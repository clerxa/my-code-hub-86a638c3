import { useState } from "react";
import { OptimisationFiscaleSimulation, PlafondInfo, PlafondDetail } from "@/types/optimisation-fiscale";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalculationResult {
  parts_fiscales: number;
  tmi: number;
  impot_avant: number;
  impot_apres: number;
  economie_totale: number;
  plafond_per_total: number;
  reductions: {
    reduction_per: number;
    plafond_per_utilise: number;
    reduction_dons_75: number;
    reduction_dons_66: number;
    dons_66_montant: number;
    reduction_aide_domicile: number;
    reduction_garde_enfant: number;
    reduction_pinel_annuelle: number;
    reduction_pinel_om_annuelle: number;
    reduction_girardin: number;
    reduction_pme: number;
    reduction_esus: number;
  };
  plafond_unique: PlafondDetail;
  plafonds: PlafondInfo[];
}

export const useOptimisationFiscaleCalculations = () => {
  const fiscalRules = useFiscalRules();
  const [isLoading, setIsLoading] = useState(false);

  // ===== FONCTIONS LOCALES (pour preview instantanée) =====
  
  const calculerPartsFiscalesLocale = (situationFamiliale: string, nbEnfants: number): number => {
    let parts = 0;
    
    if (situationFamiliale === 'celibataire' || situationFamiliale === 'divorce') {
      parts = 1;
    } else if (situationFamiliale === 'marie' || situationFamiliale === 'pacse') {
      parts = 2;
    } else if (situationFamiliale === 'veuf') {
      parts = 1;
    }
    
    if (nbEnfants === 1) {
      parts += 0.5;
    } else if (nbEnfants === 2) {
      parts += 1;
    } else if (nbEnfants >= 3) {
      parts += 1 + (nbEnfants - 2);
    }
    
    return parts;
  };

  const calculerTMILocale = (revenuImposable: number, situationFamiliale: string, nbEnfants: number): number => {
    const parts = calculerPartsFiscalesLocale(situationFamiliale, nbEnfants);
    const quotientFamilial = revenuImposable / parts;
    
    const tranches = fiscalRules.tax_brackets || [];
    for (let i = tranches.length - 1; i >= 0; i--) {
      if (quotientFamilial > tranches[i].seuil) {
        return tranches[i].taux;
      }
    }
    return 0;
  };

  const calculerImpotLocale = (revenuImposable: number, situationFamiliale: string, nbEnfants: number): number => {
    const parts = calculerPartsFiscalesLocale(situationFamiliale, nbEnfants);
    const quotientFamilial = revenuImposable / parts;
    
    const tranches = fiscalRules.tax_brackets || [];
    
    let impotParPart = 0;
    let revenuRestant = quotientFamilial;
    let tranchePrecedente = 0;
    
    for (let i = 0; i < tranches.length; i++) {
      const limite = i < tranches.length - 1 ? tranches[i + 1].seuil : Infinity;
      const taux = tranches[i].taux / 100;
      
      const revenuDansTranche = Math.min(revenuRestant, limite - tranchePrecedente);
      
      if (revenuDansTranche > 0) {
        impotParPart += revenuDansTranche * taux;
        revenuRestant -= revenuDansTranche;
      }
      
      tranchePrecedente = limite;
      
      if (revenuRestant <= 0) break;
    }
    
    return Math.max(Math.round(impotParPart * parts), 0);
  };

  const calculerPlafondPERTotalLocale = (simulation: Partial<OptimisationFiscaleSimulation>): number => {
    const plafondBase = (simulation.revenus_professionnels || 0) * (fiscalRules.per_ceiling_rate / 100);
    const reports = (simulation.plafond_per_report_n1 || 0) + 
                   (simulation.plafond_per_report_n2 || 0) + 
                   (simulation.plafond_per_report_n3 || 0);
    return plafondBase + reports;
  };

  const calculerReductionPERLocale = (simulation: Partial<OptimisationFiscaleSimulation>): { reduction: number; utilise: number } => {
    const plafondTotal = calculerPlafondPERTotalLocale(simulation);
    const utilise = Math.min(simulation.montant_per || 0, plafondTotal);
    const reduction = utilise * ((simulation.tmi || 0) / 100);
    return { reduction, utilise };
  };

  const calculerReductionsDonsLocale = (simulation: Partial<OptimisationFiscaleSimulation>): { 
    reduction75: number; 
    reduction66: number;
    dons66Total: number;
  } => {
    const dons75 = simulation.dons_75_montant || 0;
    const reduction75 = Math.min(dons75, fiscalRules.dons_75_ceiling) * (fiscalRules.dons_75_rate / 100);
    const excedent75 = Math.max(dons75 - fiscalRules.dons_75_ceiling, 0);
    const dons66Total = (simulation.dons_66_montant || 0) + excedent75;
    const reduction66 = dons66Total * (fiscalRules.dons_66_rate / 100);
    
    return { reduction75, reduction66, dons66Total };
  };

  const calculerReductionAideDomicileLocale = (montant: number): number => {
    return Math.min(montant * (fiscalRules.aide_domicile_rate / 100), fiscalRules.aide_domicile_ceiling);
  };

  const calculerReductionGardeEnfantLocale = (montant: number): number => {
    return Math.min(montant * (fiscalRules.garde_enfant_rate / 100), fiscalRules.garde_enfant_ceiling);
  };

  const calculerReductionPinelLocale = (prix: number, taux: number, duree: number): number => {
    if (duree === 0) return 0;
    return (prix * taux) / 100 / duree;
  };

  const calculerReductionGirardinLocale = (montant: number, taux: number = 110): number => {
    return montant * (taux / 100);
  };

  const calculerReductionPMELocale = (montant: number): number => {
    return montant * (fiscalRules.pme_reduction_rate / 100);
  };

  const calculerReductionESUSLocale = (montant: number): number => {
    return Math.min(montant * (fiscalRules.esus_reduction_rate / 100), fiscalRules.esus_ceiling);
  };

  const calculerToutesReductionsLocale = (simulation: Partial<OptimisationFiscaleSimulation>) => {
    const perCalc = calculerReductionPERLocale(simulation);
    const donsCalc = calculerReductionsDonsLocale(simulation);
    
    const reductionAideDomicile = calculerReductionAideDomicileLocale(simulation.montant_aide_domicile || 0);
    const reductionGardeEnfant = calculerReductionGardeEnfantLocale(simulation.montant_garde_enfant || 0);
    const reductionPinel = calculerReductionPinelLocale(
      simulation.prix_pinel || 0, 
      simulation.taux_pinel || 0, 
      simulation.duree_pinel || 0
    );
    const reductionPinelOM = calculerReductionPinelLocale(
      simulation.prix_pinel_om || 0, 
      simulation.taux_pinel_om || 0, 
      simulation.duree_pinel_om || 0
    );
    const reductionGirardin = calculerReductionGirardinLocale(simulation.montant_girardin || 0, simulation.taux_girardin || 110);
    const reductionPME = calculerReductionPMELocale(simulation.montant_pme || 0);
    const reductionESUS = calculerReductionESUSLocale(simulation.montant_esus || 0);

    return {
      reduction_per: perCalc.reduction,
      plafond_per_utilise: perCalc.utilise,
      reduction_dons_75: donsCalc.reduction75,
      reduction_dons_66: donsCalc.reduction66,
      dons_66_montant: donsCalc.dons66Total,
      reduction_aide_domicile: reductionAideDomicile,
      reduction_garde_enfant: reductionGardeEnfant,
      reduction_pinel_annuelle: reductionPinel,
      reduction_pinel_om_annuelle: reductionPinelOM,
      reduction_girardin: reductionGirardin,
      reduction_pme: reductionPME,
      reduction_esus: reductionESUS,
    };
  };

  const calculerPlafondUniqueLocale = (simulation: Partial<OptimisationFiscaleSimulation>): PlafondDetail => {
    const reductions = calculerToutesReductionsLocale(simulation);
    const dispositifsSelectionnes = simulation.dispositifs_selectionnes || [];
    
    const hasESUS = dispositifsSelectionnes.includes('esus') && reductions.reduction_esus > 0;
    const hasOutreMer = (dispositifsSelectionnes.includes('girardin') && reductions.reduction_girardin > 0) ||
                        (dispositifsSelectionnes.includes('pinel_om') && reductions.reduction_pinel_om_annuelle > 0);
    
    let plafondApplicable = fiscalRules.niche_ceiling_base;
    let raison = "Plafond de base des niches fiscales";
    
    if (hasOutreMer) {
      plafondApplicable = fiscalRules.niche_ceiling_outremer;
      raison = "Plafond majoré pour investissements Outre-mer (Girardin, Pinel OM)";
    } else if (hasESUS) {
      plafondApplicable = fiscalRules.niche_ceiling_esus;
      raison = "Plafond majoré pour investissements ESUS";
    }
    
    const repartition: PlafondDetail['repartition'] = [];
    
    if (dispositifsSelectionnes.includes('dons_66') && reductions.reduction_dons_66 > 0) {
      repartition.push({
        dispositifId: 'dons_66',
        nom: 'Dons 66%',
        montantPlafonnable: reductions.reduction_dons_66,
        pourcentagePlafond: 0,
      });
    }
    
    if (dispositifsSelectionnes.includes('aide_domicile') && reductions.reduction_aide_domicile > 0) {
      repartition.push({
        dispositifId: 'aide_domicile',
        nom: 'Aide à domicile',
        montantPlafonnable: reductions.reduction_aide_domicile,
        pourcentagePlafond: 0,
      });
    }
    
    if (dispositifsSelectionnes.includes('garde_enfants') && reductions.reduction_garde_enfant > 0) {
      repartition.push({
        dispositifId: 'garde_enfants',
        nom: "Garde d'enfants",
        montantPlafonnable: reductions.reduction_garde_enfant,
        pourcentagePlafond: 0,
      });
    }
    
    if (dispositifsSelectionnes.includes('pinel') && reductions.reduction_pinel_annuelle > 0) {
      repartition.push({
        dispositifId: 'pinel',
        nom: 'Pinel',
        montantPlafonnable: reductions.reduction_pinel_annuelle,
        pourcentagePlafond: 0,
      });
    }
    
    if (dispositifsSelectionnes.includes('pinel_om') && reductions.reduction_pinel_om_annuelle > 0) {
      repartition.push({
        dispositifId: 'pinel_om',
        nom: 'Pinel Outre-mer',
        montantPlafonnable: reductions.reduction_pinel_om_annuelle,
        pourcentagePlafond: 0,
      });
    }
    
    if (dispositifsSelectionnes.includes('girardin') && reductions.reduction_girardin > 0) {
      const girardinPlafonnable = reductions.reduction_girardin * (fiscalRules.girardin_ceiling_part / 100);
      repartition.push({
        dispositifId: 'girardin',
        nom: `Girardin (${fiscalRules.girardin_ceiling_part}%)`,
        montantPlafonnable: girardinPlafonnable,
        pourcentagePlafond: 0,
      });
    }
    
    if (dispositifsSelectionnes.includes('pme_fcpi_fip') && reductions.reduction_pme > 0) {
      repartition.push({
        dispositifId: 'pme_fcpi_fip',
        nom: 'PME/FCPI/FIP',
        montantPlafonnable: reductions.reduction_pme,
        pourcentagePlafond: 0,
      });
    }
    
    if (dispositifsSelectionnes.includes('esus') && reductions.reduction_esus > 0) {
      repartition.push({
        dispositifId: 'esus',
        nom: 'ESUS',
        montantPlafonnable: reductions.reduction_esus,
        pourcentagePlafond: 0,
      });
    }
    
    const totalUtilise = repartition.reduce((sum, r) => sum + r.montantPlafonnable, 0);
    
    repartition.forEach((r) => {
      r.pourcentagePlafond = plafondApplicable > 0 ? (r.montantPlafonnable / plafondApplicable) * 100 : 0;
    });
    
    return {
      plafondBase: fiscalRules.niche_ceiling_base,
      plafondApplicable,
      totalUtilise,
      pourcentage: plafondApplicable > 0 ? (totalUtilise / plafondApplicable) * 100 : 0,
      isDepasse: totalUtilise > plafondApplicable,
      repartition,
      raison,
    };
  };

  const calculerPlafondsLocale = (simulation: Partial<OptimisationFiscaleSimulation>): PlafondInfo[] => {
    const plafondUnique = calculerPlafondUniqueLocale(simulation);
    
    return [{
      nom: 'Plafond des niches fiscales',
      utilise: plafondUnique.totalUtilise,
      maximum: plafondUnique.plafondApplicable,
      pourcentage: plafondUnique.pourcentage,
      couleur: plafondUnique.pourcentage >= 100 ? 'destructive' : plafondUnique.pourcentage >= 70 ? 'warning' : 'success',
    }];
  };

  const calculerImpotFinalLocale = (simulation: Partial<OptimisationFiscaleSimulation>) => {
    const reductions = calculerToutesReductionsLocale(simulation);
    
    const economieTotal = 
      reductions.reduction_per +
      reductions.reduction_dons_75 +
      reductions.reduction_dons_66 +
      reductions.reduction_aide_domicile +
      reductions.reduction_garde_enfant +
      reductions.reduction_pinel_annuelle +
      reductions.reduction_pinel_om_annuelle +
      reductions.reduction_girardin +
      reductions.reduction_pme +
      reductions.reduction_esus;

    const impotApres = Math.max((simulation.impot_avant || 0) - economieTotal, 0);
    
    return {
      impot_apres: impotApres,
      economie_totale: economieTotal,
      reductions,
    };
  };

  // ===== FONCTION SERVEUR (appel Edge Function) =====
  
  const calculerSimulationServeur = async (simulation: Partial<OptimisationFiscaleSimulation>): Promise<CalculationResult | null> => {
    setIsLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('calculate-optimisation-fiscale', {
        body: {
          revenu_imposable: simulation.revenu_imposable || 0,
          revenus_professionnels: simulation.revenus_professionnels || 0,
          situation_familiale: simulation.situation_familiale || 'celibataire',
          nb_enfants: simulation.nb_enfants || 0,
          impot_avant: simulation.impot_avant || 0,
          montant_per: simulation.montant_per || 0,
          plafond_per_report_n1: simulation.plafond_per_report_n1 || 0,
          plafond_per_report_n2: simulation.plafond_per_report_n2 || 0,
          plafond_per_report_n3: simulation.plafond_per_report_n3 || 0,
          dons_75_montant: simulation.dons_75_montant || 0,
          dons_66_montant: simulation.dons_66_montant || 0,
          montant_aide_domicile: simulation.montant_aide_domicile || 0,
          montant_garde_enfant: simulation.montant_garde_enfant || 0,
          prix_pinel: simulation.prix_pinel || 0,
          taux_pinel: simulation.taux_pinel || 0,
          duree_pinel: simulation.duree_pinel || 0,
          prix_pinel_om: simulation.prix_pinel_om || 0,
          taux_pinel_om: simulation.taux_pinel_om || 0,
          duree_pinel_om: simulation.duree_pinel_om || 0,
          montant_girardin: simulation.montant_girardin || 0,
          taux_girardin: simulation.taux_girardin || 110,
          montant_pme: simulation.montant_pme || 0,
          montant_esus: simulation.montant_esus || 0,
          dispositifs_selectionnes: simulation.dispositifs_selectionnes || [],
          fiscal_rules: fiscalRules,
        },
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

  // Aliases pour compatibilité avec l'ancien code
  const calculerImpot = calculerImpotLocale;
  const calculerTMI = calculerTMILocale;
  const calculerPartsFiscales = calculerPartsFiscalesLocale;
  const calculerPlafondPERTotal = calculerPlafondPERTotalLocale;
  const calculerReductionPER = calculerReductionPERLocale;
  const calculerReductionsDons = calculerReductionsDonsLocale;
  const calculerReductionAideDomicile = calculerReductionAideDomicileLocale;
  const calculerReductionGardeEnfant = calculerReductionGardeEnfantLocale;
  const calculerReductionPinel = calculerReductionPinelLocale;
  const calculerReductionGirardin = calculerReductionGirardinLocale;
  const calculerReductionPME = calculerReductionPMELocale;
  const calculerReductionESUS = calculerReductionESUSLocale;
  const calculerToutesReductions = calculerToutesReductionsLocale;
  const calculerPlafonds = calculerPlafondsLocale;
  const calculerPlafondUnique = calculerPlafondUniqueLocale;
  const calculerImpotFinal = calculerImpotFinalLocale;

  return {
    isLoading,
    // Fonctions locales (preview)
    calculerImpot,
    calculerTMI,
    calculerPartsFiscales,
    calculerPlafondPERTotal,
    calculerReductionPER,
    calculerReductionsDons,
    calculerReductionAideDomicile,
    calculerReductionGardeEnfant,
    calculerReductionPinel,
    calculerReductionGirardin,
    calculerReductionPME,
    calculerReductionESUS,
    calculerToutesReductions,
    calculerPlafonds,
    calculerPlafondUnique,
    calculerImpotFinal,
    // Fonction serveur
    calculerSimulationServeur,
  };
};
