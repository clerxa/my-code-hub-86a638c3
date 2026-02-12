/**
 * Hook pour les calculs du simulateur PER
 * La logique de calcul est maintenant exécutée côté serveur via Edge Function
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFiscalRules, useProductConstants } from "@/contexts/GlobalSettingsContext";
import { toast } from "sonner";

export interface PERInput {
  revenu_fiscal: number;
  parts_fiscales: number;
  age_actuel: number;
  age_retraite: number;
  plafond_reportable: number;
  versements_per: number;
}

export interface PERResults {
  tmi: number;
  plafond_per_annuel: number;
  plafond_per_total: number;
  impot_sans_per: number;
  impot_avec_per: number;
  economie_impots: number;
  effort_reel: number;
  optimisation_fiscale: number;
  reduction_impots_max: number;
  horizon_annees: number;
  taux_rendement: number;
  capital_futur: number;
  gain_financier: number;
}

interface PERCalculationState {
  results: PERResults | null;
  isLoading: boolean;
  error: string | null;
}

export const usePERCalculations = () => {
  const fiscalRules = useFiscalRules();
  const productConstants = useProductConstants();
  
  const [state, setState] = useState<PERCalculationState>({
    results: null,
    isLoading: false,
    error: null,
  });

  /**
   * Appelle l'Edge Function pour calculer la simulation PER
   */
  const calculerSimulation = useCallback(async (data: PERInput): Promise<PERResults | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Prepare fiscal rules and product constants for the backend
      const payload = {
        ...data,
        fiscal_rules: {
          tax_brackets: fiscalRules.tax_brackets || [],
          per_ceiling_rate: fiscalRules.per_ceiling_rate,
          per_ceiling_min: fiscalRules.per_ceiling_min,
          per_ceiling_max: fiscalRules.per_ceiling_max,
        },
        product_constants: {
          return_rate_short: productConstants.return_rate_short,
          return_rate_medium: productConstants.return_rate_medium,
          return_rate_long: productConstants.return_rate_long,
          return_rate_very_long: productConstants.return_rate_very_long,
        },
      };

      console.log('Calling calculate-per Edge Function with:', payload);

      const { data: response, error } = await supabase.functions.invoke('calculate-per', {
        body: payload,
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Erreur lors du calcul');
      }

      if (!response?.success) {
        const errorMessage = response?.error || 'Erreur inconnue';
        const details = response?.details?.map((d: { message: string }) => d.message).join(', ');
        throw new Error(details || errorMessage);
      }

      const results = response.results as PERResults;
      setState({ results, isLoading: false, error: null });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du calcul PER';
      console.error('PER calculation error:', errorMessage);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error('Erreur de calcul', {
        description: errorMessage,
      });
      return null;
    }
  }, [fiscalRules, productConstants]);

  /**
   * Calcul synchrone local pour les mises à jour en temps réel (preview)
   * Utilisé pendant que l'utilisateur remplit le formulaire
   */
  const calculerSimulationLocale = useCallback((data: PERInput): PERResults => {
    const {
      revenu_fiscal,
      parts_fiscales,
      age_actuel,
      age_retraite,
      plafond_reportable,
      versements_per,
    } = data;

    const tranches = fiscalRules.tax_brackets || [];

    // Calcul TMI
    const quotient = revenu_fiscal / parts_fiscales;
    let tmi = 0;
    for (let i = tranches.length - 1; i >= 0; i--) {
      if (quotient > tranches[i].seuil) {
        tmi = tranches[i].taux;
        break;
      }
    }

    // Calcul impôt
    const calculerImpot = (revenu: number, parts: number): number => {
      const q = revenu / parts;
      let impotParPart = 0;
      for (let i = 0; i < tranches.length; i++) {
        const tranche = tranches[i];
        const nextSeuil = i < tranches.length - 1 ? tranches[i + 1].seuil : Infinity;
        if (q > tranche.seuil) {
          const base = Math.min(q, nextSeuil) - tranche.seuil;
          impotParPart += base * (tranche.taux / 100);
        }
      }
      return Math.max(0, impotParPart * parts);
    };

    // Calcul plafond PER
    const plafondTheorique = revenu_fiscal * (fiscalRules.per_ceiling_rate / 100);
    const plafond_per_annuel = Math.min(
      Math.max(plafondTheorique, fiscalRules.per_ceiling_min),
      fiscalRules.per_ceiling_max
    );
    const plafond_per_total = plafond_per_annuel + plafond_reportable;

    // Calculs fiscaux
    const impot_sans_per = calculerImpot(revenu_fiscal, parts_fiscales);
    const impot_avec_per = calculerImpot(revenu_fiscal - versements_per, parts_fiscales);
    const economie_impots = impot_sans_per - impot_avec_per;
    const effort_reel = versements_per - economie_impots;
    const optimisation_fiscale = versements_per > 0 ? (economie_impots / versements_per) * 100 : 0;
    const reduction_impots_max = plafond_per_total * (tmi / 100);

    // Calculs retraite
    const horizon_annees = Math.max(0, age_retraite - age_actuel);
    
    let taux_rendement: number;
    if (horizon_annees > 25) taux_rendement = productConstants.return_rate_very_long / 100;
    else if (horizon_annees >= 10) taux_rendement = productConstants.return_rate_long / 100;
    else if (horizon_annees >= 5) taux_rendement = productConstants.return_rate_medium / 100;
    else taux_rendement = productConstants.return_rate_short / 100;

    const capital_futur = horizon_annees > 0 
      ? versements_per * Math.pow(1 + taux_rendement, horizon_annees)
      : versements_per;
    const gain_financier = capital_futur - versements_per;

    return {
      tmi,
      plafond_per_annuel,
      plafond_per_total,
      impot_sans_per,
      impot_avec_per,
      economie_impots,
      effort_reel,
      optimisation_fiscale,
      reduction_impots_max,
      horizon_annees,
      taux_rendement,
      capital_futur,
      gain_financier,
    };
  }, [fiscalRules, productConstants]);

  // Helper functions for backward compatibility
  const calculerTMI = useCallback((revenuFiscal: number, parts: number): number => {
    const quotient = revenuFiscal / parts;
    const tranches = fiscalRules.tax_brackets || [];
    for (let i = tranches.length - 1; i >= 0; i--) {
      if (quotient > tranches[i].seuil) {
        return tranches[i].taux;
      }
    }
    return 0;
  }, [fiscalRules]);

  const calculerPlafondPER = useCallback((revenusProf: number): number => {
    const plafondTheorique = revenusProf * (fiscalRules.per_ceiling_rate / 100);
    return Math.min(Math.max(plafondTheorique, fiscalRules.per_ceiling_min), fiscalRules.per_ceiling_max);
  }, [fiscalRules]);

  return {
    // State
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    
    // Server-side calculation (secure, for final results)
    calculerSimulation,
    
    // Local calculation (for real-time preview)
    calculerSimulationLocale,
    
    // Helper functions (backward compatibility)
    calculerTMI,
    calculerPlafondPER,
  };
};
