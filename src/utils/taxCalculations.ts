/**
 * Fonctions centralisées de calcul fiscal basées sur les global_settings.
 * Les TaxBracket[] viennent du contexte useFiscalRules() : { seuil, taux }
 * où taux est en pourcentage (ex: 30 = 30%).
 */
import { TaxBracket, FiscalRules } from '@/types/global-settings';

// Fallback si jamais les brackets ne sont pas chargés
const DEFAULT_BRACKETS: TaxBracket[] = [
  { seuil: 0, taux: 0 },
  { seuil: 11294, taux: 11 },
  { seuil: 28797, taux: 30 },
  { seuil: 82341, taux: 41 },
  { seuil: 177106, taux: 45 },
];

/** Paramètres par défaut pour le quotient familial */
const DEFAULT_QF = {
  qf_base_celibataire: 1,
  qf_base_couple: 2,
  qf_base_veuf_avec_enfants: 1.5,
  qf_enfant_1: 0.5,
  qf_enfant_2: 0.5,
  qf_enfant_suivant: 1,
  qf_bonus_parent_isole: 0.5,
  qf_plafond_demi_part: 1759,
};

function ensureBrackets(brackets?: TaxBracket[]): TaxBracket[] {
  return brackets && brackets.length > 0 ? brackets : DEFAULT_BRACKETS;
}

/**
 * Calcule le nombre de parts fiscales selon la situation familiale et le nombre d'enfants.
 * Utilise les règles configurables de global_settings (FiscalRules).
 */
export function calculatePartsFiscales(
  statut: string,
  nbEnfants: number,
  rules?: Partial<FiscalRules>,
): number {
  const qf = {
    ...DEFAULT_QF,
    ...(rules ? {
      qf_base_celibataire: rules.qf_base_celibataire ?? DEFAULT_QF.qf_base_celibataire,
      qf_base_couple: rules.qf_base_couple ?? DEFAULT_QF.qf_base_couple,
      qf_base_veuf_avec_enfants: rules.qf_base_veuf_avec_enfants ?? DEFAULT_QF.qf_base_veuf_avec_enfants,
      qf_enfant_1: rules.qf_enfant_1 ?? DEFAULT_QF.qf_enfant_1,
      qf_enfant_2: rules.qf_enfant_2 ?? DEFAULT_QF.qf_enfant_2,
      qf_enfant_suivant: rules.qf_enfant_suivant ?? DEFAULT_QF.qf_enfant_suivant,
      qf_bonus_parent_isole: rules.qf_bonus_parent_isole ?? DEFAULT_QF.qf_bonus_parent_isole,
    } : {}),
  };

  let parts: number;

  switch (statut) {
    case 'marie':
    case 'pacs':
    case 'pacse':
      parts = qf.qf_base_couple;
      break;
    case 'veuf':
      parts = nbEnfants > 0 ? qf.qf_base_veuf_avec_enfants : qf.qf_base_celibataire;
      break;
    default: // celibataire, divorce, separe, union-libre
      parts = qf.qf_base_celibataire;
  }

  // Enfants à charge
  if (nbEnfants >= 1) parts += qf.qf_enfant_1;
  if (nbEnfants >= 2) parts += qf.qf_enfant_2;
  if (nbEnfants >= 3) parts += (nbEnfants - 2) * qf.qf_enfant_suivant;

  // Bonus parent isolé
  const isParentIsole = ['celibataire', 'divorce', 'separe', 'veuf'].includes(statut);
  if (isParentIsole && nbEnfants > 0) {
    parts += qf.qf_bonus_parent_isole;
  }

  return parts;
}

/**
 * Retourne le plafond du quotient familial par demi-part supplémentaire.
 */
export function getPlafondDemiPart(rules?: Partial<FiscalRules>): number {
  return rules?.qf_plafond_demi_part ?? DEFAULT_QF.qf_plafond_demi_part;
}

/**
 * Calcule la TMI (Taux Marginal d'Imposition) à partir du revenu imposable et des parts fiscales.
 * Retourne le taux en pourcentage (ex: 30).
 */
export function calculateTMI(
  revenuImposable: number,
  partsFiscales: number,
  brackets?: TaxBracket[],
): number {
  if (!revenuImposable || !partsFiscales || partsFiscales === 0) return 0;
  const sorted = [...ensureBrackets(brackets)].sort((a, b) => a.seuil - b.seuil);
  const quotient = revenuImposable / partsFiscales;

  let tmi = 0;
  for (const bracket of sorted) {
    if (quotient > bracket.seuil) {
      tmi = bracket.taux;
    }
  }
  return tmi;
}

/**
 * Calcule l'impôt annuel brut à partir du revenu imposable et des parts fiscales.
 */
export function calculateImpotAnnuel(
  revenuImposable: number,
  partsFiscales: number,
  brackets?: TaxBracket[],
): number {
  if (!revenuImposable || !partsFiscales || partsFiscales === 0) return 0;
  const sorted = [...ensureBrackets(brackets)].sort((a, b) => a.seuil - b.seuil);
  const quotient = revenuImposable / partsFiscales;

  let impot = 0;
  let prev = 0;
  for (let i = 0; i < sorted.length; i++) {
    const tauxDecimal = sorted[i].taux / 100;
    const plafond = i < sorted.length - 1 ? sorted[i + 1].seuil : Infinity;
    const taxable = Math.min(quotient, plafond) - prev;
    if (taxable > 0) impot += taxable * tauxDecimal;
    prev = plafond;
    if (quotient <= plafond) break;
  }
  return Math.round(impot * partsFiscales);
}

/**
 * Calcule l'impôt détaillé par tranche (pour le hook useImpotsCalculations).
 * Retourne { impot, tauxMarginal }.
 */
export function calculateImpotDetaille(
  revenuImposable: number,
  partsFiscales: number,
  brackets?: TaxBracket[],
): { impot: number; tauxMarginal: number } {
  if (!revenuImposable || !partsFiscales || partsFiscales === 0) {
    return { impot: 0, tauxMarginal: 0 };
  }
  const sorted = [...ensureBrackets(brackets)].sort((a, b) => a.seuil - b.seuil);
  const quotient = revenuImposable / partsFiscales;

  let impotParPart = 0;
  let tauxMarginal = 0;
  let prev = 0;

  for (let i = 0; i < sorted.length; i++) {
    const tauxDecimal = sorted[i].taux / 100;
    const plafond = i < sorted.length - 1 ? sorted[i + 1].seuil : Infinity;
    const taxable = Math.min(quotient, plafond) - prev;
    if (taxable > 0) {
      impotParPart += taxable * tauxDecimal;
      tauxMarginal = sorted[i].taux;
    }
    prev = plafond;
    if (quotient <= plafond) break;
  }

  return { impot: impotParPart * partsFiscales, tauxMarginal };
}
