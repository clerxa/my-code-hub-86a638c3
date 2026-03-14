/**
 * Payslip formatting & helper utilities
 * v3.0 — V3 schema support with V2 backward compatibility.
 */

import type { PayslipData, RemboursementsDeductions } from "@/types/payslip";

const MONTHS = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** Format a number as French currency (e.g. "4 500,00 €") */
export const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
};

/** Short currency format without decimals (e.g. "4 500 €") */
export const fmtShort = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  return Math.round(n).toLocaleString("fr-FR") + " €";
};

/** Format a percentage — always absolute value (e.g. "22,5 %") */
export const fmtPct = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  return Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
};

/** Get a human-readable month label (e.g. "Décembre 2024") */
export const getMonthLabel = (mois: number | null | undefined, annee: number | null | undefined): string => {
  if (!mois || !annee) return "Ce mois-ci";
  return `${MONTHS[mois] || ""} ${annee}`;
};

/** Safe deep property access */
export const safe = (obj: any, ...keys: string[]): any => {
  let val = obj;
  for (const k of keys) {
    if (val == null) return null;
    val = val[k];
  }
  return val;
};

/** Calculate cotisations percentage relative to brut */
export const getCotisationsPct = (data: any): number | null => {
  const brut = data?.remuneration_brute?.total_brut;
  const cot = data?.cotisations_salariales?.total_cotisations_salariales;
  if (!brut || !cot) return null;
  return Math.round((cot / brut) * 100);
};

/** Get priority-based styling for a point d'attention */
export const getPriorityStyle = (priorite: number): { border: string; bg: string; text: string } => {
  switch (priorite) {
    case 1:
      return {
        border: "border-destructive/30",
        bg: "bg-destructive/5",
        text: "text-destructive",
      };
    case 2:
      return {
        border: "border-accent/30",
        bg: "bg-accent/5",
        text: "text-accent-foreground",
      };
    case 3:
    default:
      return {
        border: "border-primary/20",
        bg: "bg-primary/5",
        text: "text-primary",
      };
  }
};

/** Get an emoji icon based on point d'attention id */
export const getPointIcon = (id: string | null | undefined): string => {
  if (!id) return "📌";
  if (id.includes("actions_gratuites")) return "🎁";
  if (id.includes("rsu")) return "📈";
  if (id.includes("espp")) return "🏪";
  if (id.includes("prime")) return "💰";
  if (id.includes("taux_pas") || id.includes("pas_zero")) return "⚠️";
  if (id.includes("conge") || id.includes("absence")) return "🏖️";
  if (id.includes("avantages")) return "🍽️";
  if (id.includes("credit_impot")) return "🎉";
  if (id.includes("ligne_inconnue")) return "❓";
  if (id.includes("entree") || id.includes("sortie")) return "📅";
  if (id.includes("changement")) return "📊";
  if (id.includes("remboursement") || id.includes("frais")) return "💳";
  return "📌";
};

/** Normalize points_attention: handles both string[] and object[] */
export function normalizePointsAttention(raw: any[]): Array<{id: string; priorite: number; titre: string; resume: string; explication_detaillee?: string; a_modal?: boolean}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return {
        id: `point_${i}`,
        priorite: 2,
        titre: "Point d'attention",
        resume: item,
        explication_detaillee: item,
        a_modal: false,
      };
    }
    return {
      id: item.id || `point_${i}`,
      priorite: item.priorite ?? 2,
      titre: item.titre || item.title || "Point d'attention",
      resume: item.resume || item.summary || item.message || "",
      explication_detaillee: item.explication_detaillee || item.resume || "",
      a_modal: item.a_modal ?? !!item.explication_detaillee,
    };
  });
}

/** Normalize actions_recommandees: handles both string[] and object[] */
export function normalizeActions(raw: any[]): Array<{id: string; priorite: number; texte: string; cta_label?: string; cta_url?: string | null}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return { id: `action_${i}`, priorite: 3, texte: item };
    }
    return {
      id: item.id || `action_${i}`,
      priorite: item.priorite ?? 3,
      texte: item.texte || item.text || item.message || "",
      cta_label: item.cta_label,
      cta_url: item.cta_url,
    };
  });
}

