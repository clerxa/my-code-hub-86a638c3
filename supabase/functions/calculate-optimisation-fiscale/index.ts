import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface TaxBracket {
  seuil: number;
  taux: number;
}

interface FiscalRules {
  tax_brackets: TaxBracket[];
  per_ceiling_rate: number;
  dons_75_ceiling: number;
  dons_75_rate: number;
  dons_66_rate: number;
  aide_domicile_rate: number;
  aide_domicile_ceiling: number;
  garde_enfant_rate: number;
  garde_enfant_ceiling: number;
  pme_reduction_rate: number;
  esus_reduction_rate: number;
  esus_ceiling: number;
  niche_ceiling_base: number;
  niche_ceiling_outremer: number;
  niche_ceiling_esus: number;
  girardin_ceiling_part: number;
}

// ============= VALIDATION SCHEMA =============

const TaxBracketSchema = z.object({
  seuil: z.number().min(0),
  taux: z.number().min(0).max(100),
});

const FiscalRulesSchema = z.object({
  tax_brackets: z.array(TaxBracketSchema).min(1),
  per_ceiling_rate: z.number().min(0).max(100),
  dons_75_ceiling: z.number().min(0),
  dons_75_rate: z.number().min(0).max(100),
  dons_66_rate: z.number().min(0).max(100),
  aide_domicile_rate: z.number().min(0).max(100),
  aide_domicile_ceiling: z.number().min(0),
  garde_enfant_rate: z.number().min(0).max(100),
  garde_enfant_ceiling: z.number().min(0),
  pme_reduction_rate: z.number().min(0).max(100),
  esus_reduction_rate: z.number().min(0).max(100),
  esus_ceiling: z.number().min(0),
  niche_ceiling_base: z.number().min(0),
  niche_ceiling_outremer: z.number().min(0),
  niche_ceiling_esus: z.number().min(0),
  girardin_ceiling_part: z.number().min(0),
});

const SimulationInputSchema = z.object({
  revenu_imposable: z.number().min(0, { message: "Le revenu imposable doit être >= 0" }).max(100_000_000),
  revenus_professionnels: z.number().min(0).max(100_000_000).default(0),
  situation_familiale: z.enum(['celibataire', 'marie', 'pacse', 'divorce', 'veuf']),
  nb_enfants: z.number().min(0).max(20).default(0),
  impot_avant: z.number().min(0).max(100_000_000).default(0),
  montant_per: z.number().min(0).max(10_000_000).default(0),
  plafond_per_report_n1: z.number().min(0).max(10_000_000).default(0),
  plafond_per_report_n2: z.number().min(0).max(10_000_000).default(0),
  plafond_per_report_n3: z.number().min(0).max(10_000_000).default(0),
  dons_75_montant: z.number().min(0).max(10_000_000).default(0),
  dons_66_montant: z.number().min(0).max(10_000_000).default(0),
  montant_aide_domicile: z.number().min(0).max(1_000_000).default(0),
  montant_garde_enfant: z.number().min(0).max(1_000_000).default(0),
  prix_pinel: z.number().min(0).max(100_000_000).default(0),
  taux_pinel: z.number().min(0).max(100).default(0),
  duree_pinel: z.number().min(0).max(30).default(0),
  prix_pinel_om: z.number().min(0).max(100_000_000).default(0),
  taux_pinel_om: z.number().min(0).max(100).default(0),
  duree_pinel_om: z.number().min(0).max(30).default(0),
  montant_girardin: z.number().min(0).max(10_000_000).default(0),
  taux_girardin: z.number().min(0).max(200).default(0),
  montant_pme: z.number().min(0).max(10_000_000).default(0),
  montant_esus: z.number().min(0).max(10_000_000).default(0),
  dispositifs_selectionnes: z.array(z.string()).default([]),
  fiscal_rules: FiscalRulesSchema,
});

type SimulationInputs = z.infer<typeof SimulationInputSchema>;

// Calcul du nombre de parts fiscales
function calculerPartsFiscales(situationFamiliale: string, nbEnfants: number): number {
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
}

