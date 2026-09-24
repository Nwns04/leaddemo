const PROMOTER = Object.freeze({
  name: "Nero Vale",
  xHandle: "@NeroValeHQ",
  xUrl: "https://x.com/NeroValeHQ",
  xFollowers: "718",
});

const root = document.documentElement;
const toggle = document.querySelector("[data-theme-toggle]");
const themeIcon = document.querySelector("[data-theme-icon]");

function themeForCurrentTime() {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "day" : "night";
}

function setTheme(theme) {
  const next = theme === "night" ? "night" : "day";
  root.dataset.theme = next;
  if (themeIcon) themeIcon.textContent = next === "day" ? "🌙" : "☀️";
  toggle?.setAttribute("aria-label", next === "day" ? "Switch to night mode" : "Switch to day mode");
}

setTheme(themeForCurrentTime());

toggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "night" ? "day" : "night");
});

document.querySelectorAll("[data-promoter-name]").forEach((node) => {
  node.textContent = PROMOTER.name;
});

document.querySelectorAll("[data-x-link]").forEach((node) => {
  node.href = PROMOTER.xUrl;
});

document.querySelectorAll("[data-x-followers]").forEach((node) => {
  node.textContent = PROMOTER.xFollowers;
});

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

document.querySelectorAll(".service-row").forEach((row) => {
  row.addEventListener("click", () => {
    const isOpen = row.getAttribute("aria-expanded") === "true";
    row.setAttribute("aria-expanded", isOpen ? "false" : "true");
  });
});

const copyButton = document.querySelector("[data-copy-handle]");
copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(PROMOTER.xHandle);
    copyButton.textContent = "Copied ✓";
    window.setTimeout(() => {
      copyButton.textContent = `Copy ${PROMOTER.xHandle}`;
    }, 1400);
  } catch {
    copyButton.textContent = PROMOTER.xHandle;
  }
});

// Full-viewport hero scroll choreography.
const hero = document.querySelector("[data-hero]");
const promoHeader = document.querySelector(".promo-header");
const signalStrip = document.querySelector(".signal-strip");
let heroFrame = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateHeroMotion() {
  heroFrame = 0;
  if (!hero) return;

  const rect = hero.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  // The hero itself is exactly one viewport tall. Progress follows the
  // viewport leaving that hero, so the image never creates extra page height.
  const progress = clamp(-rect.top / viewportHeight, 0, 1);

  const scale = 1 + progress * 0.045;
  const mediaY = -progress * 14;

  // Keep the hero copy present while the image carries the early scroll.
  // Only begin the exit once the next chapter is genuinely approaching.
  const fadeStart = 0.68;
  const fadeEnd = 0.985;
  const fadeProgress = clamp((progress - fadeStart) / (fadeEnd - fadeStart), 0, 1);
  const easedFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
  const copyY = -easedFade * 42;
  const copyOpacity = 1 - easedFade;
  const shadeOpacity = easedFade * 0.16;

  hero.style.setProperty("--hero-scale", scale.toFixed(4));
  hero.style.setProperty("--hero-media-y", `${mediaY.toFixed(1)}px`);
  hero.style.setProperty("--hero-copy-y", `${copyY.toFixed(1)}px`);
  hero.style.setProperty("--hero-copy-opacity", copyOpacity.toFixed(3));
  hero.style.setProperty("--hero-shade", shadeOpacity.toFixed(3));

  const onContent = rect.bottom <= 96;
  promoHeader?.classList.toggle("is-on-content", onContent);
  signalStrip?.classList.toggle("is-revealed", progress > 0.84 || onContent);
}

function requestHeroMotion() {
  if (heroFrame) return;
  heroFrame = window.requestAnimationFrame(updateHeroMotion);
}

updateHeroMotion();
window.addEventListener("scroll", requestHeroMotion, { passive: true });
window.addEventListener("resize", requestHeroMotion);


// Services chapter: the cobalt panel holds while the menu rises over it.
const servicesPull = document.querySelector("[data-services-pull]");
const servicesIntro = document.querySelector("[data-services-intro]");
let servicesFrame = 0;

function updateServicesMotion() {
  servicesFrame = 0;
  if (!servicesPull || !servicesIntro) return;

  const rect = servicesPull.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  const introHeight = servicesIntro.offsetHeight || viewportHeight;
  const travelled = clamp(-rect.top, 0, introHeight);
  const progress = clamp(travelled / Math.max(introHeight, 1), 0, 1);

  const parallaxY = progress * 86;
  const headY = -progress * 46;
  const headOpacity = clamp(1 - progress * 1.18, .08, 1);

  servicesPull.style.setProperty("--services-parallax-y", `${parallaxY.toFixed(1)}px`);
  servicesPull.style.setProperty("--services-head-y", `${headY.toFixed(1)}px`);
  servicesPull.style.setProperty("--services-head-opacity", headOpacity.toFixed(3));
}

