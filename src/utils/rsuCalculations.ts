/**
 * Calculs fiscaux RSU — 6 régimes AGA + Non qualifié
 *
 * AGA_PRE2012   — IR forfaitaire 30%, pas d'abattement
 * AGA_2012_2015 — Barème IR (TMI), PS 15,5%, pas d'abattement
 * AGA_2015_2016 — Barème IR (TMI) + abattement durée détention, PS 17,2% avant abattement
 * AGA_2017      — Barème IR (TMI) + abattement durée détention, seuil 300k, PS 17,2%, contrib 10%
 * AGA_POST2018  — Barème IR (TMI) + abattement 50% fixe sous 300k, PS 17,2%, contrib 10%
 * NON_QUALIFIE  — Barème IR (TMI) + cotisations salariales, PFU 30% sur PV
 */

import type { RSUPlan, RSUCessionParams, RSUPlanResult, RSUSimulationResult } from '@/types/rsu';

// ─── Agrégats par plan ───
function getPlanAggregates(plan: RSUPlan) {
  const nb_rsu_plan = plan.vestings.reduce((s, v) => s + v.nb_rsu, 0);
  const plan_gain_eur = plan.gain_acquisition_total;
  const valeur_moy_acq_eur = nb_rsu_plan > 0 ? plan_gain_eur / nb_rsu_plan : 0;
  return { nb_rsu_plan, plan_gain_eur, valeur_moy_acq_eur };
}

// ─── PV de cession par plan ───
function getPVCession(plan: RSUPlan, params: RSUCessionParams) {
  const { nb_rsu_plan, valeur_moy_acq_eur } = getPlanAggregates(plan);
  const prix_cession_eur = plan.devise === 'USD'
    ? params.prix_vente * params.taux_change_vente
    : params.prix_vente;

  const pv_raw = nb_rsu_plan * (prix_cession_eur - valeur_moy_acq_eur);
  const pv_plan = Math.max(0, pv_raw);
  return { pv_plan, nb_rsu_plan, prix_cession_eur, valeur_moy_acq_eur };
}

// ─── Abattement pour durée de détention (AGA_2015_2016 & AGA_2017) ───
function getAbattementDureeDetention(plan: RSUPlan, dateCession: Date): number {
  if (!plan.date_fin_conservation) return 0;
  const dateRef = new Date(plan.date_fin_conservation);
  const diffMs = dateCession.getTime() - dateRef.getTime();
  const dureeAnnees = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  if (dureeAnnees < 2) return 0;
  if (dureeAnnees < 8) return 0.50;
  return 0.65;
}

// ─── Fiscalité gain d'acquisition par plan ───
interface GainTaxDetail {
  ir: number;
  ps: number;
  contrib: number;
  abattement: number;
}

function computeGainTax(plan: RSUPlan, tmi: number, dateCession: Date): GainTaxDetail {
  const gain = plan.gain_acquisition_total;
  const tmiRate = tmi / 100;

  switch (plan.regime) {
    case 'AGA_PRE2012': {
      // Taux forfaitaire 30% fixe, pas d'abattement, pas de contrib
      return { ir: gain * 0.30, ps: gain * 0.155, contrib: 0, abattement: 0 };
    }

    case 'AGA_2012_2015': {
      // Barème IR (TMI), PS 15,5% historique, pas d'abattement
      return { ir: gain * tmiRate, ps: gain * 0.155, contrib: 0, abattement: 0 };
    }

    case 'AGA_2015_2016': {
      // Barème IR après abattement conditionnel, PS 17,2% avant abattement
      const abattement = getAbattementDureeDetention(plan, dateCession);
      const baseIR = gain * (1 - abattement);
      return { ir: baseIR * tmiRate, ps: gain * 0.172, contrib: 0, abattement };
    }

    case 'AGA_2017': {
      // Seuil 300k: tranche A = abattement conditionnel, tranche B = barème salaires
      const abattement = getAbattementDureeDetention(plan, dateCession);
      const trancheA = Math.min(gain, 300000);
      const trancheB = Math.max(0, gain - 300000);

      const irA = trancheA * (1 - abattement) * tmiRate;
      const psA = trancheA * 0.172;
      const irB = trancheB * tmiRate;
      const psB = trancheB * 0.097;
      const contrib = trancheB * 0.10;

      return { ir: irA + irB, ps: psA + psB, contrib, abattement };
    }

    case 'AGA_POST2018': {
      // Abattement fixe 50% sous 300k, barème salaires au-delà
      const trancheA = Math.min(gain, 300000);
      const trancheB = Math.max(0, gain - 300000);

      const irA = trancheA * 0.50 * tmiRate; // abattement fixe 50%
      const psA = trancheA * 0.172;
      const irB = trancheB * tmiRate;
      const psB = trancheB * 0.097;
      const contrib = trancheB * 0.10;

      return { ir: irA + irB, ps: psA + psB, contrib, abattement: 0.50 };
    }

    case 'NON_QUALIFIE': {
      // Barème IR + cotisations salariales complètes, pas d'abattement
      return { ir: gain * tmiRate, ps: gain * 0.097, contrib: gain * 0.10, abattement: 0 };
    }

    default:
      return { ir: 0, ps: 0, contrib: 0, abattement: 0 };
  }
}

