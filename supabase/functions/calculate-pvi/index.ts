/**
 * Edge Function: calculate-pvi
 * Calcul sécurisé de la Plus-Value Immobilière (PVI)
 * Implémente CGI Art. 150 VB, 150 VC, 1609 nonies G
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// Schéma de validation Zod
// ============================================

const PVIInputSchema = z.object({
  nature_bien: z.enum(['residence_principale', 'residence_secondaire', 'investissement_locatif', 'terrain_batir']),
  date_acquisition: z.string().optional().refine(
    (val) => !val || val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: 'Format de date invalide (YYYY-MM-DD)' }
  ),
  date_cession: z.string().optional().refine(
    (val) => !val || val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: 'Format de date invalide (YYYY-MM-DD)' }
  ),
  prix_cession: z.number().positive(),
  prix_acquisition: z.number().positive(),
  mode_frais_acquisition: z.enum(['reel', 'forfait']),
  frais_acquisition_reel: z.number().optional(),
  mode_travaux: z.enum(['reel', 'forfait_15']),
  travaux_reel: z.number().optional(),
});

// ============================================
// Constantes fiscales
// ============================================

const TAUX_IR = 0.19;
const TAUX_PS = 0.172;
const FORFAIT_FRAIS_ACQUISITION = 0.075;
const FORFAIT_TRAVAUX = 0.15;

// ============================================
// Fonctions de calcul
// ============================================

function getAbattementIR(annees: number): number {
  if (annees < 6) return 0;
  if (annees >= 22) return 100;
  
  if (annees <= 21) {
    return (annees - 5) * 6;
  }
  return 96;
}

function getAbattementPS(annees: number): number {
  if (annees < 6) return 0;
  if (annees >= 30) return 100;
  
  let abattement = 0;
  
  if (annees >= 6) {
    const anneesPhase1 = Math.min(annees, 21) - 5;
    abattement += anneesPhase1 * 1.65;
  }
  
  if (annees >= 22) {
    abattement += 1.60;
  }
  
  if (annees >= 23) {
    const anneesPhase3 = Math.min(annees, 30) - 22;
    abattement += anneesPhase3 * 9;
  }
  
  return Math.min(abattement, 100);
}

function calculerSurtaxe(pvImposable: number): { taux: number; montant: number } {
  if (pvImposable <= 50000) return { taux: 0, montant: 0 };
  
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
}

function calculerDureeDetention(dateAcquisition: string, dateCession: string) {
  const acquisition = new Date(dateAcquisition);
  const cession = new Date(dateCession);
  
  const diffMs = cession.getTime() - acquisition.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  
  return { annees: years, detail: { years, months, days } };
}

// ============================================
// Handler principal
// ============================================

serve(async (req) => {
  console.log('[calculate-pvi] Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    console.log('[calculate-pvi] Input:', JSON.stringify(body, null, 2));
    
    // Validation
    const parseResult = PVIInputSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('[calculate-pvi] Validation error:', parseResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Données invalides', details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const inputs = parseResult.data;
    
    // CAS SPÉCIAL: Résidence principale = Exonération totale (Art. 150 U II du CGI)
    if (inputs.nature_bien === 'residence_principale') {
      const plusValueBrute = inputs.prix_cession - inputs.prix_acquisition;
      console.log('[calculate-pvi] Résidence principale - Exonération totale');
      
      return new Response(
        JSON.stringify({
          success: true,
          result: {
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
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Pour les autres types de biens, les dates sont requises
    if (!inputs.date_acquisition || !inputs.date_cession) {
      return new Response(
        JSON.stringify({ success: false, error: 'Les dates sont requises pour ce type de bien' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 1. Durée de détention
    const duree = calculerDureeDetention(inputs.date_acquisition, inputs.date_cession);
    console.log('[calculate-pvi] Durée détention:', duree.annees, 'ans');
    
    // 2. Frais d'acquisition
    const fraisAcquisition = inputs.mode_frais_acquisition === 'forfait'
      ? inputs.prix_acquisition * FORFAIT_FRAIS_ACQUISITION
      : (inputs.frais_acquisition_reel || 0);
    
    // 3. Travaux
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
    console.log('[calculate-pvi] Plus-value brute:', plusValueBrute);
    
    // Si pas de plus-value, pas d'impôt
    if (plusValueBrute <= 0) {
      return new Response(
        JSON.stringify({
          success: true,
          result: {
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
              part_exoneree: Math.abs(plusValueBrute),
              impot_revenu: 0,
              prelevements_sociaux: 0,
              surtaxe: 0
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 6. Abattements
    const abattementIRPct = getAbattementIR(duree.annees);
    const abattementPSPct = getAbattementPS(duree.annees);
    
    const abattementIRMontant = plusValueBrute * (abattementIRPct / 100);
    const abattementPSMontant = plusValueBrute * (abattementPSPct / 100);
    
    // 7. Assiettes nettes
    const assietteIRNette = plusValueBrute - abattementIRMontant;
    const assiettePSNette = plusValueBrute - abattementPSMontant;
    
    // 8. Impôts
    const impotRevenu = assietteIRNette * TAUX_IR;
    const prelevementsSociaux = assiettePSNette * TAUX_PS;
    
    // 9. Surtaxe
    const surtaxe = calculerSurtaxe(assietteIRNette);
    
    // 10. Totaux
    const impotTotal = impotRevenu + prelevementsSociaux + surtaxe.montant;
    const netVendeur = inputs.prix_cession - impotTotal;
    
    console.log('[calculate-pvi] Impôt total:', impotTotal, '€');
    
    const result = {
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
        part_exoneree: Math.round(abattementIRMontant * 100) / 100,
        impot_revenu: Math.round(impotRevenu * 100) / 100,
        prelevements_sociaux: Math.round(prelevementsSociaux * 100) / 100,
        surtaxe: Math.round(surtaxe.montant * 100) / 100
      }
    };
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[calculate-pvi] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
