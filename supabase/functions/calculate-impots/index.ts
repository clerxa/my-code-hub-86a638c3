import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Barème 2025 par défaut
const BAREME_2025 = [
  { min: 0, max: 11294, taux: 0 },
  { min: 11294, max: 28797, taux: 0.11 },
  { min: 28797, max: 82341, taux: 0.30 },
  { min: 82341, max: 177106, taux: 0.41 },
  { min: 177106, max: Infinity, taux: 0.45 },
];

// Plafonnement quotient familial 2025 : 1759€ par demi-part supplémentaire
const PLAFOND_DEMI_PART = 1759;

// Schéma de validation Zod
const CalculInputsSchema = z.object({
  revenu_imposable: z.number().min(0, "Le revenu imposable doit être positif"),
  statut_marital: z.string(),
  nombre_enfants: z.number().int().min(0, "Le nombre d'enfants doit être positif"),
  reductions_impot: z.number().optional().default(0),
  credits_impot: z.number().optional().default(0),
});

function calculerParts(statut: string, enfants: number): number {
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
      // Les veufs avec enfants bénéficient d'une demi-part supplémentaire
      parts = enfants > 0 ? 1.5 : 1;
      break;
    default:
      parts = 1;
  }

  // Parts pour les enfants
  if (enfants === 1) {
    parts += 0.5;
  } else if (enfants === 2) {
    parts += 1;
  } else if (enfants >= 3) {
    // À partir du 3e enfant : 1 part par enfant
    parts += 1 + (enfants - 2) * 1;
  }

  return parts;
}

function calculerImpot(revenu: number, parts: number): { impot: number; tauxMarginal: number; detailTranches: Array<{ tranche: string; montant: number; impot: number }> } {
  const quotientFamilial = revenu / parts;
  let impotParPart = 0;
  let tauxMarginal = 0;
  let revenuRestant = quotientFamilial;
  const detailTranches: Array<{ tranche: string; montant: number; impot: number }> = [];

  for (const tranche of BAREME_2025) {
    if (revenuRestant <= 0) break;

    const montantTranche = tranche.max === Infinity 
      ? revenuRestant 
      : Math.min(tranche.max - tranche.min, revenuRestant);
    
    if (montantTranche > 0) {
      const impotTranche = montantTranche * tranche.taux;
      impotParPart += impotTranche;
      
      detailTranches.push({
        tranche: `${Math.round(tranche.taux * 100)}%`,
        montant: Math.round(montantTranche * parts),
        impot: Math.round(impotTranche * parts),
      });

      if (revenuRestant > 0) {
        tauxMarginal = tranche.taux * 100;
      }
    }

    revenuRestant -= montantTranche;
  }

  return { impot: impotParPart * parts, tauxMarginal, detailTranches };
}

function calculerEconomieQF(revenu: number, partsActuelles: number): number {
  if (partsActuelles <= 1) return 0;
  
  const { impot: impotCelibataire } = calculerImpot(revenu, 1);
  const { impot: impotActuel } = calculerImpot(revenu, partsActuelles);
  
  // Appliquer le plafonnement du QF
  const demiPartsSupp = (partsActuelles - 1) * 2; // Nombre de demi-parts supplémentaires
  const plafondTotal = demiPartsSupp * PLAFOND_DEMI_PART;
  const economieTheorique = impotCelibataire - impotActuel;
  
  return Math.min(economieTheorique, plafondTotal);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInputs = await req.json();
    
    // Validation avec Zod
    const parseResult = CalculInputsSchema.safeParse(rawInputs);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const inputs = parseResult.data;

    console.log('Received inputs for tax calculation:', {
      revenu: inputs.revenu_imposable,
      statut: inputs.statut_marital,
      enfants: inputs.nombre_enfants,
    });

    const { revenu_imposable, statut_marital, nombre_enfants, reductions_impot, credits_impot } = inputs;

    // Calculs
    const parts = calculerParts(statut_marital, nombre_enfants);
    const quotientFamilial = revenu_imposable / parts;
    const { impot, tauxMarginal, detailTranches } = calculerImpot(revenu_imposable, parts);
    const economieQF = calculerEconomieQF(revenu_imposable, parts);
    
    const reductions = reductions_impot || 0;
    const credits = credits_impot || 0;
    
    // Les réductions diminuent l'impôt brut, les crédits sont déduits après
    const impotApresReductions = Math.max(0, impot - reductions);
    const impotFinal = Math.max(0, impotApresReductions - credits);
    const tauxMoyen = revenu_imposable > 0 ? (impotFinal / revenu_imposable) * 100 : 0;

    const result = {
      parts,
      quotient_familial: quotientFamilial,
      impot_brut: Math.max(0, impot),
      reductions_impot: reductions,
      credits_impot: credits,
      impot_net: impotFinal,
      taux_moyen: tauxMoyen,
      taux_marginal: tauxMarginal,
      economie_quotient_familial: economieQF,
      detail_tranches: detailTranches,
    };

    console.log('Tax calculation completed:', {
      parts: result.parts,
      impot_brut: result.impot_brut,
      impot_net: result.impot_net,
      tmi: result.taux_marginal,
      economie_qf: result.economie_quotient_familial,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-impots:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur de calcul';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
