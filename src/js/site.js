import { mountAssetFallbacks } from "./assets.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initSite() {
  mountAssetFallbacks();
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });
  document.querySelectorAll("[data-copy-contract]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.closest("[data-contract]")?.dataset.contract || "";
      try { await navigator.clipboard.writeText(value); } catch { /* clipboard is optional */ }
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = "Copy"; }, 1400);
    });
  });
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  }), { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nav = document.querySelector("[data-mobile-nav]");
      nav?.classList.toggle("is-open");
      button.setAttribute("aria-expanded", nav?.classList.contains("is-open") ? "true" : "false");
    });
  });
  return { reduceMotion };
}

export function initParallax(stageSelector = "[data-parallax-stage]") {
  if (reduceMotion) return;
  const stage = document.querySelector(stageSelector);
  if (!stage) return;
  let frame = 0;
  stage.addEventListener("pointermove", (event) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      stage.style.setProperty("--pointer-x", `${x.toFixed(3)}`);
      stage.style.setProperty("--pointer-y", `${y.toFixed(3)}`);
      frame = 0;
    });
  }, { passive: true });
}

export function initScrollMascot() {
  const stage = document.querySelector("[data-scroll-mascot]");
  if (!stage || reduceMotion) return;
  let frame = 0;
  window.addEventListener("scroll", () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)));
      stage.style.setProperty("--scroll-progress", progress.toFixed(3));
      frame = 0;
    });
  }, { passive: true });
}
