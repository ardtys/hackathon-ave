import { NextResponse } from 'next/server';

const AVE_API_KEY = process.env.AVE_API_KEY ?? '';
const BOT_API_BASE = 'https://bot-api.ave.ai';

// Native token addresses by chain
const NATIVE: Record<string, string> = {
  solana:   'sol',
  bsc:      '0x0000000000000000000000000000000000000000',
  ethereum: '0x0000000000000000000000000000000000000000',
  base:     '0x0000000000000000000000000000000000000000',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chain, inToken, outToken, amount, swapType } = body;

    if (!chain || !inToken || !outToken || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Resolve native token address
    const resolvedIn  = inToken  === 'sol' || inToken  === 'native' ? NATIVE[chain] ?? inToken  : inToken;
    const resolvedOut = outToken === 'sol' || outToken === 'native' ? NATIVE[chain] ?? outToken : outToken;

    const quoteBody = {
      chain,
      inAmount:        String(amount),
      inTokenAddress:  resolvedIn,
      outTokenAddress: resolvedOut,
      swapType:        swapType || 'buy',
    };

    const res = await fetch(`${BOT_API_BASE}/v1/thirdParty/chainWallet/getAmountOut`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'AVE-ACCESS-KEY': AVE_API_KEY,
      },
      body: JSON.stringify(quoteBody),
    });

    const data = await res.json();

    if (!res.ok || data.status !== 200) {
      return NextResponse.json({
        success: false,
        error:   data.msg ?? `AVE Trade API error ${res.status}`,
      }, { status: res.ok ? 400 : res.status });
    }

    return NextResponse.json({
      success:     true,
      estimateOut: data.data?.estimateOut,
      decimals:    data.data?.decimals,
      spender:     data.data?.spender,
      output:      `estimateOut: ${data.data?.estimateOut} (decimals: ${data.data?.decimals})`,
    });

  } catch (err: any) {
    console.error('[trade/quote]', err);
    return NextResponse.json({ success: false, error: err.message ?? String(err) }, { status: 500 });
  }
}
