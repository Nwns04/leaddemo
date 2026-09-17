import * as THREE from "https://esm.sh/three@0.180.0";
import { GLTFLoader } from "https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const DEMO_CONTRACT = "0xC0110A0000000000000000000000000000002026";
const DEMO_WALLET = "0x7A2F3C4D5E6F00112233445566778899AA0019DE";

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shortWallet(address) {
  if (!address) return "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function normalizeModel(scene) {
  const root = new THREE.Group();
  root.add(scene);

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z, 0.0001);
  const normalizedScale = 1 / maxAxis;

  scene.position.sub(center);
  scene.scale.setScalar(normalizedScale);

  scene.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = true;

    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => material.clone());
    } else if (object.material) {
      object.material = object.material.clone();
    }
  });

  return root;
}

function setOpacity(object, opacity) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((material) => {
      material.transparent = opacity < 0.999 || material.transparent;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.3;
      material.needsUpdate = true;
    });
  });

  object.visible = opacity > 0.015;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.min(
    1,
    Math.max(0, (value - edge0) / Math.max(0.0001, edge1 - edge0))
  );
  return t * t * (3 - 2 * t);
}

function lerpVector3(a, b, t) {
  return new THREE.Vector3(
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t)
  );
}

function sampleKeyframes(frames, progress) {
  if (progress <= frames[0].t) return frames[0];
  if (progress >= frames[frames.length - 1].t) return frames[frames.length - 1];

  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i];
    const b = frames[i + 1];

    if (progress >= a.t && progress <= b.t) {
      const span = Math.max(0.0001, b.t - a.t);
      const local = (progress - a.t) / span;

      return {
        t: progress,
        pos: [
          lerp(a.pos[0], b.pos[0], local),
          lerp(a.pos[1], b.pos[1], local),
          lerp(a.pos[2], b.pos[2], local)
        ],
        rot: [
          lerp(a.rot[0], b.rot[0], local),
          lerp(a.rot[1], b.rot[1], local),
          lerp(a.rot[2], b.rot[2], local)
        ],
        scale: lerp(a.scale, b.scale, local),
        opacity: lerp(a.opacity, b.opacity, local)
      };
    }
  }

  return frames[frames.length - 1];
}

