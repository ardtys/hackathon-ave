import { NextResponse } from 'next/server';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

async function getGoPlusData(address: string, chain: string) {
  try {
    let url: string;
    const isSolana = chain === 'solana';

    if (isSolana) {
      url = `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${address}`;
    } else {
      const chainIdMap: Record<string, string> = {
        ethereum: '1', eth: '1',
        bsc: '56', bnb: '56',
        base: '8453',
        arbitrum: '42161',
      };
      const chainId = chainIdMap[chain] || '1';
      url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;
    }

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { data: null, isSolana };
    const json = await res.json();
    const key = address.toLowerCase();
    const data = json?.result?.[key] || json?.result?.[address] || null;
    return { data, isSolana };
  } catch {
    return { data: null, isSolana: chain === 'solana' };
  }
}

async function getSolanaHolders(address: string) {
  try {
    const [supplyRes, holdersRes] = await Promise.all([
      fetch(SOLANA_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTokenSupply', params: [address] }),
        signal: AbortSignal.timeout(6000),
      }),
      fetch(SOLANA_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getTokenLargestAccounts', params: [address, { commitment: 'confirmed' }] }),
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    const supplyData = await supplyRes.json();
    const holdersData = await holdersRes.json();

    const totalSupply = supplyData?.result?.value?.uiAmount || 0;
    const holders: any[] = holdersData?.result?.value || [];
    return { totalSupply, holders };
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const chain = new URL(request.url).searchParams.get('chain') || 'solana';

  const [{ data: goplusData, isSolana }, solanaHolders] = await Promise.all([
    getGoPlusData(address, chain),
    chain === 'solana' ? getSolanaHolders(address) : Promise.resolve(null),
  ]);

  const flags: string[] = [];
  let securityScore = 100;

  // --- EVM GoPlus flags ---
  if (goplusData && !isSolana) {
    if (goplusData.is_honeypot === '1')              { flags.push('HONEYPOT');          securityScore -= 50; }
    if (goplusData.hidden_owner === '1')             { flags.push('HIDDEN_OWNER');       securityScore -= 20; }
    if (goplusData.can_take_back_ownership === '1')  { flags.push('OWNERSHIP_RISK');     securityScore -= 15; }
    if (goplusData.selfdestruct === '1')             { flags.push('SELFDESTRUCT');        securityScore -= 20; }
    if (goplusData.is_mintable === '1')              { flags.push('MINTABLE');            securityScore -= 10; }
    if (Number(goplusData.buy_tax)  > 10)            { flags.push(`BUY_TAX_${goplusData.buy_tax}%`);  securityScore -= 10; }
    if (Number(goplusData.sell_tax) > 10)            { flags.push(`SELL_TAX_${goplusData.sell_tax}%`); securityScore -= 15; }
    if (Number(goplusData.owner_percent) > 0.20)     { flags.push('OWNER_CONCENTRATION'); securityScore -= 10; }
  }

  // --- Solana GoPlus flags ---
  if (goplusData && isSolana) {
    const sec = goplusData.security || goplusData;
    if (sec.freeze_authority)          { flags.push('FREEZE_AUTHORITY');   securityScore -= 20; }
    if (sec.mint_authority)            { flags.push('MINTABLE');           securityScore -= 15; }
    if (sec.non_transferable === true) { flags.push('NON_TRANSFERABLE');   securityScore -= 30; }
    if (sec.transfer_fee_upgradable)   { flags.push('FEE_UPGRADABLE');     securityScore -= 10; }
  }

  // --- Build holder distribution ---
  let topHolders: any[] = [];

  if (chain === 'solana' && solanaHolders) {
    const { totalSupply, holders } = solanaHolders;
    topHolders = holders.slice(0, 10).map((h: any) => ({
      address: h.address,
      amount: h.uiAmount,
      percent: totalSupply > 0 ? ((h.uiAmount / totalSupply) * 100).toFixed(2) : '0',
    }));

    const top1Pct  = topHolders[0] ? Number(topHolders[0].percent) : 0;
    const top5Pct  = topHolders.slice(0, 5).reduce((a, h) => a + Number(h.percent), 0);
    if (top1Pct  > 20) { flags.push('WHALE_CONCENTRATION'); securityScore -= 10; }
    if (top5Pct  > 60) { flags.push('HIGH_CONCENTRATION');  securityScore -= 5;  }
  } else if (goplusData?.holders) {
    topHolders = (goplusData.holders as any[]).slice(0, 10).map((h: any) => ({
      address: h.address,
      amount: h.balance,
      percent: (Number(h.percent) * 100).toFixed(2),
      tag: h.tag || null,
    }));
  }

  // --- Liquidity lock (EVM LP holders from GoPlus) ---
  const lpHolders: any[] = (goplusData?.lp_holders || []).slice(0, 5).map((h: any) => ({
    address: h.address,
    percent: (Number(h.percent) * 100).toFixed(2),
    is_locked: h.is_locked === 1,
    tag: h.tag || null,
  }));

  const liquidityLocked = lpHolders.some(h => h.is_locked);
  if (!liquidityLocked && lpHolders.length > 0) {
    flags.push('LIQUIDITY_NOT_LOCKED');
    securityScore -= 10;
  }

  return NextResponse.json({
    security_score: Math.max(0, securityScore),
    flags,
    is_honeypot:   goplusData?.is_honeypot === '1' || false,
    is_open_source: goplusData?.is_open_source === '1' || false,
    buy_tax:        goplusData?.buy_tax  || '0',
    sell_tax:       goplusData?.sell_tax || '0',
    holder_count:   goplusData?.holder_count || null,
    creator_address: goplusData?.creator_address || null,
    creator_percent: goplusData?.creator_percent
      ? (Number(goplusData.creator_percent) * 100).toFixed(2)
      : null,
    owner_address:  goplusData?.owner_address || null,
    owner_percent:  goplusData?.owner_percent
      ? (Number(goplusData.owner_percent) * 100).toFixed(2)
      : null,
    lp_holders:     lpHolders,
    liquidity_locked: liquidityLocked,
    top_holders:    topHolders,
    goplus_available: goplusData !== null,
  });
}
