const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_KEY = Deno.env.get('VITE_TWELVE_DATA_API_KEY') || '';
const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY') || '';

function findPrice(timeSeries: Record<string, any>, date: string): { price: number | null; isBusinessDay: boolean; closestDate?: string } {
  if (timeSeries[date]) {
    return { price: parseFloat(timeSeries[date]['4. close']), isBusinessDay: true };
  }
  const sortedDates = Object.keys(timeSeries).sort().reverse();
  const closestDate = sortedDates.find(d => d <= date);
  if (closestDate) {
    return { price: parseFloat(timeSeries[closestDate]['4. close']), isBusinessDay: false, closestDate };
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

    // --- Single stock price via Alpha Vantage ---
    if (action === 'stock_price') {
      const { ticker, date } = params;
      if (!ALPHA_VANTAGE_KEY || !ticker || !date) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=full&apikey=${ALPHA_VANTAGE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data['Error Message']) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: data['Error Message'] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (data['Note']) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: 'Limite API atteinte — réessayez dans 1 minute' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: 'No data' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const result = findPrice(timeSeries, date);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- BATCH stock prices: 1 API call, multiple dates ---
    if (action === 'stock_prices_batch') {
      const { ticker, dates } = params as { ticker: string; dates: string[] };
      if (!ALPHA_VANTAGE_KEY || !ticker || !dates?.length) {
        return new Response(JSON.stringify({ results: {} }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=full&apikey=${ALPHA_VANTAGE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log('[stock_prices_batch] Alpha Vantage response keys:', Object.keys(data));
      if (data['Information']) {
        console.log('[stock_prices_batch] Information:', data['Information']);
        const errResults: Record<string, any> = {};
        for (const d of dates) errResults[d] = { price: null, isBusinessDay: true, error: data['Information'] };
        return new Response(JSON.stringify({ results: errResults }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (data['Error Message']) {
        console.log('[stock_prices_batch] Error:', data['Error Message']);
        const errResults: Record<string, any> = {};
        for (const d of dates) errResults[d] = { price: null, isBusinessDay: true, error: data['Error Message'] };
        return new Response(JSON.stringify({ results: errResults }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (data['Note']) {
        console.log('[stock_prices_batch] Note (rate limit):', data['Note']);
        const errResults: Record<string, any> = {};
        for (const d of dates) errResults[d] = { price: null, isBusinessDay: true, error: 'Limite API atteinte — réessayez dans 1 minute' };
        return new Response(JSON.stringify({ results: errResults }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        console.log('[stock_prices_batch] No Time Series found. Full response:', JSON.stringify(data).substring(0, 500));
        const errResults: Record<string, any> = {};
        for (const d of dates) errResults[d] = { price: null, isBusinessDay: true, error: 'No data' };
        return new Response(JSON.stringify({ results: errResults }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const results: Record<string, any> = {};
      for (const d of dates) {
        results[d] = findPrice(timeSeries, d);
      }
      return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
