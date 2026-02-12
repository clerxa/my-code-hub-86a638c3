import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= VALIDATION SCHEMAS =============

const TaxBracketSchema = z.object({
  seuil: z.number(),
  taux: z.number(),
});

const FiscalRulesSchema = z.object({
  tax_brackets: z.array(TaxBracketSchema).default([
    { seuil: 0, taux: 0 },
    { seuil: 11294, taux: 11 },
    { seuil: 28797, taux: 30 },
    { seuil: 82341, taux: 41 },
    { seuil: 177106, taux: 45 },
  ]),
  per_ceiling_rate: z.number().default(10),
  per_ceiling_min: z.number().default(4399),
  per_ceiling_max: z.number().default(35194),
});

const ProductConstantsSchema = z.object({
  return_rate_short: z.number().default(2),
  return_rate_medium: z.number().default(4),
  return_rate_long: z.number().default(5),
  return_rate_very_long: z.number().default(6),
});

const PERInputSchema = z.object({
  revenu_fiscal: z.number().positive({ message: "Le revenu fiscal doit être positif" }),
  parts_fiscales: z.number().min(1, { message: "Le nombre de parts doit être >= 1" }).max(10),
  age_actuel: z.number().min(18, { message: "L'âge minimum est 18 ans" }).max(100),
  age_retraite: z.number().min(50, { message: "L'âge de retraite doit être >= 50" }).max(70),
  plafond_reportable: z.number().min(0, { message: "Le plafond reportable doit être >= 0" }),
  versements_per: z.number().min(0, { message: "Les versements doivent être >= 0" }),
  // Optional: fiscal rules and product constants (can be passed from frontend settings)
  fiscal_rules: FiscalRulesSchema.optional(),
  product_constants: ProductConstantsSchema.optional(),
});

type PERInput = z.infer<typeof PERInputSchema>;
type TaxBracket = z.infer<typeof TaxBracketSchema>;

// ============= CALCULATION FUNCTIONS =============

/**
 * Calcul de l'impôt selon le barème progressif
 */
function calculerImpot(
  revenuFiscal: number,
  parts: number,
  tranches: TaxBracket[]
): number {
  const quotient = revenuFiscal / parts;
  let impotParPart = 0;

  for (let i = 0; i < tranches.length; i++) {
    const tranche = tranches[i];
    const prochaineTrancheSeui = i < tranches.length - 1
      ? tranches[i + 1].seuil
      : Infinity;

    if (quotient > tranche.seuil) {
      const baseImposable = Math.min(quotient, prochaineTrancheSeui) - tranche.seuil;
      impotParPart += baseImposable * (tranche.taux / 100);
    }
  }

  return Math.max(0, impotParPart * parts);
}

/**
 * Calcul de la TMI (Tranche Marginale d'Imposition)
 */
function calculerTMI(
  revenuFiscal: number,
  parts: number,
  tranches: TaxBracket[]
): number {
  const quotient = revenuFiscal / parts;

  for (let i = tranches.length - 1; i >= 0; i--) {
    if (quotient > tranches[i].seuil) {
      return tranches[i].taux;
    }
  }

  return 0;
}

/**
 * Calcul du plafond PER annuel
 */
function calculerPlafondPER(
  revenusProf: number,
  perCeilingRate: number,
  perCeilingMin: number,
  perCeilingMax: number
): number {
  const plafondTheorique = revenusProf * (perCeilingRate / 100);
  return Math.min(Math.max(plafondTheorique, perCeilingMin), perCeilingMax);
}

/**
 * Calcul du taux de rendement selon l'horizon
 */
function calculerTauxRendement(
  horizon: number,
  productConstants: { 
    return_rate_short: number; 
    return_rate_medium: number; 
    return_rate_long: number; 
    return_rate_very_long: number 
  }
): number {
  if (horizon > 25) return productConstants.return_rate_very_long / 100;
  if (horizon >= 10) return productConstants.return_rate_long / 100;
  if (horizon >= 5) return productConstants.return_rate_medium / 100;
  return productConstants.return_rate_short / 100;
}

/**
 * Calcul du capital futur et du gain financier
 */
function calculerGainFinancier(
  versementsPER: number,
  horizon: number,
  taux: number
): { capitalFutur: number; gainFinancier: number } {
  if (horizon <= 0) {
    return { capitalFutur: versementsPER, gainFinancier: 0 };
  }

  const capitalFutur = versementsPER * Math.pow(1 + taux, horizon);
  const gainFinancier = capitalFutur - versementsPER;

  return { capitalFutur, gainFinancier };
}

/**
 * Calcul complet de la simulation PER
 */
function calculerSimulation(data: PERInput) {
  const {
    revenu_fiscal,
    parts_fiscales,
    age_actuel,
    age_retraite,
    plafond_reportable,
    versements_per,
  } = data;

  // Use provided fiscal rules or defaults
  const fiscalRules = data.fiscal_rules || FiscalRulesSchema.parse({});
  const productConstants = data.product_constants || ProductConstantsSchema.parse({});

  const tranches = fiscalRules.tax_brackets;

  // Calculs de base
  const tmi = calculerTMI(revenu_fiscal, parts_fiscales, tranches);
  const plafond_per_annuel = calculerPlafondPER(
    revenu_fiscal,
    fiscalRules.per_ceiling_rate,
    fiscalRules.per_ceiling_min,
    fiscalRules.per_ceiling_max
  );
  const plafond_per_total = plafond_per_annuel + plafond_reportable;

  // Calculs fiscaux
  const impot_sans_per = calculerImpot(revenu_fiscal, parts_fiscales, tranches);
  const impot_avec_per = calculerImpot(
    revenu_fiscal - versements_per,
    parts_fiscales,
    tranches
  );
  const economie_impots = impot_sans_per - impot_avec_per;
  const effort_reel = versements_per - economie_impots;
  const optimisation_fiscale = versements_per > 0
    ? (economie_impots / versements_per) * 100
    : 0;
  const reduction_impots_max = plafond_per_total * (tmi / 100);

  // Calculs retraite
  const horizon_annees = Math.max(0, age_retraite - age_actuel);
  const taux_rendement = calculerTauxRendement(horizon_annees, productConstants);
  const { capitalFutur, gainFinancier } = calculerGainFinancier(
    versements_per,
    horizon_annees,
    taux_rendement
  );

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
    capital_futur: capitalFutur,
    gain_financier: gainFinancier,
  };
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    console.log('Received PER calculation request:', JSON.stringify(body));

    // Validate input data with Zod
    const validationResult = PERInputSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({
          error: 'Données invalides',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const input = validationResult.data;

    // Additional business logic validations
    if (input.age_retraite <= input.age_actuel) {
      return new Response(
        JSON.stringify({
          error: 'Données invalides',
          details: [{ field: 'age_retraite', message: "L'âge de retraite doit être supérieur à l'âge actuel" }],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform calculation
    const results = calculerSimulation(input);

    console.log('PER calculation completed successfully:', JSON.stringify(results));

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-per function:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
