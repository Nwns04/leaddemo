import { initSite } from "./site.js";
import { gsap } from "https://esm.sh/gsap@3.13.0";
import { ScrollTrigger } from "https://esm.sh/gsap@3.13.0/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Preserve pinned scroll choreography on mobile while reducing resize churn
// caused by browser chrome / address-bar changes.
ScrollTrigger.config({
  ignoreMobileResize: true
});

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function getByPath(object, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], object);
}

function cssUrl(value) {
  if (!value) return "none";
  return `url("${String(value).replaceAll('"', '\\"')}")`;
}

async function hydrateLwolfAssets(root) {
  try {
    const response = await fetch("/demos/lwolf/assets.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn("LWOLF assets manifest unavailable:", response.status);
      return;
    }

    const manifest = await response.json();

    const textureMap = {
      "--lw-paper-grain": manifest.textures?.paperGrain,
      "--lw-paper-extra": manifest.textures?.paperExtra,
      "--lw-photocopy-noise": manifest.textures?.photocopyNoise,
      "--lw-halftone": manifest.textures?.halftone,
      "--lw-ink-bleed": manifest.textures?.inkBleed,
      "--lw-rough-edge": manifest.textures?.roughEdge
    };

    for (const [property, value] of Object.entries(textureMap)) {
      if (value) root.style.setProperty(property, cssUrl(value));
    }

    $all("[data-lwolf-asset]", root).forEach((node) => {
      const value = getByPath(manifest, node.dataset.lwolfAsset || "");
      if (!value) return;

      if (node instanceof HTMLImageElement) {
        node.addEventListener(
          "load",
          () => {
            node.hidden = false;

            const frame = node.closest(
              ".hero-character, .portrait-card, .campaign-piece"
            );

            frame?.classList.add("is-hydrated");
          },
          { once: true }
        );

        node.addEventListener(
          "error",
          () => {
            console.warn(
              `LWOLF asset failed to load: ${node.dataset.lwolfAsset}`,
              value
            );
          },
          { once: true }
        );

        node.src = value;

        // Cached images can already be complete before the listener fires.
        if (node.complete && node.naturalWidth > 0) {
          node.hidden = false;

          const frame = node.closest(
            ".hero-character, .portrait-card, .campaign-piece"
          );

          frame?.classList.add("is-hydrated");
        }
      }
    });

    root.dataset.assetsReady = "true";
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  } catch (error) {
    console.warn("LWOLF asset hydration failed:", error);
  }
}

function setMode(root, mode, animate = true) {
  const next = mode === "night" ? "night" : "day";

  root.dataset.mode = next;
  document.documentElement.dataset.lwolfMode = next;

  $all("[data-mode-toggle]", root).forEach((button) => {
    button.setAttribute("aria-pressed", String(next === "night"));

    const label = $("[data-mode-label]", button);

    if (label) {
      label.textContent =
        next === "night" ? "NIGHT / WOLF" : "DAY / SHEEP";
    }
  });

  if (!animate) return;

  gsap.fromTo(
    $all("[data-mode-piece]", root),
    {
      rotate: (index) => (index % 2 ? -1.6 : 1.6),
      y: (index) => (index % 2 ? -8 : 8)
    },
    {
      rotate: 0,
      y: 0,
      duration: 0.42,
      ease: "power2.out",
      stagger: 0.018,
      overwrite: true
    }
  );

  const activeCharacter =
    next === "night"
      ? $(".hero-character__asset--wolf", root)
      : $(".hero-character__asset--sheep", root);

  if (activeCharacter && !activeCharacter.hidden) {
    gsap.fromTo(
      activeCharacter,
      { scale: 0.965, rotate: next === "night" ? 1.5 : -1.5 },
      {
        scale: 1,
        rotate: 0,
        duration: 0.52,
        ease: "power3.out",
        overwrite: true
      }
    );
  }
}

function bindMode(root) {
  $all("[data-mode-toggle]", root).forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.dataset.mode === "night" ? "day" : "night";
      setMode(root, next, true);
    });
  });
}

function bindContractCopy(root) {
  const contract = "0xLW0LF0000000000000000000000000000002026";

  $all("[data-copy-ca]", root).forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(contract);

        const previous = button.textContent;
        button.textContent = "COPIED ✓";
        button.classList.add("is-copied");

        window.setTimeout(() => {
          button.textContent = previous;
          button.classList.remove("is-copied");
        }, 1200);
      } catch {
        button.textContent = "COPY FAILED";
        window.setTimeout(() => {
          button.textContent = "COPY";
        }, 1000);
      }
    });
  });
}

