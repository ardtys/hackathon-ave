import { NextResponse } from 'next/server';

const AVE_API_KEY = process.env.AVE_API_KEY ?? '';

export async function GET(request: Request) {
  const urlParams = new URL(request.url).searchParams;
  const action = urlParams.get('action') || 'ranks';
  
  try {
    if (action === 'ranks') {
      // Fetch Gainers
      const gainersRes = await fetch(`https://prod.ave-api.com/v2/ranks?topic=gainer`, {
        method: "GET",
        headers: { "X-API-KEY": AVE_API_KEY }
      });
      if (!gainersRes.ok) throw new Error(`AVE gainers API returned ${gainersRes.status}`);
      const gainersData = await gainersRes.json();

      // Fetch Losers
      const losersRes = await fetch(`https://prod.ave-api.com/v2/ranks?topic=loser`, {
        method: "GET",
        headers: { "X-API-KEY": AVE_API_KEY }
      });
      if (!losersRes.ok) throw new Error(`AVE losers API returned ${losersRes.status}`);
      const losersData = await losersRes.json();

      return NextResponse.json({
         success: true,
         gainers: gainersData.data?.slice(0, 15) || [],
         losers: losersData.data?.slice(0, 15) || []
      });
    }

    if (action === 'chain') {
      const chain = urlParams.get('chain') || 'solana';
      const trendingRes = await fetch(`https://prod.ave-api.com/v2/tokens/trending?chain=${chain}&page_size=20`, {
        method: "GET",
        headers: { "X-API-KEY": AVE_API_KEY }
      });
      const trendingData = await trendingRes.json();
      
      return NextResponse.json({
         success: true,
         trending: trendingData.data?.list || []
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Market API Error", err);
    return NextResponse.json({ error: "API Fetch failed" }, { status: 500 });
  }
}
