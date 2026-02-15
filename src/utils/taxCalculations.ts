/**
 * Fonctions centralisées de calcul fiscal basées sur les global_settings.
 * Les TaxBracket[] viennent du contexte useFiscalRules() : { seuil, taux }
 * où taux est en pourcentage (ex: 30 = 30%).
 */
import { TaxBracket } from '@/types/global-settings';

// Fallback si jamais les brackets ne sont pas chargés
const DEFAULT_BRACKETS: TaxBracket[] = [
  { seuil: 0, taux: 0 },
  { seuil: 11294, taux: 11 },
  { seuil: 28797, taux: 30 },
  { seuil: 82341, taux: 41 },
  { seuil: 177106, taux: 45 },
];

function ensureBrackets(brackets?: TaxBracket[]): TaxBracket[] {
  return brackets && brackets.length > 0 ? brackets : DEFAULT_BRACKETS;
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
