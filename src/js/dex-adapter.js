const demoTokenData = {
  projectName: "MUGI",
  symbol: "$MUGI",
  price: "—",
  liquidity: "—",
  volume24h: "—",
  marketCap: "—",
  fdv: "—",
  pairAge: "Demo pair",
  transactions: "—",
  dex: "Solana / DEX Screener",
  pair: "Not connected",
  socials: ["X", "Telegram"],
  website: "Not connected",
  isDemo: true
};

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function normalizeDexPair(pair) {
  if (!pair) return demoTokenData;
  return {
    projectName: firstDefined(pair.baseToken?.name, pair.baseToken?.symbol, "Unknown token"),
    symbol: firstDefined(pair.baseToken?.symbol, "—"),
    price: firstDefined(pair.priceUsd ? `$${Number(pair.priceUsd).toFixed(6)}` : null, "—"),
    liquidity: firstDefined(pair.liquidity?.usd ? `$${Math.round(pair.liquidity.usd).toLocaleString()}` : null, "—"),
    volume24h: firstDefined(pair.volume?.h24 ? `$${Math.round(pair.volume.h24).toLocaleString()}` : null, "—"),
    marketCap: firstDefined(pair.marketCap ? `$${Math.round(pair.marketCap).toLocaleString()}` : null, "—"),
    fdv: firstDefined(pair.fdv ? `$${Math.round(pair.fdv).toLocaleString()}` : null, "—"),
    pairAge: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toLocaleDateString() : "—",
    transactions: pair.txns?.h24 ? `${pair.txns.h24.buys + pair.txns.h24.sells}` : "—",
    dex: firstDefined(pair.dexId, "—"),
    pair: firstDefined(pair.pairAddress, "—"),
    socials: (pair.info?.socials || []).map((social) => social.type),
    website: firstDefined(pair.info?.websites?.[0]?.url, "—"),
    isDemo: false
  };
}

export async function getTokenData(chainId, tokenAddress) {
  if (!chainId || !tokenAddress) return demoTokenData;
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(tokenAddress)}`);
    if (!response.ok) throw new Error("DEX request failed");
    const payload = await response.json();
    return normalizeDexPair(payload.pairs?.[0]);
  } catch {
    return demoTokenData;
  }
}

export { demoTokenData };
