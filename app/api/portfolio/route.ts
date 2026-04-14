import { NextResponse } from 'next/server';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

// EVM public RPCs by chain
const EVM_RPCS: Record<string, string> = {
  ethereum: 'https://ethereum-rpc.publicnode.com',
  bsc:      'https://bsc-rpc.publicnode.com',
  base:     'https://base-rpc.publicnode.com',
};

async function rpc(url: string, method: string, params: any[]) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const type   = searchParams.get('type') || 'solana';

  if (!wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });

  try {
    if (type === 'solana') {
      // 1. Native SOL balance
      const balData = await rpc(SOLANA_RPC, 'getBalance', [wallet]);
      const lamports: number = balData.result?.value ?? 0;
      const sol = lamports / 1e9;

      // 2. SPL token accounts
      const tokData = await rpc(SOLANA_RPC, 'getTokenAccountsByOwner', [
        wallet,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ]);
      const accounts: any[] = tokData.result?.value ?? [];

      // Collect mints with non-zero balance
      const splTokens = accounts
        .map((acc: any) => {
          const info = acc.account?.data?.parsed?.info;
          return info ? { mint: info.mint as string, amount: info.tokenAmount?.uiAmount as number } : null;
        })
        .filter((t): t is { mint: string; amount: number } => !!t && t.amount > 0)
        .slice(0, 15);

      // 3. Parallel DexScreener price lookups
      const [solPrice, ...splPrices] = await Promise.all([
        // SOL price
        fetch(`https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112`)
          .then(r => r.json())
          .then(d => {
            const pair = d.pairs?.find((p: any) =>
              p.quoteToken?.symbol === 'USDC' || p.quoteToken?.symbol === 'USDT'
            );
            return pair?.priceUsd ? parseFloat(pair.priceUsd) : 0;
          })
          .catch(() => 0),
        // SPL token prices
        ...splTokens.map(t =>
          fetch(`https://api.dexscreener.com/latest/dex/tokens/${t.mint}`)
            .then(r => r.json())
            .then(d => {
              const pair = d.pairs?.[0];
              return pair ? {
                symbol: pair.baseToken?.symbol ?? t.mint.slice(0, 6).toUpperCase(),
                name:   pair.baseToken?.name   ?? 'Unknown',
                price:  parseFloat(pair.priceUsd ?? '0'),
                change: parseFloat(pair.priceChange?.h24 ?? '0'),
              } : null;
            })
            .catch(() => null)
        ),
      ]);

      const assets = [];

      if (sol > 0) {
        assets.push({
          symbol:  'SOL',
          name:    'Solana',
          balance: sol.toFixed(6),
          value:   sol * (solPrice || 0),
          change:  0,
          chain:   'solana',
          address: 'So11111111111111111111111111111111111111112',
        });
      }

      splTokens.forEach((t, i) => {
        const meta = splPrices[i];
        assets.push({
          symbol:  meta?.symbol ?? t.mint.slice(0, 6).toUpperCase(),
          name:    meta?.name   ?? 'Unknown Token',
          balance: t.amount.toLocaleString(undefined, { maximumFractionDigits: 4 }),
          value:   t.amount * (meta?.price ?? 0),
          change:  meta?.change ?? 0,
          chain:   'solana',
          address: t.mint,
        });
      });

      return NextResponse.json({ success: true, assets, walletType: 'solana' });
    }

    if (type === 'evm') {
      // Detect chain from searchParams or default to all three
      const chainParam = searchParams.get('chain') || 'ethereum';
      const rpcUrl = EVM_RPCS[chainParam];
      if (!rpcUrl) return NextResponse.json({ error: 'Unknown EVM chain' }, { status: 400 });

      const data = await rpc(rpcUrl, 'eth_getBalance', [wallet, 'latest']);
      const hexBalance: string = data.result ?? '0x0';
      const weiBI = BigInt(hexBalance);
      const nativeBalance = Number(weiBI) / 1e18;

      // Native token labels
      const nativeSymbols: Record<string, { symbol: string; name: string; address: string }> = {
        ethereum: { symbol: 'ETH', name: 'Ethereum',   address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
        bsc:      { symbol: 'BNB', name: 'BNB Chain',  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
        base:     { symbol: 'ETH', name: 'Base ETH',   address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
      };
      const native = nativeSymbols[chainParam];

      // Native price from DexScreener
      const dexIds: Record<string, string> = {
        ethereum: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        bsc:      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
        base:     '0x4200000000000000000000000000000000000006', // WETH on Base
      };
      let nativePrice = 0;
      try {
        const pd = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${dexIds[chainParam]}`).then(r => r.json());
        const pair = pd.pairs?.find((p: any) => p.quoteToken?.symbol === 'USDT' || p.quoteToken?.symbol === 'USDC' || p.quoteToken?.symbol === 'BUSD');
        nativePrice = parseFloat(pair?.priceUsd ?? '0');
      } catch {}

      const assets = [];
      if (nativeBalance > 0) {
        assets.push({
          symbol:  native.symbol,
          name:    native.name,
          balance: nativeBalance.toFixed(6),
          value:   nativeBalance * nativePrice,
          change:  0,
          chain:   chainParam,
          address: native.address,
        });
      }

      return NextResponse.json({ success: true, assets, walletType: 'evm', chain: chainParam });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    console.error('[portfolio API]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
