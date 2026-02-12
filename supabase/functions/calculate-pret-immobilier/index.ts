import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= VALIDATION SCHEMAS =============

const PretImmobilierInputSchema = z.object({
  montantProjet: z.number().min(0, { message: "Le montant doit être >= 0" }),
  apportPersonnel: z.number().min(0).default(0),
  dureeAnnees: z.number().min(5).max(30, { message: "La durée doit être entre 5 et 30 ans" }),
  tauxInteret: z.number().min(0).max(20, { message: "Le taux doit être entre 0 et 20%" }),
  tauxAssurance: z.number().min(0).max(5).default(0.34),
  revenuMensuel: z.number().min(0).optional(),
});

type PretImmobilierInput = z.infer<typeof PretImmobilierInputSchema>;

// ============= CALCULATION FUNCTION =============

function calculerSimulation(input: PretImmobilierInput) {
  const montantEmprunte = Math.max(0, input.montantProjet - input.apportPersonnel);
  const tauxMensuel = input.tauxInteret / 100 / 12;
  const nombreMensualites = input.dureeAnnees * 12;

  let mensualitePret = 0;
  if (tauxMensuel > 0 && nombreMensualites > 0 && montantEmprunte > 0) {
    mensualitePret = montantEmprunte * (tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -nombreMensualites)));
  } else if (nombreMensualites > 0 && montantEmprunte > 0) {
    mensualitePret = montantEmprunte / nombreMensualites;
  }

  const mensualiteAssurance = (montantEmprunte * (input.tauxAssurance / 100)) / 12;
  const mensualiteTotale = mensualitePret + mensualiteAssurance;
  const coutTotalInterets = Math.max(0, (mensualitePret * nombreMensualites) - montantEmprunte);
  const coutTotalAssurance = mensualiteAssurance * nombreMensualites;
  const coutGlobalCredit = coutTotalInterets + coutTotalAssurance;

  let tauxEndettement: number | null = null;
  if (input.revenuMensuel && input.revenuMensuel > 0) {
    tauxEndettement = (mensualiteTotale / input.revenuMensuel) * 100;
  }

  return {
    montantEmprunte,
    mensualitePret,
    mensualiteAssurance,
    mensualiteTotale,
    coutTotalInterets,
    coutTotalAssurance,
    coutGlobalCredit,
    tauxEndettement,
    nombreMensualites,
  };
}

function genererAmortissement(input: PretImmobilierInput) {
  const montantEmprunte = Math.max(0, input.montantProjet - input.apportPersonnel);
  const tauxMensuel = input.tauxInteret / 100 / 12;
  const nombreMensualites = input.dureeAnnees * 12;

  let mensualitePret = 0;
  if (tauxMensuel > 0 && nombreMensualites > 0 && montantEmprunte > 0) {
    mensualitePret = montantEmprunte * (tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -nombreMensualites)));
  } else if (nombreMensualites > 0 && montantEmprunte > 0) {
    mensualitePret = montantEmprunte / nombreMensualites;
  }

  const tableau: { annee: number; capitalRembourse: number; interetsPaies: number; capitalRestant: number }[] = [];
  let capitalRestant = montantEmprunte;

  for (let annee = 1; annee <= input.dureeAnnees; annee++) {
    let capitalRembourseAnnee = 0;
    let interetsPaiesAnnee = 0;

    for (let mois = 0; mois < 12; mois++) {
      if (capitalRestant <= 0) break;
      const interetsMois = capitalRestant * tauxMensuel;
      const capitalMois = Math.min(mensualitePret - interetsMois, capitalRestant);
      interetsPaiesAnnee += interetsMois;
      capitalRembourseAnnee += capitalMois;
      capitalRestant -= capitalMois;
    }

    tableau.push({
      annee,
      capitalRembourse: capitalRembourseAnnee,
      interetsPaies: interetsPaiesAnnee,
      capitalRestant: Math.max(0, capitalRestant),
    });
  }

  return tableau;
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
    console.log('Received Prêt Immobilier calculation request');

    const validationResult = PretImmobilierInputSchema.safeParse(body);

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
    const amortissement = body.includeAmortissement ? genererAmortissement(validationResult.data) : null;

    return new Response(
      JSON.stringify({ success: true, results, amortissement }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-pret-immobilier function:', error);
    return new Response(
      JSON.stringify({
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
