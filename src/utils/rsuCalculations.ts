/**
 * Calculs fiscaux RSU — 6 régimes AGA + Non qualifié
 * Supporte mode simple (une date) et avancé (une date par plan)
 */

import type { RSUPlan, RSUCessionParams, RSUPlanResult, RSUSimulationResult, RSUResultatAnnuel } from '@/types/rsu';

// ─── Résoudre la date de cession par plan ───
function resoudreDateCession(plan: RSUPlan, params: RSUCessionParams): Date {
  if (params.mode === 'avance' && params.dates_cession_par_plan?.[plan.id]) {
    return new Date(params.dates_cession_par_plan[plan.id]);
  }
  return params.date_cession ? new Date(params.date_cession) : new Date();
}

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

interface ConsolidatedTranches {
  trancheA: number;
  trancheB: number;
}

function computeGainTax(
  plan: RSUPlan,
  tmi: number,
  dateCession: Date,
  consolidated?: ConsolidatedTranches,
): GainTaxDetail {
  const gain = plan.gain_acquisition_total;
  const tmiRate = tmi / 100;

  switch (plan.regime) {
    case 'AGA_PRE2012': {
      return { ir: gain * 0.30, ps: gain * 0.172, contrib: gain * 0.10, abattement: 0 };
    }

    case 'AGA_2012_2015': {
      return { ir: gain * tmiRate, ps: gain * 0.097, contrib: gain * 0.10, abattement: 0 };
    }

    case 'AGA_2015_2016': {
      const abattement = getAbattementDureeDetention(plan, dateCession);
      const baseIR = gain * (1 - abattement);
      return { ir: baseIR * tmiRate, ps: gain * 0.172, contrib: 0, abattement };
    }

    case 'AGA_2017': {
      const abattement = getAbattementDureeDetention(plan, dateCession);
      const trancheA = consolidated ? consolidated.trancheA : Math.min(gain, 300000);
      const trancheB = consolidated ? consolidated.trancheB : Math.max(0, gain - 300000);

      const irA = trancheA * (1 - abattement) * tmiRate;
      const irB = trancheB * tmiRate;
      const ps = gain * 0.172;

      return { ir: irA + irB, ps, contrib: 0, abattement };
    }

    case 'AGA_POST2018': {
      const trancheA = consolidated ? consolidated.trancheA : Math.min(gain, 300000);
      const trancheB = consolidated ? consolidated.trancheB : Math.max(0, gain - 300000);

      const irA = trancheA * 0.50 * tmiRate;
      const irB = trancheB * tmiRate;
      const ps = gain * 0.172;

      return { ir: irA + irB, ps, contrib: 0, abattement: 0.50 };
    }

    case 'NON_QUALIFIE': {
      return { ir: gain * tmiRate, ps: gain * 0.097, contrib: gain * 0.10, abattement: 0 };
    }

    default:
      return { ir: 0, ps: 0, contrib: 0, abattement: 0 };
  }
}

// ─── Consolidation seuil 300k par année fiscale ───
function computeConsolidatedTranches(
  plans: RSUPlan[],
  params: RSUCessionParams,
): Map<string, ConsolidatedTranches> {
  const result = new Map<string, ConsolidatedTranches>();

  // Grouper les plans AGA_2017 + AGA_POST2018 par année fiscale de cession
  const parAnneeFiscale = new Map<number, RSUPlan[]>();
  for (const plan of plans.filter(p =>
    p.regime === 'AGA_2017' || p.regime === 'AGA_POST2018'
  )) {
    const date = resoudreDateCession(plan, params);
    const annee = date.getFullYear();
    if (!parAnneeFiscale.has(annee)) parAnneeFiscale.set(annee, []);
    parAnneeFiscale.get(annee)!.push(plan);
  }

  for (const [, plansAnnee] of parAnneeFiscale) {
    const gainAnnee = plansAnnee.reduce((s, p) => s + p.gain_acquisition_total, 0);
    if (gainAnnee === 0) continue;
    const trancheA = Math.min(gainAnnee, 300000);
    const trancheB = Math.max(0, gainAnnee - 300000);

    for (const plan of plansAnnee) {
      const ratio = plan.gain_acquisition_total / gainAnnee;
      result.set(plan.id, {
        trancheA: trancheA * ratio,
        trancheB: trancheB * ratio,
      });
    }
  }

  return result;
}

