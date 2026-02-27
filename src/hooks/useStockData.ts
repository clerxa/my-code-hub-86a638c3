/**
 * Hook for fetching stock prices (Twelve Data) and FX rates (Frankfurter)
 */

const TWELVE_DATA_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY || '';

export interface SymbolSearchResult {
  symbol: string;
  instrument_name: string;
  exchange: string;
  currency: string;
  country: string;
}

export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  if (!TWELVE_DATA_KEY || query.length < 2) return [];
  try {
    const res = await fetch(
      `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${TWELVE_DATA_KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    // Filter to stocks only, deduplicate by symbol
    const results: SymbolSearchResult[] = (data.data || [])
      .filter((r: any) => r.instrument_type === 'Common Stock' || r.instrument_type === 'Equity')
      .slice(0, 8);
    return results;
  } catch {
    return [];
  }
}

export async function fetchStockPrice(
  ticker: string,
  date: string
): Promise<{ price: number | null; isBusinessDay: boolean; error?: string }> {
  if (!TWELVE_DATA_KEY || !ticker || !date) return { price: null, isBusinessDay: true };
  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(ticker)}&interval=1day&start_date=${date}&end_date=${date}&outputsize=1&apikey=${TWELVE_DATA_KEY}`
    );
    if (!res.ok) return { price: null, isBusinessDay: true, error: 'API error' };
    const data = await res.json();
    if (data.status === 'error') return { price: null, isBusinessDay: true, error: data.message };
    const values = data.values;
    if (!values || values.length === 0) return { price: null, isBusinessDay: true, error: 'No data' };
    const close = parseFloat(values[0].close);
    const returnedDate = values[0].datetime;
    const isBusinessDay = returnedDate === date;
    return { price: close, isBusinessDay };
  } catch {
    return { price: null, isBusinessDay: true, error: 'Network error' };
  }
}

export async function fetchFxRate(
  date: string
): Promise<{ rate: number | null; isBusinessDay: boolean; error?: string }> {
  if (!date) return { rate: null, isBusinessDay: true };
  try {
    const res = await fetch(`https://api.frankfurter.app/${date}?from=USD&to=EUR`);
    if (!res.ok) return { rate: null, isBusinessDay: true, error: 'API error' };
    const data = await res.json();
    const rate = data.rates?.EUR;
    if (!rate) return { rate: null, isBusinessDay: true, error: 'No rate' };
    const isBusinessDay = data.date === date;
    return { rate, isBusinessDay };
  } catch {
    return { rate: null, isBusinessDay: true, error: 'Network error' };
  }
}
