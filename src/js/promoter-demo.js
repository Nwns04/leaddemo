const PROMOTER = Object.freeze({
  name: "Marco Alpha",
  xHandle: "@Marco_Alpheok",
  xUrl: "https://x.com/Marco_Alpheok",
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
