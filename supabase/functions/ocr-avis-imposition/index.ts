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
    "impot_sans_dispositifs": null,
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
  "niches_fiscales": {
    "total_niches": null,
    "plafond_atteint": false,
    "girardin_detecte": false,
    "plafond_applicable": 10000,
    "marge_restante": null,
    "cas_detecte": "A | B | C | D | aucun"
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
- confidence : "high" si document complet et lisible, "medium" si partiellement lisible, "low" si illisible

RÈGLE CRITIQUE — CRÉDITS D'IMPÔT :
- Pour le champ "credits_impot", tu dois IMPÉRATIVEMENT prendre le montant RÉELLEMENT RETENU par l'administration (la dernière colonne du tableau des réductions/crédits), et NON le montant déclaré brut.
- Exemple : pour la garde d'enfants, le montant déclaré peut être 3200 € mais le crédit d'impôt retenu est 50% soit 1600 €. C'est 1600 € qu'il faut mettre dans "credits_impot".
- Même logique pour les réductions d'impôt : prendre le montant effectivement retenu, pas le montant déclaré.

RÈGLE CRITIQUE — CALCUL DE L'IMPÔT SANS DISPOSITIFS :
- Calcule et renseigne le champ "impot_sans_dispositifs" : c'est l'impôt brut progressif AVANT toute réduction et crédit d'impôt. C'est le montant que le contribuable aurait payé s'il n'avait bénéficié d'aucun avantage fiscal (réductions + crédits).
- Ce champ permet de visualiser l'économie réelle apportée par les dispositifs fiscaux.

RÈGLE CRITIQUE — PLAFONDS PER (Plan d'Épargne Retraite) :
- Sur chaque avis d'imposition, cherche OBLIGATOIREMENT les plafonds de déduction épargne retraite (souvent indiqués en bas ou en page 2 sous "Plafond de déduction épargne retraite").
- Extrais : le plafond du déclarant 1, le plafond du déclarant 2 (si applicable), le montant déjà versé/déduit sur un PER, et le plafond restant disponible.
- Dans analyse_personnalisee, rédige un texte pédagogique en vouvoiement qui :
  1. Rappelle le plafond total et ce qui a déjà été utilisé
  2. Calcule précisément l'économie d'impôt potentielle si le contribuable versait le restant sur un PER (= plafond_restant × TMI / 100)
  3. Donne un exemple concret : "Si vous versiez X € sur un PER avant le 31 décembre, vous pourriez réduire votre impôt de Y €."
  4. Mentionne que cela est à valider avec un conseiller patrimonial
- Si les plafonds PER ne sont pas visibles sur le document, mets les champs numériques à null et indique dans analyse_personnalisee : "Les plafonds de déduction épargne retraite ne sont pas visibles sur ce document. Ils figurent généralement en page 2 de votre avis d'imposition. Nous vous recommandons de vérifier ce point avec un conseiller."

RÈGLE CRITIQUE — PLAFOND DES NICHES FISCALES :

ÉTAPE 1 — CALCUL DU TOTAL NICHES :
- Calculer : total_niches = reductions_impot + credits_impot
- Ne JAMAIS inclure : les versements PER (déduction de revenu), le prélèvement à la source, les contributions sociales.

ÉTAPE 2 — DÉTECTION DU PLAFONNEMENT :
- Rechercher toute mention de "Plafonnement des avantages fiscaux", "Reprise de réduction d'impôt", "Avantages fiscaux plafonnés", ou tout écart inexpliqué entre réduction demandée et accordée.
- Si détecté : plafond_atteint = true. Sinon : false.

ÉTAPE 3 — DÉTECTION DU GIRARDIN :
- Rechercher toute mention de "Investissement Outre-mer", "Article 199 undecies B", "Girardin", ou réduction d'impôt isolée > 5 000 € sans autre explication.
- Si détecté : girardin_detecte = true et plafond_applicable = 18000. Sinon : girardin_detecte = false et plafond_applicable = 10000.

ÉTAPE 4 — GÉNÉRATION DU CONSEIL (dans conseils_optimisation ou points_attention) :

CAS A — total_niches < 7000 ET plafond_atteint = false → cas_detecte = "A"
Ajouter dans conseils_optimisation :
"Vous n'avez mobilisé que [total_niches] € d'avantages fiscaux cette année, alors que la loi vous autorise jusqu'à 10 000 € par an. Il vous restait donc une marge d'environ [10000 - total_niches] €. Selon votre situation, des dispositifs comme l'emploi à domicile (crédit d'impôt de 50% jusqu'à 12 000 € de dépenses), les dons aux associations (réduction de 66 à 75%), ou l'investissement au capital de PME pourraient être pertinents pour l'année en cours. Cette liste n'est pas exhaustive — d'autres dispositifs peuvent s'appliquer selon votre situation personnelle et patrimoniale. À évoquer avec votre conseiller patrimonial."

CAS B — total_niches >= 7000 ET total_niches < 10000 ET plafond_atteint = false → cas_detecte = "B"
Ajouter dans conseils_optimisation :
"Vous avez mobilisé [total_niches] € d'avantages fiscaux cette année. Vous approchez du plafond légal de 10 000 €, avec environ [10000 - total_niches] € de marge restante. Cette capacité résiduelle mérite d'être utilisée de manière ciblée avant la fin de l'année fiscale. Les dispositifs éligibles sont nombreux et varient selon votre situation — un conseiller patrimonial pourrait vous aider à identifier celui qui vous correspond le mieux."

CAS C — (total_niches >= 10000 OU plafond_atteint = true) ET girardin_detecte = false → cas_detecte = "C"
Ajouter dans points_attention :
"Votre avis d'imposition indique que vous avez atteint le plafond annuel de 10 000 € d'avantages fiscaux. Cela signifie que vous exploitez déjà pleinement votre capacité de défiscalisation classique. Il existe cependant des dispositifs bénéficiant d'un plafond majoré à 18 000 €, notamment l'investissement en Outre-mer (Girardin industriel), parmi d'autres solutions qui ne sont pas toutes visibles sur un avis d'imposition. Ce sujet mérite une analyse approfondie avec votre conseiller patrimonial pour identifier les leviers adaptés à votre situation."

CAS D — (total_niches >= 10000 OU plafond_atteint = true) ET girardin_detecte = true → cas_detecte = "D"
Ajouter dans points_attention :
"Votre avis d'imposition mentionne un investissement en Outre-mer. Ce type de dispositif bénéficie d'un plafond majoré de 18 000 € (contre 10 000 € pour les niches classiques), mais ce n'est pas le seul mécanisme permettant d'aller au-delà du plafond standard. Avec [total_niches] € d'avantages fiscaux constatés cette année, votre conseiller patrimonial est le mieux placé pour évaluer votre capacité résiduelle exacte et l'ensemble des options disponibles pour l'année prochaine."

Si aucun cas ne s'applique ou confidence = "low" : cas_detecte = "aucun", ne générer aucun conseil niches.

RÈGLES DE TON pour les niches fiscales :
- Toujours vouvoyer
- Formuler positivement (ouvrir une opportunité, jamais alerter)
- Toujours terminer par une orientation vers le conseiller
- Ne jamais calculer de marge résiduelle dans le cas D
- Ne jamais mentionner de pourcentages de prise en compte du Girardin dans le plafond
- Les exemples de dispositifs sont illustratifs et non exhaustifs

Remplir l'objet niches_fiscales avec : total_niches (nombre), plafond_atteint (boolean), girardin_detecte (boolean), plafond_applicable (10000 ou 18000), marge_restante (nombre ou null si cas D), cas_detecte ("A", "B", "C", "D" ou "aucun").`;

function normalizeModelText(text: string): string {
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

function getJsonState(input: string) {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of input) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{" || ch === "[") {
      stack.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      const last = stack[stack.length - 1];
      if ((ch === "}" && last === "{") || (ch === "]" && last === "[")) {
        stack.pop();
      }
    }
  }

  return { stack, inString };
}

function extractFirstBalancedJson(input: string): string | null {
  const start = input.search(/[\{\[]/);
  if (start === -1) return null;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const ch = input[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{" || ch === "[") {
      stack.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      const last = stack[stack.length - 1];
      if ((ch === "}" && last === "{") || (ch === "]" && last === "[")) {
        stack.pop();
      }

      if (stack.length === 0) {
        return input.substring(start, i + 1);
      }
    }
  }

  return input.substring(start);
}

function repairTruncatedJson(input: string): string {
  let cleaned = input
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/,\s*$/, "")
    .trim();

  const state = getJsonState(cleaned);

  if (state.inString) {
    cleaned += '"';
  }

  for (let i = state.stack.length - 1; i >= 0; i--) {
    cleaned += state.stack[i] === "{" ? "}" : "]";
  }

  return cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

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
        max_tokens: 16000,
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
      let cleaned = textContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const jsonStart = cleaned.search(/[\{\[]/);
      if (jsonStart === -1) throw new Error("No JSON found in API response");
      cleaned = cleaned.substring(jsonStart);

      // Fix control characters
      cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ' ' : '');

      // Check if truncated (unbalanced braces)
      const count = (s: string) => {
        let b = 0, k = 0, inStr = false, esc = false;
        for (const c of s) {
          if (esc) { esc = false; continue; }
          if (c === '\\') { esc = true; continue; }
          if (c === '"') { inStr = !inStr; continue; }
          if (inStr) continue;
          if (c === '{') b++; else if (c === '}') b--;
          if (c === '[') k++; else if (c === ']') k--;
        }
        return { b, k, inStr };
      };

      let state = count(cleaned);

      if (state.b > 0 || state.k > 0 || state.inStr) {
        // Close open string if needed
        if (state.inStr) {
          // Find last quote, trim partial content after it
          const lastQuote = cleaned.lastIndexOf('"');
          // Check if this quote opens an unfinished string value
          cleaned = cleaned.substring(0, lastQuote + 1);
          state = count(cleaned);
        }

        // Remove trailing partial key-value pairs
        // Find last cleanly ended value (ends with ", null, }, ], number, true, false)
        const trailingPartial = cleaned.match(/,\s*"[^"]*"\s*:\s*("[^"]*)?$/);
        if (trailingPartial) {
          cleaned = cleaned.substring(0, cleaned.length - trailingPartial[0].length);
          state = count(cleaned);
        }

        // Remove trailing commas
        cleaned = cleaned.replace(/,\s*$/, "");

        // Re-count and close
        state = count(cleaned);
        while (state.k > 0) { cleaned += "]"; state.k--; }
        while (state.b > 0) { cleaned += "}"; state.b--; }
      }

      // Fix trailing commas inside structures
      cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

      try {
        parsed = JSON.parse(cleaned);
        console.warn("JSON repaired successfully after truncation");
      } catch (finalErr) {
        console.error("JSON repair failed:", finalErr.message, "Last 200 chars:", cleaned.substring(cleaned.length - 200));
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