// Calcul du TMI
function calculerTMI(revenuImposable: number, situationFamiliale: string, nbEnfants: number, tranches: TaxBracket[]): number {
  const parts = calculerPartsFiscales(situationFamiliale, nbEnfants);
  const quotientFamilial = revenuImposable / parts;
  
  for (let i = tranches.length - 1; i >= 0; i--) {
    if (quotientFamilial > tranches[i].seuil) {
      return tranches[i].taux;
    }
  }
  return 0;
}

// Calcul de l'impôt sur le revenu
function calculerImpot(revenuImposable: number, situationFamiliale: string, nbEnfants: number, tranches: TaxBracket[]): number {
  const parts = calculerPartsFiscales(situationFamiliale, nbEnfants);
  const quotientFamilial = revenuImposable / parts;
  
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
}

// Calcul du plafond PER total
function calculerPlafondPERTotal(inputs: SimulationInputs): number {
  const plafondBase = (inputs.revenus_professionnels || 0) * (inputs.fiscal_rules.per_ceiling_rate / 100);
  const reports = (inputs.plafond_per_report_n1 || 0) + 
                 (inputs.plafond_per_report_n2 || 0) + 
                 (inputs.plafond_per_report_n3 || 0);
  return plafondBase + reports;
}

// Calcul de la réduction PER
function calculerReductionPER(inputs: SimulationInputs, tmi: number): { reduction: number; utilise: number } {
  const plafondTotal = calculerPlafondPERTotal(inputs);
  const utilise = Math.min(inputs.montant_per || 0, plafondTotal);
  const reduction = utilise * (tmi / 100);
  return { reduction, utilise };
}

// Calcul des réductions dons
function calculerReductionsDons(inputs: SimulationInputs): { 
  reduction75: number; 
  reduction66: number;
  dons66Total: number;
} {
  const rules = inputs.fiscal_rules;
  const dons75 = inputs.dons_75_montant || 0;
  const reduction75 = Math.min(dons75, rules.dons_75_ceiling) * (rules.dons_75_rate / 100);
  const excedent75 = Math.max(dons75 - rules.dons_75_ceiling, 0);
  const dons66Total = (inputs.dons_66_montant || 0) + excedent75;
  const reduction66 = dons66Total * (rules.dons_66_rate / 100);
  
  return { reduction75, reduction66, dons66Total };
}

// Calcul aide domicile
function calculerReductionAideDomicile(montant: number, rules: FiscalRules): number {
  return Math.min(montant * (rules.aide_domicile_rate / 100), rules.aide_domicile_ceiling);
}

// Calcul garde enfants
function calculerReductionGardeEnfant(montant: number, rules: FiscalRules): number {
  return Math.min(montant * (rules.garde_enfant_rate / 100), rules.garde_enfant_ceiling);
}

// Calcul Pinel
function calculerReductionPinel(prix: number, taux: number, duree: number): number {
  if (duree === 0) return 0;
  return (prix * taux) / 100 / duree;
}

// Calcul Girardin
function calculerReductionGirardin(montant: number, taux: number = 110): number {
  return montant * (taux / 100);
}

// Calcul PME/FCPI/FIP
function calculerReductionPME(montant: number, rules: FiscalRules): number {
  return montant * (rules.pme_reduction_rate / 100);
}

// Calcul ESUS
function calculerReductionESUS(montant: number, rules: FiscalRules): number {
  return Math.min(montant * (rules.esus_reduction_rate / 100), rules.esus_ceiling);
}

// Calcul de toutes les réductions
function calculerToutesReductions(inputs: SimulationInputs, tmi: number) {
  const rules = inputs.fiscal_rules;
  const perCalc = calculerReductionPER(inputs, tmi);
  const donsCalc = calculerReductionsDons(inputs);
  
  const reductionAideDomicile = calculerReductionAideDomicile(inputs.montant_aide_domicile || 0, rules);
  const reductionGardeEnfant = calculerReductionGardeEnfant(inputs.montant_garde_enfant || 0, rules);
  const reductionPinel = calculerReductionPinel(
    inputs.prix_pinel || 0, 
    inputs.taux_pinel || 0, 
    inputs.duree_pinel || 0
  );
  const reductionPinelOM = calculerReductionPinel(
    inputs.prix_pinel_om || 0, 
    inputs.taux_pinel_om || 0, 
    inputs.duree_pinel_om || 0
  );
  const reductionGirardin = calculerReductionGirardin(inputs.montant_girardin || 0, inputs.taux_girardin || 110);
  const reductionPME = calculerReductionPME(inputs.montant_pme || 0, rules);
  const reductionESUS = calculerReductionESUS(inputs.montant_esus || 0, rules);

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
}

