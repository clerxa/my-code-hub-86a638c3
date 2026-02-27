/**
 * Hook for fetching stock prices and FX rates via edge function proxy
 */

import { supabase } from '@/integrations/supabase/client';

export interface SymbolSearchResult {
  symbol: string;
  instrument_name: string;
  exchange: string;
  currency: string;
  country: string;
}

async function callStockData(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('stock-data', { body });
  if (error) throw error;
  return data;
}

export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  if (query.length < 2) return [];
  try {
    const data = await callStockData({ action: 'symbol_search', query });
    return data.data || [];
  } catch {
    return [];
  }
}

export async function fetchStockPrice(
  ticker: string,
  date: string
): Promise<{ price: number | null; isBusinessDay: boolean; error?: string }> {
  if (!ticker || !date) return { price: null, isBusinessDay: true };
  try {
    const data = await callStockData({ action: 'stock_price', ticker, date });
    return { price: data.price ?? null, isBusinessDay: data.isBusinessDay ?? true, error: data.error };
  } catch {
    return { price: null, isBusinessDay: true, error: 'Network error' };
  }
}

/**
 * Batch fetch: 1 single API call for all dates of the same ticker
 */
export async function fetchStockPricesBatch(
  ticker: string,
  dates: string[]
): Promise<Record<string, { price: number | null; isBusinessDay: boolean; error?: string }>> {
  if (!ticker || !dates.length) return {};
  try {
    const data = await callStockData({ action: 'stock_prices_batch', ticker, dates });
    return data.results || {};
  } catch {
    const fallback: Record<string, { price: number | null; isBusinessDay: boolean; error?: string }> = {};
    for (const d of dates) fallback[d] = { price: null, isBusinessDay: true, error: 'Network error' };
    return fallback;
  }
}

export async function fetchFxRate(
  date: string
): Promise<{ rate: number | null; isBusinessDay: boolean; error?: string }> {
  if (!date) return { rate: null, isBusinessDay: true };
  try {
    const data = await callStockData({ action: 'fx_rate', date });
    return { rate: data.rate ?? null, isBusinessDay: data.isBusinessDay ?? true, error: data.error };
  } catch {
    return { rate: null, isBusinessDay: true, error: 'Network error' };
  }
}
