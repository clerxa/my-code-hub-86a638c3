const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_KEY = Deno.env.get('VITE_TWELVE_DATA_API_KEY') || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

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

    if (action === 'stock_price') {
      const { ticker, date } = params;
      if (!TWELVE_DATA_KEY || !ticker || !date) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(ticker)}&interval=1day&start_date=${date}&end_date=${date}&outputsize=1&apikey=${TWELVE_DATA_KEY}`);
      const data = await res.json();
      if (data.status === 'error') {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: data.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const values = data.values;
      if (!values || values.length === 0) {
        return new Response(JSON.stringify({ price: null, isBusinessDay: true, error: 'No data' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const close = parseFloat(values[0].close);
      const isBusinessDay = values[0].datetime === date;
      return new Response(JSON.stringify({ price: close, isBusinessDay }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