// ─── CALCUL PRINCIPAL ───
export function calculateRSUSimulation(
  plans: RSUPlan[],
  params: RSUCessionParams,
): RSUSimulationResult {
  const dateCession = params.date_cession ? new Date(params.date_cession) : new Date();

  // PV cession par plan
  const planPVs = new Map<string, ReturnType<typeof getPVCession>>();
  for (const plan of plans) {
    planPVs.set(plan.id, getPVCession(plan, params));
  }

  // Fiscalité gain d'acquisition par plan
  const planTaxes = new Map<string, GainTaxDetail>();
  let totalIR_GA = 0, totalPS_GA = 0, totalContrib = 0;

  for (const plan of plans) {
    const tax = computeGainTax(plan, params.tmi, dateCession);
    planTaxes.set(plan.id, tax);
    totalIR_GA += tax.ir;
    totalPS_GA += tax.ps;
    totalContrib += tax.contrib;
  }

  // PV cession totale → PFU
  let pv_totale = 0;
  for (const [, pv] of planPVs) {
    pv_totale += pv.pv_plan;
  }
  const ir_pv = pv_totale * 0.128;
  const ps_pv = pv_totale * 0.172;

  // Totaux
  const totalGainAcq = plans.reduce((s, p) => s + p.gain_acquisition_total, 0);
  const total_ir = totalIR_GA + ir_pv;
  const total_ps = totalPS_GA + ps_pv;
  const total_impots = total_ir + total_ps + totalContrib;
  const gain_brut_total = totalGainAcq + pv_totale;
  const gain_net = gain_brut_total - total_impots;
  const taux_effectif = gain_brut_total > 0 ? (total_impots / gain_brut_total) * 100 : 0;

  // Seuil 300k applicable?
  const seuil_300k = plans.some(p =>
    (p.regime === 'AGA_2017' || p.regime === 'AGA_POST2018') && p.gain_acquisition_total > 300000
  );

  // Résultats par plan
  const planResults: RSUPlanResult[] = plans.map(plan => {
    const pvData = planPVs.get(plan.id)!;
    const tax = planTaxes.get(plan.id)!;
    const { nb_rsu_plan } = getPlanAggregates(plan);

    const ir_pv_plan = pvData.pv_plan * 0.128;
    const ps_pv_plan = pvData.pv_plan * 0.172;
    const totalImPlan = tax.ir + tax.ps + tax.contrib + ir_pv_plan + ps_pv_plan;

    return {
      plan_id: plan.id,
      plan_nom: plan.nom,
      regime: plan.regime,
      devise: plan.devise,
      nb_actions_total: nb_rsu_plan,
      gain_acquisition_eur: plan.gain_acquisition_total,
      pv_cession_eur: pvData.pv_plan,
      abattement_duree_detention: tax.abattement,
      ir_gain_acquisition: tax.ir,
      ps_gain_acquisition: tax.ps,
      contribution_salariale: tax.contrib,
      csg_crds: 0,
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
    seuil_300k_applique: seuil_300k,
    total_ir,
    total_ps,
    total_contribution_salariale: totalContrib,
    total_csg_crds: 0,
  };
}
