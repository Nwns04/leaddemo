import { initSite } from "./site.js";

const agents = {
  research: {
    name: "Research Agent",
    role: "Evidence analyst",
    status: "ACTIVE",
    specialty: "Sources and synthesis",
    task: "Analyze competitor positioning",
    result: "Positioning signals grouped across 14 demo sources."
  },
  code: {
    name: "Code Agent",
    role: "Frontend engineer",
    status: "RUNNING",
    specialty: "Interfaces and audits",
    task: "Audit contract interface",
    result: "Four interface risks flagged for review."
  },
  market: {
    name: "Market Agent",
    role: "Signal analyst",
    status: "WAITING",
    specialty: "Activity summaries",
    task: "Summarize token activity",
    result: "Activity summary prepared from demo data."
  },
  community: {
    name: "Community Agent",
    role: "Community operator",
    status: "COMPLETE",
    specialty: "Reports and narratives",
    task: "Prepare community report",
    result: "Community report is ready to review."
  }
};

const stateOrder = ["IDLE", "QUEUED", "RUNNING", "COMPLETE"];
const eventLabels = ["Task queued", "Sources indexed", "Evidence grouped", "Summary completed"];

function $(selector, root = document) {
  return root.querySelector(selector);
}

export async function hydrateSlockAssets(root = document) {
  const response = await fetch("/demos/slock/assets.json");
  if (!response.ok) return;

  const manifest = await response.json();

  root.querySelectorAll("[data-slock-asset]").forEach((node) => {
    const key = node.dataset.slockAsset;
    if (!key) return;

    const value = key
      .split(".")
      .reduce((acc, part) => acc?.[part], manifest);

    if (!value) return;
    node.src = value;
  });
}

function renderAgentDetail(agentId, state = "IDLE", progress = 0) {
  const panel = $("[data-agent-detail]");
  const agent = agents[agentId];

  if (!panel || !agent) return;

  const stateLabel = state.toUpperCase();

  panel.innerHTML = `
    <div class="inspector-head">
      <span class="status-chip">${stateLabel}</span>
      <span class="mono">DEMO PROFILE / ${agentId.toUpperCase()}</span>
    </div>
    <h3>${agent.name}</h3>
    <p>${agent.role} / ${agent.specialty}</p>
    <div class="inspector-grid">
      <span>Current task<strong>${agent.task}</strong></span>
      <span>Tasks completed<strong>${state === "COMPLETE" ? "28" : "27"}</strong></span>
      <span>Uptime<strong>99.94%</strong></span>
      <span>Progress<strong>${progress}%</strong></span>
    </div>
    <div class="capability-row">
      <span>Capabilities</span>
      <b>RESEARCH</b>
      <b>SUMMARIZE</b>
      <b>REPORT</b>
    </div>
    <p class="detail-result">${
      state === "COMPLETE"
        ? agent.result
        : "Conceptual demo state. No external service is connected."
    }</p>
  `;
}

function addActivityFeed(agent, eventText) {
  const feed = $("[data-activity]");
  if (!feed) return;

  const list = feed.querySelector("ul");
  if (!list) return;

  const entry = document.createElement("li");
  const time = new Date(
    0,
    0,
    0,
    14,
    32,
    11 + Math.max(0, list.children.length * 3)
  )
    .toTimeString()
    .slice(0, 8);

  entry.innerHTML = `
    <time>${time}</time>
    <span><b>${agent.name}</b> ${eventText.toLowerCase()}</span>
  `;

  list.prepend(entry);
}

function runTask(agentId) {
  const button = $("[data-assign-task]");
  const progress = $("[data-progress]");
  const agent = agents[agentId];

  if (!button || !progress || !agent || button.disabled) return;

  button.disabled = true;

  const label = $("[data-task-label]");
  if (label) label.textContent = agent.task;

  let step = 1;

  const tick = () => {
    const currentState = stateOrder[step];
    const value =
      currentState === "QUEUED"
        ? 18
        : currentState === "RUNNING"
          ? 62
          : 100;

    progress.style.setProperty("--progress", `${value}%`);

    const strong = progress.querySelector("strong");
    if (strong) strong.textContent = `${value}%`;

    renderAgentDetail(agentId, currentState, value);
    addActivityFeed(agent, eventLabels[Math.max(0, step - 1)]);

    if (step < stateOrder.length - 1) {
      step += 1;
      window.setTimeout(tick, 800);
      return;
    }

    button.disabled = false;
    button.innerHTML = "RUN AGAIN <span>↗</span>";
  };

  addActivityFeed(agent, "Task assigned");
  window.setTimeout(tick, 250);
}

