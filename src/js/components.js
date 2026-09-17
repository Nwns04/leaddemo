import { assetSlot } from "./assets.js";

export function projectDisclaimer(text = "Independent MUGI concept study — not affiliated with the project.") {
  return `<p class="disclaimer"><span class="disclaimer__dot"></span>${text}</p>`;
}

export function communityLinks() {
  return `<div class="community-links" aria-label="Community links">
    <a href="#x" class="community-link"><span>↗</span><strong>X / @mugi</strong><small>Concept channel</small></a>
    <a href="#telegram" class="community-link"><span>↗</span><strong>Telegram / pack</strong><small>Concept channel</small></a>
  </div>`;
}

export function contractCopy(address = "MUGI-CONCEPT-NOT-LIVE") {
  return `<div class="contract-copy" data-contract="${address}">
    <span><small>CONTRACT</small><strong>${address}</strong></span>
    <button type="button" data-copy-contract>Copy</button>
  </div>`;
}

export function tokenIdentity(data) {
  return `<div class="token-identity">
    <span class="token-identity__coin">M</span>
    <span><strong>${data.projectName}</strong><small>${data.symbol} · Solana</small></span>
  </div>`;
}

export function dexStats(data) {
  const label = data.isDemo ? "Demo data" : "DEX Screener data";
  const values = [
    ["Price", data.price], ["Liquidity", data.liquidity], ["24h volume", data.volume24h],
    ["FDV / mcap", data.fdv || data.marketCap], ["Pair age", data.pairAge], ["Transactions", data.transactions]
  ];
  return `<div class="dex-panel">
    <div class="dex-panel__head"><span>DEX SCREENER / ${data.dex}</span><em>${label}</em></div>
    <div class="dex-grid">${values.map(([key, value]) => `<div class="dex-stat"><small>${key}</small><strong>${value}</strong></div>`).join("")}</div>
    <div class="dex-panel__foot"><span>Pair ${data.pair}</span><span>${data.website}</span></div>
  </div>`;
}

export function deviceMockup({ title, children, className = "" }) {
  return `<div class="device ${className}"><div class="device__top"><span></span><small>${title}</small><span>···</span></div><div class="device__screen">${children}</div></div>`;
}

export function graphicsGallery() {
  const graphics = [
    ["X HEADER", "1400 × 500", "x-banner"], ["TELEGRAM HEADER", "1280 × 720", "telegram-banner"],
    ["DEXSCREENER HEADER", "1200 × 300", "dex-banner"], ["TOKEN PROFILE", "Social profile", "token-card"],
    ["LAUNCH ANNOUNCEMENT", "Feed / 4:5", "launch-poster"], ["NOW LIVE POST", "Feed / 1:1", "now-live"],
    ["MEME TEMPLATE", "Editable frame", "meme-template"], ["PARTNERSHIP TEMPLATE", "Collab frame", "partner-template"]
  ];
  return `<div class="graphics-grid">${graphics.map(([title, size, variant], index) => `<article class="graphic-card ${variant}">
    <div class="graphic-card__art"><span class="graphic-card__eyebrow">MUGI / PACK ${String(index + 1).padStart(2, "0")}</span><strong>${title}</strong><i></i><small>${size}</small></div>
    <div class="graphic-card__caption"><span>${title}</span><small>${size}</small></div>
  </article>`).join("")}</div>`;
}

export function caseStudySection(number, title, body, label = "") {
  return `<section class="case-section reveal"><div class="case-section__index">${number}</div><div class="case-section__copy">${label ? `<p class="eyebrow">${label}</p>` : ""}<h2>${title}</h2><p>${body}</p></div></section>`;
}

export function motionHero({ eyebrow, title, description }) {
  return `<div class="motion-hero" data-motion-hero><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div>`;
}

export function webGLFallback(label = "Interactive visual") {
  return `<div class="webgl-fallback" role="img" aria-label="${label} — lightweight fallback"><span class="webgl-fallback__grid"></span><strong>${label}</strong><small>WebGL fallback / reduced-motion safe</small></div>`;
}

export function portfolioCta() {
  return `<section class="portfolio-cta"><div><p class="eyebrow">Have a token-shaped idea?</p><h2>Build the world<br /><em>around it.</em></h2></div><a class="button button--dark" href="mailto:hello@studio.example">Let's build <span>↗</span></a></section>`;
}

export function mugiAssetCard(src, label, note, className = "") {
  return assetSlot({ src, label, note, className });
}

export function campaignBoard({ src, alt, label, title, detail = "", variant = "" }) {
  return `<article class="campaign-board ${variant}"><img src="${src}" alt="${alt}" loading="lazy" /><div class="campaign-board__veil"></div><div class="campaign-board__top"><span>${label}</span><span>MUGI / PACK</span></div><div class="campaign-board__copy"><strong>${title}</strong>${detail ? `<small>${detail}</small>` : ""}</div><div class="campaign-board__seal">M</div></article>`;
}
