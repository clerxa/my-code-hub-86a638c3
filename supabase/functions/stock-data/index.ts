const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_KEY = Deno.env.get('VITE_TWELVE_DATA_API_KEY') || '';
const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY') || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    // --- Symbol search via Twelve Data (works fine on free tier) ---
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

    // --- Stock price via Alpha Vantage (full history on free tier) ---
    if (action === 'stock_price') {
      const { ticker, date } = params;
      if (!ALPHA_VANTAGE_KEY || !ticker || !date) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Use TIME_SERIES_DAILY with outputsize=full for historical access
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=full&apikey=${ALPHA_VANTAGE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      // Check for API errors
      if (data['Error Message']) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: data['Error Message'] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (data['Note']) {
        // Rate limit hit
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: 'Limite API atteinte — réessayez dans 1 minute' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: 'No data' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Try exact date first, then find closest previous business day
      if (timeSeries[date]) {
        const close = parseFloat(timeSeries[date]['4. close']);
        return new Response(JSON.stringify({ price: close, isBusinessDay: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Find the closest previous trading day
      const sortedDates = Object.keys(timeSeries).sort().reverse();
      const closestDate = sortedDates.find(d => d <= date);
      if (closestDate) {
        const close = parseFloat(timeSeries[closestDate]['4. close']);
        return new Response(JSON.stringify({ price: close, isBusinessDay: false, closestDate }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: 'No data for this date' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
