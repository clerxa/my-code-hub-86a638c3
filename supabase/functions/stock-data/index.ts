const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_KEY = Deno.env.get('VITE_TWELVE_DATA_API_KEY') || '';

/**
 * Fetch historical daily prices from Yahoo Finance (no API key required).
 * Returns a Map of "YYYY-MM-DD" -> close price.
 */
async function fetchYahooHistory(ticker: string, fromDate: string, toDate: string): Promise<Map<string, number>> {
  // Convert dates to Unix timestamps
  // Subtract 10 days from fromDate to handle holidays/weekends at the start of the range
  const period1 = Math.floor(new Date(fromDate + 'T00:00:00Z').getTime() / 1000) - 86400 * 10;
  // Add a few days buffer after toDate to handle weekends
  const period2 = Math.floor(new Date(toDate + 'T00:00:00Z').getTime() / 1000) + 86400 * 5;

  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false`;
  
  console.log('[Yahoo] Fetching:', url);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  if (!res.ok) {
    console.log('[Yahoo] HTTP error:', res.status);
    throw new Error(`Yahoo Finance HTTP ${res.status}`);
  }
  
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) {
    console.log('[Yahoo] No chart result. Response:', JSON.stringify(data).substring(0, 500));
    throw new Error('No data from Yahoo Finance');
  }

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  
  const priceMap = new Map<string, number>();
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] != null) {
      const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
      priceMap.set(dateStr, closes[i]);
    }
  }
  
  console.log(`[Yahoo] Got ${priceMap.size} daily prices for ${ticker}`);
  return priceMap;
}

/**
 * Find the closing price for a date, or the closest previous business day.
 */
function findPriceInMap(priceMap: Map<string, number>, date: string): { price: number | null; isBusinessDay: boolean; closestDate?: string } {
  if (priceMap.has(date)) {
    return { price: priceMap.get(date)!, isBusinessDay: true };
  }
  // Find closest previous date
  const sortedDates = Array.from(priceMap.keys()).sort().reverse();
  const closestDate = sortedDates.find(d => d <= date);
  if (closestDate) {
    return { price: priceMap.get(closestDate)!, isBusinessDay: false, closestDate };
  }
  return { price: null, isBusinessDay: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    // --- Symbol search via Twelve Data ---
    if (action === 'symbol_search') {
      const { query } = params;
      if (!TWELVE_DATA_KEY || !query || query.length < 2) {
        return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const res = await fetch(`https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${TWELVE_DATA_KEY}`);
      const data = await res.json();
      const results = (data.data || [])
        .filter((r: any) => r.instrument_type === 'Common Stock' || r.instrument_type === 'Equity')
        .slice(0, 8);
      return new Response(JSON.stringify({ data: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Single stock price via Yahoo Finance ---
    if (action === 'stock_price') {
      const { ticker, date } = params;
      if (!ticker || !date) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        const priceMap = await fetchYahooHistory(ticker, date, date);
        const result = findPriceInMap(priceMap, date);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        console.log('[stock_price] Error:', e.message);
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // --- BATCH stock prices via Yahoo Finance: 1 API call, multiple dates ---
    if (action === 'stock_prices_batch') {
      const { ticker, dates } = params as { ticker: string; dates: string[] };
      if (!ticker || !dates?.length) {
        return new Response(JSON.stringify({ results: {} }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        // Find min/max dates to fetch the full range in one call
        const sortedDates = [...dates].sort();
        const minDate = sortedDates[0];
        const maxDate = sortedDates[sortedDates.length - 1];
        
        const priceMap = await fetchYahooHistory(ticker, minDate, maxDate);
        
        const results: Record<string, any> = {};
        for (const d of dates) {
          results[d] = findPriceInMap(priceMap, d);
        }
        return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        console.log('[stock_prices_batch] Error:', e.message);
        const errResults: Record<string, any> = {};
        for (const d of dates) errResults[d] = { price: null, isBusinessDay: true, error: e.message };
        return new Response(JSON.stringify({ results: errResults }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // --- FX rate via Frankfurter (BCE) ---
    if (action === 'fx_rate') {
      const { date } = params;
      if (!date) {
        return new Response(JSON.stringify({ rate: null, isBusinessDay: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const res = await fetch(`https://api.frankfurter.app/${date}?from=USD&to=EUR`);
      const data = await res.json();
      const rate = data.rates?.EUR;
      if (!rate) {
        return new Response(JSON.stringify({ rate: null, isBusinessDay: true, error: 'No rate' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const isBusinessDay = data.date === date;
      return new Response(JSON.stringify({ rate, isBusinessDay }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
