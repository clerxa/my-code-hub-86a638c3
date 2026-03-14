import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODELS: Record<string, { id: string; input_cost: number; output_cost: number }> = {
  "haiku-4.5": { id: "claude-haiku-4-5-20251001", input_cost: 1.00, output_cost: 5.00 },
  "sonnet-4": { id: "claude-sonnet-4-20250514", input_cost: 3.00, output_cost: 15.00 },
};

const SYSTEM_PROMPT = `Tu es un expert en fiscalité française et en droit fiscal des particuliers. Tu analyses des avis d'imposition français (Direction Générale des Finances Publiques — DGFIP).

Tu dois faire DEUX choses simultanément :
1. Extraire toutes les données fiscales structurées
2. Expliquer chaque ligne en langage clair et pédagogique pour un salarié qui ne connaît pas la fiscalité

Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.

{
  "contribuable": {
    "nom": "",
    "prenom": "",
    "adresse_complete": "",
    "numero_fiscal": "",
    "reference_avis": "",
    "situation_familiale": "",
    "nombre_parts": null
  },
  "annees": {
    "annee_revenus": null,
    "annee_imposition": null
  },
  "revenus": {
    "salaires_traitements_bruts": null,
    "abattement_10_pct": null,
    "salaires_nets_imposables": null,
    "revenus_fonciers_nets": null,
    "revenus_capitaux_mobiliers": null,
    "plus_values_mobilières": null,
    "bic_bnc_ba": null,
    "pensions_retraites": null,
    "autres_revenus": null,
    "revenu_brut_global": null,
    "charges_deductibles": null,
    "revenu_net_global": null,
    "abattements_speciaux": null,
    "revenu_net_imposable": null,
    "revenu_fiscal_reference": null
  },
  "impot": {
    "impot_brut_progressif": null,
    "taux_marginal_imposition_pct": null,
    "taux_moyen_imposition_pct": null,
    "plafonnement_quotient_familial": null,
    "reductions_impot": null,
    "credits_impot": null,
    "impot_net_avant_contributions": null,
    "prelevement_forfaitaire_unique": null,
    "contributions_sociales_revenus_capital": null,
    "taxe_habitation": null,
    "impot_net_total": null,
    "total_a_payer": null,
    "mensualisation_ou_prelevement": null
  },
  "prelevement_source": {
    "taux_pas_pct": null,
    "montant_preleve_annee_n": null,
    "solde_a_payer_ou_rembourser": null
  },
  "plafonds_per": {
    "plafond_declarant_1": null,
    "plafond_declarant_2": null,
    "montant_verse_per": null,
    "plafond_restant": null,
    "analyse_personnalisee": "Analyse détaillée et personnalisée du plafond PER : combien a été versé, combien il reste, quel serait l'avantage fiscal concret en euros si le contribuable utilisait tout son plafond restant (calcul basé sur son TMI), et recommandation claire."
  },
  "explications_pedagogiques": {
    "introduction": "Phrase d'accroche expliquant en 2 lignes ce qu'est un avis d'imposition et à quoi il sert",
    "revenu_fiscal_reference_explication": "Explication claire du RFR",
    "taux_marginal_explication": "Explication du TMI avec la métaphore des tranches",
    "taux_moyen_explication": "Explication du taux moyen réel et différence avec le TMI",
    "quotient_familial_explication": "Explication du quotient familial",
    "abattement_10_pct_explication": "Explication de l'abattement forfaitaire de 10%",
    "prelevement_source_explication": "Explication du PAS",
    "lignes_inhabituelles": [],
    "conseils_optimisation": [],
    "points_attention": []
  },
  "meta": {
    "type_document": "avis_imposition | avis_non_imposition | avis_tiers_provisionnel | inconnu",
    "confidence": "high | medium | low",
    "champs_manquants": [],
    "annee_detectee": null
  }
}

Règles importantes :
- explications_pedagogiques : utilise un langage simple, concret, avec des chiffres tirés du document. Pas de jargon sans explication.
- lignes_inhabituelles : signale toute ligne hors norme avec une explication
- conseils_optimisation : 2-3 pistes concrètes adaptées à la situation — toujours avec la mention "à valider avec un conseiller"
- points_attention : alertes importantes
- Tous les montants en euros, nombres décimaux
- confidence : "high" si document complet et lisible, "medium" si partiellement lisible, "low" si illisible`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const { images, model: modelKey } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "No images provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const modelConfig = MODELS[modelKey] || MODELS["haiku-4.5"];

    const content: any[] = images.map((base64: string) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: base64,
      },
    }));

    content.push({
      type: "text",
      text: "Analyse cet avis d'imposition français et retourne le JSON structuré avec les explications pédagogiques.",
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelConfig.id,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error for model", modelConfig.id, ":", response.status, errorText);
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
    const costInput = (inputTokens / 1_000_000) * modelConfig.input_cost;
    const costOutput = (outputTokens / 1_000_000) * modelConfig.output_cost;
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
        model: modelConfig.id,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue lors de l'analyse du document." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