const ASSET_CHOREOGRAPHY = {
  heroAnt: [
    // 01 / HERO — one ant, alone and monumental.
    { t: 0.00, pos: [4.25, 4.35, 8.95], rot: [0.12, -0.56, -0.025], scale: 8.8, opacity: 1.00 },
    { t: 0.08, pos: [4.05, 4.15, 8.70], rot: [0.12, -0.50, -0.020], scale: 8.55, opacity: 1.00 },
    { t: 0.15, pos: [3.60, 3.78, 8.00], rot: [0.11, -0.36, -0.015], scale: 7.90, opacity: 1.00 },

    // 02 / FORMATION — commander keeps moving at the FRONT.
    { t: 0.24, pos: [2.65, 3.10, 6.65], rot: [0.09, -0.10, -0.010], scale: 6.70, opacity: 1.00 },
    { t: 0.32, pos: [1.40, 2.62, 5.65], rot: [0.08, 0.08, -0.005], scale: 5.85, opacity: 1.00 },

    // 03 / HOLDER EXPLORER — followers take focus, commander continues ahead.
    { t: 0.40, pos: [0.35, 2.25, 5.00], rot: [0.07, 0.24, 0.0], scale: 5.15, opacity: 1.00 },
    { t: 0.48, pos: [-0.65, 1.95, 4.85], rot: [0.06, 0.46, 0.0], scale: 4.25, opacity: 1.00 },

    // 04 / NETWORK VIEW — commander keeps travelling while followers become nodes.
    { t: 0.58, pos: [-2.20, 1.70, 4.55], rot: [0.055, 0.72, 0.0], scale: 3.45, opacity: 0.98 },
    { t: 0.68, pos: [1.20, 1.55, 4.15], rot: [0.050, 1.02, 0.0], scale: 3.05, opacity: 0.96 },

    // 05 / ACTIVITY — same commander leads into the next visual field.
    { t: 0.78, pos: [4.10, 1.35, 3.55], rot: [0.045, 1.30, 0.0], scale: 2.65, opacity: 0.94 },

    // 06 / STRUCTURE — continues toward the colony architecture.
    { t: 0.88, pos: [1.40, 1.15, 2.95], rot: [0.040, 1.58, 0.0], scale: 2.30, opacity: 0.92 },

    // FINAL — still present as the visual guide; never abruptly disappears.
    { t: 1.00, pos: [-2.70, 0.95, 2.45], rot: [0.035, 1.90, 0.0], scale: 2.05, opacity: 0.88 }
  ],

  queenAnt: [
    { t: 0.00, pos: [0, -2, -8], rot: [0, 0, 0], scale: 1.0, opacity: 0.0 },
    { t: 0.38, pos: [5.8, 0.8, 5.8], rot: [0.08, -1.0, 0.0], scale: 1.7, opacity: 0.0 },
    { t: 0.56, pos: [2.5, 1.3, 3.2], rot: [0.08, -0.5, 0.0], scale: 2.4, opacity: 0.86 },
    { t: 0.76, pos: [-2.4, 1.4, 2.8], rot: [0.05, 0.5, 0.0], scale: 2.1, opacity: 0.72 },
    { t: 0.92, pos: [0, 0.6, 8.0], rot: [0.05, 1.0, 0.0], scale: 1.3, opacity: 0.1 },
    { t: 1.00, pos: [0, 0.6, 8.0], rot: [0.05, 1.0, 0.0], scale: 1.3, opacity: 0.0 }
  ],

  token: [
    { t: 0.00, pos: [8.0, 2.2, -3.0], rot: [0.5, 0.0, 0.25], scale: 1.6, opacity: 0.0 },
    { t: 0.12, pos: [6.3, 2.3, 0.5], rot: [0.35, 0.6, 0.2], scale: 1.8, opacity: 0.78 },
    { t: 0.28, pos: [4.5, 1.9, 1.8], rot: [0.25, 1.2, 0.12], scale: 1.4, opacity: 0.58 },
    { t: 0.44, pos: [7.8, 1.0, 4.8], rot: [0.15, 2.0, 0.0], scale: 1.0, opacity: 0.0 },
    { t: 1.00, pos: [7.8, 1.0, 4.8], rot: [0.15, 2.0, 0.0], scale: 1.0, opacity: 0.0 }
  ],

  nestCore: [
    { t: 0.00, pos: [-8.0, -1.0, 8.0], rot: [0, 0, 0], scale: 2.0, opacity: 0.0 },
    { t: 0.44, pos: [-5.2, 0.0, 6.2], rot: [0, 0.2, 0], scale: 2.4, opacity: 0.08 },
    { t: 0.62, pos: [-2.0, 0.1, 3.7], rot: [0, 0.45, 0], scale: 3.2, opacity: 0.56 },
    { t: 0.84, pos: [0, -0.2, 2.8], rot: [0, 0.75, 0], scale: 3.7, opacity: 0.42 },
    { t: 1.00, pos: [0, -0.5, 6.0], rot: [0, 1.0, 0], scale: 3.0, opacity: 0.0 }
  ],

  earthFragment: [
    { t: 0.00, pos: [-9.0, -0.8, 7.5], rot: [0.2, 0.2, 0.1], scale: 4.0, opacity: 0.0 },
    { t: 0.20, pos: [-7.0, -0.7, 5.5], rot: [0.2, 0.5, 0.1], scale: 4.0, opacity: 0.22 },
    { t: 0.50, pos: [-4.0, -0.8, 4.5], rot: [0.2, 0.9, 0.05], scale: 4.5, opacity: 0.28 },
    { t: 0.78, pos: [3.0, -1.0, 6.5], rot: [0.2, 1.4, 0.0], scale: 4.2, opacity: 0.18 },
    { t: 1.00, pos: [7.0, -1.0, 8.0], rot: [0.2, 1.7, 0.0], scale: 4.0, opacity: 0.0 }
  ]
};


