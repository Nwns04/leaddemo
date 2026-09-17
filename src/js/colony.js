import * as THREE from "https://esm.sh/three@0.180.0";
import { initSite } from "./site.js";
import {
  COLONY_DEMO_LABEL,
  buildColonyData,
  shortAddress,
  formatCompact,
  holderStatus
} from "./colony-data.js";

const MOBILE_BREAKPOINT = 720;

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

const dummy = new THREE.Object3D();

function setInstanceTransform(mesh, index, position, scale, yaw = 0) {
  dummy.position.copy(position);
  dummy.rotation.set(0, yaw, 0);
  dummy.scale.set(scale.x, scale.y, scale.z);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

class ColonyWorld {
  constructor(root) {
    this.root = root;
    this.canvas = $("[data-colony-canvas]", root);
    this.tooltip = $("[data-holder-tooltip]", root);
    this.inspector = $("[data-holder-inspector]", root);
    this.modeButtons = $all("[data-colony-mode]", root);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this.holderCount = this.mobile ? 650 : 2400;
    this.data = buildColonyData(this.holderCount);
    this.mode = "ants";
    this.hovered = -1;
    this.selected = -1;
    this.pointer = new THREE.Vector2(99, 99);
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.activeIds = [];
    this.scrollProgress = 0;
    this.currentLook = new THREE.Vector3(0, 0, 0);

    // Optional focus point supplied by colony-extras.js.
    // During STRUCTURE this lets the camera perform a true overhead pull-out
    // centered on the continuously moving commander ant.
    this.structureFocus = new THREE.Vector3(0, 0, 0);
    this.structureFocusActive = false;

    this.resizeObserver = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070808);
    this.scene.fog = new THREE.FogExp2(0x070808, 0.027);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.set(0, 11.5, 19.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.mobile,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.88;

    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.initLights();
    this.initTerrain();
    this.initAtmosphere();
    this.initPaths();
    this.initHolders();
    this.initClusterHalos();
    this.initSelection();
    this.bind();
    this.resize();
    this.updateMetrics();

    this.renderer.setAnimationLoop(() => this.render());
  }

  initLights() {
    const ambient = new THREE.HemisphereLight(0xb9c2b1, 0x241b12, 0.55);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffd18c, 2.1);
    key.position.set(-8, 16, 5);
    this.scene.add(key);

    const rim = new THREE.PointLight(0xe2a957, 38, 34, 2);
    rim.position.set(7, 5, -5);
    this.scene.add(rim);

    const fill = new THREE.PointLight(0x8e7250, 22, 26, 2);
    fill.position.set(-9, 3, 7);
    this.scene.add(fill);
  }

  terrainHeight(x, z) {
    return (
      Math.sin(x * 0.21) * 0.22 +
      Math.cos(z * 0.19) * 0.18 +
      Math.sin((x + z) * 0.11) * 0.14 -
      Math.exp(-((x * x + z * z) / 120)) * 0.55
    );
  }

  initTerrain() {
    const geometry = new THREE.PlaneGeometry(43, 43, 84, 84);
    geometry.rotateX(-Math.PI / 2);

    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      position.setY(i, this.terrainHeight(x, z));
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x15120e,
      roughness: 0.98,
      metalness: 0.03,
      side: THREE.DoubleSide
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.position.y = -0.05;
    this.world.add(terrain);

    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: 0x745935,
        transparent: true,
        opacity: 0.055
      })
    );
    wire.position.y = 0.012;
    this.world.add(wire);
  }

  initAtmosphere() {
    const count = this.mobile ? 260 : 720;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    const random = this.data.holders.length;
    for (let i = 0; i < count; i += 1) {
      const seed = (i * 9301 + random * 49297) % 233280;
      const r1 = ((seed * 17) % 1000) / 1000;
      const r2 = ((seed * 29) % 1000) / 1000;
      const r3 = ((seed * 43) % 1000) / 1000;
      const radius = 7 + r1 * 20;
      const theta = r2 * Math.PI * 2;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = 0.3 + r3 * 7;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xd8a75d,
      size: this.mobile ? 0.026 : 0.035,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });

    this.dust = new THREE.Points(geometry, material);
    this.scene.add(this.dust);
  }

  initPaths() {
    this.pathGroup = new THREE.Group();
    const holderGroups = new Map();

    this.data.holders.forEach((holder) => {
      if (!holderGroups.has(holder.cluster)) holderGroups.set(holder.cluster, []);
      holderGroups.get(holder.cluster).push(holder);
    });

    [...holderGroups.values()].forEach((group, clusterIndex) => {
      for (let pathIndex = 0; pathIndex < 4; pathIndex += 1) {
        const points = [];
        for (let i = 0; i < 7; i += 1) {
          const holder = group[(pathIndex * 17 + i * 31) % group.length];
          const p = holder.position;
          points.push(new THREE.Vector3(p.x, p.y + 0.035, p.z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(90));
        const material = new THREE.LineBasicMaterial({
          color: clusterIndex === 4 ? 0xe9b867 : 0x916d3f,
          transparent: true,
          opacity: clusterIndex === 4 ? 0.23 : 0.12
        });

        this.pathGroup.add(new THREE.Line(geometry, material));
      }
    });

    this.world.add(this.pathGroup);

    const pulseGeometry = new THREE.SphereGeometry(0.055, 8, 8);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xffc66f });

    this.pulses = [];
    this.pathGroup.children.slice(0, 12).forEach((line, index) => {
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.userData.line = line;
      pulse.userData.offset = index / 12;
      this.pulses.push(pulse);
      this.world.add(pulse);
    });
  }

  initHolders() {
    const count = this.data.holders.length;

    const headGeo = new THREE.SphereGeometry(0.1, 8, 6);
    const thoraxGeo = new THREE.SphereGeometry(0.13, 8, 6);
    const abdomenGeo = new THREE.SphereGeometry(0.16, 9, 7);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x33291c,
      roughness: 0.78,
      metalness: 0.2
    });

    const abdomenMat = bodyMat.clone();
    abdomenMat.color.set(0x57401f);

    this.antHead = new THREE.InstancedMesh(headGeo, bodyMat, count);
    this.antThorax = new THREE.InstancedMesh(thoraxGeo, bodyMat, count);
    this.antAbdomen = new THREE.InstancedMesh(abdomenGeo, abdomenMat, count);

    [this.antHead, this.antThorax, this.antAbdomen].forEach((mesh) => {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = true;
      this.world.add(mesh);
    });

    this.pointPositions = new Float32Array(count * 3);
    this.pointColors = new Float32Array(count * 3);

    const warm = new THREE.Color(0xd59c4d);
    const muted = new THREE.Color(0x806a4d);

    this.data.holders.forEach((holder, index) => {
      const { x, y, z } = holder.position;
      const yaw = ((holder.id * 1.618) % 6.28) - Math.PI;
      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));

      const thoraxPos = new THREE.Vector3(x, y + 0.13, z);
      const headPos = thoraxPos.clone().addScaledVector(forward, 0.21);
      const abdomenPos = thoraxPos.clone().addScaledVector(forward, -0.23);

      const holderScale = 0.78 + Math.min(0.52, Math.log10(holder.balance + 10) * 0.09);

      setInstanceTransform(
        this.antThorax,
        index,
        thoraxPos,
        new THREE.Vector3(holderScale * 0.84, holderScale * 0.75, holderScale),
        yaw
      );
      setInstanceTransform(
        this.antHead,
        index,
        headPos,
        new THREE.Vector3(holderScale * 0.7, holderScale * 0.51, holderScale * 0.875),
        yaw
      );
      setInstanceTransform(
        this.antAbdomen,
        index,
        abdomenPos,
        new THREE.Vector3(holderScale, holderScale * 0.75, holderScale * 1.25),
        yaw
      );

      this.pointPositions[index * 3] = x;
      this.pointPositions[index * 3 + 1] = y + 0.16;
      this.pointPositions[index * 3 + 2] = z;

      const color = holder.activity > 0.65 ? warm : muted;
      this.pointColors[index * 3] = color.r;
      this.pointColors[index * 3 + 1] = color.g;
      this.pointColors[index * 3 + 2] = color.b;

      if (holder.activity > 0.87 && this.activeIds.length < 90) {
        this.activeIds.push(index);
      }
    });

    this.antHead.instanceMatrix.needsUpdate = true;
    this.antThorax.instanceMatrix.needsUpdate = true;
    this.antAbdomen.instanceMatrix.needsUpdate = true;

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(this.pointPositions, 3));
    pointGeometry.setAttribute("color", new THREE.BufferAttribute(this.pointColors, 3));

    const pointMaterial = new THREE.PointsMaterial({
      size: this.mobile ? 0.075 : 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.holderPoints = new THREE.Points(pointGeometry, pointMaterial);
    this.holderPoints.visible = false;
    this.world.add(this.holderPoints);
  }

  initClusterHalos() {
    this.clusterGroup = new THREE.Group();

    this.data.clusters.forEach((cluster, index) => {
      const radius = index === 4 ? 4.4 : 3.2;
      const geometry = new THREE.RingGeometry(radius * 0.78, radius, 72);
      geometry.rotateX(-Math.PI / 2);

      const material = new THREE.MeshBasicMaterial({
        color: index === 4 ? 0xd9a65c : 0x745633,
        transparent: true,
        opacity: index === 4 ? 0.16 : 0.085,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const halo = new THREE.Mesh(geometry, material);
      halo.position.set(
        cluster.x,
        this.terrainHeight(cluster.x, cluster.z) + 0.05,
        cluster.z
      );

      this.clusterGroup.add(halo);
    });

    this.clusterGroup.visible = false;
    this.world.add(this.clusterGroup);
  }

  initSelection() {
    const ringGeometry = new THREE.RingGeometry(0.32, 0.4, 32);
    ringGeometry.rotateX(-Math.PI / 2);

    this.selectionRing = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffcd7d,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    this.selectionRing.visible = false;
    this.world.add(this.selectionRing);

    this.selectionBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xe3aa5a,
        transparent: true,
        opacity: 0.52
      })
    );
    this.selectionBeacon.visible = false;
    this.world.add(this.selectionBeacon);
  }

  updateMetrics() {
    const active = this.data.holders.filter((holder) => holder.activity > 0.62).length;
    const newHolders = this.data.holders.filter((holder) => holder.joinedDaysAgo < 30).length;

    const values = {
      holders: this.data.holders.length,
      active,
      newHolders,
      clusters: this.data.clusters.length
    };

    Object.entries(values).forEach(([key, value]) => {
      $all(`[data-colony-metric="${key}"]`, this.root).forEach((node) => {
        node.textContent = value.toLocaleString();
      });
    });

    $all("[data-demo-label]", this.root).forEach((node) => {
      node.textContent = COLONY_DEMO_LABEL;
    });
  }

  setMode(mode) {
    this.mode = mode;

    this.modeButtons.forEach((button) => {
      const active = button.dataset.colonyMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const antsVisible = mode === "ants";
    const nodesVisible = mode === "nodes";
    const clustersVisible = mode === "clusters";

    this.antHead.visible = antsVisible || clustersVisible;
    this.antThorax.visible = antsVisible || clustersVisible;
    this.antAbdomen.visible = antsVisible || clustersVisible;
    this.holderPoints.visible = nodesVisible;
    this.clusterGroup.visible = clustersVisible;

    this.pathGroup.children.forEach((line) => {
      line.material.opacity = nodesVisible ? 0.22 : clustersVisible ? 0.17 : 0.12;
    });
  }

  bind() {
    this.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.setMode(button.dataset.colonyMode || "ants");
      });
    });

    this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event), {
      passive: true
    });

    this.canvas.addEventListener("pointerleave", () => {
      this.pointer.set(99, 99);
      this.hovered = -1;
      this.hideTooltip();
    });

    this.canvas.addEventListener("click", () => {
      if (this.hovered >= 0) this.selectHolder(this.hovered);
    });

    window.addEventListener("scroll", () => this.updateScroll(), { passive: true });
    window.addEventListener("resize", () => this.resize(), { passive: true });

    this.updateScroll();

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    }
  }

  onPointerMove(event) {
    const rect = this.canvas.getBoundingClientRect();

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const interactive = this.mode === "nodes" ? this.holderPoints : this.antAbdomen;
    const hits = this.raycaster.intersectObject(interactive, false);

    if (!hits.length) {
      this.hovered = -1;
      this.hideTooltip();
      this.canvas.style.cursor = "grab";
      return;
    }

    const hit = hits[0];
    const instanceId = this.mode === "nodes" ? hit.index : hit.instanceId;

    if (instanceId == null) return;

    this.hovered = instanceId;
    this.canvas.style.cursor = "pointer";
    this.showTooltip(instanceId, event.clientX, event.clientY);
  }

  showTooltip(index, clientX, clientY) {
    if (!this.tooltip) return;

    const holder = this.data.holders[index];
    this.tooltip.hidden = false;
    this.tooltip.style.left = `${clientX + 18}px`;
    this.tooltip.style.top = `${clientY + 18}px`;

    const address = $("[data-tooltip-address]", this.tooltip);
    const state = $("[data-tooltip-state]", this.tooltip);
    const share = $("[data-tooltip-share]", this.tooltip);

    if (address) address.textContent = shortAddress(holder.address);
    if (state) state.textContent = holderStatus(holder);
    if (share) share.textContent = `${holder.share.toFixed(4)}%`;
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.hidden = true;
  }

  selectHolder(index) {
    this.selected = index;
    const holder = this.data.holders[index];

    this.selectionRing.visible = true;
    this.selectionRing.position.set(
      holder.position.x,
      holder.position.y + 0.025,
      holder.position.z
    );

    this.selectionBeacon.visible = true;
    this.selectionBeacon.position.set(
      holder.position.x,
      holder.position.y + 0.92,
      holder.position.z
    );

    if (this.inspector) {
      this.inspector.classList.add("is-open");

      const values = {
        address: shortAddress(holder.address),
        position: `${holder.share.toFixed(4)}%`,
        joined: `${holder.joinedDaysAgo} DAYS`,
        activity: holderStatus(holder),
        balance: formatCompact(holder.balance),
        cluster: `CLUSTER ${String(holder.cluster + 1).padStart(2, "0")}`
      };

      Object.entries(values).forEach(([key, value]) => {
        const node = $(`[data-holder-value="${key}"]`, this.inspector);
        if (node) node.textContent = value;
      });
    }

    this.currentLook.set(holder.position.x, holder.position.y, holder.position.z);
  }

  updateScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    this.scrollProgress = clamp(window.scrollY / max);
  }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const height = Math.max(1, this.canvas.clientHeight || window.innerHeight);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, window.innerWidth <= MOBILE_BREAKPOINT ? 1.25 : 1.6)
    );
  }

  updateCamera(delta) {
    const t = this.scrollProgress;

    let cameraPos;
    let look;

    // 01–04: existing cinematic travel through hero / formation / explorer / network.
    if (t < 0.2) {
      const p = t / 0.2;
      cameraPos = new THREE.Vector3(
        lerp(0.5, -1.8, p),
        lerp(11.5, 8.8, p),
        lerp(19.5, 15.2, p)
      );
      look = new THREE.Vector3(0, 0.2, 0);
    } else if (t < 0.48) {
      const p = (t - 0.2) / 0.28;
      cameraPos = new THREE.Vector3(
        lerp(-1.8, 6.5, p),
        lerp(8.8, 6.2, p),
        lerp(15.2, 11.6, p)
      );
      look = new THREE.Vector3(
        lerp(0, 2.4, p),
        0.2,
        lerp(0, 1.4, p)
      );
    } else if (t < 0.70) {
      const p = (t - 0.48) / 0.22;
      cameraPos = new THREE.Vector3(
        lerp(6.5, -5.8, p),
        lerp(6.2, 7.4, p),
        lerp(11.6, 10.2, p)
      );
      look = new THREE.Vector3(
        lerp(2.4, -0.8, p),
        0.15,
        lerp(1.4, 2.4, p)
      );
    } else if (t < 0.90) {
      // 05 / STRUCTURE:
      // Do not fake a zoom by shrinking the ant.
      // Physically raise the camera and rotate into a near top-down view.
      // The commander ant remains the only GLB subject in this section.
      const p = (t - 0.70) / 0.20;
      const eased = p * p * (3 - 2 * p);

      const focus = this.structureFocusActive
        ? this.structureFocus
        : new THREE.Vector3(0, 0.8, 2.8);

      // Start as a close elevated 3/4 shot, then climb vertically.
      const startOffset = new THREE.Vector3(4.8, 8.0, 9.2);
      const endOffset = new THREE.Vector3(0.35, 31.5, 1.0);

      const offset = startOffset.clone().lerp(endOffset, eased);

      cameraPos = focus.clone().add(offset);
      look = focus.clone();

      // Slightly bias the look point toward the ground beneath the commander
      // so the system/terrain reveals itself around him as altitude increases.
      look.y = lerp(focus.y + 0.15, focus.y - 0.25, eased);
    } else {
      // Hold the wide architectural reveal into the final section.
      const p = (t - 0.90) / 0.10;
      const focus = this.structureFocusActive
        ? this.structureFocus
        : new THREE.Vector3(0, 0.8, 2.8);

      cameraPos = focus.clone().add(
        new THREE.Vector3(
          lerp(0.35, 0.0, p),
          lerp(31.5, 37.0, p),
          lerp(1.0, 0.25, p)
        )
      );
      look = focus.clone();
      look.y -= 0.3;
    }

    // Holder selection may influence the camera only before STRUCTURE.
    if (
      this.selected >= 0 &&
      t > 0.24 &&
      t < 0.67
    ) {
      const selected = this.data.holders[this.selected];

      look.lerp(
        new THREE.Vector3(
          selected.position.x,
          selected.position.y,
          selected.position.z
        ),
        0.18
      );
    }

    const smoothing = this.reducedMotion
      ? 1
      : 1 - Math.pow(0.001, delta);

    this.camera.position.lerp(
      cameraPos,
      smoothing * 0.12
    );

    this.currentLook.lerp(
      look,
      smoothing * 0.1
    );

    this.camera.lookAt(this.currentLook);
  }

  updateActiveHolders(time) {
    if (this.reducedMotion || this.mode === "nodes") return;

    this.activeIds.forEach((index, i) => {
      const holder = this.data.holders[index];
      const base = holder.position;

      const yaw =
        ((holder.id * 1.618) % 6.28) -
        Math.PI +
        Math.sin(time * 0.55 + i) * 0.15;

      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const wiggle = Math.sin(time * 0.8 + i * 0.6) * 0.055;

      const thoraxPos = new THREE.Vector3(
        base.x + forward.x * wiggle,
        base.y + 0.13,
        base.z + forward.z * wiggle
      );

      const headPos = thoraxPos.clone().addScaledVector(forward, 0.21);
      const abdomenPos = thoraxPos.clone().addScaledVector(forward, -0.23);

      const holderScale = 0.78 + Math.min(0.52, Math.log10(holder.balance + 10) * 0.09);

      setInstanceTransform(
        this.antThorax,
        index,
        thoraxPos,
        new THREE.Vector3(holderScale * 0.84, holderScale * 0.75, holderScale),
        yaw
      );
      setInstanceTransform(
        this.antHead,
        index,
        headPos,
        new THREE.Vector3(holderScale * 0.7, holderScale * 0.51, holderScale * 0.875),
        yaw
      );
      setInstanceTransform(
        this.antAbdomen,
        index,
        abdomenPos,
        new THREE.Vector3(holderScale, holderScale * 0.75, holderScale * 1.25),
        yaw
      );
    });

    this.antHead.instanceMatrix.needsUpdate = true;
    this.antThorax.instanceMatrix.needsUpdate = true;
    this.antAbdomen.instanceMatrix.needsUpdate = true;
  }

  updatePulses(time) {
    if (this.reducedMotion) return;

    this.pulses.forEach((pulse, index) => {
      const positions = pulse.userData.line.geometry.attributes.position;
      const phase = (time * 0.055 + pulse.userData.offset) % 1;
      const pointIndex = Math.min(
        positions.count - 1,
        Math.floor(phase * positions.count)
      );

      pulse.position.set(
        positions.getX(pointIndex),
        positions.getY(pointIndex) + 0.08,
        positions.getZ(pointIndex)
      );

      const scale = 0.65 + Math.sin(time * 3 + index) * 0.18;
      pulse.scale.setScalar(scale);
    });
  }

  render() {
    const delta = Math.min(0.05, this.clock.getDelta());
    const time = this.clock.elapsedTime;

    this.updateCamera(delta);
    this.updateActiveHolders(time);
    this.updatePulses(time);

    if (!this.reducedMotion) {
      this.world.rotation.y = Math.sin(time * 0.08) * 0.015;
      this.dust.rotation.y += delta * 0.008;

      if (this.selectionRing.visible) {
        const s = 1 + Math.sin(time * 2.4) * 0.12;
        this.selectionRing.scale.setScalar(s);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}

export function initColony() {
  const root = document.querySelector("[data-colony]");
  if (!root) return;

  if (root.dataset.colonyInitialized === "true") return;
  root.dataset.colonyInitialized = "true";

  const { reduceMotion } = initSite();
  if (reduceMotion) document.body.classList.add("motion-reduced");

  const world = new ColonyWorld(root);

  const close = $("[data-inspector-close]", root);
  if (close) {
    close.addEventListener("click", () => {
      const inspector = $("[data-holder-inspector]", root);
      inspector?.classList.remove("is-open");
      world.selected = -1;
      world.selectionRing.visible = false;
      world.selectionBeacon.visible = false;
    });
  }

  root.__colonyWorld = world;
}
