const SEED = "COLONY-DEMO-2026";

export const COLONY_DEMO_LABEL = "DEMO NETWORK DATA";

function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(hashString(SEED));

function makeAddress(index) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "";
  const local = mulberry32(hashString(`${SEED}-${index}`));
  for (let i = 0; i < 38; i += 1) {
    out += alphabet[Math.floor(local() * alphabet.length)];
  }
  return out;
}

function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.21) * 0.22 +
    Math.cos(z * 0.19) * 0.18 +
    Math.sin((x + z) * 0.11) * 0.14 -
    Math.exp(-((x * x + z * z) / 120)) * 0.55
  );
}

export function buildColonyData(count = 2200) {
  const holders = [];
  const clusterCenters = [
    { x: -7.4, z: -4.8, weight: 0.19 },
    { x: 6.2, z: -4.2, weight: 0.17 },
    { x: -5.8, z: 6.5, weight: 0.18 },
    { x: 5.5, z: 6.8, weight: 0.2 },
    { x: 0, z: 0.2, weight: 0.26 }
  ];

  for (let index = 0; index < count; index += 1) {
    const roll = random();
    let cursor = 0;
    let cluster = clusterCenters.length - 1;

    for (let i = 0; i < clusterCenters.length; i += 1) {
      cursor += clusterCenters[i].weight;
      if (roll <= cursor) {
        cluster = i;
        break;
      }
    }

    const center = clusterCenters[cluster];
    const radius = Math.pow(random(), 0.58) * (cluster === 4 ? 8.3 : 6.3);
    const theta = random() * Math.PI * 2;

    let x = center.x + Math.cos(theta) * radius + (random() - 0.5) * 1.8;
    let z = center.z + Math.sin(theta) * radius + (random() - 0.5) * 1.8;

    const maxRadius = 17.5;
    const mag = Math.hypot(x, z);
    if (mag > maxRadius) {
      x = (x / mag) * maxRadius;
      z = (z / mag) * maxRadius;
    }

    const activity = random();
    const balance = Math.round((Math.pow(random(), 3.2) * 740000 + 110) * 100) / 100;

    holders.push({
      id: index + 1,
      address: makeAddress(index),
      balance,
      share: 0,
      joinedDaysAgo: Math.max(1, Math.round(Math.pow(random(), 0.72) * 520)),
      activity,
      cluster,
      position: { x, y: terrainHeight(x, z) + 0.18, z }
    });
  }

  const total = holders.reduce((sum, holder) => sum + holder.balance, 0);
  holders.forEach((holder) => {
    holder.share = (holder.balance / total) * 100;
  });

  return {
    seed: SEED,
    holders,
    totalBalance: total,
    clusters: clusterCenters.map((center, id) => ({ ...center, id }))
  };
}

export function shortAddress(address) {
  return address ? `${address.slice(0, 5)}…${address.slice(-5)}` : "—";
}

export function formatCompact(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function holderStatus(holder) {
  if (holder.activity > 0.82) return "HIGH ACTIVITY";
  if (holder.joinedDaysAgo < 30) return "NEW HOLDER";
  if (holder.activity < 0.18) return "DORMANT";
  return "ACTIVE";
}