function requestServicesMotion() {
  if (servicesFrame) return;
  servicesFrame = window.requestAnimationFrame(updateServicesMotion);
}

updateServicesMotion();
window.addEventListener("scroll", requestServicesMotion, { passive: true });
window.addEventListener("resize", requestServicesMotion);

// Audience chapter: typewriter + compact stat choreography + light parallax.
const audience = document.querySelector("[data-audience]");
const audienceType = audience?.querySelector("[data-audience-type]");
const audienceTypeText = audience?.querySelector("[data-audience-type-text]");
const countNode = audience?.querySelector("[data-count-to]");
let audienceStarted = false;
let audienceMotionFrame = 0;

function typeAudienceHeadline() {
  if (!audience || !audienceType || !audienceTypeText || audienceStarted) return;
  audienceStarted = true;
  audience.classList.add("is-visible", "is-typing");

  const fullText = audienceType.dataset.audienceType || audienceTypeText.textContent.trim();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    audienceTypeText.textContent = fullText;
    audience.classList.remove("is-typing");
    audience.classList.add("is-typed");
    return;
  }

  audienceTypeText.textContent = "";
  let index = 0;

  const step = () => {
    index += 1;
    audienceTypeText.textContent = fullText.slice(0, index);

    if (index < fullText.length) {
      const char = fullText[index - 1];
      const delay = /[,.!?]/.test(char) ? 92 : char === " " ? 24 : 34;
      window.setTimeout(step, delay);
    } else {
      audience.classList.remove("is-typing");
      audience.classList.add("is-typed");
    }
  };

  window.setTimeout(step, 120);
}

function animateAudienceCount() {
  if (!countNode || countNode.dataset.counted === "true") return;
  countNode.dataset.counted = "true";

  const target = Number(countNode.dataset.countTo || 0);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !Number.isFinite(target)) {
    countNode.textContent = String(target || PROMOTER.xFollowers);
    return;
  }

  const start = performance.now();
  const duration = 820;

  const tick = (now) => {
    const progress = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    countNode.textContent = String(Math.round(target * eased));

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}

if (audience) {
  const audienceObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      typeAudienceHeadline();
      window.setTimeout(animateAudienceCount, 180);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.24 });

  audienceObserver.observe(audience);
}

function updateAudienceMotion() {
  audienceMotionFrame = 0;
  if (!audience) return;

  const rect = audience.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  if (rect.bottom < 0 || rect.top > viewportHeight) return;

  const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
  const ghostX = (progress - .5) * 90;
  audience.style.setProperty("--audience-ghost-x", `${ghostX.toFixed(1)}px`);
}

function requestAudienceMotion() {
  if (audienceMotionFrame) return;
  audienceMotionFrame = window.requestAnimationFrame(updateAudienceMotion);
}

updateAudienceMotion();
window.addEventListener("scroll", requestAudienceMotion, { passive: true });
window.addEventListener("resize", requestAudienceMotion);

// Campaign form chapter: slide the heading from the left into the center.
const campaignFormSection = document.querySelector("[data-campaign-form-section]");
const campaignForm = document.querySelector("[data-campaign-form]");
const campaignFormStatus = document.querySelector("[data-campaign-form-status]");

if (campaignFormSection) {
  const campaignFormObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      campaignFormSection.classList.add("is-form-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.22 });

  campaignFormObserver.observe(campaignFormSection);
}

campaignForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(campaignForm);
  const project = String(data.get("project") || "your project").trim() || "your project";
  const service = String(data.get("service") || "promotion").trim() || "promotion";

  if (campaignFormStatus) {
    campaignFormStatus.textContent = `Request ready for ${project} · ${service}. This demo does not send live enquiries yet.`;
  }
});


// Final booking chapter: centered card with restrained parallax background motion.
const bookFinale = document.querySelector("[data-book-finale]");
let bookFrame = 0;

if (bookFinale) {
  const bookObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) bookFinale.classList.add("is-visible");
    });
  }, { threshold: 0.18 });

  bookObserver.observe(bookFinale);
}

function updateBookMotion() {
  bookFrame = 0;
  if (!bookFinale) return;

  const rect = bookFinale.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  if (rect.bottom < 0 || rect.top > viewportHeight) return;

  const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
  const parallaxY = (progress - .5) * 120;
  const cardY = (1 - progress) * 34;
  const cardScale = .965 + progress * .035;

  bookFinale.style.setProperty("--book-parallax-y", `${parallaxY.toFixed(1)}px`);
  bookFinale.style.setProperty("--book-card-y", `${cardY.toFixed(1)}px`);
  bookFinale.style.setProperty("--book-card-scale", cardScale.toFixed(4));
}

function requestBookMotion() {
  if (bookFrame) return;
  bookFrame = window.requestAnimationFrame(updateBookMotion);
}

updateBookMotion();
window.addEventListener("scroll", requestBookMotion, { passive: true });
window.addEventListener("resize", requestBookMotion);
