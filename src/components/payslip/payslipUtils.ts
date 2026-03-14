/**
 * Payslip progressive disclosure utilities
 * Alert & action prioritization algorithms
 */

export interface PayslipAlert {
  id: string;
  priority: number; // 1 = urgent, 2 = important, 3 = info
  icon: string;
  title: string;
  summary: string;
  fullExplanation?: string;
  hasDetails: boolean;
}

export interface PayslipAction {
  id: string;
  priority: number;
  icon: string;
  text: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

const MONTHS = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
};

export const fmtPct = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  return Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
};

export const getMonthLabel = (mois: number | null, annee: number | null): string => {
  if (!mois || !annee) return "Ce mois-ci";
  return `${MONTHS[mois] || ""} ${annee}`;
};

export const safe = (obj: any, ...keys: string[]): any => {
  let val = obj;
  for (const k of keys) {
    if (val == null) return null;
    val = val[k];
  }
  return val;
};

export function prioritizeAlerts(data: any): PayslipAlert[] {
  const alerts: PayslipAlert[] = [];
  const cas = data.cas_particuliers_mois || {};

  // PRIORITY 1: URGENT
  const congesN1Solde = safe(data, "conges_rtt", "conges_n_moins_1", "solde");
  if (congesN1Solde != null && congesN1Solde > 0) {
    alerts.push({
      id: "conges_n_moins_1",
      priority: 1,
      icon: "⏰",
      title: `Congés N-1 à consommer : ${congesN1Solde} jours`,
      summary: `Tes congés de l'année précédente doivent être pris avant fin mai, sinon ils seront perdus !`,
      hasDetails: false,
    });
  }

  if (cas.taux_pas_zero?.detecte) {
    alerts.push({
      id: "taux_pas_zero",
      priority: 1,
      icon: "⚠️",
      title: "Taux PAS à 0%",
      summary: cas.taux_pas_zero.explication || "Attention : tu ne paies pas d'impôt ce mois-ci. Vérifie que c'est intentionnel.",
      fullExplanation: cas.taux_pas_zero.explication,
      hasDetails: !!cas.taux_pas_zero.explication,
    });
  }

  // PRIORITY 2: IMPORTANT (unusual items)
  if (cas.prime_exceptionnelle?.detecte) {
    alerts.push({
      id: "prime_exceptionnelle",
      priority: 2,
      icon: "💰",
      title: `Prime exceptionnelle : ${fmt(cas.prime_exceptionnelle.montant)}`,
      summary: cas.prime_exceptionnelle.explication || "Une prime significative augmente ton brut ce mois-ci.",
      fullExplanation: cas.prime_exceptionnelle.explication,
      hasDetails: !!cas.prime_exceptionnelle.explication,
    });
  }

  if (cas.rsu_massif?.detecte) {
    const rsu = data.remuneration_equity?.rsu_restricted_stock_units;
    alerts.push({
      id: "rsu_massif",
      priority: 2,
      icon: "📈",
      title: `Vesting RSU : ${fmt(cas.rsu_massif.montant)}`,
      summary: rsu?.variante === "sell_to_cover_45pct"
        ? `Mécanisme Sell-To-Cover : ${rsu.quotite_cedee_pct || 45}% d'actions vendues automatiquement pour couvrir les impôts.`
        : cas.rsu_massif.explication || "Un lot important de RSU a été acquis ce mois-ci.",
      fullExplanation: cas.rsu_massif.explication,
      hasDetails: true,
    });
  }

  if (cas.actions_gratuites_vesting?.detecte) {
    alerts.push({
      id: "actions_gratuites_vesting",
      priority: 2,
      icon: "🎁",
      title: `Vesting actions gratuites : ${cas.actions_gratuites_vesting.nb_actions} actions (${fmt(cas.actions_gratuites_vesting.valeur_fiscale)})`,
      summary: cas.actions_gratuites_vesting.explication || "Des actions gratuites sont devenues définitivement acquises ce mois-ci.",
      fullExplanation: cas.actions_gratuites_vesting.explication,
      hasDetails: true,
    });
  }

  if (cas.credit_impot?.detecte) {
    alerts.push({
      id: "credit_impot",
      priority: 2,
      icon: "🎉",
      title: `Crédit d'impôt : ${fmt(cas.credit_impot.montant_credit)}`,
      summary: cas.credit_impot.explication || "Tu as reçu un crédit d'impôt ce mois-ci !",
      fullExplanation: cas.credit_impot.explication,
      hasDetails: !!cas.credit_impot.explication,
    });
  }

  if (cas.conge_paternite?.detecte) {
    alerts.push({
      id: "conge_paternite",
      priority: 2,
      icon: "👶",
      title: `Congé paternité : ${cas.conge_paternite.nb_jours || ""} jours`,
      summary: cas.conge_paternite.explication || "Ton salaire est réduit car tu étais en congé paternité.",
      fullExplanation: cas.conge_paternite.explication,
      hasDetails: !!cas.conge_paternite.explication,
    });
  }

  if (cas.absence_longue_duree?.detecte) {
    alerts.push({
      id: "absence_longue_duree",
      priority: 2,
      icon: "🏥",
      title: `Absence longue durée : ${cas.absence_longue_duree.nb_jours || ""} jours`,
      summary: cas.absence_longue_duree.explication || "Ton salaire est impacté par une absence de longue durée.",
      fullExplanation: cas.absence_longue_duree.explication,
      hasDetails: !!cas.absence_longue_duree.explication,
    });
  }

  if (cas.entree_ou_sortie_mois?.detecte) {
    alerts.push({
      id: "entree_ou_sortie_mois",
      priority: 2,
      icon: "📅",
      title: cas.entree_ou_sortie_mois.type === "entree" ? "Entrée en cours de mois" : "Sortie en cours de mois",
      summary: cas.entree_ou_sortie_mois.explication || "Ton salaire est proratisé ce mois-ci.",
      fullExplanation: cas.entree_ou_sortie_mois.explication,
      hasDetails: !!cas.entree_ou_sortie_mois.explication,
    });
  }

  // Avantages en nature compensés
  const avantages = data.remuneration_equity?.avantages_nature_compenses;
  if (avantages?.total_brut) {
    alerts.push({
      id: "avantages_nature",
      priority: 2,
      icon: "🍽️",
      title: `Avantage repas + compensation : ${fmt(avantages.total_brut)}`,
      summary: "L'avantage en nature repas est entièrement compensé par un Gross-Up. Tu profites des repas SANS impact net.",
      hasDetails: true,
    });
  }

  // PRIORITY 3: INFO
  if (cas.changement_taux_pas?.detecte) {
    alerts.push({
      id: "changement_taux_pas",
      priority: 3,
      icon: "📊",
      title: `Taux PAS ajusté : ${fmtPct(data.net?.taux_pas_pct)}`,
      summary: cas.changement_taux_pas.explication || "Ton taux de prélèvement a été modifié.",
      fullExplanation: cas.changement_taux_pas.explication,
      hasDetails: !!cas.changement_taux_pas.explication,
    });
  }

  if (cas.conges_pris?.detecte) {
    alerts.push({
      id: "conges_pris",
      priority: 3,
      icon: "🏖️",
      title: `${cas.conges_pris.nb_jours || ""} jour(s) de congés pris`,
      summary: cas.conges_pris.explication || "Tu as pris des congés ce mois-ci. Ton salaire n'est pas réduit.",
      hasDetails: false,
    });
  }

  // Points d'attention from AI
  if (Array.isArray(data.points_attention)) {
    data.points_attention.forEach((pt: any, i: number) => {
      const text = typeof pt === "string" ? pt : pt?.message || "";
      if (text && !alerts.some(a => a.summary === text)) {
        alerts.push({
          id: `point_attention_${i}`,
          priority: 2,
          icon: "⚠️",
          title: "Point d'attention",
          summary: text,
          hasDetails: false,
        });
      }
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

export function prioritizeActions(data: any): PayslipAction[] {
  const actions: PayslipAction[] = [];
  const cas = data.cas_particuliers_mois || {};

  // Congés N-1 urgents
  const congesN1Solde = safe(data, "conges_rtt", "conges_n_moins_1", "solde");
  if (congesN1Solde != null && congesN1Solde > 0) {
    actions.push({
      id: "conges_urgent",
      priority: 1,
      icon: "⏰",
      text: `Prends tes ${congesN1Solde} jours de congés N-1 avant le 31 mai, sinon ils seront perdus !`,
    });
  }

  // RSU → suggest expert
  const rsu = data.remuneration_equity?.rsu_restricted_stock_units;
  if (rsu?.gain_brut_total > 0) {
    actions.push({
      id: "strategie_rsu",
      priority: 2,
      icon: "💡",
      text: `Un lot de RSU de ${fmt(rsu.gain_brut_total)} a été acquis ce mois-ci. Pour bien comprendre l'impact fiscal et patrimonial, prends rendez-vous avec un expert.`,
      ctaLabel: "Prendre rendez-vous",
      ctaUrl: "/expert-booking",
    });
  }

  // Actions gratuites → suggest expert
  const ag = data.remuneration_equity?.actions_gratuites_acquises;
  if (Array.isArray(ag) && ag.length > 0) {
    const totalActions = ag.reduce((acc: number, a: any) => acc + (a.nb_actions || 0), 0);
    const totalVal = ag.reduce((acc: number, a: any) => acc + (a.valeur_fiscale_totale || 0), 0);
    actions.push({
      id: "strategie_ag",
      priority: 2,
      icon: "💡",
      text: `${totalActions} actions gratuites acquises (${fmt(totalVal)}). Un expert patrimonial peut t'aider à optimiser la fiscalité de tes actions.`,
      ctaLabel: "Consulter un expert",
      ctaUrl: "/expert-booking",
    });
  }

  // Commission optimization
  if (cas.prime_exceptionnelle?.detecte && data.net?.taux_pas_pct > 25) {
    actions.push({
      id: "optimisation_commission",
      priority: 3,
      icon: "💡",
      text: `Tes primes créent des pics de revenu. Demande un taux PAS lissé sur l'année pour éviter les pics d'impôt.`,
      ctaLabel: "Accéder à impots.gouv.fr",
      ctaUrl: "https://impots.gouv.fr",
    });
  }

  // ESPP → suggest expert
  const espp = data.remuneration_equity?.espp_employee_stock_purchase_plan;
  if (espp?.contribution_mensuelle) {
    actions.push({
      id: "strategie_espp",
      priority: 3,
      icon: "💡",
      text: `Tu contribues ${fmt(espp.contribution_mensuelle)}/mois à l'ESPP. Pour optimiser la gestion de tes actions, consulte un expert patrimonial.`,
      ctaLabel: "Prendre rendez-vous",
      ctaUrl: "/expert-booking",
    });
  }

  // Conseils from AI
  if (Array.isArray(data.conseils_optimisation)) {
    data.conseils_optimisation.forEach((conseil: any, i: number) => {
      const text = typeof conseil === "string" ? conseil : conseil?.message || "";
      if (text && !actions.some(a => a.text === text)) {
        actions.push({
          id: `conseil_${i}`,
          priority: 3,
          icon: "💡",
          text,
        });
      }
    });
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

export function getCotisationsGrouped(data: any) {
  const cs = data.cotisations_salariales || {};
  const cp = data.cotisations_patronales || {};

  const retraite = (cs.vieillesse_plafonnee || 0) + (cs.vieillesse_deplafonnee || 0) +
    (cs.retraite_complementaire_tranche1 || 0) + (cs.retraite_complementaire_tranche2 || 0) +
    (cs.ceg_salarie || 0) + (cs.cet_salarie || 0) + (cs.apec_ou_agirc_arrco || 0);

  const sante = (cs.sante_maladie || 0) + (cs.complementaire_sante_salarie || 0) + (cs.prevoyance_salarie || 0);

  const chomage = cs.assurance_chomage || 0;

  const csg = (cs.csg_deductible || 0) + (cs.csg_crds_non_deductible || 0);

  return {
    retraite: { total: retraite, label: "Retraite", icon: "🏦" },
    sante: { total: sante, label: "Santé", icon: "🏥" },
    chomage: { total: chomage, label: "Chômage", icon: "🛡️" },
    csg: { total: csg, label: "CSG/CRDS", icon: "📋" },
  };
}

export const CAS_PARTICULIERS_CONFIG: Record<string, { icon: string; title: string }> = {
  taux_pas_zero: { icon: "⚠️", title: "Taux PAS à 0%" },
  credit_impot: { icon: "🎉", title: "Crédit d'impôt" },
  conge_paternite: { icon: "👶", title: "Congé paternité" },
  absence_longue_duree: { icon: "🏥", title: "Absence longue durée" },
  conges_pris: { icon: "🏖️", title: "Congés pris" },
  prime_exceptionnelle: { icon: "💰", title: "Prime exceptionnelle" },
  entree_ou_sortie_mois: { icon: "📅", title: "Entrée/Sortie" },
  changement_taux_pas: { icon: "📊", title: "Changement taux PAS" },
  actions_gratuites_vesting: { icon: "🎁", title: "Vesting actions gratuites" },
  rsu_massif: { icon: "📈", title: "RSU massif" },
};
