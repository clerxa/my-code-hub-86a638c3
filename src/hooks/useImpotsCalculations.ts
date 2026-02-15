import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";
import { calculateImpotDetaille } from "@/utils/taxCalculations";

// Plafonnement quotient familial 2025 : 1759€ par demi-part supplémentaire
const PLAFOND_DEMI_PART = 1759;

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
  const { tax_brackets } = useFiscalRules();

  // Calcul local pour preview instantanée
  const calculerPartsLocale = (statut: string, enfants: number): number => {
    let parts = 0;
    
    switch (statut) {
      case "marie":
      case "pacs":
        parts = 2;
        break;
      case "celibataire":
      case "divorce":
      case "separe":
      case "union-libre":
        parts = 1;
        break;
      case "veuf":
        parts = enfants > 0 ? 1.5 : 1;
        break;
      default:
        parts = 1;
    }

    if (enfants === 1) {
      parts += 0.5;
    } else if (enfants === 2) {
      parts += 1;
    } else if (enfants >= 3) {
      parts += 1 + (enfants - 2) * 1;
    }

    return parts;
  };

  const calculerImpotLocale = (revenu: number, parts: number): { impot: number; tauxMarginal: number } => {
    return calculateImpotDetaille(revenu, parts, tax_brackets);
  };

  const calculerEconomieQFLocale = (revenu: number, partsActuelles: number): number => {
    if (partsActuelles <= 1) return 0;
    
    const { impot: impotCelibataire } = calculerImpotLocale(revenu, 1);
    const { impot: impotActuel } = calculerImpotLocale(revenu, partsActuelles);
    
    // Appliquer le plafonnement du QF
    const demiPartsSupp = (partsActuelles - 1) * 2;
    const plafondTotal = demiPartsSupp * PLAFOND_DEMI_PART;
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
