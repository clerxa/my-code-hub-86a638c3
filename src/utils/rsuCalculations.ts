/**
 * Calculs fiscaux RSU centralisés
 * Utilise les règles de global_settings via FiscalRules
 */

import type { FiscalRules } from '@/types/global-settings';
import type { RSUPlan, RSUCessionParams, RSUPlanResult, RSUSimulationResult } from '@/types/rsu';

// Defaults basés sur la législation 2024/2025
const DEFAULT_RSU_RULES = {
  // R1 Qualifié post 30/12/2016
  rsu_q_abattement_taux: 50,
  rsu_q_abattement_seuil: 300000,
  rsu_q_contribution_patronale: 0, // payée par l'employeur
  rsu_q_csg_crds_rate: 9.7,
  rsu_q_csg_deductible: 6.8,
  rsu_q_contribution_salariale_excedent: 10,
  // R3 Non qualifié
  rsu_nq_charges_sociales_salarie: 0, // intégré au salaire, déjà précompté
  // PV cession
  rsu_pv_cession_pfu_ir: 12.8,
  rsu_pv_cession_ps: 17.2,
  // PS standard
  social_charges_rate: 17.2,
};

function getRules(fiscalRules?: Partial<FiscalRules>) {
  return { ...DEFAULT_RSU_RULES, ...fiscalRules };
}

function calculatePlanResult(
  plan: RSUPlan,
  params: RSUCessionParams,
  rules: ReturnType<typeof getRules>,
  seuilRestant: number
): { result: RSUPlanResult; seuilConsomme: number } {
  const nbActionsTotal = plan.vestings.reduce((s, v) => s + v.nb_rsu, 0);
  const gainAcquisitionEur = plan.gain_acquisition_total;

  // Calcul PV de cession
  const coursVenteEur = plan.devise === 'USD'
    ? params.prix_vente * params.taux_change_vente
    : params.prix_vente;

  // PRU moyen pondéré en EUR
  const totalCoutAcquisition = plan.vestings.reduce((s, v) => {
    const coursEur = plan.devise === 'USD' ? v.cours * v.taux_change : v.cours;
    return s + (coursEur * v.nb_rsu);
  }, 0);
  const pvCessionEur = Math.max(0, (coursVenteEur * nbActionsTotal) - totalCoutAcquisition);

  let irGainAcquisition = 0;
  let psGainAcquisition = 0;
  let contributionSalariale = 0;
  let csgCrds = 0;

  if (plan.regime === 'R1') {
    // Régime qualifié post 30/12/2016
    // Abattement de 50% sur la fraction ≤ 300k€
    const fractionAbattue = Math.min(gainAcquisitionEur, seuilRestant);
    const fractionExcedent = Math.max(0, gainAcquisitionEur - seuilRestant);
    const seuilConsomme = fractionAbattue;

    const baseApresAbattement = fractionAbattue * (1 - rules.rsu_q_abattement_taux / 100) + fractionExcedent;
    irGainAcquisition = baseApresAbattement * (params.tmi / 100);

    // CSG/CRDS sur le gain total (pas d'abattement)
    csgCrds = gainAcquisitionEur * (rules.rsu_q_csg_crds_rate / 100);

    // Contribution salariale de 10% sur l'excédent > 300k
    contributionSalariale = fractionExcedent * (rules.rsu_q_contribution_salariale_excedent / 100);

    // PS = 0 pour le gain d'acquisition qualifié (déjà couvert par CSG/CRDS)
    psGainAcquisition = 0;

    // PV cession : PFU
    const irPvCession = pvCessionEur * (rules.rsu_pv_cession_pfu_ir / 100);
    const psPvCession = pvCessionEur * (rules.rsu_pv_cession_ps / 100);

    const totalImpots = irGainAcquisition + csgCrds + contributionSalariale + irPvCession + psPvCession;

    return {
      result: {
        plan_id: plan.id,
        plan_nom: plan.nom,
        regime: plan.regime,
        devise: plan.devise,
        nb_actions_total: nbActionsTotal,
        gain_acquisition_eur: gainAcquisitionEur,
        pv_cession_eur: pvCessionEur,
        ir_gain_acquisition: irGainAcquisition,
        ps_gain_acquisition: psGainAcquisition,
        contribution_salariale: contributionSalariale,
        csg_crds: csgCrds,
        ir_pv_cession: irPvCession,
        ps_pv_cession: psPvCession,
        total_impots: totalImpots,
        gain_net: gainAcquisitionEur + pvCessionEur - totalImpots,
      },
      seuilConsomme,
    };
  } else if (plan.regime === 'R2') {
    // Régime qualifié 08/2015 - 12/2016 : même logique que R1 mais contribution salariale dès le 1er euro > seuil
    const fractionAbattue = Math.min(gainAcquisitionEur, seuilRestant);
    const fractionExcedent = Math.max(0, gainAcquisitionEur - seuilRestant);
    const seuilConsomme = fractionAbattue;

    const baseApresAbattement = fractionAbattue * (1 - rules.rsu_q_abattement_taux / 100) + fractionExcedent;
    irGainAcquisition = baseApresAbattement * (params.tmi / 100);
    csgCrds = gainAcquisitionEur * (rules.rsu_q_csg_crds_rate / 100);
    contributionSalariale = fractionExcedent * (rules.rsu_q_contribution_salariale_excedent / 100);

    const irPvCession = pvCessionEur * (rules.rsu_pv_cession_pfu_ir / 100);
    const psPvCession = pvCessionEur * (rules.rsu_pv_cession_ps / 100);

    const totalImpots = irGainAcquisition + csgCrds + contributionSalariale + irPvCession + psPvCession;

    return {
      result: {
        plan_id: plan.id,
        plan_nom: plan.nom,
        regime: plan.regime,
        devise: plan.devise,
        nb_actions_total: nbActionsTotal,
        gain_acquisition_eur: gainAcquisitionEur,
        pv_cession_eur: pvCessionEur,
        ir_gain_acquisition: irGainAcquisition,
        ps_gain_acquisition: psGainAcquisition,
        contribution_salariale: contributionSalariale,
        csg_crds: csgCrds,
        ir_pv_cession: irPvCession,
        ps_pv_cession: psPvCession,
        total_impots: totalImpots,
        gain_net: gainAcquisitionEur + pvCessionEur - totalImpots,
      },
      seuilConsomme,
    };
  } else {
    // R3 Non qualifié : gain d'acquisition taxé comme salaire
    irGainAcquisition = gainAcquisitionEur * (params.tmi / 100);
    psGainAcquisition = gainAcquisitionEur * (rules.social_charges_rate / 100);

    const irPvCession = pvCessionEur * (rules.rsu_pv_cession_pfu_ir / 100);
    const psPvCession = pvCessionEur * (rules.rsu_pv_cession_ps / 100);

    const totalImpots = irGainAcquisition + psGainAcquisition + irPvCession + psPvCession;

    return {
      result: {
        plan_id: plan.id,
        plan_nom: plan.nom,
        regime: plan.regime,
        devise: plan.devise,
        nb_actions_total: nbActionsTotal,
        gain_acquisition_eur: gainAcquisitionEur,
        pv_cession_eur: pvCessionEur,
        ir_gain_acquisition: irGainAcquisition,
        ps_gain_acquisition: psGainAcquisition,
        contribution_salariale: 0,
        csg_crds: 0,
        ir_pv_cession: irPvCession,
        ps_pv_cession: psPvCession,
        total_impots: totalImpots,
        gain_net: gainAcquisitionEur + pvCessionEur - totalImpots,
      },
      seuilConsomme: 0,
    };
  }
}