function initHorizontalRail(root) {
  const rail = $("[data-horizontal-rail]", root);
  const track = $("[data-horizontal-track]", root);

  if (!rail || !track) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  const tween = gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger: rail,
      start: "top top",
      end: () => {
        const distance = track.scrollWidth - window.innerWidth;
        const mobileFloor =
          window.innerWidth <= 680
            ? window.innerHeight * 1.35
            : window.innerWidth;

        return `+=${Math.max(mobileFloor, distance)}`;
      },
      scrub: 1,
      pin: true,
      invalidateOnRefresh: true,
      anticipatePin: 1
    }
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

function initPackRail(root) {
  const rail = $("[data-pack-rail]", root);
  const track = $("[data-pack-track]", root);

  if (!rail || !track) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  const tween = gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger: rail,
      start: "top top",
      end: () => {
        const distance = track.scrollWidth - window.innerWidth;
        const mobileFloor =
          window.innerWidth <= 680
            ? window.innerHeight * 1.15
            : window.innerWidth * 0.8;

        return `+=${Math.max(mobileFloor, distance)}`;
      },
      scrub: 0.9,
      pin: true,
      invalidateOnRefresh: true,
      anticipatePin: 1
    }
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

function initCollageMotion(root) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  $all("[data-float]", root).forEach((node, index) => {
    gsap.to(node, {
      y: index % 2 ? -12 : 12,
      rotate: index % 2 ? 1.2 : -1.2,
      duration: 2.7 + (index % 4) * 0.45,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  });

  $all("[data-reveal]", root).forEach((node) => {
    gsap.from(node, {
      y: 40,
      opacity: 0,
      rotate: node.matches(".paper-card, .campaign-piece") ? -2 : 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: node,
        start: "top 82%",
        once: true
      }
    });
  });

  $all("[data-stamp]", root).forEach((node) => {
    gsap.from(node, {
      scale: 1.9,
      rotate: 12,
      opacity: 0,
      duration: 0.42,
      ease: "back.out(2)",
      scrollTrigger: {
        trigger: node,
        start: "top 74%",
        once: true
      }
    });
  });
}

function initNightThreshold(root) {
  const threshold = $("[data-night-threshold]", root);

  if (!threshold) return;

  ScrollTrigger.create({
    trigger: threshold,
    start: "top 55%",
    end: "bottom 45%",
    onEnter: () => setMode(root, "night", true),
    onEnterBack: () => setMode(root, "night", true),
    onLeaveBack: () => setMode(root, "day", true)
  });
}

function initPointerParallax(root) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  const pieces = $all("[data-parallax]", root);

  window.addEventListener(
    "pointermove",
    (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;

      pieces.forEach((node) => {
        const depth = Number(node.dataset.parallax || 1);

        gsap.to(node, {
          x: x * 18 * depth,
          y: y * 14 * depth,
          duration: 0.55,
          ease: "power2.out",
          overwrite: true
        });
      });
    },
    { passive: true }
  );
}

function initInkDistress(root) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  const headings = $all(
    ".hero-copy h1, .rail-copy h2, .section-heading h2, .night-fall__copy h2",
    root
  );

  headings.forEach((heading) => {
    gsap.fromTo(
      heading,
      { filter: "contrast(1)" },
      {
        filter: "contrast(1.04)",
        duration: 1.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      }
    );
  });
}

export function initLwolf() {
  const root = document.querySelector("[data-lwolf]");

  if (!root || root.dataset.initialized === "true") return;

  root.dataset.initialized = "true";

  initSite();
  setMode(root, "day", false);
  bindMode(root);
  bindContractCopy(root);

  const cleanupHorizontal = initHorizontalRail(root);
  const cleanupPack = initPackRail(root);

  initCollageMotion(root);
  initNightThreshold(root);
  initPointerParallax(root);
  initInkDistress(root);
  hydrateLwolfAssets(root);

  const onResize = () => ScrollTrigger.refresh();
  window.addEventListener("resize", onResize, { passive: true });

  root.__cleanupLwolf = () => {
    cleanupHorizontal?.();
    cleanupPack?.();
    window.removeEventListener("resize", onResize);
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };
}
