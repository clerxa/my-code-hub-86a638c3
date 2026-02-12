/**
 * Hook pour les calculs du simulateur LMNP
 * La logique de calcul est maintenant exécutée côté serveur via Edge Function
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";
import { toast } from "sonner";

export interface LMNPInputs {
  recettes: number;
  interets_emprunt: number;
  assurance_pno: number;
  assurance_gli: number;
  gestion_locative: number;
  expert_comptable: number;
  charges_copro: number;
  taxe_fonciere: number;
  cfe: number;
  travaux_entretien: number;
  petit_materiel: number;
  frais_deplacement: number;
  autre_charge: number;
  valeur_bien: number;
  duree_immo: number;
  valeur_mobilier: number;
  duree_mobilier: number;
  tmi: number;
}

export interface LMNPResults {
  total_charges: number;
  resultat_avant_amort: number;
  amort_immo: number;
  amort_mobilier: number;
  amort_total: number;
  resultat_fiscal_reel: number;
  resultat_fiscal_micro: number;
  ir_reel: number;
  ps_reel: number;
  ir_micro: number;
  ps_micro: number;
  fiscalite_totale_reel: number;
  fiscalite_totale_micro: number;
  meilleur_regime: 'reel' | 'micro';
  amort_non_deduits: number;
}

interface LMNPCalculationState {
  results: LMNPResults | null;
  isLoading: boolean;
  error: string | null;
}

export const useLMNPCalculations = () => {
  const fiscalRules = useFiscalRules();

  const [state, setState] = useState<LMNPCalculationState>({
    results: null,
    isLoading: false,
    error: null,
  });

  const calculerTotalCharges = useCallback((inputs: Partial<LMNPInputs>): number => {
    return (
      (inputs.interets_emprunt || 0) +
      (inputs.assurance_pno || 0) +
      (inputs.assurance_gli || 0) +
      (inputs.gestion_locative || 0) +
      (inputs.expert_comptable || 0) +
      (inputs.charges_copro || 0) +
      (inputs.taxe_fonciere || 0) +
      (inputs.cfe || 0) +
      (inputs.travaux_entretien || 0) +
      (inputs.petit_materiel || 0) +
      (inputs.frais_deplacement || 0) +
      (inputs.autre_charge || 0)
    );
  }, []);

  /**
   * Appelle l'Edge Function pour calculer la simulation LMNP
   */
  const calculerSimulation = useCallback(async (inputs: LMNPInputs): Promise<LMNPResults | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const payload = {
        ...inputs,
        fiscal_rules: {
          micro_bic_abatement: fiscalRules.micro_bic_abatement,
          social_charges_rate: fiscalRules.social_charges_rate,
        },
      };

      console.log('Calling calculate-lmnp Edge Function with:', payload);

      const { data: response, error } = await supabase.functions.invoke('calculate-lmnp', {
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

      const results = response.results as LMNPResults;
      setState({ results, isLoading: false, error: null });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du calcul LMNP';
      console.error('LMNP calculation error:', errorMessage);
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error('Erreur de calcul', { description: errorMessage });
      return null;
    }
  }, [fiscalRules]);

  /**
   * Calcul synchrone local pour les mises à jour en temps réel (preview)
   */
  const calculerSimulationLocale = useCallback((inputs: LMNPInputs): LMNPResults => {
    const total_charges = calculerTotalCharges(inputs);

    // Résultat avant amortissement
    const resultat_avant_amort = inputs.recettes - total_charges;

    // Amortissements
    const amort_immo = inputs.duree_immo > 0 ? inputs.valeur_bien / inputs.duree_immo : 0;
    const amort_mobilier = inputs.duree_mobilier > 0 ? inputs.valeur_mobilier / inputs.duree_mobilier : 0;
    const amort_total = amort_immo + amort_mobilier;

    // Résultat fiscal LMNP réel
    let resultat_fiscal_reel: number;
    let amort_non_deduits = 0;

    if (resultat_avant_amort <= 0) {
      resultat_fiscal_reel = resultat_avant_amort;
    } else {
      resultat_fiscal_reel = Math.max(resultat_avant_amort - amort_total, 0);
      amort_non_deduits = Math.max(amort_total - resultat_avant_amort, 0);
    }

    // Micro-BIC avec abattement configurable
    const abattementMicroBIC = fiscalRules.micro_bic_abatement / 100;
    const resultat_fiscal_micro = inputs.recettes * (1 - abattementMicroBIC);

    // Prélèvements sociaux configurables
    const tauxPS = fiscalRules.social_charges_rate / 100;

    // Fiscalité régime réel
    const tmi_decimal = inputs.tmi / 100;
    const ir_reel = Math.max(resultat_fiscal_reel, 0) * tmi_decimal;
    const ps_reel = Math.max(resultat_fiscal_reel, 0) * tauxPS;
    const fiscalite_totale_reel = ir_reel + ps_reel;

    // Fiscalité micro-BIC
    const ir_micro = resultat_fiscal_micro * tmi_decimal;
    const ps_micro = resultat_fiscal_micro * tauxPS;
    const fiscalite_totale_micro = ir_micro + ps_micro;

    // Meilleur régime
    const meilleur_regime = fiscalite_totale_reel < fiscalite_totale_micro ? 'reel' : 'micro';

    return {
      total_charges,
      resultat_avant_amort,
      amort_immo,
      amort_mobilier,
      amort_total,
      resultat_fiscal_reel,
      resultat_fiscal_micro,
      ir_reel,
      ps_reel,
      ir_micro,
      ps_micro,
      fiscalite_totale_reel,
      fiscalite_totale_micro,
      meilleur_regime,
      amort_non_deduits,
    };
  }, [fiscalRules, calculerTotalCharges]);

  return {
    // State
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,

    // Functions
    calculerTotalCharges,
    calculerSimulation,
    calculerSimulationLocale,
  };
};
