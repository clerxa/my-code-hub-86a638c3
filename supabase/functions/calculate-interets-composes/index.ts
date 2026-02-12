import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= VALIDATION SCHEMA =============

const CalculInputSchema = z.object({
  montant_initial: z.number().min(0, { message: "Le montant initial doit être >= 0" }).max(100_000_000, { message: "Le montant initial est trop élevé" }),
  versement_mensuel: z.number().min(0).max(1_000_000, { message: "Le versement mensuel est trop élevé" }).default(0),
  duree_annees: z.number().min(1, { message: "La durée doit être >= 1 an" }).max(50, { message: "La durée ne peut excéder 50 ans" }),
  taux_interet: z.number().min(0, { message: "Le taux doit être >= 0" }).max(30, { message: "Le taux ne peut excéder 30%" }),
});

serve(async (req) => {
  // Handle CORS preflight
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

    const validationResult = CalculInputSchema.safeParse(body);

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

    const { montant_initial, versement_mensuel, duree_annees, taux_interet } = validationResult.data;
    
    // Calculs
    const tauxMensuel = taux_interet / 100 / 12;
    const evolutionAnnuelle: { annee: number; capital: number; versements: number; interets: number }[] = [];
    
    let capitalActuel = montant_initial;
    let totalVerse = montant_initial;
    
    for (let annee = 0; annee <= duree_annees; annee++) {
      if (annee === 0) {
        evolutionAnnuelle.push({
          annee: 0,
          capital: montant_initial,
          versements: montant_initial,
          interets: 0,
        });
      } else {
        for (let mois = 0; mois < 12; mois++) {
          capitalActuel = capitalActuel * (1 + tauxMensuel) + versement_mensuel;
          totalVerse += versement_mensuel;
        }
        
        evolutionAnnuelle.push({
          annee,
          capital: Math.round(capitalActuel),
          versements: Math.round(totalVerse),
          interets: Math.round(capitalActuel - totalVerse),
        });
      }
    }
    
    const capitalFinal = evolutionAnnuelle[evolutionAnnuelle.length - 1].capital;
    const totalInterets = evolutionAnnuelle[evolutionAnnuelle.length - 1].interets;
    const totalInvesti = evolutionAnnuelle[evolutionAnnuelle.length - 1].versements;
    
    // Sans versements mensuels
    const capitalSansVersements = Math.round(montant_initial * Math.pow(1 + taux_interet / 100, duree_annees));
    
    const result = {
      capital_final: capitalFinal,
      total_interets: totalInterets,
      total_investi: totalInvesti,
      evolution_annuelle: evolutionAnnuelle,
      capital_sans_versements: capitalSansVersements,
      multiplicateur: totalInvesti > 0 ? (capitalFinal / totalInvesti).toFixed(1) : '0',
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-interets-composes:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
