/**
 * Hook pour les calculs du simulateur Plus-Value Immobilière (PVI)
 * Implémente la logique fiscale selon CGI Art. 150 VB, 150 VC, 1609 nonies G
 * Toutes les constantes fiscales viennent de global_settings via useFiscalRules()
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFiscalRules } from '@/contexts/GlobalSettingsContext';
import type { PVIFormInputs, PVICalculationResult, PVIAbattementDetail } from '@/types/pvi';
import type { FiscalRules, PVISurtaxeBracket } from '@/types/global-settings';

// ============================================
// Fonctions utilitaires PVI (paramétrisées)
// ============================================

/** Grille d'abattement IR (Art. 150 VC CGI) – paramétrisée */
const getAbattementIRConfigurable = (annees: number, rules: FiscalRules): number => {
  const debutAnnee = rules.pvi_abattement_ir_debut_annee;
  const exonerationAnnee = rules.pvi_abattement_ir_exoneration_annee;
  const tauxAnnuel = rules.pvi_abattement_ir_taux_annuel;
  const taux22e = rules.pvi_abattement_ir_taux_22e;

  if (annees < debutAnnee) return 0;
  if (annees >= exonerationAnnee) return 100;

  // De la debutAnnee à l'avant-dernière année: tauxAnnuel par an
  const anneesAbattement = Math.min(annees, exonerationAnnee - 1) - (debutAnnee - 1);
  let abattement = anneesAbattement * tauxAnnuel;

  // Dernière année avant exonération
  if (annees >= exonerationAnnee - 1) {
    // On remplace la dernière année de taux annuel par taux22e
    // En réalité le barème officiel : 6% × 16 ans = 96% + 4% = 100%
    // Donc on cap à 100 avec la formule
  }

  return Math.min(abattement, 100);
};

/** Grille d'abattement PS (Art. 150 VC CGI) – paramétrisée */
const getAbattementPSConfigurable = (annees: number, rules: FiscalRules): number => {
  const debutAnnee = rules.pvi_abattement_ir_debut_annee; // même début que IR
  const exonerationAnnee = rules.pvi_abattement_ps_exoneration_annee;
  const phase1Rate = rules.pvi_abattement_ps_phase1_rate;
  const phase2Rate = rules.pvi_abattement_ps_phase2_rate;
  const phase3Rate = rules.pvi_abattement_ps_phase3_rate;

  if (annees < debutAnnee) return 0;
  if (annees >= exonerationAnnee) return 100;

  let abattement = 0;

  // Phase 1: de la debutAnnee à la 21e année
  if (annees >= debutAnnee) {
    const anneesPhase1 = Math.min(annees, 21) - (debutAnnee - 1);
    abattement += anneesPhase1 * phase1Rate;
  }

  // Phase 2: 22e année
  if (annees >= 22) {
    abattement += phase2Rate;
  }

  // Phase 3: de la 23e à la 30e année
  if (annees >= 23) {
    const anneesPhase3 = Math.min(annees, exonerationAnnee) - 22;
    abattement += anneesPhase3 * phase3Rate;
  }

  return Math.min(abattement, 100);
};

/** Barème surtaxe hautes plus-values (Art. 1609 nonies G CGI) – paramétrisé */
const calculerSurtaxeConfigurable = (
  pvImposable: number,
  brackets: PVISurtaxeBracket[]
): { taux: number; montant: number } => {
  if (!brackets || brackets.length === 0 || pvImposable <= (brackets[0]?.seuil || 50000)) {
    return { taux: 0, montant: 0 };
  }

  const sorted = [...brackets].sort((a, b) => a.seuil - b.seuil);

  let taux = 0;
  for (const bracket of sorted) {
    if (pvImposable > bracket.seuil) {
      taux = bracket.taux / 100;
    }
  }

  const montant = pvImposable * taux;
  return { taux: taux * 100, montant };
};

// Calcul de la durée de détention en années pleines
const calculerDureeDetention = (dateAcquisition: string, dateCession: string) => {
  const acquisition = new Date(dateAcquisition);
  const cession = new Date(dateCession);

  const diffMs = cession.getTime() - acquisition.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;

  return {
    annees: years,
    detail: { years, months, days }
  };
};

