/**
 * Hook pour les calculs du simulateur Plus-Value Immobilière (PVI)
 * Implémente la logique fiscale selon CGI Art. 150 VB, 150 VC, 1609 nonies G
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PVIFormInputs, PVICalculationResult, PVIAbattementDetail } from '@/types/pvi';

// ============================================
// Constantes fiscales
// ============================================

const TAUX_IR = 0.19; // 19%
const TAUX_PS = 0.172; // 17.2%
const FORFAIT_FRAIS_ACQUISITION = 0.075; // 7.5%
const FORFAIT_TRAVAUX = 0.15; // 15%

// Grille d'abattement IR (Art. 150 VC CGI)
// Exonération totale après 22 ans
const getAbattementIR = (annees: number): number => {
  if (annees < 6) return 0;
  if (annees >= 22) return 100;
  
  // De la 6ème à la 21ème année: 6% par an
  // 22ème année: 4%
  if (annees <= 21) {
    return (annees - 5) * 6;
  }
  // annees === 21, on ajoute le 4% de la 22ème
  return 16 * 6; // 96%
};

// Grille d'abattement PS (Art. 150 VC CGI)
// Exonération totale après 30 ans
const getAbattementPS = (annees: number): number => {
  if (annees < 6) return 0;
  if (annees >= 30) return 100;
  
  let abattement = 0;
  
  // De la 6ème à la 21ème année: 1.65% par an
  if (annees >= 6) {
    const anneesPhase1 = Math.min(annees, 21) - 5;
    abattement += anneesPhase1 * 1.65;
  }
  
  // 22ème année: 1.60%
  if (annees >= 22) {
    abattement += 1.60;
  }
  
  // De la 23ème à la 30ème année: 9% par an
  if (annees >= 23) {
    const anneesPhase3 = Math.min(annees, 30) - 22;
    abattement += anneesPhase3 * 9;
  }
  
  return Math.min(abattement, 100);
};

// Barème surtaxe hautes plus-values (Art. 1609 nonies G CGI)
const calculerSurtaxe = (pvImposable: number): { taux: number; montant: number } => {
  if (pvImposable <= 50000) return { taux: 0, montant: 0 };
  
  // Barème progressif
  const tranches = [
    { min: 50001, max: 60000, taux: 0.02 },
    { min: 60001, max: 100000, taux: 0.02 },
    { min: 100001, max: 110000, taux: 0.03 },
    { min: 110001, max: 150000, taux: 0.03 },
    { min: 150001, max: 160000, taux: 0.04 },
    { min: 160001, max: 200000, taux: 0.04 },
    { min: 200001, max: 210000, taux: 0.05 },
    { min: 210001, max: 250000, taux: 0.05 },
    { min: 250001, max: 260000, taux: 0.06 },
    { min: 260001, max: Infinity, taux: 0.06 },
  ];
  
  // Calcul avec lissage (formule officielle)
  let taux = 0;
  if (pvImposable > 50000 && pvImposable <= 60000) {
    taux = 0.02;
  } else if (pvImposable > 60000 && pvImposable <= 100000) {
    taux = 0.02;
  } else if (pvImposable > 100000 && pvImposable <= 110000) {
    taux = 0.03;
  } else if (pvImposable > 110000 && pvImposable <= 150000) {
    taux = 0.03;
  } else if (pvImposable > 150000 && pvImposable <= 160000) {
    taux = 0.04;
  } else if (pvImposable > 160000 && pvImposable <= 200000) {
    taux = 0.04;
  } else if (pvImposable > 200000 && pvImposable <= 210000) {
    taux = 0.05;
  } else if (pvImposable > 210000 && pvImposable <= 250000) {
    taux = 0.05;
  } else if (pvImposable > 250000) {
    taux = 0.06;
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
  
  /**
   * Calcul local (preview) pour réactivité UI
   */
  const calculerPVILocal = useCallback((inputs: PVIFormInputs): PVICalculationResult | null => {
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
      ? inputs.prix_acquisition * FORFAIT_FRAIS_ACQUISITION
      : (inputs.frais_acquisition_reel || 0);
    
    // 3. Travaux (forfait 15% seulement si détention > 5 ans)
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
    const abattementIRPct = getAbattementIR(duree.annees);
    const abattementPSPct = getAbattementPS(duree.annees);
    
    const abattementIRMontant = plusValueBrute * (abattementIRPct / 100);
    const abattementPSMontant = plusValueBrute * (abattementPSPct / 100);
    
    // 7. Assiettes nettes
    const assietteIRNette = plusValueBrute - abattementIRMontant;
    const assiettePSNette = plusValueBrute - abattementPSMontant;
    
    // 8. Impôts de base
    const impotRevenu = assietteIRNette * TAUX_IR;
    const prelevementsSociaux = assiettePSNette * TAUX_PS;
    
    // 9. Surtaxe sur hautes plus-values
    const surtaxe = calculerSurtaxe(assietteIRNette);
    
    // 10. Totaux
    const impotTotal = impotRevenu + prelevementsSociaux + surtaxe.montant;
    const netVendeur = inputs.prix_cession - impotTotal;
    
    // Répartition pour graphique
    const partExoneree = abattementIRMontant; // Simplifié pour le graphique
    
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
  }, []);
  
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
        // Fallback sur calcul local
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
    
    for (let annee = 0; annee <= dureeMax; annee++) {
      tableau.push({
        annee,
        taux_ir: annee < 6 ? 0 : (annee >= 22 ? 0 : (annee === 21 ? 4 : 6)),
        taux_ps: annee < 6 ? 0 : (annee >= 30 ? 0 : (annee <= 21 ? 1.65 : (annee === 22 ? 1.60 : 9))),
        cumul_ir: getAbattementIR(annee),
        cumul_ps: getAbattementPS(annee)
      });
    }
    
    return tableau;
  }, []);
  
  return {
    calculerPVILocal,
    calculerPVIBackend,
    genererTableauAbattements,
    getAbattementIR,
    getAbattementPS
  };
};