export function calculateRSUSimulation(
  plans: RSUPlan[],
  params: RSUCessionParams,
  fiscalRules?: Partial<FiscalRules>
): RSUSimulationResult {
  const rules = getRules(fiscalRules);
  const seuil300k = rules.rsu_q_abattement_seuil;

  let seuilRestant = seuil300k;
  const planResults: RSUPlanResult[] = [];

  // Traiter les plans qualifiés d'abord (R1, R2) pour le seuil mutualisé
  const sortedPlans = [...plans].sort((a, b) => {
    const order = { R1: 0, R2: 1, R3: 2 };
    return order[a.regime] - order[b.regime];
  });

  for (const plan of sortedPlans) {
    const { result, seuilConsomme } = calculatePlanResult(plan, params, rules, seuilRestant);
    planResults.push(result);
    seuilRestant -= seuilConsomme;
  }

  const gainBrutTotal = planResults.reduce((s, r) => s + r.gain_acquisition_eur + r.pv_cession_eur, 0);
  const totalImpots = planResults.reduce((s, r) => s + r.total_impots, 0);
  const gainNetTotal = planResults.reduce((s, r) => s + r.gain_net, 0);

  return {
    plans: planResults,
    gain_brut_total: gainBrutTotal,
    total_impots: totalImpots,
    gain_net_total: gainNetTotal,
    taux_effectif: gainBrutTotal > 0 ? (totalImpots / gainBrutTotal) * 100 : 0,
    seuil_300k_applique: seuilRestant < seuil300k,
    total_ir: planResults.reduce((s, r) => s + r.ir_gain_acquisition + r.ir_pv_cession, 0),
    total_ps: planResults.reduce((s, r) => s + r.ps_gain_acquisition + r.ps_pv_cession, 0),
    total_contribution_salariale: planResults.reduce((s, r) => s + r.contribution_salariale, 0),
    total_csg_crds: planResults.reduce((s, r) => s + r.csg_crds, 0),
  };
}
