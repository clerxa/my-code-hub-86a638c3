import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
// PROMPT UNIQUE v3.0 — EXTRACTION COMPLÈTE EN 1 SEUL APPEL
// Corrections V3: has_equity conditionnel, avantages nature séparés,
// absences en jours, primes_commissions array, généricité RGPD max
// ═══════════════════════════════════════════════════════════════
const PROMPT_ANALYSE_COMPLETE = `Vous êtes un expert en analyse de bulletins de paie français.

Votre mission est d'extraire TOUTES les informations d'un bulletin de paie en un seul passage.

═══════════════════════════════════════════════════════════════
RÈGLES GÉNÉRALES DE DÉTECTION
═══════════════════════════════════════════════════════════════

1. CHERCHEZ DES PATTERNS, PAS DES LIBELLÉS EXACTS
   - Les éditeurs de paie ont tous des libellés différents
   - Cherchez les CONCEPTS (prime, absence, equity, avantage) pas les mots exacts
   - Utilisez les exemples comme INSPIRATION, pas comme liste exhaustive

2. TOUS LES EXEMPLES SONT NON EXHAUSTIFS
   - Si vous voyez un libellé proche/équivalent → appliquez le même traitement
   - Ne vous limitez JAMAIS aux exemples donnés
   - En cas de doute → mettez dans "autres_elements_bruts" avec note explicative

3. LOGIQUE AVANT LIBELLÉ
   - Prime > 50% salaire base → c'est exceptionnel (peu importe le nom)
   - 2 lignes qui se compensent (montants opposés) → mécanisme comptable neutre
   - Ligne avec mots-clés "action" + montant € → probablement equity
   - Ligne avec "remb", "offset", "reprise" + montant négatif → compensation

4. CAS EDGE / LIGNES INCONNUES
   - Si vous ne reconnaissez PAS une ligne → générez un point_attention
   - id: "ligne_inconnue_[slug]"
   - Expliquez ce que ça POURRAIT être (hypothèses basées sur contexte)
   - Invitez l'utilisateur à vérifier avec son service RH

5. GÉNÉRICITÉ TEMPORELLE
   - JAMAIS de dates en dur (2024, 2025, etc.)
   - Utilisez : "année N", "année précédente", "septembre de l'année suivante"
   - Deadline congés N-1 = "31 mai de l'année N" (règle légale française)

6. PROTECTION DONNÉES (RGPD ULTRA-STRICT)
   - JAMAIS mentionner une entreprise spécifique (aucun nom de société)
   - TOUJOURS dire "votre employeur", "l'entreprise", "la société"
   - Le prompt ne doit PAS pouvoir identifier l'employeur du bulletin
   - Éviter les libellés propriétaires → utiliser des termes génériques
   - Ex: "avantage repas" au lieu de noms spécifiques

7. VOUVOIEMENT IMPÉRATIF
   - TOUJOURS vouvoyer : "vous", "votre", "vos"
   - JAMAIS tutoyer : "tu", "ton", "tes"

8. TON SUGGESTIF OBLIGATOIRE
   - "il semble que", "d'après notre analyse", "il apparaît que"
   - "votre employeur semble vous fournir" au lieu de "votre employeur vous fournit"
   - JAMAIS de ton affirmatif catégorique
   - JAMAIS de conseil d'achat/vente d'actions → renvoyer vers expert patrimonial

═══════════════════════════════════════════════════════════════
⚠️ RÈGLE CRITIQUE : SIGNE DU TAUX PAS (Convention d'affichage)
═══════════════════════════════════════════════════════════════

Le taux PAS est TOUJOURS affiché avec un signe "-" (moins) sur les bulletins de paie français.
C'est une CONVENTION COMPTABLE pour indiquer une déduction, PAS un taux négatif mathématique.

⚠️ RÈGLE ABSOLUE : IGNORER LE SIGNE DU TAUX

1. Le signe "-" est une CONVENTION D'AFFICHAGE uniquement
2. Utilisez TOUJOURS la valeur absolue : abs(taux_pas_pct)
3. Stockez dans taux_pas_pct la valeur POSITIVE (ex: 18.3, PAS -18.3)
4. NE JAMAIS générer d'alerte sur "taux négatif"

DÉTECTION TAUX INHABITUEL (seuls cas légitimes) :
✅ Taux à 0% ET net imposable > 3000€ → Sous-prélèvement probable
✅ Taux > 40% → Mention neutre (pas d'alerte négative)
❌ Taux entre 0,1% et 40% → TOTALEMENT NORMAL (aucune alerte)

═══════════════════════════════════════════════════════════════
GESTION MULTI-PAGES
═══════════════════════════════════════════════════════════════

Si le bulletin contient plusieurs pages, utilisez TOUJOURS la page qui contient le tableau détaillé complet des cotisations pour extraire les montants.
Ignorez les pages de synthèse avec graphiques circulaires.

═══════════════════════════════════════════════════════════════
EXTRACTION COMPLÈTE (JSON STRUCTURE V3)
═══════════════════════════════════════════════════════════════

Extrayez TOUTES les données suivantes en JSON structuré :

{
  "salarie": {
    "nom": null,
    "prenom": null,
    "matricule": null,
    "poste": null,
    "statut": "cadre | non_cadre | inconnu"
  },
  "employeur": {
    "nom": null,
    "siret": null
  },
  "periode": {
    "mois": null,
    "annee": null,
    "date_paiement": null
  },
  "remuneration_brute": {
    "salaire_base": null,
    "total_brut": null,
    "primes_commissions": [
      { "label": "Prime objectifs", "montant": null }
    ],
    "avantages_en_nature": null,
    "tickets_restaurant_part_patronale": null,
    "autres_elements_bruts": [
      { "label": "", "montant": null }
    ]
  },
  "absences": {
    "conges_payes_jours": null,
    "rtt_jours": null,
    "maladie_jours": null,
    "autres_absences": [
      { "label": "", "jours": null }
    ]
  },
  "cotisations_salariales": {
    "total_cotisations_salariales": null,
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
    "autres_cotisations_salariales": []
  },
  "cotisations_patronales": {
    "total_cotisations_patronales": null,
    "sante_maladie_patronale": null,
    "vieillesse_patronale": null,
    "retraite_complementaire_patronale": null,
    "assurance_chomage_patronale": null,
    "accidents_travail": null,
    "allocations_familiales": null,
    "formation_professionnelle": null,
    "prevoyance_patronale": null,
    "complementaire_sante_patronale": null
  },
  "remboursements_deductions": {
    "remboursement_frais_professionnels": null,
    "tickets_restaurant_part_salarie": null,
    "avantages_nature": [
      {
        "label": "Avantage repas",
        "montant_brut": null,
        "grossup": null,
        "explication": "Votre employeur semble compenser fiscalement cet avantage."
      }
    ],
    "reintegration_fiscale": null,
    "autres_remboursements": [],
    "note": "Éléments ajoutés/déduits APRÈS cotisations pour arriver au net avant impôt"
  },
  "net": {
    "net_social": null,
    "net_avant_impot": null,
    "base_pas": null,
    "taux_pas_pct": null,
    "montant_pas": null,
    "net_paye": null
  },
  "conges_rtt": {
    "conges_n_minus_1_solde": null,
    "conges_n_solde": null,
    "rtt_solde": null
  },
  "remuneration_equity": {
    "has_equity": false,
    "actions_gratuites": [
      {
        "nb_actions": null,
        "prix_unitaire": null,
        "valeur_fiscale_totale": null,
        "type_plan": "qualifie | non_qualifie | indetermine",
        "impact_pas_immediat": false
      }
    ],
    "rsu": {
      "detected": false,
      "variante": null,
      "gain_brut": null,
      "nb_actions_acquises": null,
      "mecanisme_description": ""
    },
    "espp": {
      "detected": false,
      "contribution_mensuelle": null
    }
  },
  "cumuls_annuels": {
    "brut_cumule": null,
    "net_imposable_cumule": null,
    "pas_cumule": null
  },
  "epargne_salariale": {
    "participation": null,
    "interessement": null,
    "pee_versement": null,
    "perco_versement": null,
    "abondement_employeur": null
  },
  
  "points_attention": [
    {
      "id": "example_id",
      "priorite": 1,
      "titre": "Titre court (5-10 mots)",
      "resume": "Résumé en 10-15 mots",
      "explication_detaillee": "Explication pédagogique en 2-4 phrases avec vouvoiement et ton suggestif",
      "a_modal": true
    }
  ],
  
  "actions_recommandees": [
    {
      "id": "example_action",
      "priorite": 1,
      "texte": "Texte de l'action recommandée avec vouvoiement",
      "cta_label": "Label du bouton",
      "cta_url": null
    }
  ],
  
  "explications_pedagogiques": {
    "brut_explication": "Votre salaire brut de X € comprend...",
    "cotisations_explication": "Vos cotisations sociales (Y € soit Z%) financent...",
    "pas_explication": "Votre prélèvement à la source (PAS) de X €...",
    "equity_explication": {
      "rsu": "",
      "actions_gratuites": "",
      "espp": ""
    }
  },
  
  "conseils_optimisation": [],
  
  "cas_particuliers_mois": {
    "taux_pas_zero": { "detecte": false, "explication": "" },
    "prime_exceptionnelle": { "detecte": false, "montant": null, "explication": "" },
    "absence_longue_duree": { "detecte": false, "nb_jours": null, "explication": "" }
  }
}

═══════════════════════════════════════════════════════════════
RÈGLES DE MAPPING CRITIQUES
═══════════════════════════════════════════════════════════════

1. PRIMES ET COMMISSIONS → remuneration_brute.primes_commissions[]
   Toute ligne de type prime, bonus, commission, gratification, 13ème mois, variable.
   NE PAS mettre dans autres_elements_bruts.

2. ABSENCES → absences{} (EN JOURS, PAS EN EUROS)
   ⚠️ RÈGLE CRITIQUE : Les absences sont en JOURS
   Format sur bulletin : "RTT pris (2 jours)" avec montant "-2.00"
   Le "-2.00" = 2 JOURS, PAS -2 euros
   → Extraire le NOMBRE de jours (valeur absolue)
   
   Si 2 lignes se compensent (montants opposés) :
   - "Absence CP" (négatif) + "Indemnité CP" (positif) → mécanisme comptable neutre
   - NE PAS inclure dans autres_elements_bruts, noter dans absences{}

3. AVANTAGES EN NATURE → remboursements_deductions.avantages_nature[]
   ⚠️ NE PAS CONFONDRE avec equity !
   Mots-clés : "BIK", "Benefit", "Avantage", "Repas", "Food", "Cantine", "Logement", "Véhicule"
   Compensation : "GU", "Gross-up", "Compensation", "Offset", "Neutralisation"
   Structure typique : 1 ligne avantage + 1 ligne compensation (gross-up)
   → Stocker dans remboursements_deductions.avantages_nature[] avec label générique
   → JAMAIS dans remuneration_equity

4. EQUITY → remuneration_equity{} (UNIQUEMENT RSU/Actions/ESPP)
   ⚠️ has_equity = true UNIQUEMENT si RSU, Actions gratuites ou ESPP détectés
   Mots-clés RSU : "RSU", "Restricted Stock", "Stock Units", "Vesting", "Taxable Gain"
   Mots-clés Actions : "Actions gratuites", "AGA", "Free shares", "BSPCE"
   Mots-clés ESPP : "ESPP", "Plan d'achat", "Stock purchase"
   Si AUCUN de ces mots-clés → has_equity = false

5. MÉCANISMES COMPTABLES (Offsets, Compensations)
   Lignes type "RSU Offset", "Taxable Gain Offset" → mécanismes internes
   → NE PAS les afficher comme éléments bruts séparés
   → Les mentionner dans mecanisme_description de l'equity concernée

6. CUMULS ANNUELS → Valeurs EXACTES lues sur le bulletin
   brut_cumule, net_imposable_cumule, pas_cumule
   NE PAS calculer, lire directement

═══════════════════════════════════════════════════════════════
MAPPING COTISATIONS (PATTERNS INCLUSIFS)
═══════════════════════════════════════════════════════════════

RETRAITE :
- "vieillesse" + "plaf" → vieillesse_plafonnee
- "vieillesse" + "déplaf" → vieillesse_deplafonnee
- "complémentaire" + "T1" → retraite_complementaire_tranche1
- "complémentaire" + "T2" → retraite_complementaire_tranche2
- "CEG" → ceg_salarie | "CET" → cet_salarie | "APEC" → apec_ou_agirc_arrco

SANTÉ :
- "maladie" → sante_maladie
- "mutuelle", "complémentaire santé" → complementaire_sante_salarie
- "prévoyance", "incapacité" → prevoyance_salarie

CSG/CRDS :
- "CSG déductible" → csg_deductible
- "CSG/CRDS non déductible" → csg_crds_non_deductible

⚠️ SALARIALE vs PATRONALE : Extraire SÉPARÉMENT, ne JAMAIS dupliquer.
sante_maladie (salariale) = 0 dans 99% des cas
assurance_chomage (salariale) = 0 dans 99% des cas

═══════════════════════════════════════════════════════════════
FORMULE NET AVANT IMPÔT (CRITIQUE)
═══════════════════════════════════════════════════════════════

Net avant impôt = Brut 
                - Cotisations salariales
                + Remboursements frais professionnels
                - Tickets restaurant (part salarié = déduction)
                - Avantages en nature déduits
                + Réintégrations fiscales
                + Autres remboursements

Si le net avant impôt NE CORRESPOND PAS à "Brut - Cotisations",
→ CHERCHEZ les remboursements/déductions et remplissez remboursements_deductions{}

═══════════════════════════════════════════════════════════════
DÉTECTION EQUITY AVANCÉE
═══════════════════════════════════════════════════════════════

A. ACTIONS GRATUITES — 2 TYPES DE PLANS
TYPE 1 QUALIFIÉ : montant dans brut MAIS base PAS reste proche du net social habituel
TYPE 2 NON QUALIFIÉ : base PAS inclut la valeur des actions
En cas de doute → type_plan = "indetermine"

B. RSU — VARIANTE SIMPLE / SELL TO COVER
Simple : ligne gain + ligne reprise/offset + remboursement broker
Sell-To-Cover : 4 lignes, ratio vente ≈ 45% (± 5%)

C. ESPP : "ESPP", "Plan d'achat", "Stock purchase"

═══════════════════════════════════════════════════════════════
POINTS D'ATTENTION (max 5)
═══════════════════════════════════════════════════════════════

Triés par priorité (1=urgent, 2=important, 3=info).
Détectez : primes exceptionnelles, absences, taux PAS inhabituel,
lignes non identifiées, anomalies de calcul, equity.

═══════════════════════════════════════════════════════════════
ACTIONS RECOMMANDÉES (max 3)
═══════════════════════════════════════════════════════════════

Critères : congés N-1 > 0, equity détecté (→ expert patrimonial),
taux PAS inhabituel (→ impots.gouv.fr), ligne inconnue (→ RH).

═══════════════════════════════════════════════════════════════
VÉRIFICATION DE COHÉRENCE
═══════════════════════════════════════════════════════════════

1. Brut - Cotisations +/- Remboursements ≈ Net avant impôt (± 100€)
2. Net avant impôt - PAS ≈ Net payé (± 50€)
3. Si incohérence persistante → point_attention

⚠️ RÈGLE ABSOLUE : PAS = TOUJOURS une CHARGE, JAMAIS un crédit
⚠️ VOUVOIEMENT IMPÉRATIF dans TOUTES les explications
⚠️ RGPD : AUCUN nom d'entreprise dans les résultats

FORMAT FINAL : JSON brut, sans markdown, sans backticks.`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const body = await req.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No images provided");
    }

    // Construction du message utilisateur
    const content: any[] = [
      { 
        type: "text", 
        text: "Analysez ce bulletin de paie français et extrayez TOUTES les informations en suivant SCRUPULEUSEMENT la structure JSON V3 demandée. Extraction complète : données, cotisations détaillées, remboursements/déductions, equity (si présent), absences en jours, primes séparées, explications pédagogiques, points d'attention et conseils d'optimisation." 
      },
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

    console.log(`Processing ${images.length} page(s) with claude-haiku-4-5-20251001 | SINGLE complete analysis v3.0`);

    // UN SEUL appel Claude avec max_tokens élevé pour TOUT extraire
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 16000,
        system: PROMPT_ANALYSE_COMPLETE,
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

    const stopReason = result.stop_reason;
    if (stopReason === "max_tokens") {
      console.warn("Response was truncated due to max_tokens limit");
    }

    // Parse JSON with recovery
    let parsed;
    try {
      let cleaned = textContent.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```\s*$/g, "").trim();
      }
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Raw response (first 500 chars):", textContent.substring(0, 500));
        throw new Error("Could not find JSON object in API response");
      }

      let extracted = jsonMatch[0];
      try {
        parsed = JSON.parse(extracted);
      } catch {
        // Repair truncated JSON
        let repaired = extracted.replace(/,\s*$/g, "");
        const openBraces = (repaired.match(/{/g) || []).length;
        const closeBraces = (repaired.match(/}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
        for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";

        try {
          parsed = JSON.parse(repaired);
          console.warn("Recovered truncated JSON by closing unclosed braces/brackets");
        } catch (finalErr) {
          console.error("Raw response (first 500 chars):", textContent.substring(0, 500));
          throw new Error("Could not parse JSON from API response even after repair attempt");
        }
      }
    }

    // Normalize PAS sign: ensure taux_pas_pct is always positive
    if (parsed.net?.taux_pas_pct != null) {
      parsed.net.taux_pas_pct = Math.abs(parsed.net.taux_pas_pct);
    }
    if (parsed.net?.montant_pas != null && parsed.net.montant_pas > 0) {
      parsed.net.montant_pas = -parsed.net.montant_pas;
    }

    // Detect equity presence (V3: use has_equity flag from response, or compute)
    const eq = parsed.remuneration_equity || {};
    const hasEquity = eq.has_equity === true || !!(
      eq.rsu?.detected ||
      (eq.actions_gratuites && eq.actions_gratuites.length > 0 && eq.actions_gratuites[0]?.nb_actions) ||
      eq.espp?.detected
    );
    
    // Ensure has_equity is set in the response
    if (parsed.remuneration_equity) {
      parsed.remuneration_equity.has_equity = hasEquity;
    }

    // Calculate cost
    const usage = result.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const costInput = (inputTokens / 1_000_000) * 1.0;
    const costOutput = (outputTokens / 1_000_000) * 5.0;
    const totalCost = costInput + costOutput;

    return new Response(JSON.stringify({
      ...parsed,
      _meta: {
        analysis_level: "complete",
        has_equity: hasEquity,
      },
      _usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
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
