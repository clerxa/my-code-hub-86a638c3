import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= VALIDATION SCHEMAS =============

const CapaciteEmpruntInputSchema = z.object({
  revenuMensuelNet: z.number().min(0, { message: "Le revenu doit être >= 0" }),
  chargesFixes: z.number().min(0).default(0),
  loyerActuel: z.number().min(0).default(0),
  nombreEnfants: z.number().min(0).max(10).default(0),
  dureeAnnees: z.number().min(5).max(30, { message: "La durée doit être entre 5 et 30 ans" }),
  tauxInteret: z.number().min(0).max(20, { message: "Le taux doit être entre 0 et 20%" }),
  apportPersonnel: z.number().min(0).default(0),
  fraisNotaire: z.number().min(0).max(15).default(8),
  // Simulation defaults from settings
  simulation_defaults: z.object({
    max_debt_ratio: z.number().default(35),
    min_living_remainder_adult: z.number().default(700),
    min_living_remainder_child: z.number().default(300),
  }).optional(),
});

type CapaciteEmpruntInput = z.infer<typeof CapaciteEmpruntInputSchema>;

// ============= CALCULATION FUNCTION =============

function calculerSimulation(input: CapaciteEmpruntInput) {
  const {
    revenuMensuelNet,
    chargesFixes,
    loyerActuel,
    nombreEnfants,
    dureeAnnees,
    tauxInteret,
    apportPersonnel,
    fraisNotaire,
  } = input;

  // Paramètres configurables
  const defaults = input.simulation_defaults || {
    max_debt_ratio: 35,
    min_living_remainder_adult: 700,
    min_living_remainder_child: 300,
  };

  const tauxEndettementMax = defaults.max_debt_ratio / 100;
  const resteAVivreParAdulte = defaults.min_living_remainder_adult;
  const resteAVivreParEnfant = defaults.min_living_remainder_child;

  // 1. Taux d'endettement actuel (charges fixes seules, HORS loyer)
  const tauxEndettementActuel = revenuMensuelNet > 0
    ? (chargesFixes / revenuMensuelNet) * 100
    : 0;

  // 1b. Taux d'utilisation de la capacité
  const tauxUtilisationCapacite = revenuMensuelNet > 0
    ? ((chargesFixes + loyerActuel) / revenuMensuelNet) * 100
    : 0;

  // 2. Mensualité maximale
  const mensualiteMaximale = Math.max(0, (revenuMensuelNet * tauxEndettementMax) - chargesFixes);

  // 3. Calcul du reste à vivre futur
  const resteAVivreFutur = revenuMensuelNet - mensualiteMaximale - chargesFixes;

  // Reste à vivre minimum requis
  const resteAVivreMinimum = resteAVivreParAdulte * 2 + (nombreEnfants * resteAVivreParEnfant);

  // Ajuster la mensualité si le reste à vivre est insuffisant
  let mensualiteAjustee = mensualiteMaximale;
  if (resteAVivreFutur < resteAVivreMinimum && revenuMensuelNet > 0) {
    mensualiteAjustee = Math.max(0, revenuMensuelNet - chargesFixes - resteAVivreMinimum);
  }

  // 4. Calcul de la capacité d'emprunt
  const tauxMensuel = tauxInteret / 100 / 12;
  const nombreMensualites = dureeAnnees * 12;

  let capaciteEmprunt = 0;
  if (tauxMensuel > 0 && nombreMensualites > 0 && mensualiteAjustee > 0) {
    capaciteEmprunt = mensualiteAjustee * ((1 - Math.pow(1 + tauxMensuel, -nombreMensualites)) / tauxMensuel);
  } else if (nombreMensualites > 0 && mensualiteAjustee > 0) {
    capaciteEmprunt = mensualiteAjustee * nombreMensualites;
  }

  // 5. Estimation des frais de notaire
  const prixBienEstime = capaciteEmprunt + apportPersonnel;
  const fraisNotaireEstimes = prixBienEstime * (fraisNotaire / 100);

  // 6. Montant maximal du projet
  const montantProjetMax = capaciteEmprunt + apportPersonnel - fraisNotaireEstimes;

  // 7. Taux d'endettement futur
  const tauxEndettementFutur = revenuMensuelNet > 0
    ? ((mensualiteAjustee + chargesFixes) / revenuMensuelNet) * 100
    : 0;

  // 8. Reste à vivre actuel
  const resteAVivre = revenuMensuelNet - chargesFixes - loyerActuel;

  return {
    mensualiteMaximale: mensualiteAjustee,
    capaciteEmprunt: Math.max(0, capaciteEmprunt),
    montantProjetMax: Math.max(0, montantProjetMax),
    tauxEndettementActuel,
    tauxUtilisationCapacite,
    tauxEndettementFutur,
    resteAVivre,
    resteAVivreFutur: revenuMensuelNet - mensualiteAjustee - chargesFixes,
    nombreMensualites,
    fraisNotaireEstimes,
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
    console.log('Received Capacité Emprunt calculation request:', JSON.stringify(body));

    const validationResult = CapaciteEmpruntInputSchema.safeParse(body);

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
    console.log('Capacité Emprunt calculation completed successfully');

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-capacite-emprunt function:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
