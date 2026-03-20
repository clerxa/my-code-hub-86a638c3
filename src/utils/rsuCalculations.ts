/**
 * Calculs fiscaux RSU centralisés — Règles détaillées
 * 
 * Étapes 1→9 : gain d'acquisition, PV cession, consolidation R1/R2,
 * fiscalité par régime, totaux consolidés.
 */

import type { RSUPlan, RSUCessionParams, RSUPlanResult, RSUSimulationResult } from '@/types/rsu';

// ─── ÉTAPE 1 — Gain d'acquisition par vesting ───
// gain_vesting_eur = nb_rsu × cours × taux_change (1 si EUR)
// → déjà calculé en temps réel dans RSUPlanEditor (computedVestings)

// ─── ÉTAPE 2 — Gain total par plan ───
function getPlanAggregates(plan: RSUPlan) {
  const nb_rsu_plan = plan.vestings.reduce((s, v) => s + v.nb_rsu, 0);
  const plan_gain_eur = plan.gain_acquisition_total; // Σ gain_vesting_eur
  const valeur_moy_acq_eur = nb_rsu_plan > 0 ? plan_gain_eur / nb_rsu_plan : 0;
  return { nb_rsu_plan, plan_gain_eur, valeur_moy_acq_eur };
}

// ─── ÉTAPE 3 — Plus-value de cession par plan ───
function getPVCession(plan: RSUPlan, params: RSUCessionParams) {
  const { nb_rsu_plan, valeur_moy_acq_eur } = getPlanAggregates(plan);
  const prix_cession_eur = plan.devise === 'USD'
    ? params.prix_vente * params.taux_change_vente
    : params.prix_vente;

  const pv_raw = nb_rsu_plan * (prix_cession_eur - valeur_moy_acq_eur);
  const moins_value = pv_raw < 0 ? Math.abs(pv_raw) : 0;
  const pv_plan = Math.max(0, pv_raw);

  return { pv_plan, moins_value, nb_rsu_plan, prix_cession_eur, valeur_moy_acq_eur };
}

// ─── Helper — Date de référence pour le calcul d'abattement ───
// Pour les plans qualifiés (R1/R2), la durée de détention se calcule
// à partir de la date de fin de conservation (obligatoire).
// Fallback sur le dernier vesting si non renseignée.
function getDateReferenceConservation(plan: RSUPlan): Date | null {
  if (plan.date_fin_conservation) {
    return new Date(plan.date_fin_conservation);
  }
  // Fallback : dernier vesting
  const lastVestingDate = plan.vestings
    .filter(v => v.date)
    .map(v => new Date(v.date))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  return lastVestingDate || null;
}

// ─── ÉTAPE 5bis/6 — Abattement pour durée de détention (R1 et R2) ───
// Règle : 0% si < 2 ans, 50% si 2-8 ans, 65% si > 8 ans
// après la fin de la période de conservation
function getAbattementDureeDetention(plan: RSUPlan, dateCession: Date): number {
  const dateRef = getDateReferenceConservation(plan);
  if (!dateRef) return 0;

  const diffMs = dateCession.getTime() - dateRef.getTime();
  const dureeAnnees = diffMs / (1000 * 60 * 60 * 24 * 365.25);

  if (dureeAnnees < 2) return 0;
  if (dureeAnnees < 8) return 0.50;
  return 0.65;
}