const FOLLOWER_LAYOUTS = [
  // FORMATION positions are OFFSETS from the commander.
  // Negative Z means farther from camera / physically BEHIND the leader.
  // Rows widen and shrink as they recede, forming a clean marching wedge.
  {
    formationOffset: [-1.65, 0.05, -1.55],
    explorer: [-4.80, 2.20, 4.55],
    formationScale: 2.10,
    explorerScale: 2.65,
    formationYaw: 0.02,
    explorerYaw: 0.25,
    phase: 0.20
  },
  {
    formationOffset: [1.65, 0.05, -1.55],
    explorer: [-2.85, 2.30, 4.40],
    formationScale: 2.05,
    explorerScale: 2.90,
    formationYaw: -0.05,
    explorerYaw: 0.48,
    phase: 0.85
  },

  {
    formationOffset: [-3.00, 0.10, -3.00],
    explorer: [-0.95, 2.16, 4.25],
    formationScale: 1.72,
    explorerScale: 2.75,
    formationYaw: 0.08,
    explorerYaw: 0.12,
    phase: 1.45
  },
  {
    formationOffset: [0.00, 0.14, -3.20],
    explorer: [1.05, 2.34, 4.15],
    formationScale: 1.78,
    explorerScale: 3.05,
    formationYaw: 0.00,
    explorerYaw: -0.28,
    phase: 2.00,
    selected: true
  },
  {
    formationOffset: [3.00, 0.10, -3.00],
    explorer: [3.15, 2.14, 4.30],
    formationScale: 1.70,
    explorerScale: 2.70,
    formationYaw: -0.10,
    explorerYaw: -0.48,
    phase: 2.55
  },

  {
    formationOffset: [-4.15, 0.18, -4.65],
    explorer: [-4.10, 1.72, 3.50],
    formationScale: 1.35,
    explorerScale: 2.40,
    formationYaw: 0.12,
    explorerYaw: 0.72,
    phase: 3.05
  },
  {
    formationOffset: [-1.40, 0.22, -4.90],
    explorer: [-1.65, 1.66, 3.35],
    formationScale: 1.42,
    explorerScale: 2.32,
    formationYaw: 0.05,
    explorerYaw: 0.32,
    phase: 3.60
  },
  {
    formationOffset: [1.40, 0.22, -4.90],
    explorer: [1.75, 1.65, 3.32],
    formationScale: 1.40,
    explorerScale: 2.28,
    formationYaw: -0.05,
    explorerYaw: -0.34,
    phase: 4.15
  },
  {
    formationOffset: [4.15, 0.18, -4.65],
    explorer: [4.20, 1.70, 3.45],
    formationScale: 1.34,
    explorerScale: 2.38,
    formationYaw: -0.14,
    explorerYaw: -0.56,
    phase: 4.70
  },

  {
    formationOffset: [-2.20, 0.28, -6.20],
    explorer: [-2.70, 1.24, 2.70],
    formationScale: 1.08,
    explorerScale: 2.05,
    formationYaw: 0.08,
    explorerYaw: 0.26,
    phase: 5.20
  },
  {
    formationOffset: [2.20, 0.28, -6.20],
    explorer: [2.75, 1.24, 2.75],
    formationScale: 1.05,
    explorerScale: 2.05,
    formationYaw: -0.08,
    explorerYaw: -0.26,
    phase: 5.75
  }
];

function cloneFollowerAnt(source, index) {
  const clone = source.clone(true);
  clone.name = `COLONY_FOLLOWER_ANT_${String(index + 1).padStart(2, "0")}`;

  const materials = [];

  clone.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => {
        const next = material.clone();
        materials.push(next);
        return next;
      });
    } else {
      child.material = child.material.clone();
      materials.push(child.material);
    }

    child.renderOrder = 3;
    child.castShadow = false;
    child.receiveShadow = false;
  });

  clone.userData.followerMaterials = materials;
  clone.visible = false;

  return clone;
}

function setFollowerOpacity(follower, opacity) {
  const materials = follower.object.userData.followerMaterials || [];

  materials.forEach((material) => {
    material.transparent = opacity < 0.999 || material.transparent;
    material.opacity = opacity;
    material.depthWrite = opacity > 0.28;
  });

  follower.object.visible = opacity > 0.015;
}

