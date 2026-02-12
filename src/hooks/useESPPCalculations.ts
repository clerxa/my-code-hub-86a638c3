/**
 * Hook pour les calculs du simulateur ESPP
 * Utilise les paramètres fiscaux configurables depuis GlobalSettings
 */

import { ESPPPlan, CalculESPP, ResultatVente, UserFiscalProfile } from "@/types/espp";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";

export const useESPPCalculations = () => {
  const fiscalRules = useFiscalRules();
  
  // Calcule le prix d'achat final du plan
  const calculerPrixAchat = (plan: Partial<ESPPPlan>): number => {
    if (!plan.fmv_debut || !plan.fmv_fin || !plan.discount_pct) return 0;
    
    let prixBase: number;
    if (plan.lookback) {
      prixBase = Math.min(plan.fmv_debut, plan.fmv_fin);
    } else {
      prixBase = plan.fmv_fin;
    }
    
    const prixAchat = prixBase * (1 - plan.discount_pct / 100);
    return Math.round(prixAchat * 10000) / 10000;
  };

  // Calcule le nombre d'actions achetées
  const calculerQuantiteActions = (montantInvesti: number, prixAchat: number): number => {
    if (prixAchat === 0) return 0;
    return Math.round((montantInvesti / prixAchat) * 10000) / 10000;
  };

  // Calcule le gain d'acquisition
  const calculerGainAcquisition = (plan: Partial<ESPPPlan>): CalculESPP => {
    const prixAchatFinal = calculerPrixAchat(plan);
    const quantiteActions = calculerQuantiteActions(plan.montant_investi || 0, prixAchatFinal);
    
    const fmvRetenu = plan.fmv_fin || 0;
    const gainAcquisitionParAction = fmvRetenu - prixAchatFinal;
    const gainAcquisitionTotal = gainAcquisitionParAction * quantiteActions;
    const gainAcquisitionEUR = gainAcquisitionTotal * (plan.taux_change_payroll || 1);
    const pruFiscalEUR = fmvRetenu * (plan.taux_change_payroll || 1);

    return {
      prixAchatFinal,
      quantiteActions,
      gainAcquisitionParAction,
      gainAcquisitionTotal,
      gainAcquisitionEUR,
      pruFiscalEUR
    };
  };

  // Calcule la plus-value et l'impôt d'une vente
  const calculerPlusValue = (
    quantiteVendue: number,
    prixVenteDevise: number,
    tauxChange: number,
    pruFiscalEUR: number,
    fmvRetenuPlan: number,
    fraisVente: number,
    profile: UserFiscalProfile
  ): ResultatVente => {
    const prixVenteEUR = prixVenteDevise * tauxChange;
    const plusValueBrute = (prixVenteDevise - fmvRetenuPlan) * quantiteVendue;
    const plusValueEUR = (prixVenteEUR * quantiteVendue) - (pruFiscalEUR * quantiteVendue) - fraisVente;
    
    // Taux configurables depuis GlobalSettings
    const tauxPS = fiscalRules.social_charges_rate / 100;
    const tauxPFU = fiscalRules.pfu_rate / 100;
    
    let impot = 0;
    let prelevementsSociaux = 0;
    
    if (plusValueEUR > 0) {
      prelevementsSociaux = plusValueEUR * tauxPS;
      
      if (profile.mode_imposition_plus_value === 'PFU') {
        impot = plusValueEUR * tauxPFU;
      } else {
        impot = plusValueEUR * (profile.tmi / 100);
      }
    }
    
    const netApresImpot = plusValueEUR - impot - prelevementsSociaux;

    return {
      plusValueBrute: Math.round(plusValueBrute * 100) / 100,
      plusValueEUR: Math.round(plusValueEUR * 100) / 100,
      impot: Math.round(impot * 100) / 100,
      prelevementsSociaux: Math.round(prelevementsSociaux * 100) / 100,
      netApresImpot: Math.round(netApresImpot * 100) / 100
    };
  };

  return {
    calculerPrixAchat,
    calculerQuantiteActions,
    calculerGainAcquisition,
    calculerPlusValue
  };
};