// Calcul du plafond unique des niches fiscales
function calculerPlafondUnique(inputs: SimulationInputs, reductions: ReturnType<typeof calculerToutesReductions>) {
  const rules = inputs.fiscal_rules;
  const dispositifsSelectionnes = inputs.dispositifs_selectionnes || [];
  
  const hasESUS = dispositifsSelectionnes.includes('esus') && reductions.reduction_esus > 0;
  const hasOutreMer = (dispositifsSelectionnes.includes('girardin') && reductions.reduction_girardin > 0) ||
                      (dispositifsSelectionnes.includes('pinel_om') && reductions.reduction_pinel_om_annuelle > 0);
  
  let plafondApplicable = rules.niche_ceiling_base;
  let raison = "Plafond de base des niches fiscales";
  
  if (hasOutreMer) {
    plafondApplicable = rules.niche_ceiling_outremer;
    raison = "Plafond majoré pour investissements Outre-mer (Girardin, Pinel OM)";
  } else if (hasESUS) {
    plafondApplicable = rules.niche_ceiling_esus;
    raison = "Plafond majoré pour investissements ESUS";
  }
  
  // Calcul de la répartition par dispositif
  const repartition: Array<{
    dispositifId: string;
    nom: string;
    montantPlafonnable: number;
    pourcentagePlafond: number;
  }> = [];
  
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
    const girardinPlafonnable = reductions.reduction_girardin * (rules.girardin_ceiling_part / 100);
    repartition.push({
      dispositifId: 'girardin',
      nom: `Girardin (${rules.girardin_ceiling_part}%)`,
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
    plafondBase: rules.niche_ceiling_base,
    plafondApplicable,
    totalUtilise,
    pourcentage: plafondApplicable > 0 ? (totalUtilise / plafondApplicable) * 100 : 0,
    isDepasse: totalUtilise > plafondApplicable,
    repartition,
    raison,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const validationResult = SimulationInputSchema.safeParse(body);

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

    const inputs = validationResult.data;

    const tranches = inputs.fiscal_rules.tax_brackets;
    
    // Calculs
    const parts = calculerPartsFiscales(inputs.situation_familiale, inputs.nb_enfants);
    const tmi = calculerTMI(inputs.revenu_imposable, inputs.situation_familiale, inputs.nb_enfants, tranches);
    const impotAvant = calculerImpot(inputs.revenu_imposable, inputs.situation_familiale, inputs.nb_enfants, tranches);
    const plafondPERTotal = calculerPlafondPERTotal(inputs);
    
    const reductions = calculerToutesReductions(inputs, tmi);
    const plafondUnique = calculerPlafondUnique(inputs, reductions);
    
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

    const impotApres = Math.max(impotAvant - economieTotal, 0);

    const result = {
      parts_fiscales: parts,
      tmi,
      impot_avant: impotAvant,
      impot_apres: impotApres,
      economie_totale: economieTotal,
      plafond_per_total: plafondPERTotal,
      reductions,
      plafond_unique: plafondUnique,
      plafonds: [{
        nom: 'Plafond des niches fiscales',
        utilise: plafondUnique.totalUtilise,
        maximum: plafondUnique.plafondApplicable,
        pourcentage: plafondUnique.pourcentage,
        couleur: plafondUnique.pourcentage >= 100 ? 'destructive' : plafondUnique.pourcentage >= 70 ? 'warning' : 'success',
      }],
    };

    console.log('Calculation completed:', {
      tmi: result.tmi,
      impot_avant: result.impot_avant,
      impot_apres: result.impot_apres,
      economie_totale: result.economie_totale,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-optimisation-fiscale:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