function createFollowerAntSystem(world, heroAnt) {
  if (!heroAnt) return null;

  const group = new THREE.Group();
  group.name = "COLONY_FOLLOWER_ANTS";

  const followers = FOLLOWER_LAYOUTS.map((layout, index) => {
    const object = cloneFollowerAnt(heroAnt, index);
    group.add(object);

    return {
      object,
      layout,
      currentScale: layout.formationScale
    };
  });

  world.scene.add(group);

  // The selected holder remains an ANT. The data layer identifies it with
  // a restrained ring + vertical amber trace rather than replacing it with
  // a sci-fi machine.
  const ringGeometry = new THREE.RingGeometry(0.42, 0.54, 56);
  ringGeometry.rotateX(-Math.PI / 2);

  const ring = new THREE.Mesh(
    ringGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xf0b85f,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.010, 0.010, 2.2, 8),
    new THREE.MeshBasicMaterial({
      color: 0xe5a54a,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );

  ring.name = "COLONY_SELECTED_FOLLOWER_RING";
  beam.name = "COLONY_SELECTED_FOLLOWER_TRACE";

  group.add(ring, beam);

  return {
    group,
    followers,
    ring,
    beam,
    selectedIndex: FOLLOWER_LAYOUTS.findIndex((layout) => layout.selected)
  };
}

function updateFollowerAntSystem(system, heroAnt, progress, time, reduceMotion) {
  if (!system) return;

  // Followers enter only after the single-ant opening has been established.
  const globalIn = smoothstep(0.115, 0.205, progress);

  // During HOLDER EXPLORER, followers leave the commander's rear formation,
  // move toward camera, grow, and become individual holder ants.
  const explorerBlend = smoothstep(0.300, 0.425, progress);

  // The followers hand off to the NODE visualization, while the commander
  // continues travelling into the next section.
  const physicalOut = 1 - smoothstep(0.505, 0.565, progress);

  system.followers.forEach((follower, index) => {
    const { layout, object } = follower;

    // Stagger the colony formation so it feels like followers assembling,
    // not ten copies popping in simultaneously.
    const staggerIn = smoothstep(
      0.115 + index * 0.006,
      0.190 + index * 0.006,
      progress
    );

    const opacity = globalIn * staggerIn * physicalOut;

    // FORMATION is anchored to the moving commander, keeping every follower
    // strictly BEHIND him instead of scattering underneath/around his body.
    const heroPosition = heroAnt?.position || new THREE.Vector3();
    const formationPosition = new THREE.Vector3(
      heroPosition.x + layout.formationOffset[0],
      heroPosition.y + layout.formationOffset[1],
      heroPosition.z + layout.formationOffset[2]
    );

    const explorerPosition = new THREE.Vector3(
      layout.explorer[0],
      layout.explorer[1],
      layout.explorer[2]
    );

    const position = formationPosition.clone().lerp(
      explorerPosition,
      explorerBlend
    );

    const motionStrength = reduceMotion ? 0 : opacity;
    const walkPhase = time * 1.05 + layout.phase;

    // Small whole-body motion is intentional: the GLB is not rigged, so this
    // reads as coordinated marching/body weight without faking leg animation.
    position.x += Math.sin(walkPhase * 0.62) * 0.055 * motionStrength;
    position.y += Math.sin(walkPhase) * 0.045 * motionStrength;
    position.z += Math.cos(walkPhase * 0.48) * 0.060 * motionStrength;

    object.position.copy(position);

    const yaw = lerp(
      layout.formationYaw,
      layout.explorerYaw,
      explorerBlend
    );

    object.rotation.set(
      0.04 + Math.sin(walkPhase * 0.41) * 0.010 * motionStrength,
      yaw + Math.sin(walkPhase * 0.24) * 0.035 * motionStrength,
      Math.cos(walkPhase * 0.52) * 0.008 * motionStrength
    );

    const scale = lerp(
      layout.formationScale,
      layout.explorerScale,
      explorerBlend
    );

    const breathe = reduceMotion
      ? 1
      : 1 + Math.sin(walkPhase * 0.82) * 0.014;

    follower.currentScale = scale * breathe;
    object.scale.setScalar(follower.currentScale);

    setFollowerOpacity(follower, opacity);
  });

  const selected = system.followers[system.selectedIndex];

  if (selected) {
    // Marker exists only in the HOLDER EXPLORER portion of the story.
    const markerIn = smoothstep(0.345, 0.405, progress);
    const markerOut = 1 - smoothstep(0.475, 0.535, progress);
    const markerOpacity = markerIn * markerOut;

    const body = selected.object.position;
    const scale = selected.currentScale;

    system.ring.position.set(
      body.x,
      body.y - scale * 0.34,
      body.z
    );

    system.beam.position.set(
      body.x,
      body.y + scale * 0.25,
      body.z
    );

    system.ring.scale.setScalar(0.85 + scale * 0.17);

    if (!reduceMotion) {
      const pulse = 1 + Math.sin(time * 2.4) * 0.10;
      system.ring.scale.multiplyScalar(pulse);
    }

    system.ring.material.opacity = markerOpacity * 0.85;
    system.beam.material.opacity = markerOpacity * 0.34;
    system.ring.visible = markerOpacity > 0.01;
    system.beam.visible = markerOpacity > 0.01;
  }
}

function updateNarrativeRepresentation(world, progress, state) {
  if (!world?.setMode) return state;

  // Hysteresis prevents rapid mode flipping around the threshold.
  if (progress >= 0.555 && state !== "nodes") {
    world.setMode("nodes");
    return "nodes";
  }

  if (progress <= 0.505 && state !== "ants") {
    world.setMode("ants");
    return "ants";
  }

  return state;
}


function tuneHeroAntMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((material) => {
      // Keep the downloaded texture intact, but make the dark model respond
      // more clearly to the COLONY lighting.
      if (material.color?.isColor) {
        material.color.multiplyScalar(1.16);
      }

      if ("roughness" in material) {
        material.roughness = Math.min(material.roughness ?? 0.78, 0.72);
      }

      if ("metalness" in material) {
        material.metalness = Math.max(material.metalness ?? 0.08, 0.12);
      }

      if ("envMapIntensity" in material) {
        material.envMapIntensity = Math.max(material.envMapIntensity ?? 1, 1.25);
      }

      if (material.emissiveMap && "emissiveIntensity" in material) {
        material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 1, 1.45);
      }

      material.needsUpdate = true;
    });

    child.castShadow = false;
    child.receiveShadow = false;
    child.renderOrder = 4;
  });
}

