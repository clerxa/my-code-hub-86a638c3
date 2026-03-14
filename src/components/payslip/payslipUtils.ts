/**
 * Payslip formatting & helper utilities
 * Simplified for Option 2 Hybrid — backend now provides points_attention & actions_recommandees directly.
 */

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

/** Format a percentage (e.g. "22,5 %") */
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
export const getPointIcon = (id: string): string => {
  if (id.includes("rsu")) return "📈";
  if (id.includes("actions_gratuites")) return "🎁";
  if (id.includes("espp")) return "🏪";
  if (id.includes("prime")) return "💰";
  if (id.includes("taux_pas") || id.includes("pas_zero")) return "⚠️";
  if (id.includes("conge") || id.includes("absence")) return "🏖️";
  if (id.includes("avantages")) return "🍽️";
  if (id.includes("credit_impot")) return "🎉";
  if (id.includes("ligne_inconnue")) return "❓";
  if (id.includes("entree") || id.includes("sortie")) return "📅";
  if (id.includes("changement")) return "📊";
  return "📌";
};

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