// ─── Compute single plan result ───
function computePlanResult(
  plan: RSUPlan,
  params: RSUCessionParams,
  consolidated: Map<string, ConsolidatedTranches>,
): RSUPlanResult {
  const dateCession = resoudreDateCession(plan, params);
  const pvData = getPVCession(plan, params);
  const tax = computeGainTax(plan, params.tmi, dateCession, consolidated.get(plan.id));
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
}

// ─── CALCUL PRINCIPAL ───
export function calculateRSUSimulation(
  plans: RSUPlan[],
  params: RSUCessionParams,
): RSUSimulationResult {
  // Consolidation seuil 300k (fonctionne pour les deux modes)
  const consolidated = computeConsolidatedTranches(plans, params);

  // Compute all plan results
  const planResults = plans.map(plan => computePlanResult(plan, params, consolidated));

  // Totaux
  const totalGainAcq = planResults.reduce((s, p) => s + p.gain_acquisition_eur, 0);
  const pv_totale = planResults.reduce((s, p) => s + p.pv_cession_eur, 0);
  const total_ir = planResults.reduce((s, p) => s + p.ir_gain_acquisition + p.ir_pv_cession, 0);
  const total_ps = planResults.reduce((s, p) => s + p.ps_gain_acquisition + p.ps_pv_cession, 0);
  const totalContrib = planResults.reduce((s, p) => s + p.contribution_salariale, 0);
  const total_impots = planResults.reduce((s, p) => s + p.total_impots, 0);
  const gain_brut_total = totalGainAcq + pv_totale;
  const gain_net = gain_brut_total - total_impots;
  const taux_effectif = gain_brut_total > 0 ? (total_impots / gain_brut_total) * 100 : 0;

  const seuil_300k = plans.some(p =>
    (p.regime === 'AGA_2017' || p.regime === 'AGA_POST2018') && p.gain_acquisition_total > 300000
  );

  // Mode avancé: résultats par année fiscale
  let resultats_par_annee: RSUResultatAnnuel[] | undefined;

  if (params.mode === 'avance') {
    const parAnnee = new Map<number, RSUPlanResult[]>();
    for (const pr of planResults) {
      const plan = plans.find(p => p.id === pr.plan_id)!;
      const dateCession = resoudreDateCession(plan, params);
      const annee = dateCession.getFullYear();
      if (!parAnnee.has(annee)) parAnnee.set(annee, []);
      parAnnee.get(annee)!.push(pr);
    }

    resultats_par_annee = Array.from(parAnnee.entries())
      .sort(([a], [b]) => a - b)
      .map(([annee, plansAnnee]) => {
        const gainBrut = plansAnnee.reduce((s, p) => s + p.gain_acquisition_eur + p.pv_cession_eur, 0);
        const irAnnee = plansAnnee.reduce((s, p) => s + p.ir_gain_acquisition + p.ir_pv_cession, 0);
        const psAnnee = plansAnnee.reduce((s, p) => s + p.ps_gain_acquisition + p.ps_pv_cession, 0);
        const contribAnnee = plansAnnee.reduce((s, p) => s + p.contribution_salariale, 0);
        const impotsAnnee = plansAnnee.reduce((s, p) => s + p.total_impots, 0);
        const cashRecu = plansAnnee.reduce((s, p) => s + p.gain_net, 0);
        const impactBulletin = plansAnnee
          .filter(p => p.regime === 'NON_QUALIFIE')
          .reduce((s, p) => s + p.ir_gain_acquisition + p.ps_gain_acquisition + p.contribution_salariale, 0);

        const seuilAnnee = plansAnnee.some(p =>
          (p.regime === 'AGA_2017' || p.regime === 'AGA_POST2018') &&
          p.gain_acquisition_eur > 300000
        );

        return {
          annee,
          plans: plansAnnee,
          gain_brut: gainBrut,
          total_ir: irAnnee,
          total_ps: psAnnee,
          total_contrib: contribAnnee,
          total_impots: impotsAnnee,
          cash_recu: cashRecu,
          impact_bulletin: impactBulletin,
          seuil_300k_applique: seuilAnnee,
        };
      });
  }

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
    mode: params.mode,
    resultats_par_annee,
  };
}