/** Group cotisations by category for the detailed view */
export function getCotisationsGrouped(data: any) {
  const cs = data.cotisations_salariales || {};

  const retraite =
    (cs.vieillesse_plafonnee || 0) + (cs.vieillesse_deplafonnee || 0) +
    (cs.retraite_complementaire_tranche1 || 0) + (cs.retraite_complementaire_tranche2 || 0) +
    (cs.ceg_salarie || 0) + (cs.cet_salarie || 0) + (cs.apec_ou_agirc_arrco || 0);

  const sante =
    (cs.sante_maladie || 0) + (cs.complementaire_sante_salarie || 0) + (cs.prevoyance_salarie || 0);

  const chomage = cs.assurance_chomage || 0;

  const csg = (cs.csg_deductible || 0) + (cs.csg_crds_non_deductible || 0);

  return {
    retraite: { total: retraite, label: "Retraite", icon: "🏦" },
    sante: { total: sante, label: "Santé", icon: "🏥" },
    chomage: { total: chomage, label: "Chômage", icon: "🛡️" },
    csg: { total: csg, label: "CSG/CRDS", icon: "📋" },
  };
}

/** Extract displayable remboursements/deductions lines with sign */
export interface RembDeductionLine {
  label: string;
  montant: number;
  sign: "+" | "-";
}

export function getRemboursementsDeductionsLines(data: PayslipData): RembDeductionLine[] {
  const rd = data.remboursements_deductions;
  if (!rd) return [];

  const lines: RembDeductionLine[] = [];

  if (rd.remboursement_frais_professionnels && rd.remboursement_frais_professionnels !== 0) {
    lines.push({ label: "Remboursement frais", montant: Math.abs(rd.remboursement_frais_professionnels), sign: "+" });
  }
  if (rd.tickets_restaurant_part_salarie && rd.tickets_restaurant_part_salarie !== 0) {
    lines.push({ label: "Tickets restaurant (part salarié)", montant: Math.abs(rd.tickets_restaurant_part_salarie), sign: "-" });
  }
  if (rd.reintegration_fiscale && rd.reintegration_fiscale !== 0) {
    lines.push({ label: "Réintégration fiscale", montant: Math.abs(rd.reintegration_fiscale), sign: rd.reintegration_fiscale > 0 ? "+" : "-" });
  }

  // V3: avantages_nature array
  if (rd.avantages_nature && Array.isArray(rd.avantages_nature)) {
    for (const av of rd.avantages_nature) {
      if (av && av.montant_brut && av.montant_brut !== 0) {
        lines.push({ label: av.label || "Avantage en nature déduit", montant: Math.abs(av.montant_brut), sign: "-" });
      }
    }
  }

  // V2 legacy compat
  if (!(rd.avantages_nature && rd.avantages_nature.length > 0)) {
    if ((rd as any).avantage_vehicule_deduit && (rd as any).avantage_vehicule_deduit !== 0) {
      lines.push({ label: "Avantage véhicule déduit", montant: Math.abs((rd as any).avantage_vehicule_deduit), sign: "-" });
    }
    if ((rd as any).avantage_logement_deduit && (rd as any).avantage_logement_deduit !== 0) {
      lines.push({ label: "Avantage logement déduit", montant: Math.abs((rd as any).avantage_logement_deduit), sign: "-" });
    }
  }

  // Autres remboursements
  if (rd.autres_remboursements && Array.isArray(rd.autres_remboursements)) {
    for (const item of rd.autres_remboursements) {
      if (typeof item === "string") {
        lines.push({ label: item, montant: 0, sign: "+" });
      } else if (item && item.montant) {
        lines.push({
          label: item.label || "Autre",
          montant: Math.abs(item.montant),
          sign: item.montant >= 0 ? "+" : "-",
        });
      }
    }
  }

  return lines.filter(l => l.montant > 0);
}