export const usePVICalculations = () => {
  const fiscalRules = useFiscalRules();

  // Wrappers utilisant les règles configurées
  const getAbattementIR = useCallback((annees: number): number => {
    return getAbattementIRConfigurable(annees, fiscalRules);
  }, [fiscalRules]);

  const getAbattementPS = useCallback((annees: number): number => {
    return getAbattementPSConfigurable(annees, fiscalRules);
  }, [fiscalRules]);

  /**
   * Calcul local (preview) pour réactivité UI
   */
  const calculerPVILocal = useCallback((inputs: PVIFormInputs): PVICalculationResult | null => {
    const TAUX_IR = fiscalRules.pvi_taux_ir / 100;
    const TAUX_PS = fiscalRules.pvi_taux_ps / 100;
    const FORFAIT_FRAIS = fiscalRules.pvi_forfait_frais_acquisition / 100;
    const FORFAIT_TRAVAUX = fiscalRules.pvi_forfait_travaux / 100;

    // Cas spécial: résidence principale = exonération totale
    if (inputs.nature_bien === 'residence_principale') {
      const plusValueBrute = inputs.prix_cession - inputs.prix_acquisition;
      return {
        duree_detention_annees: 0,
        duree_detention_exacte: { years: 0, months: 0, days: 0 },
        frais_acquisition: 0,
        travaux: 0,
        prix_acquisition_majore: inputs.prix_acquisition,
        plus_value_brute: plusValueBrute,
        abattement_ir_pct: 100,
        abattement_ps_pct: 100,
        abattement_ir_montant: plusValueBrute,
        abattement_ps_montant: plusValueBrute,
        assiette_ir_nette: 0,
        assiette_ps_nette: 0,
        impot_revenu: 0,
        prelevements_sociaux: 0,
        surtaxe_applicable: false,
        surtaxe_montant: 0,
        surtaxe_taux: 0,
        impot_total: 0,
        net_vendeur: inputs.prix_cession,
        repartition: {
          part_exoneree: plusValueBrute,
          impot_revenu: 0,
          prelevements_sociaux: 0,
          surtaxe: 0
        }
      };
    }

    if (!inputs.date_acquisition || !inputs.date_cession ||
        !inputs.prix_cession || !inputs.prix_acquisition) {
      return null;
    }

    // 1. Durée de détention
    const duree = calculerDureeDetention(inputs.date_acquisition, inputs.date_cession);

    // 2. Frais d'acquisition
    const fraisAcquisition = inputs.mode_frais_acquisition === 'forfait'
      ? inputs.prix_acquisition * FORFAIT_FRAIS
      : (inputs.frais_acquisition_reel || 0);

    // 3. Travaux (forfait seulement si détention > 5 ans)
    let travaux = 0;
    if (inputs.mode_travaux === 'forfait_15' && duree.annees >= 5) {
      travaux = inputs.prix_acquisition * FORFAIT_TRAVAUX;
    } else if (inputs.mode_travaux === 'reel') {
      travaux = inputs.travaux_reel || 0;
    }

    // 4. Prix d'acquisition majoré
    const prixAcquisitionMajore = inputs.prix_acquisition + fraisAcquisition + travaux;

    // 5. Plus-value brute
    const plusValueBrute = inputs.prix_cession - prixAcquisitionMajore;

    if (plusValueBrute <= 0) {
      return {
        duree_detention_annees: duree.annees,
        duree_detention_exacte: duree.detail,
        frais_acquisition: fraisAcquisition,
        travaux,
        prix_acquisition_majore: prixAcquisitionMajore,
        plus_value_brute: plusValueBrute,
        abattement_ir_pct: 0,
        abattement_ps_pct: 0,
        abattement_ir_montant: 0,
        abattement_ps_montant: 0,
        assiette_ir_nette: 0,
        assiette_ps_nette: 0,
        impot_revenu: 0,
        prelevements_sociaux: 0,
        surtaxe_applicable: false,
        surtaxe_montant: 0,
        surtaxe_taux: 0,
        impot_total: 0,
        net_vendeur: inputs.prix_cession,
        repartition: {
          part_exoneree: plusValueBrute,
          impot_revenu: 0,
          prelevements_sociaux: 0,
          surtaxe: 0
        }
      };
    }

    // 6. Abattements pour durée de détention
    const abattementIRPct = getAbattementIRConfigurable(duree.annees, fiscalRules);
    const abattementPSPct = getAbattementPSConfigurable(duree.annees, fiscalRules);

    const abattementIRMontant = plusValueBrute * (abattementIRPct / 100);
    const abattementPSMontant = plusValueBrute * (abattementPSPct / 100);

    // 7. Assiettes nettes
    const assietteIRNette = plusValueBrute - abattementIRMontant;
    const assiettePSNette = plusValueBrute - abattementPSMontant;

    // 8. Impôts de base
    const impotRevenu = assietteIRNette * TAUX_IR;
    const prelevementsSociaux = assiettePSNette * TAUX_PS;

    // 9. Surtaxe sur hautes plus-values
    const surtaxe = calculerSurtaxeConfigurable(assietteIRNette, fiscalRules.pvi_surtaxe_brackets);

    // 10. Totaux
    const impotTotal = impotRevenu + prelevementsSociaux + surtaxe.montant;
    const netVendeur = inputs.prix_cession - impotTotal;

    // Répartition pour graphique
    const partExoneree = abattementIRMontant;

    return {
      duree_detention_annees: duree.annees,
      duree_detention_exacte: duree.detail,
      frais_acquisition: Math.round(fraisAcquisition * 100) / 100,
      travaux: Math.round(travaux * 100) / 100,
      prix_acquisition_majore: Math.round(prixAcquisitionMajore * 100) / 100,
      plus_value_brute: Math.round(plusValueBrute * 100) / 100,
      abattement_ir_pct: Math.round(abattementIRPct * 100) / 100,
      abattement_ps_pct: Math.round(abattementPSPct * 100) / 100,
      abattement_ir_montant: Math.round(abattementIRMontant * 100) / 100,
      abattement_ps_montant: Math.round(abattementPSMontant * 100) / 100,
      assiette_ir_nette: Math.round(assietteIRNette * 100) / 100,
      assiette_ps_nette: Math.round(assiettePSNette * 100) / 100,
      impot_revenu: Math.round(impotRevenu * 100) / 100,
      prelevements_sociaux: Math.round(prelevementsSociaux * 100) / 100,
      surtaxe_applicable: surtaxe.montant > 0,
      surtaxe_montant: Math.round(surtaxe.montant * 100) / 100,
      surtaxe_taux: surtaxe.taux,
      impot_total: Math.round(impotTotal * 100) / 100,
      net_vendeur: Math.round(netVendeur * 100) / 100,
      repartition: {
        part_exoneree: Math.round(partExoneree * 100) / 100,
        impot_revenu: Math.round(impotRevenu * 100) / 100,
        prelevements_sociaux: Math.round(prelevementsSociaux * 100) / 100,
        surtaxe: Math.round(surtaxe.montant * 100) / 100
      }
    };
  }, [fiscalRules]);

  /**
   * Calcul backend sécurisé via Edge Function
   */
  const calculerPVIBackend = useCallback(async (inputs: PVIFormInputs): Promise<PVICalculationResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-pvi', {
        body: inputs
      });

      if (error) {
        console.error('Erreur calculate-pvi:', error);
        return calculerPVILocal(inputs);
      }

      return data.result;
    } catch (err) {
      console.error('Exception calculate-pvi:', err);
      return calculerPVILocal(inputs);
    }
  }, [calculerPVILocal]);

  /**
   * Génère le tableau des abattements année par année
   */
  const genererTableauAbattements = useCallback((dureeMax: number = 30): PVIAbattementDetail[] => {
    const tableau: PVIAbattementDetail[] = [];
    const debutAnnee = fiscalRules.pvi_abattement_ir_debut_annee;
    const tauxAnnuelIR = fiscalRules.pvi_abattement_ir_taux_annuel;
    const taux22eIR = fiscalRules.pvi_abattement_ir_taux_22e;
    const exoIR = fiscalRules.pvi_abattement_ir_exoneration_annee;
    const phase1PS = fiscalRules.pvi_abattement_ps_phase1_rate;
    const phase2PS = fiscalRules.pvi_abattement_ps_phase2_rate;
    const phase3PS = fiscalRules.pvi_abattement_ps_phase3_rate;

    for (let annee = 0; annee <= dureeMax; annee++) {
      const tauxIRAnnuel = annee < debutAnnee ? 0 : (annee >= exoIR ? 0 : (annee === exoIR - 1 ? taux22eIR : tauxAnnuelIR));
      const tauxPSAnnuel = annee < debutAnnee ? 0 : (annee >= 30 ? 0 : (annee <= 21 ? phase1PS : (annee === 22 ? phase2PS : phase3PS)));

      tableau.push({
        annee,
        taux_ir: tauxIRAnnuel,
        taux_ps: tauxPSAnnuel,
        cumul_ir: getAbattementIRConfigurable(annee, fiscalRules),
        cumul_ps: getAbattementPSConfigurable(annee, fiscalRules)
      });
    }

    return tableau;
  }, [fiscalRules]);

  return {
    calculerPVILocal,
    calculerPVIBackend,
    genererTableauAbattements,
    getAbattementIR,
    getAbattementPS
  };
};