function createHeroAntLightRig(world) {
  const group = new THREE.Group();
  group.name = "COLONY_HERO_ANT_LIGHT_RIG";

  // Neutral-warm key: exposes graphite texture without washing it silver.
  const key = new THREE.PointLight(0xffe1ba, 72, 24, 2);
  key.name = "COLONY_HERO_ANT_KEY";

  // Bronze/amber rim: catches the model's edge and material accents.
  const rim = new THREE.PointLight(0xd98532, 50, 20, 2);
  rim.name = "COLONY_HERO_ANT_RIM";

  // Soft cool-neutral fill prevents the underside from disappearing.
  const fill = new THREE.PointLight(0xc8d0cf, 28, 18, 2);
  fill.name = "COLONY_HERO_ANT_FILL";

  group.add(key, rim, fill);
  world.scene.add(group);

  return { group, key, rim, fill };
}

function updateHeroAntLightRig(rig, ant, state) {
  if (!rig || !ant || !state) return;

  const p = ant.position;
  const visibility = Math.max(0, Math.min(1, state.opacity));

  rig.key.position.set(p.x - 2.8, p.y + 4.2, p.z + 4.0);
  rig.rim.position.set(p.x + 3.4, p.y + 2.2, p.z - 2.7);
  rig.fill.position.set(p.x - 1.4, p.y + 1.0, p.z + 1.6);

  // Lights are strongest during the hero and naturally recede as the ant
  // joins the procedural colony.
  rig.key.intensity = 72 * visibility;
  rig.rim.intensity = 50 * visibility;
  rig.fill.intensity = 28 * visibility;

  rig.group.visible = visibility > 0.02;
}