// ─── CALCUL PRINCIPAL ───
export function calculateRSUSimulation(
  plans: RSUPlan[],
  params: RSUCessionParams,
): RSUSimulationResult {
  const dateCession = params.date_cession ? new Date(params.date_cession) : new Date();

  // Séparer par régime
  const plansR1 = plans.filter(p => p.regime === 'R1');
  const plansR2 = plans.filter(p => p.regime === 'R2');
  const plansR3 = plans.filter(p => p.regime === 'R3');

  // ─── ÉTAPE 3 — PV cession par plan ───
  const planPVs = new Map<string, { pv_plan: number; moins_value: number; nb_rsu_plan: number }>();
  for (const plan of plans) {
    planPVs.set(plan.id, getPVCession(plan, params));
  }

  // ─── ÉTAPE 4 — Consolidation R1 + R2 ───
  const gain_R1 = plansR1.reduce((s, p) => s + p.gain_acquisition_total, 0);
  const gain_R2 = plansR2.reduce((s, p) => s + p.gain_acquisition_total, 0);
  const gain_consolide_R1R2 = gain_R1 + gain_R2;
  const tranche_A = Math.min(gain_consolide_R1R2, 300000);
  const tranche_B = Math.max(0, gain_consolide_R1R2 - 300000);

  // ─── ÉTAPE 5 — Fiscalité R1 (plan par plan avec abattement conditionnel) ───
  const tmi = params.tmi / 100;
  const totalR1Gain = gain_R1;

  // Calculer abattement et fiscalité R1 par plan
  const r1Details = new Map<string, { ir: number; ps: number; abattement: number; contrib: number }>();
  let ir_R1_total = 0;
  let ps_R1_total = 0;
  let contrib_R1_total = 0;

  for (const plan of plansR1) {
    const abattement = getAbattementDureeDetention(plan, dateCession);
    const ratio = totalR1Gain > 0 ? plan.gain_acquisition_total / totalR1Gain : 0;
    const planTrancheA = tranche_A * ratio;
    const planTrancheB = tranche_B * ratio;

    // Tranche A : abattement conditionnel (pas systématiquement 50%)
    const base_ir_A = planTrancheA * (1 - abattement);
    const ir_A_plan = base_ir_A * tmi;
    const ps_A_plan = planTrancheA * 0.172; // PS sur assiette AVANT abattement

    // Tranche B : pas d'abattement, imposé au TMI + PS 9.7% + contrib 10%
    const ir_B_plan = planTrancheB * tmi;
    const ps_B_plan = planTrancheB * 0.097;
    const contrib_plan = planTrancheB * 0.10;

    const ir_plan = ir_A_plan + ir_B_plan;
    const ps_plan = ps_A_plan + ps_B_plan;

    ir_R1_total += ir_plan;
    ps_R1_total += ps_plan;
    contrib_R1_total += contrib_plan;
    r1Details.set(plan.id, { ir: ir_plan, ps: ps_plan, abattement, contrib: contrib_plan });
  }

  // ─── ÉTAPE 6 — Fiscalité R2 (plan par plan) ───
  let ir_R2_total = 0;
  let ps_R2_total = 0;
  let contrib_R2_total = 0;
  const r2Details = new Map<string, { ir: number; ps: number; abattement: number; contrib: number }>();

  for (const plan of plansR2) {
    const abattement = getAbattementDureeDetention(plan, dateCession);
    const base_ir = plan.gain_acquisition_total * (1 - abattement);
    const ir_plan = base_ir * tmi;
    const ps_plan = plan.gain_acquisition_total * 0.172; // assiette AVANT abattement
    const contrib_plan = plan.gain_acquisition_total * 0.10; // contribution salariale 10%
    ir_R2_total += ir_plan;
    ps_R2_total += ps_plan;
    contrib_R2_total += contrib_plan;
    r2Details.set(plan.id, { ir: ir_plan, ps: ps_plan, abattement, contrib: contrib_plan });
  }

  // ─── ÉTAPE 7 — Fiscalité R3 ───
  const gain_R3 = plansR3.reduce((s, p) => s + p.gain_acquisition_total, 0);
  const ir_R3 = gain_R3 * tmi;
  const ps_R3 = gain_R3 * 0.097;
  const contrib_R3 = gain_R3 * 0.10;

  // ─── ÉTAPE 8 — PV cession (tous régimes, PFU) ───
  let pv_totale = 0;
  for (const [, pv] of planPVs) {
    pv_totale += pv.pv_plan;
  }
  const ir_pv = pv_totale * 0.128;
  const ps_pv = pv_totale * 0.172;

  // ─── ÉTAPE 9 — Totaux consolidés ───
  const total_ir = ir_R1_total + ir_R2_total + ir_R3 + ir_pv;
  const total_ps = ps_R1_total + ps_R2_total + ps_R3 + ps_pv;
  const total_contrib = contrib_R1_total + contrib_R3;
  const total_impots = total_ir + total_ps + total_contrib;
  const gain_brut_total = gain_consolide_R1R2 + gain_R3 + pv_totale;
  const gain_net = gain_brut_total - total_impots;
  const taux_effectif = gain_brut_total > 0 ? (total_impots / gain_brut_total) * 100 : 0;

  // ─── Construire les résultats plan par plan ───
  const planResults: RSUPlanResult[] = plans.map(plan => {
    const pvData = planPVs.get(plan.id)!;
    const { nb_rsu_plan } = getPlanAggregates(plan);
    let ir_ga = 0, ps_ga = 0, contrib_sal = 0, csg_crds = 0;
    let abattement = 0;

    if (plan.regime === 'R1') {
      const detail = r1Details.get(plan.id)!;
      ir_ga = detail.ir;
      ps_ga = detail.ps;
      contrib_sal = detail.contrib;
      abattement = detail.abattement;
      csg_crds = 0;
    } else if (plan.regime === 'R2') {
      const detail = r2Details.get(plan.id)!;
      ir_ga = detail.ir;
      ps_ga = detail.ps;
      abattement = detail.abattement;
      contrib_sal = 0;
      csg_crds = 0;
    } else {
      // R3 — pas d'abattement
      ir_ga = plan.gain_acquisition_total * tmi;
      ps_ga = plan.gain_acquisition_total * 0.097;
      contrib_sal = plan.gain_acquisition_total * 0.10;
      csg_crds = 0;
    }

    // PV cession par plan (PFU)
    const ir_pv_plan = pvData.pv_plan * 0.128;
    const ps_pv_plan = pvData.pv_plan * 0.172;

    const totalImPlan = ir_ga + ps_ga + contrib_sal + csg_crds + ir_pv_plan + ps_pv_plan;

    return {
      plan_id: plan.id,
      plan_nom: plan.nom,
      regime: plan.regime,
      devise: plan.devise,
      nb_actions_total: nb_rsu_plan,
      gain_acquisition_eur: plan.gain_acquisition_total,
      pv_cession_eur: pvData.pv_plan,
      abattement_duree_detention: abattement,
      ir_gain_acquisition: ir_ga,
      ps_gain_acquisition: ps_ga,
      contribution_salariale: contrib_sal,
      csg_crds,
      ir_pv_cession: ir_pv_plan,
      ps_pv_cession: ps_pv_plan,
      total_impots: totalImPlan,
      gain_net: plan.gain_acquisition_total + pvData.pv_plan - totalImPlan,
    };
  });

  return {
    plans: planResults,
    gain_brut_total,
    total_impots,
    gain_net_total: gain_net,
    taux_effectif,
    seuil_300k_applique: gain_consolide_R1R2 > 300000,
    total_ir,
    total_ps,
    total_contribution_salariale: total_contrib,
    total_csg_crds: 0, // CSG/CRDS intégrée dans PS pour simplification affichage
  };
}
