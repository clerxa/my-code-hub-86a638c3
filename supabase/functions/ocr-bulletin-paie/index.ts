import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es un expert en droit du travail français, en paie et en fiscalité des salariés. Tu analyses des bulletins de paie français.

Tu dois faire DEUX choses simultanément :
1. Extraire toutes les données de la fiche de paie de façon structurée
2. Expliquer chaque section en langage clair et pédagogique pour un salarié qui ne comprend pas sa fiche de paie

Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.

{
  "salarie": {
    "nom": "",
    "prenom": "",
    "adresse": "",
    "numero_securite_sociale": "",
    "matricule": "",
    "emploi": "",
    "statut": "cadre | non_cadre | cadre_dirigeant | inconnu",
    "classification": "",
    "convention_collective": "",
    "date_entree": "",
    "anciennete_annees": null
  },
  "employeur": {
    "nom": "",
    "adresse": "",
    "siret": "",
    "code_naf": "",
    "urssaf": ""
  },
  "periode": {
    "mois": null,
    "annee": null,
    "date_paiement": ""
  },
  "remuneration_brute": {
    "salaire_base": null,
    "taux_horaire_ou_mensuel": null,
    "heures_travaillees": null,
    "heures_supplementaires": null,
    "prime_anciennete": null,
    "prime_objectifs": null,
    "prime_exceptionnelle": null,
    "avantages_en_nature": null,
    "tickets_restaurant_part_patronale": null,
    "autres_elements_bruts": [],
    "total_brut": null
  },
  "cotisations_salariales": {
    "sante_maladie": null,
    "complementaire_sante_salarie": null,
    "vieillesse_plafonnee": null,
    "vieillesse_deplafonnee": null,
    "retraite_complementaire_tranche1": null,
    "retraite_complementaire_tranche2": null,
    "apec_ou_agirc_arrco": null,
    "assurance_chomage": null,
    "ceg_salarie": null,
    "cet_salarie": null,
    "prevoyance_salarie": null,
    "csg_deductible": null,
    "csg_crds_non_deductible": null,
    "total_cotisations_salariales": null
  },
  "cotisations_patronales": {
    "sante_maladie_patronale": null,
    "vieillesse_patronale": null,
    "retraite_complementaire_patronale": null,
    "assurance_chomage_patronale": null,
    "accidents_travail": null,
    "allocations_familiales": null,
    "formation_professionnelle": null,
    "taxe_apprentissage": null,
    "prevoyance_patronale": null,
    "complementaire_sante_patronale": null,
    "total_cotisations_patronales": null
  },
  "net": {
    "net_social": null,
    "net_avant_impot": null,
    "taux_pas_pct": null,
    "montant_pas_preleve": null,
    "net_paye": null,
    "mode_paiement": "",
    "iban_salarie": ""
  },
  "cumuls_annuels": {
    "brut_cumul": null,
    "net_imposable_cumul": null,
    "pas_cumul": null,
    "cout_total_employeur_cumul": null
  },
  "epargne_salariale": {
    "interesse_brut": null,
    "participation_brute": null,
    "abondement_employeur": null,
    "versement_pee": null,
    "versement_percoi": null
  },
  "conges_rtt": {
    "conges_payes_n_solde": null,
    "conges_payes_n1_solde": null,
    "rtt_solde": null,
    "conges_pris_mois": null
  },
  "cout_employeur": {
    "salaire_brut": null,
    "total_charges_patronales": null,
    "cout_total_mensuel": null,
    "ratio_charges_sur_brut_pct": null
  },
  "explications_pedagogiques": {
    "introduction": "Phrase d'accroche : ce mois-ci tu as gagné X€ brut et reçu Y€ net. Voici pourquoi.",
    "ecart_brut_net_explication": "Explication claire et chiffrée de la différence entre brut et net.",
    "cotisations_a_quoi_ca_sert": {
      "retraite": "Explication concrète.",
      "sante": "Explication concrète.",
      "chomage": "Explication concrète.",
      "csg_crds": "Explication concrète.",
      "prevoyance": "Explication concrète."
    },
    "pas_explication": "Explication du prélèvement à la source.",
    "cout_employeur_explication": "Explication du coût réel pour l'employeur.",
    "epargne_salariale_explication": "Explication de l'épargne salariale.",
    "conges_explication": "Explication des congés.",
    "lignes_inhabituelles": [],
    "points_attention": [],
    "conseils_optimisation": []
  },
  "meta": {
    "confidence": "high | medium | low",
    "champs_manquants": [],
    "alertes": []
  }
}

Règles importantes :
- introduction : toujours commencer par les chiffres clés brut/net avec les montants réels
- ecart_brut_net_explication : c'est LA question que tout salarié se pose — être très concret, utiliser les vrais montants, décomposer en 3 lignes max
- cotisations_a_quoi_ca_sert : expliquer le POURQUOI de chaque prélèvement, pas juste le montant
- lignes_inhabituelles : signaler toute ligne hors norme
- points_attention : alertes concrètes
- conseils_optimisation : 2-3 pistes actionnables adaptées au profil — toujours avec mention "à valider avec un conseiller"
- cout_employeur.ratio_charges_sur_brut_pct : calculer (charges patronales / brut) * 100
- Tous montants en euros, nombres décimaux. Arrays vides [] si aucune donnée.
- confidence : "high" si bulletin complet et lisible, "medium" si partiellement lisible, "low" si illisible`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const { images } = await req.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No images provided");
    }

    const content: any[] = [
      { type: "text", text: "Analyse ce bulletin de paie français. Extrais toutes les données et fournis les explications pédagogiques complètes." },
    ];

    for (const img of images) {
      const base64Data = img.startsWith("data:") ? img.split(",")[1] : img;
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Data,
        },
      });
    }

    console.log(`Processing ${images.length} page(s) with claude-haiku-4-5-20251001`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const textContent = result.content?.find((c: any) => c.type === "text")?.text;

    if (!textContent) {
      throw new Error("No text content in API response");
    }

    let parsed;
    try {
      parsed = JSON.parse(textContent);
    } catch {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse JSON from API response");
      }
    }

    const usage = result.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const costInput = (inputTokens / 1_000_000) * 1.0;
    const costOutput = (outputTokens / 1_000_000) * 5.0;
    const totalCost = costInput + costOutput;

    return new Response(JSON.stringify({
      ...parsed,
      _usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        cost_input_usd: Math.round(costInput * 10000) / 10000,
        cost_output_usd: Math.round(costOutput * 10000) / 10000,
        cost_total_usd: Math.round(totalCost * 10000) / 10000,
        model: "claude-haiku-4-5-20251001",
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue lors de l'analyse du bulletin de paie." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
