/**
 * Calculs fiscaux ESPP — Section 423 IRC
 * Rabais = imposé comme salaire (TMI + PS 9,7%)
 * Plus-value de cession = PFU 30% (12,8% IR + 17,2% PS)
 */

import type { ESPPPeriod, ESPPPeriodResult, ESPPSimulationResult, ESPPCalculIntermediaire } from '@/types/esppNew';

// ─── Calcul intermédiaire pour une période ───
export function computeIntermediaire(period: ESPPPeriod): ESPPCalculIntermediaire {
  const cours_reference_devise = Math.min(
    period.cours_debut_offre_devise || Infinity,
    period.cours_achat_devise || Infinity
  );
  const safe_ref = isFinite(cours_reference_devise) ? cours_reference_devise : 0;

  const prix_achat_effectif_devise = safe_ref * (1 - period.taux_rabais / 100);
  const taux = period.entreprise_devise === 'USD' ? period.taux_change_achat : 1;
  const prix_achat_effectif_eur = prix_achat_effectif_devise * taux;
  const valeur_marche_achat_eur = period.cours_achat_devise * taux * period.nb_actions_achetees;
  const total_paye_eur = prix_achat_effectif_eur * period.nb_actions_achetees;
  const rabais_eur = valeur_marche_achat_eur - total_paye_eur;

  return {
    cours_reference_devise: safe_ref,
    prix_achat_effectif_devise,
    prix_achat_effectif_eur,
    valeur_marche_achat_eur,
    total_paye_eur,
    rabais_eur: Math.max(0, rabais_eur),
  };
}

// ─── Calcul complet ───
export function calculateESPPSimulation(
  periodes: ESPPPeriod[],
  tmi: number, // ex: 30, 41, etc.
): ESPPSimulationResult {
  const tmiRate = tmi / 100;

  const periodResults: ESPPPeriodResult[] = periodes.map(period => {
    const inter = computeIntermediaire(period);

    // Fiscalité sur le rabais (traitement salaire)
    const ir_rabais = inter.rabais_eur * tmiRate;
    const ps_rabais = inter.rabais_eur * 0.097;
    const gain_net_rabais = inter.rabais_eur - ir_rabais - ps_rabais;

    // Plus-value de cession
    let pv_brute = 0;
    let ir_pv = 0;
    let ps_pv = 0;
    let pfu = 0;
    let gain_net_pv = 0;
    let is_moins_value = false;

    if (period.has_sold && period.prix_cession_devise > 0) {
      const taux_cession = period.entreprise_devise === 'USD' ? period.taux_change_cession : 1;
      const prix_cession_eur = period.prix_cession_devise * taux_cession;
      const taux_achat = period.entreprise_devise === 'USD' ? period.taux_change_achat : 1;
      const cours_achat_eur = period.cours_achat_devise * taux_achat;
      
      // Base PV = cours au jour de l'achat (pas le prix payé après décote)
      pv_brute = (prix_cession_eur - cours_achat_eur) * period.nb_actions_achetees;

      if (pv_brute < 0) {
        is_moins_value = true;
        gain_net_pv = pv_brute; // la moins-value reste négative
        pv_brute = 0; // pas d'impôt
      } else {
        ir_pv = pv_brute * 0.128;
        ps_pv = pv_brute * 0.172;
        pfu = pv_brute * 0.30;
        gain_net_pv = pv_brute - pfu;
      }
    }

    const gain_brut = inter.rabais_eur + pv_brute;
    const total_impots = ir_rabais + ps_rabais + pfu;
    const gain_net = gain_net_rabais + gain_net_pv;

    return {
      period_id: period.id,
      entreprise_nom: period.entreprise_nom,
      nb_actions: period.nb_actions_achetees,
      rabais_brut: inter.rabais_eur,
      ir_rabais,
      ps_rabais,
      gain_net_rabais,
      has_sold: period.has_sold,
      pv_brute,
      ir_pv,
      ps_pv,
      pfu,
      gain_net_pv,
      is_moins_value,
      gain_brut,
      total_impots,
      gain_net,
    };
  });

  // Totaux consolidés
  const rabais_brut_total = periodResults.reduce((s, p) => s + p.rabais_brut, 0);
  const ir_rabais_total = periodResults.reduce((s, p) => s + p.ir_rabais, 0);
  const ps_rabais_total = periodResults.reduce((s, p) => s + p.ps_rabais, 0);
  const gain_net_rabais_total = periodResults.reduce((s, p) => s + p.gain_net_rabais, 0);
  const pv_brute_total = periodResults.reduce((s, p) => s + p.pv_brute, 0);
  const pfu_total = periodResults.reduce((s, p) => s + p.pfu, 0);
  const gain_net_pv_total = periodResults.reduce((s, p) => s + p.gain_net_pv, 0);
  const gain_brut_total = rabais_brut_total + pv_brute_total;
  const total_impots = ir_rabais_total + ps_rabais_total + pfu_total;
  const gain_net_total = gain_brut_total - total_impots;
  const taux_effectif = gain_brut_total > 0 ? (total_impots / gain_brut_total) * 100 : 0;

  return {
    periodes: periodResults,
    rabais_brut_total,
    ir_rabais_total,
    ps_rabais_total,
    gain_net_rabais_total,
    pv_brute_total,
    pfu_total,
    gain_net_pv_total,
    gain_brut_total,
    total_impots,
    gain_net_total,
    taux_effectif,
  };
}
