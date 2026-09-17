const PRICE_USD = 0.000742;

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function sanitizeNumber(value) {
  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1");

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

function formatUsd(value) {
  if (!Number.isFinite(value)) return "$0.00 USD";

  return `${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)} USD`;
}

function formatToken(value) {
  if (!Number.isFinite(value)) return "0 $LWOLF";

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value)} $LWOLF`;
}

function setStage(root, name) {
  $all("[data-stage]", root).forEach((stage) => {
    const active = stage.dataset.stage === name;
    stage.hidden = !active;
    stage.classList.toggle("buy-stage--active", active && name === "amount");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function hydrateBuyTextures(root) {
  try {
    const response = await fetch("/demos/lwolf/assets.json", {
      cache: "no-store"
    });

    if (!response.ok) return {};

    const manifest = await response.json();

    if (manifest.textures?.paperGrain) {
      document.documentElement.style.setProperty(
        "--buy-paper-grain",
        `url("${manifest.textures.paperGrain}")`
      );
    }

    if (manifest.textures?.photocopyNoise) {
      document.documentElement.style.setProperty(
        "--buy-noise",
        `url("${manifest.textures.photocopyNoise}")`
      );
    }

    return manifest;
  } catch {
    return {};
  }
}

function applyMode(root, mode) {
  const next = mode === "night" ? "night" : "day";

  document.documentElement.dataset.lwolfBuyMode = next;
  localStorage.setItem("lwolf-mode", next);

  const label = $("[data-buy-mode-label]", root);

  if (label) {
    label.textContent =
      next === "night" ? "NIGHT / WOLF" : "DAY / SHEEP";
  }
}

export async function initLwolfBuy() {
  const root = document.querySelector("[data-buy-app]");

  if (!root || root.dataset.initialized === "true") return;

  root.dataset.initialized = "true";

  const manifest = await hydrateBuyTextures(root);

  const modeToggle = document.querySelector("[data-buy-mode-toggle]");
  const savedMode = localStorage.getItem("lwolf-mode") || "day";

  applyMode(root, savedMode);

  modeToggle?.addEventListener("click", () => {
    const current = document.documentElement.dataset.lwolfBuyMode;
    applyMode(root, current === "night" ? "day" : "night");
  });

  const input = $("#buyAmount", root);
  const prefix = $("[data-input-prefix]", root);
  const suffix = $("[data-input-suffix]", root);
  const conversionLabel = $("[data-conversion-label]", root);
  const conversionValue = $("[data-conversion-value]", root);
  const continueButton = $("[data-continue]", root);

  const reactionImage = $("[data-reaction-image]", root);
  const reactionCopy = $("[data-reaction-copy]", root);

  let inputMode = "token";
  let tokenAmount = 0;
  let usdAmount = 0;

  function updateReaction() {
    if (!reactionImage) return;

    const useWolf = usdAmount >= 500;

    const source = useWolf
      ? manifest.characters?.wolfHead || manifest.characters?.wolfMain
      : manifest.characters?.sheepHead || manifest.characters?.sheepMain;

    if (source) {
      reactionImage.src = source;
      reactionImage.hidden = false;
    } else {
      reactionImage.hidden = true;
    }

    if (reactionCopy) {
      reactionCopy.textContent = useWolf
        ? "THE WOLF NOTICED THAT NUMBER."
        : "THE SHEEP IS WATCHING.";
    }
  }

  function updateAmounts() {
    const raw = sanitizeNumber(input.value);

    if (inputMode === "token") {
      tokenAmount = raw;
      usdAmount = tokenAmount * PRICE_USD;

      conversionLabel.textContent = "YOU PAY";
      conversionValue.textContent = formatUsd(usdAmount);
    } else {
      usdAmount = raw;
      tokenAmount = PRICE_USD > 0 ? usdAmount / PRICE_USD : 0;

      conversionLabel.textContent = "YOU RECEIVE";
      conversionValue.textContent = formatToken(tokenAmount);
    }

    continueButton.disabled = raw <= 0;
    updateReaction();
  }

  function setInputMode(nextMode) {
    inputMode = nextMode === "usd" ? "usd" : "token";

    $all("[data-input-mode]", root).forEach((button) => {
      const active = button.dataset.inputMode === inputMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (inputMode === "token") {
      prefix.textContent = "";
      suffix.textContent = "$LWOLF";
      input.placeholder = "0";
    } else {
      prefix.textContent = "$";
      suffix.textContent = "USD";
      input.placeholder = "0.00";
    }

    input.value = "";
    tokenAmount = 0;
    usdAmount = 0;
    updateAmounts();
    input.focus();
  }

  $all("[data-input-mode]", root).forEach((button) => {
    button.addEventListener("click", () => {
      setInputMode(button.dataset.inputMode);
    });
  });

  input.addEventListener("input", () => {
    const cursor = input.selectionStart;
    const sanitized = input.value
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "")
      .replace(/(\..*)\./g, "$1");

    if (input.value !== sanitized) {
      input.value = sanitized;
      input.setSelectionRange(cursor, cursor);
    }

    updateAmounts();
  });

  $("[data-clear]", root)?.addEventListener("click", () => {
    input.value = "";
    updateAmounts();
    input.focus();
  });

  continueButton.addEventListener("click", () => {
    if (tokenAmount <= 0 || usdAmount <= 0) return;

    $("[data-wallet-token]", root).textContent =
      formatToken(tokenAmount);

    $("[data-wallet-usd]", root).textContent =
      formatUsd(usdAmount);

    setStage(root, "wallet");
  });

  $("[data-back-amount]", root)?.addEventListener("click", () => {
    setStage(root, "amount");
    window.setTimeout(() => input.focus(), 250);
  });

  $("[data-demo-wallet]", root)?.addEventListener("click", () => {
    $("[data-confirm-token]", root).textContent =
      formatToken(tokenAmount);

    $("[data-confirm-usd]", root).textContent =
      formatUsd(usdAmount);

    setStage(root, "confirm");
  });

  $("[data-back-wallet]", root)?.addEventListener("click", () => {
    setStage(root, "wallet");
  });

  $("[data-confirm]", root)?.addEventListener("click", () => {
    setStage(root, "complete");
  });

  $("[data-start-over]", root)?.addEventListener("click", () => {
    input.value = "";
    tokenAmount = 0;
    usdAmount = 0;
    updateAmounts();
    setStage(root, "amount");
    window.setTimeout(() => input.focus(), 250);
  });

  setInputMode("token");
}
