import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= VALIDATION SCHEMAS =============

const ChargesDetailleesSchema = z.object({
  loyer_credit: z.number().min(0).default(0),
  energie: z.number().min(0).default(0),
  copropriete_taxes: z.number().min(0).default(0),
  assurance_habitation: z.number().min(0).default(0),
  transport_commun: z.number().min(0).default(0),
  lld_loa_auto: z.number().min(0).default(0),
  assurance_auto: z.number().min(0).default(0),
  mobile: z.number().min(0).default(0),
  internet: z.number().min(0).default(0),
  abonnements: z.number().min(0).default(0),
  frais_scolarite: z.number().min(0).default(0),
  autres: z.number().min(0).default(0),
});

const EpargnePrecautionInputSchema = z.object({
  charges_detaillees: ChargesDetailleesSchema,
  epargne_actuelle: z.number().min(0),
  niveau_securite: z.enum(['minimum', 'confortable', 'optimal']).default('confortable'),
  capacite_epargne_mensuelle: z.number().min(0).default(0),
  type_contrat: z.enum(['cdi', 'cdd', 'independant']).default('cdi'),
  simulation_defaults: z.object({
    epargne_niveau_minimum_mois: z.number().default(3),
    epargne_niveau_confortable_mois: z.number().default(6),
    epargne_niveau_optimal_mois: z.number().default(12),
    epargne_coef_cdi_tech: z.number().default(1.0),
    epargne_coef_cdi_non_tech: z.number().default(1.3),
    epargne_coef_independant: z.number().default(1.5),
    epargne_objectif_mois: z.number().default(12),
  }).optional(),
});

type EpargnePrecautionInput = z.infer<typeof EpargnePrecautionInputSchema>;
type TypeContrat = 'cdi' | 'cdd' | 'independant';
type NiveauSecurite = 'minimum' | 'confortable' | 'optimal';

// ============= CALCULATION FUNCTIONS =============

function calculateTotalCharges(charges: z.infer<typeof ChargesDetailleesSchema>): number {
  return Object.values(charges).reduce((sum, val) => sum + (val || 0), 0);
}

function getNiveauSecuriteMois(niveau: NiveauSecurite, defaults: NonNullable<EpargnePrecautionInput['simulation_defaults']>): number {
  switch (niveau) {
    case 'minimum': return defaults.epargne_niveau_minimum_mois;
    case 'confortable': return defaults.epargne_niveau_confortable_mois;
    case 'optimal': return defaults.epargne_niveau_optimal_mois;
    default: return defaults.epargne_niveau_confortable_mois;
  }
}

function getCoefficientContrat(type: TypeContrat, defaults: NonNullable<EpargnePrecautionInput['simulation_defaults']>): number {
  switch (type) {
    case 'cdi': return defaults.epargne_coef_cdi_tech;
    case 'cdd': return defaults.epargne_coef_cdi_non_tech;
    case 'independant': return defaults.epargne_coef_independant;
    default: return 1.0;
  }
}

function calculerIndiceResilience(params: {
  epargne_actuelle: number;
  epargne_recommandee: number;
  type_contrat: TypeContrat;
  charges_fixes_mensuelles: number;
}): number {
  let score = 0;

  if (params.epargne_recommandee > 0) {
    const ratioEpargne = params.epargne_actuelle / params.epargne_recommandee;
    score += Math.min(50, ratioEpargne * 50);
  }

  switch (params.type_contrat) {
    case 'cdi': score += 30; break;
    case 'cdd': score += 20; break;
    case 'independant': score += 15; break;
  }

  if (params.charges_fixes_mensuelles < 1500) score += 20;
  else if (params.charges_fixes_mensuelles < 2500) score += 15;
  else if (params.charges_fixes_mensuelles < 4000) score += 10;
  else score += 5;

  return Math.min(100, Math.round(score));
}

function genererMessage(params: {
  epargne_actuelle: number;
  charges_fixes_mensuelles: number;
}): string {
  const moisActuels = params.charges_fixes_mensuelles > 0
    ? params.epargne_actuelle / params.charges_fixes_mensuelles
    : 0;

  if (moisActuels < 2) {
    return "⚠️ Votre niveau de sécurité est insuffisant. Un expert peut vous accompagner pour mettre en place un plan d'épargne adapté.";
  }
  if (moisActuels >= 4) {
    return "✅ Vous disposez déjà d'un bon matelas de sécurité. Votre excédent peut être investi de manière rentable.";
  }
  return "💡 Vous êtes sur la bonne voie. Continuez à renforcer votre épargne de précaution.";
}

function determinerCTACondition(params: {
  epargne_actuelle: number;
  charges_fixes_mensuelles: number;
}): string {
  const moisActuels = params.charges_fixes_mensuelles > 0
    ? params.epargne_actuelle / params.charges_fixes_mensuelles
    : 0;

  if (moisActuels < 2) return "insuffisance_serieuse";
  if (moisActuels >= 4) return "matelas_ok";
  return "general";
}

function calculerSimulation(input: EpargnePrecautionInput) {
  const defaults = input.simulation_defaults || {
    epargne_niveau_minimum_mois: 3,
    epargne_niveau_confortable_mois: 6,
    epargne_niveau_optimal_mois: 12,
    epargne_coef_cdi_tech: 1.0,
    epargne_coef_cdi_non_tech: 1.3,
    epargne_coef_independant: 1.5,
    epargne_objectif_mois: 12,
  };

  const charges_fixes_mensuelles = calculateTotalCharges(input.charges_detaillees);
  const nb_mois_securite = getNiveauSecuriteMois(input.niveau_securite, defaults);
  const coefficient_contrat = getCoefficientContrat(input.type_contrat, defaults);
  const depenses_mensuelles = charges_fixes_mensuelles;
  const epargne_recommandee = depenses_mensuelles * nb_mois_securite * coefficient_contrat;
  const epargne_manquante = Math.max(0, epargne_recommandee - input.epargne_actuelle);

  let temps_pour_objectif: number | null = null;
  if (input.capacite_epargne_mensuelle > 0 && epargne_manquante > 0) {
    temps_pour_objectif = Math.ceil(epargne_manquante / input.capacite_epargne_mensuelle);
  }

  let epargne_mensuelle_optimale: number | null = null;
  if (epargne_manquante > 0) {
    epargne_mensuelle_optimale = Math.ceil(epargne_manquante / defaults.epargne_objectif_mois);
  }

  const indice_resilience = calculerIndiceResilience({
    epargne_actuelle: input.epargne_actuelle,
    epargne_recommandee,
    type_contrat: input.type_contrat,
    charges_fixes_mensuelles,
  });

  const message_personnalise = genererMessage({
    epargne_actuelle: input.epargne_actuelle,
    charges_fixes_mensuelles,
  });

  const cta_condition = determinerCTACondition({
    epargne_actuelle: input.epargne_actuelle,
    charges_fixes_mensuelles,
  });

  return {
    nb_mois_securite,
    coefficient_contrat,
    depenses_mensuelles,
    epargne_recommandee,
    epargne_manquante,
    temps_pour_objectif,
    epargne_mensuelle_optimale,
    indice_resilience,
    message_personnalise,
    cta_condition,
    charges_fixes_mensuelles,
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
    console.log('Received Épargne Précaution calculation request');

    const validationResult = EpargnePrecautionInputSchema.safeParse(body);

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

    const results = calculerSimulation(validationResult.data);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-epargne-precaution function:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
