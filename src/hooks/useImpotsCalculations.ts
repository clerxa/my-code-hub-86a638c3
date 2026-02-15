import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";
import { calculateImpotDetaille, calculatePartsFiscales, getPlafondDemiPart } from "@/utils/taxCalculations";

interface CalculInputs {
  revenu_imposable: number;
  statut_marital: string;
  nombre_enfants: number;
  reductions_impot: number;
  credits_impot: number;
}

interface DetailTranche {
  tranche: string;
  montant: number;
  impot: number;
}

interface CalculationResult {
  parts: number;
  quotient_familial: number;
  impot_brut: number;
  reductions_impot: number;
  credits_impot: number;
  impot_net: number;
  taux_moyen: number;
  taux_marginal: number;
  economie_quotient_familial: number;
  detail_tranches?: DetailTranche[];
}

export const useImpotsCalculations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const fiscalRules = useFiscalRules();
  const { tax_brackets } = fiscalRules;

  const calculerPartsLocale = (statut: string, enfants: number): number => {
    return calculatePartsFiscales(statut, enfants, fiscalRules);
  };

  const calculerImpotLocale = (revenu: number, parts: number): { impot: number; tauxMarginal: number } => {
    return calculateImpotDetaille(revenu, parts, tax_brackets);
  };

  const calculerEconomieQFLocale = (revenu: number, partsActuelles: number): number => {
    if (partsActuelles <= 1) return 0;
    
    const { impot: impotCelibataire } = calculerImpotLocale(revenu, 1);
    const { impot: impotActuel } = calculerImpotLocale(revenu, partsActuelles);
    
    const plafondDemiPart = getPlafondDemiPart(fiscalRules);
    const demiPartsSupp = (partsActuelles - 1) * 2;
    const plafondTotal = demiPartsSupp * plafondDemiPart;
    const economieTheorique = impotCelibataire - impotActuel;
    
    return Math.min(economieTheorique, plafondTotal);
  };


  const calculerLocale = (inputs: CalculInputs) => {
    const { revenu_imposable, statut_marital, nombre_enfants, reductions_impot, credits_impot } = inputs;
    
    const parts = calculerPartsLocale(statut_marital, nombre_enfants);
    const quotientFamilial = revenu_imposable / parts;
    const { impot, tauxMarginal } = calculerImpotLocale(revenu_imposable, parts);
    const economieQF = calculerEconomieQFLocale(revenu_imposable, parts);
    
    const reductions = reductions_impot || 0;
    const credits = credits_impot || 0;
    
    const impotApresReductions = Math.max(0, impot - reductions);
    const impotFinal = Math.max(0, impotApresReductions - credits);
    const tauxMoyen = revenu_imposable > 0 ? (impotFinal / revenu_imposable) * 100 : 0;

    return {
      parts,
      quotientFamilial,
      impotBrut: Math.max(0, impot),
      reductionsImpot: reductions,
      creditsImpot: credits,
      impotNet: impotFinal,
      tauxMoyen,
      tauxMarginal,
      economieQuotientFamilial: economieQF,
    };
  };

  // Calcul serveur sécurisé
  const calculerServeur = async (inputs: CalculInputs): Promise<CalculationResult | null> => {
    setIsLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('calculate-impots', {
        body: inputs,
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        toast.error("Erreur lors du calcul serveur");
        return null;
      }

      return response as CalculationResult;
    } catch (err) {
      console.error('Erreur appel serveur:', err);
      toast.error("Erreur de connexion au serveur");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    calculerPartsLocale,
    calculerImpotLocale,
    calculerEconomieQFLocale,
    calculerLocale,
    calculerServeur,
  };
};