async function loadFluidAssets(world) {
  let manifest;

  try {
    const response = await fetch("/demos/colony/assets.json", { cache: "no-store" });
    if (!response.ok) return new Map();
    manifest = await response.json();
  } catch {
    return new Map();
  }

  const loader = new GLTFLoader();
  const loaded = new Map();
  const assetLayer = new THREE.Group();
  assetLayer.name = "COLONY_FLUID_ASSETS";
  world.scene.add(assetLayer);

  const entries = Object.entries(manifest).filter(([, value]) => Boolean(value));

  await Promise.all(
    entries.map(
      ([key, url]) =>
        new Promise((resolve) => {
          loader.load(
            url,
            (gltf) => {
              const normalized = normalizeModel(gltf.scene);
              normalized.name = `COLONY_ASSET_${key}`;

              if (key === "heroAnt") {
                tuneHeroAntMaterials(normalized);
              }

              setOpacity(normalized, 0);
              assetLayer.add(normalized);
              loaded.set(key, normalized);

              console.info(`[COLONY] Loaded 3D asset: ${key}`, url);
              resolve();
            },
            undefined,
            (error) => {
              console.error(`[COLONY] Failed to load 3D asset: ${key}`, url, error);
              resolve();
            }
          );
        })
    )
  );

  return loaded;
}

function animateFluidAssets(world, loaded) {
  if (!loaded.size) return () => {};

  let raf = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const heroAnt = loaded.get("heroAnt");
  const heroLightRig = heroAnt ? createHeroAntLightRig(world) : null;
  const followerSystem = heroAnt
    ? createFollowerAntSystem(world, heroAnt)
    : null;

  let narrativeRepresentation = "ants";

  const frame = () => {
    const progress = Math.min(1, Math.max(0, world.scrollProgress || 0));
    const time = performance.now() * 0.001;

    loaded.forEach((object, key) => {
      const frames = ASSET_CHOREOGRAPHY[key];
      if (!frames) return;

      const state = sampleKeyframes(frames, progress);

      object.position.set(state.pos[0], state.pos[1], state.pos[2]);
      object.rotation.set(
        state.rot[0],
        state.rot[1] + (key === "token" ? time * 0.16 : Math.sin(time * 0.35) * 0.025),
        state.rot[2]
      );

      const breathe = key.includes("Ant") || key === "heroAnt" || key === "queenAnt"
        ? 1 + Math.sin(time * 1.15) * 0.012
        : 1;

      if (key === "heroAnt") {
        // The hero remains the commander through FORMATION, then hands the
        // scene to the enlarged followers during HOLDER EXPLORER.
        // Commander never stops moving. Motion reduces slightly deeper in the
        // story, but remains present through every section.
        const heroPresence = reduceMotion
          ? 0
          : lerp(1.0, 0.48, progress);

        object.position.x += Math.sin(time * 0.52) * 0.10 * heroPresence;
        object.position.y += Math.sin(time * 1.05) * 0.075 * heroPresence;
        object.position.z += Math.cos(time * 0.42) * 0.13 * heroPresence;

        object.rotation.x += Math.sin(time * 0.72) * 0.012 * heroPresence;
        object.rotation.y += Math.sin(time * 0.34) * 0.045 * heroPresence;
        object.rotation.z += Math.cos(time * 0.61) * 0.010 * heroPresence;

        const heroBreathe = 1 + Math.sin(time * 1.18) * 0.018 * heroPresence;
        object.scale.setScalar(state.scale * heroBreathe);

        setOpacity(object, state.opacity);
        updateHeroAntLightRig(heroLightRig, object, state);

        // Feed the commander's live world position to the camera system.
        // colony.js uses this during STRUCTURE for a true overhead pull-out.
        world.structureFocus.copy(object.position);
        world.structureFocusActive = true;
      } else {
        object.scale.setScalar(state.scale * breathe);
        setOpacity(object, state.opacity);
      }
    });

    updateFollowerAntSystem(
      followerSystem,
      heroAnt,
      progress,
      time,
      reduceMotion
    );

    narrativeRepresentation = updateNarrativeRepresentation(
      world,
      progress,
      narrativeRepresentation
    );

    raf = requestAnimationFrame(frame);
  };

  frame();

  return () => {
    cancelAnimationFrame(raf);

    if (heroLightRig?.group) {
      world.scene.remove(heroLightRig.group);
    }

    if (followerSystem?.group) {
      world.scene.remove(followerSystem.group);
    }
  };
}

