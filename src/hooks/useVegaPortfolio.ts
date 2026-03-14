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
  vestingStartDate?: string; // earliest vesting date
  vestingEndDate?: string; // last vesting date
}

export interface PortfolioSummary {
  plans: PortfolioPlan[];
  stockSummary: StockSummary | null;
  fxRate: number; // EUR/USD rate (1 if EUR)
  currentPriceEur: number | null;
  totalShares: number;
  totalValueEur: number | null;
  totalCostBasisEur: number;
  plusValueLatente: number | null;
  isLoading: boolean;
  hasPlans: boolean;
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
            vestingStartDate: vestingDates[0] || undefined,
            vestingEndDate: vestingDates[vestingDates.length - 1] || undefined,
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
  const { ticker, loading: tickerLoading } = useCompanyTicker();

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

  // 2. Fetch live stock price
  const { data: stockSummary, isLoading: stockLoading } = useQuery({
    queryKey: ['vega-stock-summary', ticker],
    queryFn: () => fetchStockSummary(ticker!),
    enabled: !!ticker && !tickerLoading,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // 3. Fetch FX rate if needed
  const needsFx = stockSummary?.currency === 'USD';
  const today = new Date().toISOString().split('T')[0];
  const { data: fxData } = useQuery({
    queryKey: ['vega-fx-rate', today],
    queryFn: () => fetchFxRate(today),
    enabled: needsFx,
    staleTime: 60 * 60 * 1000,
  });

  const fxRate = needsFx ? (fxData?.rate || 1) : 1;
  const plans = extractPlans(simulations || []);
  const hasPlans = plans.length > 0;

  // Current price in EUR
  const currentPriceEur = stockSummary?.currentPrice
    ? stockSummary.currentPrice / fxRate
    : null;

  // Only count shares that have a matching ticker
  const plansWithTicker = ticker
    ? plans.filter(p => p.ticker.toUpperCase() === ticker.toUpperCase() || p.type === 'bspce')
    : plans;

  const totalShares = plansWithTicker
    .filter(p => p.type !== 'bspce')
    .reduce((sum, p) => sum + p.nbActions, 0);

  const totalValueEur = currentPriceEur !== null
    ? totalShares * currentPriceEur
    : null;

  const totalCostBasisEur = plansWithTicker
    .filter(p => p.type !== 'bspce')
    .reduce((sum, p) => sum + p.prixAcquisitionEur, 0);

  const plusValueLatente = totalValueEur !== null
    ? totalValueEur - totalCostBasisEur
    : null;

  const isLoading = simsLoading || tickerLoading || stockLoading;

  return {
    plans,
    stockSummary,
    fxRate,
    currentPriceEur,
    totalShares,
    totalValueEur,
    totalCostBasisEur,
    plusValueLatente,
    isLoading,
    hasPlans,
  };
}