function bindAgentSelection(root = document) {
  const buttons = root.querySelectorAll("[data-agent-select]");
  const selected =
    root.querySelector("[data-agent-select].is-selected") || buttons[0];

  const updateSelection = (nextId) => {
    buttons.forEach((button) => {
      button.classList.toggle(
        "is-selected",
        button.dataset.agentSelect === nextId
      );
    });

    const taskLabel = $("[data-task-label]");
    const agent = agents[nextId];

    if (taskLabel && agent) {
      taskLabel.textContent = agent.task;
    }

    renderAgentDetail(nextId, "IDLE", 0);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextId = button.dataset.agentSelect;
      if (nextId) updateSelection(nextId);
    });
  });

  if (selected) {
    updateSelection(selected.dataset.agentSelect || "research");
  }
}

function bindNetworkTooltip(root = document) {
  const tooltip = $("[data-network-tooltip]", root);
  const buttons = root.querySelectorAll("[data-network-agent]");

  const updateTooltip = (button) => {
    const agent = agents[button.dataset.networkAgent];
    if (!tooltip || !agent) return;

    tooltip.innerHTML = `
      <strong>${agent.name}</strong>
      <span>${agent.status} / ${agent.specialty}</span>
    `;
  };

  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => updateTooltip(button));
    button.addEventListener("focus", () => updateTooltip(button));
  });
}

function bindHeroMotion(root = document) {
  const hero = root.querySelector(".slock-hero");

  if (!hero) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    document.body.classList.add("motion-reduced");
    return;
  }

  let frame = 0;

  const setPointer = (event) => {
    const rect = hero.getBoundingClientRect();

    if (event.clientY < rect.top || event.clientY > rect.bottom) {
      return;
    }

    const normalizedX =
      ((event.clientX - rect.left) / rect.width - 0.5) * 2;

    const normalizedY =
      ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      hero.style.setProperty(
        "--pointer-x",
        `${normalizedX * 10}px`
      );

      hero.style.setProperty(
        "--pointer-y",
        `${normalizedY * 8}px`
      );
    });
  };

  const resetPointer = () => {
    hero.style.setProperty("--pointer-x", "0px");
    hero.style.setProperty("--pointer-y", "0px");
  };

  const setScrollProgress = () => {
    const rect = hero.getBoundingClientRect();
    const distance = Math.max(1, rect.height + window.innerHeight);

    const progress = Math.min(
      1,
      Math.max(
        0,
        (window.innerHeight - rect.top) / distance
      )
    );

    hero.style.setProperty(
      "--hero-progress",
      progress.toFixed(3)
    );
  };

  hero.addEventListener("pointermove", setPointer, {
    passive: true
  });

  hero.addEventListener("pointerleave", resetPointer, {
    passive: true
  });

  window.addEventListener("scroll", setScrollProgress, {
    passive: true
  });

  setScrollProgress();
}

export function initSlock() {
  const root = document.querySelector("[data-slock]");

  if (!root) return;

  if (root.dataset.slockInitialized === "true") {
    return;
  }

  root.dataset.slockInitialized = "true";

  const { reduceMotion } = initSite();

  if (reduceMotion) {
    document.body.classList.add("motion-reduced");
  }

  bindAgentSelection(root);
  bindNetworkTooltip(root);
  bindHeroMotion(root);

  const button = $("[data-assign-task]", root);

  if (button) {
    button.addEventListener("click", () => {
      const selected =
        root.querySelector("[data-agent-select].is-selected")
          ?.dataset.agentSelect || "research";

      runTask(selected);
    });
  }

  hydrateSlockAssets(root).catch(() => undefined);
}
