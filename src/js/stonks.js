import { gsap } from "https://esm.sh/gsap@3.13.0";
import { ScrollTrigger } from "https://esm.sh/gsap@3.13.0/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CHART_DATA = {
  "1H": [132, 134, 133, 136, 137, 139, 138, 141, 140, 143, 142, 145],
  "1D": [118, 121, 120, 124, 129, 127, 132, 135, 133, 138, 136, 142.84],
  "1W": [108, 111, 109, 115, 112, 120, 124, 121, 130, 128, 136, 142.84],
  "1M": [94, 98, 102, 99, 106, 112, 109, 121, 118, 130, 137, 142.84],
  "1Y": [62, 68, 71, 66, 78, 82, 91, 103, 99, 118, 128, 142.84],
  "ALL": [31, 39, 36, 47, 58, 52, 69, 76, 88, 103, 121, 142.84]
};

const MOVER_DATA = {
  MOON: [18, 23, 20, 34, 32, 41, 47, 44, 58, 63, 74, 84],
  COPE: [14, 20, 17, 25, 29, 27, 35, 42, 40, 51, 56, 62],
  BAGS: [9, 12, 15, 13, 19, 21, 24, 28, 27, 32, 36, 42],
  STONKS: [12, 16, 14, 18, 21, 20, 24, 26, 25, 29, 30, 32],
  RUG: [92, 86, 81, 70, 58, 49, 37, 31, 24, 18, 12, 8],
  FOMO: [72, 69, 64, 60, 57, 51, 48, 43, 39, 34, 31, 28]
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function pointsToPath(values, width, height, pad = 30) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => [
    pad + (index / (values.length - 1)) * (width - pad * 2),
    height - pad - ((value - min) / range) * (height - pad * 2)
  ]);

  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const [firstX] = points[0];
  const [lastX] = points.at(-1);

  return {
    line,
    area: `${line} L ${lastX.toFixed(2)} ${(height - pad).toFixed(2)} L ${firstX.toFixed(2)} ${(height - pad).toFixed(2)} Z`,
    points
  };
}

function duplicateTrack(track) {
  if (!track || track.dataset.duplicated === "true") return;
  [...track.children].forEach((child) => track.appendChild(child.cloneNode(true)));
  track.dataset.duplicated = "true";
}

function setTracerOnPath(path, tracer, duration = 2.6) {
  if (!path || !tracer || reduceMotion) return;

  tracer._stonksTween?.kill();

  const length = path.getTotalLength();
  const state = { progress: 0 };

  tracer._stonksTween = gsap.to(state, {
    progress: 1,
    duration,
    ease: "none",
    repeat: -1,
    repeatDelay: 0.35,
    onUpdate: () => {
      const point = path.getPointAtLength(state.progress * length);
      tracer.setAttribute("cx", point.x);
      tracer.setAttribute("cy", point.y);
    }
  });
}

function drawChartPath(path, area, endpoint, tracer, duration = 1.05) {
  if (!path) return;

  const length = path.getTotalLength();

  if (reduceMotion) {
    path.style.strokeDasharray = "none";
    path.style.strokeDashoffset = "0";
    if (area) area.style.opacity = "1";
    if (endpoint) endpoint.style.opacity = "1";
    return;
  }

  const timeline = gsap.timeline();

  timeline.fromTo(
    path,
    { strokeDasharray: length, strokeDashoffset: length },
    { strokeDashoffset: 0, duration, ease: "power2.out" }
  );

  if (area) {
    timeline.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.45");
  }

  if (endpoint) {
    timeline.fromTo(
      endpoint,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, transformOrigin: "center" },
      "-=0.18"
    );
  }

  setTracerOnPath(path, tracer, duration * 2.1);
}

function prepareChartPath(path, area, endpoint) {
  if (!path || reduceMotion) return;

  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;
  if (area) area.style.opacity = "0";
  if (endpoint) endpoint.style.opacity = "0";
}

function initClock() {
  const element = qs("[data-market-clock]");
  if (!element) return;

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const tick = () => {
    element.textContent = formatter.format(new Date());
  };

  tick();
  setInterval(tick, 1000);
}

function initMobileNav() {
  const button = qs("[data-mobile-menu]");
  const nav = qs(".market-nav");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
  });

  qsa("a", nav).forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    });
  });
}

function initActiveNav() {
  const links = qsa(".market-nav a");

  links.forEach((link) => {
    const section = qs(link.getAttribute("href"));
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: "top 48%",
      end: "bottom 48%",
      onToggle: (self) => {
        if (!self.isActive) return;
        links.forEach((item) => item.classList.remove("is-active"));
        link.classList.add("is-active");
      }
    });
  });
}