/** Detect if equity is present (V3 has_equity flag or V2 heuristic) */
export function hasEquity(data: PayslipData): boolean {
  const eq = data.remuneration_equity;
  if (!eq) return false;
  // V3 explicit flag
  if (eq.has_equity === true) return true;
  if (eq.has_equity === false) return false;
  // V2 meta fallback
  if (data._meta?.has_equity != null) return data._meta.has_equity;
  // V2 heuristic
  return !!(
    eq.rsu?.detected || eq.rsu_detected || eq.rsu_restricted_stock_units?.gain_brut_total ||
    (eq.actions_gratuites && eq.actions_gratuites.length > 0 && eq.actions_gratuites[0]?.nb_actions) ||
    (eq.actions_gratuites_acquises && eq.actions_gratuites_acquises.length > 0 && eq.actions_gratuites_acquises[0]?.nb_actions) ||
    eq.espp?.detected || eq.espp_detected || eq.espp_employee_stock_purchase_plan?.contribution_mensuelle
  );
}

/** Get primes/commissions list (V3 array or V2 individual fields) */
export function getPrimesCommissions(data: PayslipData): Array<{ label: string; montant: number }> {
  const d = data.remuneration_brute;
  if (!d) return [];

  // V3 array
  if (d.primes_commissions && d.primes_commissions.length > 0) {
    return d.primes_commissions.filter(p => p.montant != null && p.montant !== 0);
  }

  // V2 individual fields
  const items: Array<{ label: string; montant: number }> = [];
  if (d.prime_anciennete) items.push({ label: "Prime ancienneté", montant: d.prime_anciennete });
  if (d.prime_objectifs) items.push({ label: "Prime objectifs", montant: d.prime_objectifs });
  if (d.prime_exceptionnelle) items.push({ label: "Prime exceptionnelle", montant: d.prime_exceptionnelle });
  return items;
}

/** Get absences in days */
export function getAbsencesDays(data: PayslipData): Array<{ label: string; jours: number }> {
  const abs = data.absences;
  if (!abs) {
    // V2 fallback from conges_rtt
    const cr = data.conges_rtt;
    if (!cr) return [];
    const items: Array<{ label: string; jours: number }> = [];
    if (cr.conges_pris_mois && cr.conges_pris_mois > 0) items.push({ label: "Congés payés", jours: cr.conges_pris_mois });
    if (cr.rtt_pris_mois && cr.rtt_pris_mois > 0) items.push({ label: "RTT", jours: cr.rtt_pris_mois });
    return items;
  }

  const items: Array<{ label: string; jours: number }> = [];
  if (abs.conges_payes_jours && abs.conges_payes_jours > 0) items.push({ label: "Congés payés", jours: abs.conges_payes_jours });
  if (abs.rtt_jours && abs.rtt_jours > 0) items.push({ label: "RTT", jours: abs.rtt_jours });
  if (abs.maladie_jours && abs.maladie_jours > 0) items.push({ label: "Maladie", jours: abs.maladie_jours });
  if (abs.autres_absences) {
    for (const a of abs.autres_absences) {
      if (a.jours > 0) items.push({ label: a.label, jours: a.jours });
    }
  }
  return items;
}

/** Get congés/RTT soldes (V3 flat or V2 nested) */
export function getCongesSoldes(data: PayslipData): { congesN1: number | null; congesN: number | null; rtt: number | null } {
  const cr = data.conges_rtt;
  if (!cr) return { congesN1: null, congesN: null, rtt: null };

  return {
    congesN1: cr.conges_n_minus_1_solde ?? cr.conges_n_moins_1?.solde ?? null,
    congesN: cr.conges_n_solde ?? cr.conges_n?.solde ?? null,
    rtt: cr.rtt_solde ?? cr.rtt?.solde ?? null,
  };
}
