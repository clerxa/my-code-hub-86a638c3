/**
 * Hook to aggregate all VEGA equity simulations and compute live portfolio value.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCompanyTicker } from '@/hooks/useCompanyTicker';
import { fetchStockSummary, fetchFxRate, type StockSummary } from '@/hooks/useStockData';
import type { Json } from '@/integrations/supabase/types';

// --- Extracted plan types for portfolio ---
export interface PortfolioPlan {
  id: string;
  simulationId: string;
  simulationName: string;
  type: 'rsu' | 'espp' | 'bspce';
  label: string;
  ticker: string;
  devise: string;
  nbActions: number;
  prixAcquisitionEur: number; // total cost basis in EUR
  createdAt: string;
  // Vesting / regime info
  regime?: string; // RSU regime label, ESPP n/a
  regimeCode?: string; // raw regime code (R1, R2, R3, pfu, bareme)
  vestingStartDate?: string; // earliest vesting date
  vestingEndDate?: string; // last vesting date
  // Raw data for fiscal simulation
  rawVestings?: any[]; // RSU vestings array
  rawEsppPeriod?: any; // ESPP period data
  rawBspceData?: any; // BSPCE simulation data
}

export interface TickerSummary {
  ticker: string;
  summary: StockSummary;
  fxRate: number;
  priceEur: number;
}

export interface PortfolioSummary {
  plans: PortfolioPlan[];
  tickers: TickerSummary[];
  totalShares: number;
  totalValueEur: number | null;
  totalCostBasisEur: number;
  plusValueLatente: number | null;
  isLoading: boolean;
  hasPlans: boolean;
  getPriceEur: (ticker: string) => number | null;
}

function extractPlans(simulations: Array<{ id: string; name: string | null; type: string; data: Json; created_at: string }>): PortfolioPlan[] {
  const plans: PortfolioPlan[] = [];

  for (const sim of simulations) {
    const d = sim.data as any;
    if (!d) continue;

    if (sim.type === 'rsu' && Array.isArray(d.plans)) {
      for (const plan of d.plans) {
        const vestings = Array.isArray(plan.vestings) ? plan.vestings : [];
        const totalShares = vestings.reduce((sum: number, v: any) => sum + (v.nb_rsu || 0), 0);
        const totalGainEur = plan.gain_acquisition_total || vestings.reduce(
          (sum: number, v: any) => sum + ((v.nb_rsu || 0) * (v.cours || 0) / (v.taux_change || 1)),
          0,
        );
        if (totalShares > 0) {
          // Compute vesting date range
          const vestingDates = vestings
            .map((v: any) => v.date)
            .filter((d: string) => !!d)
            .sort();
          const regimeLabels: Record<string, string> = {
            R1: 'Qualifié (post 30/12/2016)',
            R2: 'Qualifié (08/2015 - 12/2016)',
            R3: 'Non qualifié',
          };
          plans.push({
            id: `${sim.id}-${plan.id}`,
            simulationId: sim.id,
            simulationName: sim.name || 'RSU',
            type: 'rsu',
            label: plan.nom || `RSU ${plan.annee_attribution || ''}`,
            ticker: plan.ticker || '',
            devise: plan.devise || 'USD',
            nbActions: totalShares,
            prixAcquisitionEur: totalGainEur,
            createdAt: sim.created_at,
            regime: regimeLabels[plan.regime] || plan.regime || undefined,
            regimeCode: plan.regime || undefined,
            vestingStartDate: vestingDates[0] || undefined,
            vestingEndDate: vestingDates[vestingDates.length - 1] || undefined,
            rawVestings: vestings,
          });
        }
      }
    }

    if (sim.type === 'espp' && Array.isArray(d.periodes)) {
      for (const p of d.periodes) {
        const nb = p.nb_actions_achetees || 0;
        // Only count unsold shares for portfolio value
        if (nb > 0 && !p.has_sold) {
          const costEur = nb * (p.cours_achat_devise || 0) / (p.taux_change_achat || 1);
          plans.push({
            id: `${sim.id}-${p.id}`,
            simulationId: sim.id,
            simulationName: sim.name || 'ESPP',
            type: 'espp',
            label: p.entreprise_nom || 'ESPP',
            ticker: p.entreprise_ticker || '',
            devise: p.entreprise_devise || 'USD',
            nbActions: nb,
            prixAcquisitionEur: costEur,
            createdAt: sim.created_at,
            vestingStartDate: p.date_debut_offre || undefined,
            vestingEndDate: p.date_achat || undefined,
          });
        }
      }
    }

    if (sim.type === 'bspce') {
      const nb = d.nb_bspce || 0;
      const prixExercice = d.prix_exercice || 0;
      if (nb > 0) {
        plans.push({
          id: sim.id,
          simulationId: sim.id,
          simulationName: sim.name || 'BSPCE',
          type: 'bspce',
          label: d.nom_simulation || 'BSPCE',
          ticker: '',
          devise: 'EUR',
          nbActions: nb,
          prixAcquisitionEur: nb * prixExercice,
          createdAt: sim.created_at,
          vestingEndDate: d.date_entree_societe || undefined,
          regime: d.regime_applicable || undefined,
        });
      }
    }
  }

  return plans;
}

export function useVegaPortfolio(): PortfolioSummary {
  const { user } = useAuth();
  const { ticker: companyTicker, loading: tickerLoading } = useCompanyTicker();

  // 1. Fetch all equity simulations
  const { data: simulations, isLoading: simsLoading } = useQuery({
    queryKey: ['vega-portfolio-sims', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('simulations')
        .select('id, name, type, data, created_at')
        .eq('user_id', user.id)
        .in('type', ['rsu', 'espp', 'bspce'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const plans = extractPlans(simulations || []);
  const hasPlans = plans.length > 0;

  // 2. Collect unique tickers from plans + company ticker
  const uniqueTickers = Array.from(new Set(
    [companyTicker, ...plans.map(p => p.ticker)]
      .filter((t): t is string => !!t && t.length > 0)
      .map(t => t.toUpperCase())
  ));

  // 3. Fetch stock summaries for ALL unique tickers
  const { data: stockSummaries = {}, isLoading: stockLoading } = useQuery({
    queryKey: ['vega-stock-summaries', uniqueTickers.join(',')],
    queryFn: async () => {
      const results: Record<string, StockSummary> = {};
      await Promise.all(
        uniqueTickers.map(async (t) => {
          const summary = await fetchStockSummary(t);
          if (summary) results[t] = summary;
        })
      );
      return results;
    },
    enabled: uniqueTickers.length > 0 && !tickerLoading && !simsLoading,
    staleTime: 5 * 60 * 1000,
  });

  // 4. Fetch FX rate if any ticker is in USD
  const hasUsd = Object.values(stockSummaries).some(s => s.currency === 'USD');
  const today = new Date().toISOString().split('T')[0];
  const { data: fxData } = useQuery({
    queryKey: ['vega-fx-rate', today],
    queryFn: () => fetchFxRate(today),
    enabled: hasUsd,
    staleTime: 60 * 60 * 1000,
  });
  const usdEurRate = fxData?.rate || 1;

  // Build ticker summaries
  const tickers: TickerSummary[] = uniqueTickers
    .filter(t => stockSummaries[t])
    .map(t => {
      const s = stockSummaries[t]!;
      const fx = s.currency === 'USD' ? usdEurRate : 1;
      return {
        ticker: t,
        summary: s,
        fxRate: fx,
        priceEur: (s.currentPrice || 0) / fx,
      };
    });

  const getPriceEur = (ticker: string): number | null => {
    const t = tickers.find(ts => ts.ticker === ticker.toUpperCase());
    return t ? t.priceEur : null;
  };

  // 5. Compute portfolio totals
  const equityPlans = plans.filter(p => p.type !== 'bspce' && p.ticker);
  const totalShares = equityPlans.reduce((sum, p) => sum + p.nbActions, 0);

  const allPricesAvailable = equityPlans.length > 0 && equityPlans.every(p => getPriceEur(p.ticker) !== null);
  const totalValueEur = allPricesAvailable
    ? equityPlans.reduce((sum, p) => sum + p.nbActions * (getPriceEur(p.ticker) || 0), 0)
    : null;

  const totalCostBasisEur = equityPlans.reduce((sum, p) => sum + p.prixAcquisitionEur, 0);

  const plusValueLatente = totalValueEur !== null
    ? totalValueEur - totalCostBasisEur
    : null;

  const isLoading = simsLoading || tickerLoading || stockLoading;

  return {
    plans,
    tickers,
    totalShares,
    totalValueEur,
    totalCostBasisEur,
    plusValueLatente,
    isLoading,
    hasPlans,
    getPriceEur,
  };
}
