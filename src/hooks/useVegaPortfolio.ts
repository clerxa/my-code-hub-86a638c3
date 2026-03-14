/**
 * Hook to aggregate all VEGA equity simulations and compute live portfolio value.
 * Accounts for declared cessions (FIFO) to adjust remaining shares.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCompanyTicker } from '@/hooks/useCompanyTicker';
import { fetchStockSummary, fetchFxRate, type StockSummary } from '@/hooks/useStockData';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

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
  nbActionsOriginal: number; // before cessions
  nbActionsCedees: number; // total sold via cessions
  prixAcquisitionEur: number; // total cost basis in EUR (adjusted)
  prixAcquisitionEurOriginal: number; // before cessions
  createdAt: string;
  // Vesting / regime info
  regime?: string;
  regimeCode?: string;
  vestingStartDate?: string;
  vestingEndDate?: string;
  isVestingComplete: boolean;
  // Raw data for fiscal simulation
  rawVestings?: any[];
  rawEsppPeriod?: any;
  rawBspceData?: any;
}

export interface VegaCession {
  id: string;
  simulation_id: string;
  plan_id: string;
  nb_actions: number;
  date_cession: string;
  prix_cession_unitaire: number | null;
  devise: string | null;
  notes: string | null;
  created_at: string;
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
  cessions: VegaCession[];
  totalShares: number;
  totalValueEur: number | null;
  totalCostBasisEur: number;
  plusValueLatente: number | null;
  isLoading: boolean;
  hasPlans: boolean;
  getPriceEur: (ticker: string) => number | null;
  declareCession: (planId: string, simulationId: string, nbActions: number, prixUnitaire?: number) => Promise<void>;
  isDeclaring: boolean;
}

function extractPlans(
  simulations: Array<{ id: string; name: string | null; type: string; data: Json; created_at: string }>,
  cessions: VegaCession[],
): PortfolioPlan[] {
  const plans: PortfolioPlan[] = [];

  // Pre-compute cessions per plan
  const cessionsByPlan = new Map<string, number>();
  for (const c of cessions) {
    const key = `${c.simulation_id}-${c.plan_id}`;
    cessionsByPlan.set(key, (cessionsByPlan.get(key) || 0) + c.nb_actions);
  }

  const now = new Date();

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
          const vestingDates = vestings
            .map((v: any) => v.date)
            .filter((d: string) => !!d)
            .sort();
          const regimeLabels: Record<string, string> = {
            R1: 'Qualifié (post 30/12/2016)',
            R2: 'Qualifié (08/2015 - 12/2016)',
            R3: 'Non qualifié',
          };

          const planId = `${sim.id}-${plan.id}`;
          const nbCedees = cessionsByPlan.get(planId) || 0;
          const nbRestantes = Math.max(0, totalShares - nbCedees);
          const costPerShare = totalShares > 0 ? totalGainEur / totalShares : 0;

          const vestingEnd = vestingDates[vestingDates.length - 1];
          const isVestingComplete = vestingEnd ? new Date(vestingEnd) <= now : false;

          plans.push({
            id: planId,
            simulationId: sim.id,
            simulationName: sim.name || 'RSU',
            type: 'rsu',
            label: plan.nom || `RSU ${plan.annee_attribution || ''}`,
            ticker: plan.ticker || '',
            devise: plan.devise || 'USD',
            nbActions: nbRestantes,
            nbActionsOriginal: totalShares,
            nbActionsCedees: nbCedees,
            prixAcquisitionEur: nbRestantes * costPerShare,
            prixAcquisitionEurOriginal: totalGainEur,
            createdAt: sim.created_at,
            regime: regimeLabels[plan.regime] || plan.regime || undefined,
            regimeCode: plan.regime || undefined,
            vestingStartDate: vestingDates[0] || undefined,
            vestingEndDate: vestingEnd || undefined,
            isVestingComplete,
            rawVestings: vestings,
          });
        }
      }
    }

    if (sim.type === 'espp' && Array.isArray(d.periodes)) {
      for (const p of d.periodes) {
        const nb = p.nb_actions_achetees || 0;
        if (nb > 0 && !p.has_sold) {
          const costEur = nb * (p.cours_achat_devise || 0) / (p.taux_change_achat || 1);
          const planId = `${sim.id}-${p.id}`;
          const nbCedees = cessionsByPlan.get(planId) || 0;
          const nbRestantes = Math.max(0, nb - nbCedees);
          const costPerShare = nb > 0 ? costEur / nb : 0;

          const vestingEnd = p.date_achat;
          const isVestingComplete = vestingEnd ? new Date(vestingEnd) <= now : false;

          plans.push({
            id: planId,
            simulationId: sim.id,
            simulationName: sim.name || 'ESPP',
            type: 'espp',
            label: p.entreprise_nom || 'ESPP',
            ticker: p.entreprise_ticker || '',
            devise: p.entreprise_devise || 'USD',
            nbActions: nbRestantes,
            nbActionsOriginal: nb,
            nbActionsCedees: nbCedees,
            prixAcquisitionEur: nbRestantes * costPerShare,
            prixAcquisitionEurOriginal: costEur,
            createdAt: sim.created_at,
            vestingStartDate: p.date_debut_offre || undefined,
            vestingEndDate: vestingEnd || undefined,
            isVestingComplete,
            rawEsppPeriod: p,
          });
        }
      }
    }

    if (sim.type === 'bspce') {
      const nb = d.nb_bspce || 0;
      const prixExercice = d.prix_exercice || 0;
      if (nb > 0) {
        const nbCedees = cessionsByPlan.get(sim.id) || 0;
        const nbRestantes = Math.max(0, nb - nbCedees);

        const vestingEnd = d.date_entree_societe;
        const isVestingComplete = vestingEnd ? new Date(vestingEnd) <= now : true;

        plans.push({
          id: sim.id,
          simulationId: sim.id,
          simulationName: sim.name || 'BSPCE',
          type: 'bspce',
          label: d.nom_simulation || 'BSPCE',
          ticker: '',
          devise: 'EUR',
          nbActions: nbRestantes,
          nbActionsOriginal: nb,
          nbActionsCedees: nbCedees,
          prixAcquisitionEur: nbRestantes * prixExercice,
          prixAcquisitionEurOriginal: nb * prixExercice,
          createdAt: sim.created_at,
          vestingEndDate: vestingEnd || undefined,
          isVestingComplete,
          regime: d.regime_applicable || undefined,
          regimeCode: d.regime_applicable || undefined,
          rawBspceData: d,
        });
      }
    }
  }

  return plans;
}

export function useVegaPortfolio(): PortfolioSummary {
  const { user } = useAuth();
  const { ticker: companyTicker, loading: tickerLoading } = useCompanyTicker();
  const queryClient = useQueryClient();

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

  // 1b. Fetch cessions
  const { data: cessions = [], isLoading: cessionsLoading } = useQuery({
    queryKey: ['vega-cessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('vega_cessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date_cession', { ascending: true });
      if (error) throw error;
      return (data || []) as VegaCession[];
    },
    enabled: !!user,
  });

  // Declare cession mutation
  const declareMutation = useMutation({
    mutationFn: async ({ planId, simulationId, nbActions, prixUnitaire }: {
      planId: string;
      simulationId: string;
      nbActions: number;
      prixUnitaire?: number;
    }) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('vega_cessions').insert({
        user_id: user.id,
        simulation_id: simulationId,
        plan_id: planId,
        nb_actions: nbActions,
        prix_cession_unitaire: prixUnitaire || null,
        date_cession: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vega-cessions'] });
      toast.success('Cession déclarée avec succès');
    },
    onError: (err: any) => {
      toast.error(`Erreur: ${err.message}`);
    },
  });

  const declareCession = async (planId: string, simulationId: string, nbActions: number, prixUnitaire?: number) => {
    await declareMutation.mutateAsync({ planId, simulationId, nbActions, prixUnitaire });
  };

  const plans = extractPlans(simulations || [], cessions);
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

  // 5. Compute portfolio totals (only remaining shares)
  const equityPlans = plans.filter(p => p.type !== 'bspce' && p.ticker && p.nbActions > 0);
  const totalShares = equityPlans.reduce((sum, p) => sum + p.nbActions, 0);

  const allPricesAvailable = equityPlans.length > 0 && equityPlans.every(p => getPriceEur(p.ticker) !== null);
  const totalValueEur = allPricesAvailable
    ? equityPlans.reduce((sum, p) => sum + p.nbActions * (getPriceEur(p.ticker) || 0), 0)
    : null;

  const totalCostBasisEur = equityPlans.reduce((sum, p) => sum + p.prixAcquisitionEur, 0);

  const plusValueLatente = totalValueEur !== null
    ? totalValueEur - totalCostBasisEur
    : null;

  const isLoading = simsLoading || tickerLoading || stockLoading || cessionsLoading;

  return {
    plans,
    tickers,
    cessions,
    totalShares,
    totalValueEur,
    totalCostBasisEur,
    plusValueLatente,
    isLoading,
    hasPlans,
    getPriceEur,
    declareCession,
    isDeclaring: declareMutation.isPending,
  };
}
