import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= VALIDATION SCHEMAS =============

const LMNPInputSchema = z.object({
  recettes: z.number().min(0, { message: "Les recettes doivent être >= 0" }),
  interets_emprunt: z.number().min(0).default(0),
  assurance_pno: z.number().min(0).default(0),
  assurance_gli: z.number().min(0).default(0),
  gestion_locative: z.number().min(0).default(0),
  expert_comptable: z.number().min(0).default(0),
  charges_copro: z.number().min(0).default(0),
  taxe_fonciere: z.number().min(0).default(0),
  cfe: z.number().min(0).default(0),
  travaux_entretien: z.number().min(0).default(0),
  petit_materiel: z.number().min(0).default(0),
  frais_deplacement: z.number().min(0).default(0),
  autre_charge: z.number().min(0).default(0),
  valeur_bien: z.number().min(0, { message: "La valeur du bien doit être >= 0" }),
  duree_immo: z.number().min(0).default(25),
  valeur_mobilier: z.number().min(0).default(0),
  duree_mobilier: z.number().min(0).default(7),
  tmi: z.number().min(0).max(45, { message: "La TMI doit être entre 0 et 45%" }),
  // Fiscal rules from settings
  fiscal_rules: z.object({
    micro_bic_abatement: z.number().default(50),
    social_charges_rate: z.number().default(17.2),
  }).optional(),
});

type LMNPInput = z.infer<typeof LMNPInputSchema>;

// ============= CALCULATION FUNCTIONS =============

function calculerTotalCharges(inputs: LMNPInput): number {
  return (
    inputs.interets_emprunt +
    inputs.assurance_pno +
    inputs.assurance_gli +
    inputs.gestion_locative +
    inputs.expert_comptable +
    inputs.charges_copro +
    inputs.taxe_fonciere +
    inputs.cfe +
    inputs.travaux_entretien +
    inputs.petit_materiel +
    inputs.frais_deplacement +
    inputs.autre_charge
  );
}

function calculerSimulation(inputs: LMNPInput) {
  const fiscalRules = inputs.fiscal_rules || { micro_bic_abatement: 50, social_charges_rate: 17.2 };
  
  const total_charges = calculerTotalCharges(inputs);

  // Résultat avant amortissement
  const resultat_avant_amort = inputs.recettes - total_charges;

  // Amortissements
  const amort_immo = inputs.duree_immo > 0 ? inputs.valeur_bien / inputs.duree_immo : 0;
  const amort_mobilier = inputs.duree_mobilier > 0 ? inputs.valeur_mobilier / inputs.duree_mobilier : 0;
  const amort_total = amort_immo + amort_mobilier;

  // Résultat fiscal LMNP réel
  let resultat_fiscal_reel: number;
  let amort_non_deduits = 0;

  if (resultat_avant_amort <= 0) {
    resultat_fiscal_reel = resultat_avant_amort;
  } else {
    resultat_fiscal_reel = Math.max(resultat_avant_amort - amort_total, 0);
    amort_non_deduits = Math.max(amort_total - resultat_avant_amort, 0);
  }

  // Micro-BIC avec abattement configurable
  const abattementMicroBIC = fiscalRules.micro_bic_abatement / 100;
  const resultat_fiscal_micro = inputs.recettes * (1 - abattementMicroBIC);

  // Prélèvements sociaux configurables
  const tauxPS = fiscalRules.social_charges_rate / 100;

  // Fiscalité régime réel
  const tmi_decimal = inputs.tmi / 100;
  const ir_reel = Math.max(resultat_fiscal_reel, 0) * tmi_decimal;
  const ps_reel = Math.max(resultat_fiscal_reel, 0) * tauxPS;
  const fiscalite_totale_reel = ir_reel + ps_reel;

  // Fiscalité micro-BIC
  const ir_micro = resultat_fiscal_micro * tmi_decimal;
  const ps_micro = resultat_fiscal_micro * tauxPS;
  const fiscalite_totale_micro = ir_micro + ps_micro;

  // Meilleur régime
  const meilleur_regime = fiscalite_totale_reel < fiscalite_totale_micro ? 'reel' : 'micro';

  return {
    total_charges,
    resultat_avant_amort,
    amort_immo,
    amort_mobilier,
    amort_total,
    resultat_fiscal_reel,
    resultat_fiscal_micro,
    ir_reel,
    ps_reel,
    ir_micro,
    ps_micro,
    fiscalite_totale_reel,
    fiscalite_totale_micro,
    meilleur_regime,
    amort_non_deduits,
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
    console.log('Received LMNP calculation request:', JSON.stringify(body));

    const validationResult = LMNPInputSchema.safeParse(body);

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

    const results = calculerSimulation(validationResult.data);
    console.log('LMNP calculation completed successfully');

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-lmnp function:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