function updateWalletUI(root, world, address, label = "CONNECTED WALLET") {
  const identity = $("[data-wallet-identity]", root);
  const panel = $("[data-wallet-panel]", root);
  const walletAddress = $("[data-wallet-address]", root);
  const walletLabel = $("[data-wallet-label]", root);
  const walletHolder = $("[data-wallet-holder]", root);
  const walletCluster = $("[data-wallet-cluster]", root);

  const holderIndex = hashString(address) % world.data.holders.length;
  const holder = world.data.holders[holderIndex];

  if (identity) identity.hidden = false;
  if (panel) panel.hidden = false;

  if (walletAddress) walletAddress.textContent = shortWallet(address);
  if (walletLabel) walletLabel.textContent = label;
  if (walletHolder) walletHolder.textContent = `HOLDER #${holder.id.toLocaleString()}`;
  if (walletCluster) walletCluster.textContent = `CLUSTER ${String(holder.cluster + 1).padStart(2, "0")} / ${holder.share.toFixed(4)}% POSITION`;

  $all("[data-connect-wallet]", root).forEach((button) => {
    button.textContent = shortWallet(address);
    button.classList.add("is-connected");
  });

  world.selectHolder(holderIndex);
}

async function connectWallet(root, world) {
  // Solana-style injected providers first.
  if (window.solana?.connect) {
    try {
      const response = await window.solana.connect();
      const address = response?.publicKey?.toString?.() || window.solana.publicKey?.toString?.();

      if (address) {
        updateWalletUI(root, world, address, "SOLANA WALLET");
        return;
      }
    } catch {
      // User cancelled; leave UI unchanged.
      return;
    }
  }

  // Generic EVM injected provider.
  if (window.ethereum?.request) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts?.[0];

      if (address) {
        updateWalletUI(root, world, address, "EVM WALLET");
        return;
      }
    } catch {
      return;
    }
  }

  // Portfolio fallback: no signing, no transaction, clearly labelled demo wallet.
  updateWalletUI(root, world, DEMO_WALLET, "DEMO WALLET / NO SIGNING");
}

function bindWallet(root, world) {
  $all("[data-connect-wallet]", root).forEach((button) => {
    button.addEventListener("click", () => connectWallet(root, world));
  });

  if (window.ethereum?.on) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts?.[0]) updateWalletUI(root, world, accounts[0], "EVM WALLET");
    });
  }
}

function bindContractCopy(root) {
  $all("[data-copy-contract]", root).forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(DEMO_CONTRACT);
        const original = button.innerHTML;
        button.classList.add("is-copied");

        if (button.matches(".contract-chip")) {
          button.innerHTML = "COPIED <span>✓</span>";
        } else {
          button.innerHTML = "0xC011…2026 <b>COPIED</b>";
        }

        window.setTimeout(() => {
          button.innerHTML = original;
          button.classList.remove("is-copied");
        }, 1500);
      } catch {
        // Clipboard can be unavailable on non-secure local origins.
      }
    });
  });
}

function flashWorldActivity(world, index) {
  if (!world?.pathGroup?.children?.length) return;

  const line = world.pathGroup.children[index % world.pathGroup.children.length];
  const original = line.material.opacity;

  line.material.opacity = 0.72;

  if (world.pulses?.length) {
    const pulse = world.pulses[index % world.pulses.length];
    pulse.scale.setScalar(2.1);
  }

  window.setTimeout(() => {
    line.material.opacity = original;
  }, 700);
}

function bindCryptoFeed(root, world) {
  const feed = $("[data-crypto-feed]", root);
  if (!feed) return;

  const rows = [...feed.children];
  if (!rows.length) return;

  let index = 0;

  const activate = () => {
    rows.forEach((row) => row.classList.remove("is-live"));
    rows[index].classList.add("is-live");
    flashWorldActivity(world, index);
    index = (index + 1) % rows.length;
  };

  activate();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(activate, 3600);
  }
}

export async function initColonyExtras() {
  const root = document.querySelector("[data-colony]");
  if (!root) return;

  if (root.dataset.colonyExtrasInitialized === "true") return;
  root.dataset.colonyExtrasInitialized = "true";

  // initColony() exposes the live world on the page root.
  const world = root.__colonyWorld;
  if (!world) return;

  bindWallet(root, world);
  bindContractCopy(root);
  bindCryptoFeed(root, world);

  const loaded = await loadFluidAssets(world);
  animateFluidAssets(world, loaded);
}
