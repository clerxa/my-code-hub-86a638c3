import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= VALIDATION SCHEMAS =============

const ESPPPlanSchema = z.object({
  fmv_debut: z.number().min(0),
  fmv_fin: z.number().min(0),
  discount_pct: z.number().min(0).max(100).default(15),
  lookback: z.boolean().default(true),
  montant_investi: z.number().min(0),
  taux_change_payroll: z.number().min(0).default(1),
});

const UserFiscalProfileSchema = z.object({
  tmi: z.number().min(0).max(45).default(30),
  mode_imposition_plus_value: z.enum(['PFU', 'bareme']).default('PFU'),
});

const ESPPInputSchema = z.object({
  plan: ESPPPlanSchema,
  vente: z.object({
    quantiteVendue: z.number().min(0),
    prixVenteDevise: z.number().min(0),
    tauxChange: z.number().min(0).default(1),
    fraisVente: z.number().min(0).default(0),
  }).optional(),
  profile: UserFiscalProfileSchema.optional(),
  fiscal_rules: z.object({
    social_charges_rate: z.number().default(17.2),
    pfu_rate: z.number().default(12.8),
  }).optional(),
});

type ESPPInput = z.infer<typeof ESPPInputSchema>;

// ============= CALCULATION FUNCTIONS =============

function calculerPrixAchat(plan: z.infer<typeof ESPPPlanSchema>): number {
  if (!plan.fmv_debut || !plan.fmv_fin || !plan.discount_pct) return 0;

  let prixBase: number;
  if (plan.lookback) {
    prixBase = Math.min(plan.fmv_debut, plan.fmv_fin);
  } else {
    prixBase = plan.fmv_fin;
  }

  const prixAchat = prixBase * (1 - plan.discount_pct / 100);
  return Math.round(prixAchat * 10000) / 10000;
}

function calculerQuantiteActions(montantInvesti: number, prixAchat: number): number {
  if (prixAchat === 0) return 0;
  return Math.round((montantInvesti / prixAchat) * 10000) / 10000;
}

function calculerGainAcquisition(plan: z.infer<typeof ESPPPlanSchema>) {
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
    pruFiscalEUR,
  };
}

function calculerPlusValue(
  vente: NonNullable<ESPPInput['vente']>,
  pruFiscalEUR: number,
  fmvRetenuPlan: number,
  profile: z.infer<typeof UserFiscalProfileSchema>,
  fiscalRules: NonNullable<ESPPInput['fiscal_rules']>
) {
  const prixVenteEUR = vente.prixVenteDevise * vente.tauxChange;
  const plusValueBrute = (vente.prixVenteDevise - fmvRetenuPlan) * vente.quantiteVendue;
  const plusValueEUR = (prixVenteEUR * vente.quantiteVendue) - (pruFiscalEUR * vente.quantiteVendue) - vente.fraisVente;

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
    netApresImpot: Math.round(netApresImpot * 100) / 100,
  };
}

// ============= MAIN HANDLER =============

serve(async (req) => {
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
    console.log('Received ESPP calculation request');

    const validationResult = ESPPInputSchema.safeParse(body);

    if (!validationResult.success) {
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
    const gainAcquisition = calculerGainAcquisition(input.plan);

    let plusValue = null;
    if (input.vente) {
      const profile = input.profile || { tmi: 30, mode_imposition_plus_value: 'PFU' as const };
      const fiscalRules = input.fiscal_rules || { social_charges_rate: 17.2, pfu_rate: 12.8 };
      plusValue = calculerPlusValue(
        input.vente,
        gainAcquisition.pruFiscalEUR,
        input.plan.fmv_fin,
        profile,
        fiscalRules
      );
    }

    return new Response(
      JSON.stringify({ success: true, results: { gainAcquisition, plusValue } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-espp function:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
