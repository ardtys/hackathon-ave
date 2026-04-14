import { NextResponse } from 'next/server';

function score_liquidity(usd: number): { pts: number; max: number; label: string } {
  const max = 25;
  if (usd >= 1_000_000) return { pts: 25, max, label: '>$1M' };
  if (usd >= 100_000)   return { pts: 20, max, label: '>$100K' };
  if (usd >= 20_000)    return { pts: 15, max, label: '>$20K' };
  if (usd >= 5_000)     return { pts: 8,  max, label: '>$5K' };
  return { pts: 0, max, label: '<$5K' };
}

function score_volume(usd: number): { pts: number; max: number; label: string } {
  const max = 20;
  if (usd >= 500_000) return { pts: 20, max, label: '>$500K' };
  if (usd >= 100_000) return { pts: 15, max, label: '>$100K' };
  if (usd >= 10_000)  return { pts: 10, max, label: '>$10K' };
  if (usd >= 1_000)   return { pts: 5,  max, label: '>$1K' };
  return { pts: 0, max, label: '<$1K' };
}

function score_momentum(change24h: number): { pts: number; max: number; label: string } {
  const max = 15;
  if (change24h >= 0 && change24h <= 10)  return { pts: 15, max, label: 'Stable +' };
  if (change24h > 10 && change24h <= 30)  return { pts: 10, max, label: `+${change24h.toFixed(1)}%` };
  if (change24h > 30)                     return { pts: 5,  max, label: `+${change24h.toFixed(1)}%` };
  if (change24h < 0  && change24h >= -10) return { pts: 5,  max, label: `${change24h.toFixed(1)}%` };
  return { pts: 0, max, label: `${change24h.toFixed(1)}%` };
}

function score_age(createdAt: number | null): { pts: number; max: number; label: string } {
  const max = 15;
  if (!createdAt) return { pts: 5, max, label: 'Unknown' };
  const days = (Date.now() - createdAt) / 86_400_000;
  if (days >= 30) return { pts: 15, max, label: `${Math.floor(days)}d old` };
  if (days >= 7)  return { pts: 10, max, label: `${Math.floor(days)}d old` };
  if (days >= 1)  return { pts: 5,  max, label: `${Math.floor(days)}d old` };
  return { pts: 0, max, label: '<1d old' };
}

function score_social(websites: any[], socials: any[]): { pts: number; max: number; breakdown: string[] } {
  const max = 15;
  const breakdown: string[] = [];
  let pts = 0;
  if (websites?.length > 0)                                    { pts += 5; breakdown.push('Website'); }
  if (socials?.some((s: any) => s.type === 'twitter'))         { pts += 5; breakdown.push('X/Twitter'); }
  if (socials?.some((s: any) => s.type === 'telegram'))        { pts += 5; breakdown.push('Telegram'); }
  return { pts, max, breakdown };
}

function score_buysell(buys: number, sells: number): { pts: number; max: number; label: string } {
  const max = 10;
  const total = buys + sells;
  if (total === 0) return { pts: 5, max, label: 'No data' };
  const ratio = buys / total;
  if (ratio >= 0.65) return { pts: 10, max, label: `${buys}B / ${sells}S` };
  if (ratio >= 0.50) return { pts: 6,  max, label: `${buys}B / ${sells}S` };
  if (ratio >= 0.35) return { pts: 3,  max, label: `${buys}B / ${sells}S` };
  return { pts: 0, max, label: `${buys}B / ${sells}S` };
}

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('DexScreener failed');

    const dex = await res.json();
    const pairs: any[] = dex?.pairs || [];
    if (pairs.length === 0) {
      return NextResponse.json({ available: false, message: 'Token not found on DexScreener.' });
    }

    // Pick the pair with highest liquidity
    const pair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

    const liquidityUsd  = pair.liquidity?.usd    || 0;
    const volume24h     = pair.volume?.h24        || 0;
    const priceChange24h = pair.priceChange?.h24  || 0;
    const createdAt     = pair.pairCreatedAt      || null;
    const websites      = pair.info?.websites     || [];
    const socials       = pair.info?.socials      || [];
    const buys1h        = pair.txns?.h1?.buys     || 0;
    const sells1h       = pair.txns?.h1?.sells    || 0;
    const mcap          = pair.marketCap          || pair.fdv || null;
    const priceUsd      = pair.priceUsd           || null;
    const dexName       = pair.dexId              || 'Unknown DEX';
    const chainId       = pair.chainId            || 'unknown';

    const liq  = score_liquidity(liquidityUsd);
    const vol  = score_volume(volume24h);
    const mom  = score_momentum(priceChange24h);
    const age  = score_age(createdAt);
    const soc  = score_social(websites, socials);
    const bs   = score_buysell(buys1h, sells1h);

    const total = liq.pts + vol.pts + mom.pts + age.pts + soc.pts + bs.pts;
    const maxTotal = liq.max + vol.max + mom.max + age.max + soc.max + bs.max; // 100

    let grade: string;
    if      (total >= 80) grade = 'STRONG';
    else if (total >= 60) grade = 'GOOD';
    else if (total >= 40) grade = 'FAIR';
    else if (total >= 20) grade = 'WEAK';
    else                  grade = 'POOR';

    return NextResponse.json({
      available: true,
      fundamental_score: total,
      max_score: maxTotal,
      grade,
      breakdown: {
        liquidity:  { ...liq,  value: liquidityUsd },
        volume:     { ...vol,  value: volume24h },
        momentum:   { ...mom,  value: priceChange24h },
        age:        { ...age,  value: createdAt },
        social:     { ...soc,  value: soc.breakdown },
        buysell:    { ...bs,   value: { buys: buys1h, sells: sells1h } },
      },
      meta: {
        price_usd:    priceUsd,
        market_cap:   mcap,
        liquidity_usd: liquidityUsd,
        volume_24h:   volume24h,
        price_change_24h: priceChange24h,
        pair_created_at:  createdAt,
        dex:          dexName,
        chain:        chainId,
        websites,
        socials,
      },
    });
  } catch (err) {
    return NextResponse.json({ available: false, message: 'Could not fetch DexScreener data.' });
  }
}
