export function mountAssetFallbacks(root = document) {
  root.querySelectorAll("img[data-fallback]").forEach((image) => {
    if (!image.getAttribute("src") && image.dataset.assetKey) return;
    image.addEventListener("load", () => {
      image.closest("[data-asset-slot]")?.classList.add("is-loaded");
    }, { once: true });
    if (image.complete && image.naturalWidth > 0) {
      image.closest("[data-asset-slot]")?.classList.add("is-loaded");
    }
    image.addEventListener("error", () => {
      image.hidden = true;
      const slot = image.closest("[data-asset-slot]");
      if (slot) {
        slot.classList.add("is-fallback");
        slot.setAttribute("data-asset-status", "temporary placeholder");
      }
    }, { once: true });
  });
}

export async function loadMugiManifest() {
  const response = await fetch("/demos/mugi/assets.json");
  if (!response.ok) throw new Error("MUGI asset manifest unavailable");
  return response.json();
}

export function resolveAsset(manifest, key) {
  return key.split(".").reduce((value, part) => value?.[part], manifest);
}

export function hydrateManifestImages(root, manifest) {
  root.querySelectorAll("img[data-asset-key]").forEach((image) => {
    const item = resolveAsset(manifest, image.dataset.assetKey);
    if (!item?.web) return;
    image.src = item.web;
    if (!image.alt) image.alt = item.alt || "MUGI artwork";
  });
}

export function assetSlot({ src, label, note, className = "" }) {
  return `<div class="asset-slot ${className}" data-asset-slot data-asset-status="temporary placeholder">
    <img src="${src}" alt="${label}" data-fallback />
    <div class="asset-slot__fallback" aria-hidden="true">
      <span class="asset-slot__mark">M</span>
      <span class="asset-slot__label">${label}</span>
      <span class="asset-slot__note">${note}</span>
    </div>
  </div>`;
}