function initTickerMotion() {
  qsa(".tape-track").forEach((track) => {
    duplicateTrack(track);
    const reverse = track.closest(".tape-lane")?.dataset.tapeDirection === "right";

    if (!reduceMotion) {
      gsap.to(track, {
        xPercent: reverse ? 50 : -50,
        duration: reverse ? 30 : 36,
        ease: "none",
        repeat: -1
      });
    }
  });

  const bottom = qs(".bottom-ticker__track");
  if (bottom) {
    duplicateTrack(bottom);

    if (!reduceMotion) {
      gsap.to(bottom, {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1
      });
    }
  }
}

function initHeroMotion() {
  if (reduceMotion) return;

  gsap.from(".hero-copy > *", {
    y: 36,
    opacity: 0,
    duration: 0.8,
    stagger: 0.09,
    ease: "power3.out"
  });

  gsap.from(".quote-block", {
    y: 28,
    opacity: 0,
    duration: 0.7,
    stagger: 0.08,
    delay: 0.2,
    ease: "power3.out"
  });

  gsap.to(".hero-crosshair", {
    rotate: 90,
    ease: "none",
    scrollTrigger: {
      trigger: ".market-hero",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });
}

function initLivePrice() {
  const price = qs('[data-live-price="stonks"]');
  const change = qs('[data-live-change="stonks"]');
  if (!price || !change) return;

  let current = 142.84;

  setInterval(() => {
    const delta = (Math.random() - 0.45) * 0.42;
    current = Math.max(120, current + delta);
    price.textContent = current.toFixed(2);

    const percent = (current / 120.62 - 1) * 100;
    change.textContent = `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    change.classList.toggle("is-up", percent >= 0);
    change.classList.toggle("is-down", percent < 0);

    if (!reduceMotion) {
      gsap.fromTo(
        price,
        { color: delta >= 0 ? "#42ff87" : "#ff4d4d" },
        { color: "inherit", duration: 0.7 }
      );
    }
  }, 1800);
}

let moverActivated = false;
let currentMover = { symbol: "MOON", change: 84.2 };

function renderMover(symbol, change, animate = moverActivated) {
  const values = MOVER_DATA[symbol] || MOVER_DATA.MOON;
  const { line, area, points } = pointsToPath(values, 900, 440, 28);

  const linePath = qs("[data-mover-line]");
  const areaPath = qs("[data-mover-area]");
  const endpoint = qs("[data-mover-dot]");
  const tracer = qs("[data-mover-tracer]");
  const symbolLabel = qs("[data-mover-symbol]");
  const changeLabel = qs("[data-mover-change]");
  const panel = qs(".movers-chart-panel");

  if (!linePath || !areaPath || !endpoint || !symbolLabel || !changeLabel || !panel) return;

  currentMover = { symbol, change };

  linePath.setAttribute("d", line);
  areaPath.setAttribute("d", area);

  const [lastX, lastY] = points.at(-1);
  endpoint.setAttribute("cx", lastX);
  endpoint.setAttribute("cy", lastY);

  symbolLabel.textContent = `$${symbol}`;
  changeLabel.textContent = `${change >= 0 ? "+" : ""}${Number(change).toFixed(1)}%`;
  changeLabel.classList.toggle("is-up", change >= 0);
  changeLabel.classList.toggle("is-down", change < 0);
  panel.classList.toggle("is-loss", change < 0);

  if (animate) {
    drawChartPath(linePath, areaPath, endpoint, tracer, 0.95);
  } else {
    prepareChartPath(linePath, areaPath, endpoint);
  }
}

function initMovers() {
  const rows = qsa(".mover-row");

  rows.forEach((row) => {
    row.addEventListener("click", () => {
      rows.forEach((item) => item.classList.remove("is-active"));
      row.classList.add("is-active");

      renderMover(
        row.dataset.symbol || "MOON",
        Number(row.dataset.change || 0),
        true
      );
    });
  });

  renderMover("MOON", 84.2, false);

  ScrollTrigger.create({
    trigger: ".movers-chart-panel",
    start: "top 76%",
    once: true,
    onEnter: () => {
      moverActivated = true;
      renderMover(currentMover.symbol, currentMover.change, true);
    }
  });
}

let mainChartActivated = false;
let currentTimeframe = "1D";

function renderMainChart(timeframe = "1D", animate = mainChartActivated) {
  const values = CHART_DATA[timeframe] || CHART_DATA["1D"];
  const { line, area, points } = pointsToPath(values, 1200, 560, 32);

  const linePath = qs("[data-main-line]");
  const areaPath = qs("[data-main-area]");
  const endpoint = qs("[data-main-endpoint]");
  const tracer = qs("[data-main-tracer]");
  const chart = qs("[data-interactive-chart]");

  if (!linePath || !areaPath || !chart) return;

  currentTimeframe = timeframe;
  linePath.setAttribute("d", line);
  areaPath.setAttribute("d", area);
  chart.dataset.points = JSON.stringify(points);
  chart.dataset.values = JSON.stringify(values);

  const [lastX, lastY] = points.at(-1);
  if (endpoint) {
    endpoint.setAttribute("cx", lastX);
    endpoint.setAttribute("cy", lastY);
  }

  if (animate) {
    chart.classList.add("is-chart-live");
    drawChartPath(linePath, areaPath, endpoint, tracer, 1.15);
  } else {
    prepareChartPath(linePath, areaPath, endpoint);
  }
}

function initMainChart() {
  const buttons = qsa("[data-timeframe]");
  const chart = qs("[data-interactive-chart]");
  if (!chart) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderMainChart(button.dataset.timeframe || "1D", true);
    });
  });

  renderMainChart("1D", false);

  ScrollTrigger.create({
    trigger: chart,
    start: "top 76%",
    once: true,
    onEnter: () => {
      mainChartActivated = true;
      renderMainChart(currentTimeframe, true);
    }
  });

  const crossX = qs("[data-cross-x]");
  const crossY = qs("[data-cross-y]");
  const crossDot = qs("[data-cross-dot]");
  const tooltip = qs("[data-chart-tooltip]");
  const tooltipTime = qs("[data-tooltip-time]");
  const tooltipPrice = qs("[data-tooltip-price]");
  const tooltipChange = qs("[data-tooltip-change]");

  chart.addEventListener("pointerenter", () => chart.classList.add("is-hovering"));
  chart.addEventListener("pointerleave", () => chart.classList.remove("is-hovering"));

  chart.addEventListener("pointermove", (event) => {
    const rect = chart.getBoundingClientRect();
    const xRatio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const yRatio = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const x = xRatio * 1200;
    const y = yRatio * 560;

    crossX?.setAttribute("x1", x);
    crossX?.setAttribute("x2", x);
    crossY?.setAttribute("y1", y);
    crossY?.setAttribute("y2", y);
    crossDot?.setAttribute("cx", x);
    crossDot?.setAttribute("cy", y);

    const values = JSON.parse(chart.dataset.values || "[]");
    if (!values.length) return;

    const index = Math.min(values.length - 1, Math.round(xRatio * (values.length - 1)));
    const value = values[index];
    const percent = (value / values[0] - 1) * 100;

    if (tooltipTime) {
      tooltipTime.textContent = `${String(9 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`;
    }

    if (tooltipPrice) tooltipPrice.textContent = `$${Number(value).toFixed(2)}`;

    if (tooltipChange) {
      tooltipChange.textContent = `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
      tooltipChange.classList.toggle("is-up", percent >= 0);
      tooltipChange.classList.toggle("is-down", percent < 0);
    }

    if (tooltip) {
      tooltip.style.left = `${Math.min(rect.width - 185, Math.max(10, event.clientX - rect.left + 18))}px`;
      tooltip.style.top = `${Math.min(rect.height - 120, Math.max(10, event.clientY - rect.top + 18))}px`;
    }
  });
}

function initSentiment() {
  const fill = qs("[data-sentiment-fill]");
  const bullishLabel = qs("[data-bullish]");
  const bearishLabel = qs("[data-bearish]");
  if (!fill || !bullishLabel || !bearishLabel) return;

  let bullish = 72;

  setInterval(() => {
    bullish += Math.random() > 0.5 ? 1 : -1;
    bullish = Math.min(82, Math.max(62, bullish));

    fill.style.width = `${bullish}%`;
    bullishLabel.textContent = `${bullish}%`;
    bearishLabel.textContent = `${100 - bullish}%`;
  }, 3200);

  if (!reduceMotion) {
    gsap.from(".feed-row", {
      x: 42,
      opacity: 0,
      stagger: 0.07,
      duration: 0.55,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".sentiment-feed",
        start: "top 76%"
      }
    });
  }
}

function initPortfolio() {
  const sliders = qsa("[data-allocation]");
  const total = qs("[data-allocation-total]");
  const totalWrap = total?.closest(".allocation-total");
  const risk = qs("[data-risk]");
  const volatility = qs("[data-volatility]");
  const sleep = qs("[data-sleep]");
  const cashValue = qs("[data-cash-value]");

  if (!sliders.length || !total) return;

  const update = () => {
    const values = Object.fromEntries(
      sliders.map((slider) => [slider.dataset.allocation, Number(slider.value)])
    );

    sliders.forEach((slider) => {
      const output = qs(`[data-output="${slider.dataset.allocation}"]`);
      if (output) output.textContent = `${slider.value}%`;
    });

    const sum = Object.values(values).reduce((a, b) => a + b, 0);
    total.textContent = `${sum}%`;
    totalWrap?.classList.toggle("is-invalid", sum !== 100);

    const risky =
      (values.tech || 0) * 0.65 +
      (values.crypto || 0) * 1.05 +
      (values.memes || 0) * 1.4;

    const cash = values.cash || 0;

    if (risk) risk.textContent = risky > 85 ? "EXTREME" : risky > 58 ? "HIGH" : risky > 32 ? "MEDIUM" : "LOW";
    if (volatility) volatility.textContent = risky > 80 ? "ABSURD" : risky > 55 ? "HIGH" : risky > 30 ? "ACTIVE" : "CALM";
    if (sleep) sleep.textContent = risky > 80 ? "POOR" : risky > 55 ? "QUESTIONABLE" : risky > 30 ? "FINE" : "EXCELLENT";

    if (cashValue) {
      cashValue.textContent = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format((cash / 100) * 10000);
    }
  };

  sliders.forEach((slider) => slider.addEventListener("input", update));
  update();
}

function initSignalMonitor() {
  const path = qs("[data-signal-monitor-path]");
  const dot = qs("[data-signal-monitor-dot]");
  const monitor = qs(".signal-monitor");
  if (!path || !monitor) return;

  const stats = {
    momentum: qs('[data-signal-stat="momentum"]'),
    social: qs('[data-signal-stat="social"]'),
    volatility: qs('[data-signal-stat="volatility"]'),
    liquidity: qs('[data-signal-stat="liquidity"]')
  };

  const animateMonitor = () => {
    const length = path.getTotalLength();

    if (!reduceMotion) {
      gsap.fromTo(
        path,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" }
      );

      setTracerOnPath(path, dot, 2.9);
    }
  };

  ScrollTrigger.create({
    trigger: monitor,
    start: "top 80%",
    once: true,
    onEnter: animateMonitor
  });

  setInterval(() => {
    const updates = {
      momentum: 74 + Math.floor(Math.random() * 10),
      social: 87 + Math.floor(Math.random() * 9),
      volatility: 58 + Math.floor(Math.random() * 13),
      liquidity: 48 + Math.floor(Math.random() * 10)
    };

    Object.entries(updates).forEach(([key, value]) => {
      const element = stats[key];
      if (!element) return;

      element.textContent = String(value);

      if (!reduceMotion) {
        gsap.fromTo(
          element,
          { color: "#42ff87", y: -3 },
          { color: "#e9e7df", y: 0, duration: 0.55 }
        );
      }
    });
  }, 2600);
}

function initSectionMotion() {
  if (reduceMotion) return;

  qsa(
    ".section-heading h2,.chart-topline h2,.sentiment-copy h2,.portfolio-heading h2,.section-heading--signals h2,.market-close h2"
  ).forEach((heading) => {
    gsap.from(heading, {
      y: 48,
      opacity: 0,
      duration: 0.75,
      ease: "power3.out",
      scrollTrigger: {
        trigger: heading,
        start: "top 82%"
      }
    });
  });

  gsap.from(".signal-monitor", {
    x: -48,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".signals-intro",
      start: "top 80%"
    }
  });

  gsap.from(".signal-card", {
    y: 50,
    opacity: 0,
    stagger: 0.1,
    duration: 0.65,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".signal-grid",
      start: "top 78%"
    }
  });

  gsap.from(".newswire-list > div", {
    x: 60,
    opacity: 0,
    stagger: 0.08,
    duration: 0.55,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".newswire-list",
      start: "top 80%"
    }
  });
}

export function initStonks() {
  if (document.documentElement.dataset.stonksInitialized === "true") return;
  document.documentElement.dataset.stonksInitialized = "true";

  ScrollTrigger.config({ ignoreMobileResize: true });

  initClock();
  initMobileNav();
  initActiveNav();
  initTickerMotion();
  initHeroMotion();
  initLivePrice();
  initMovers();
  initMainChart();
  initSentiment();
  initPortfolio();
  initSignalMonitor();
  initSectionMotion();

  window.addEventListener("load", () => ScrollTrigger.refresh());
}
