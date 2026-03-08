/**
 * BSPCE tax calculation utilities
 */

export interface BSPCEScenario {
  label: string;
  multiplicateur: number;
  valorisation_cible: number | null;
  prix_cession_estime: number | null;
  gain_brut: number | null;
  gain_net_pfu: number | null;
  gain_net_bareme: number | null;
  cout_exercice: number;
  isCustom?: boolean;
}

export interface BSPCEFiscalResult {
  gain_brut: number;
  cout_exercice: number;
  // PFU regime (+3 ans)
  ir_pfu: number;
  ps_pfu: number;
  total_impots_pfu: number;
  gain_net_pfu: number;
  gain_net_final_pfu: number;
  taux_effectif_pfu: number;
  // Barème regime (-3 ans)
  ir_bareme: number;
  ps_bareme: number;
  total_impots_bareme: number;
  gain_net_bareme: number;
  gain_net_final_bareme: number;
  taux_effectif_bareme: number;
  // Ancienneté
  anciennete_mois: number;
  regime_applicable: 'pfu' | 'bareme';
  economie_potentielle: number;
  mois_restants_3ans: number;
}

export function calculateAncienneteMois(dateEntree: string, dateCession: string): number {
  const entree = new Date(dateEntree);
  const cession = new Date(dateCession);
  const diffMs = cession.getTime() - entree.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

export function calculateBSPCEScenarios(
  nbBspce: number,
  prixExercice: number,
  valorisationActuelle: number | null,
  nbActionsTotal: number | null,
  tmi: number,
): BSPCEScenario[] {
  const multiplicateurs = [
    { label: 'Pessimiste', mult: 2 },
    { label: 'Modéré', mult: 5 },
    { label: 'Optimiste', mult: 10 },
    { label: 'Très optimiste', mult: 20 },
    { label: 'Personnalisé', mult: 1, isCustom: true },
  ];

  const coutExercice = prixExercice * nbBspce;

  return multiplicateurs.map(({ label, mult, isCustom }) => {
    const canCalc = valorisationActuelle && nbActionsTotal && nbActionsTotal > 0;
    const valorisation_cible = canCalc ? valorisationActuelle * mult : null;
    const prix_cession_estime = canCalc ? (valorisationActuelle * mult) / nbActionsTotal : null;
    
    let gain_brut: number | null = null;
    let gain_net_pfu: number | null = null;
    let gain_net_bareme: number | null = null;

    if (prix_cession_estime !== null && prix_cession_estime > prixExercice) {
      gain_brut = (prix_cession_estime - prixExercice) * nbBspce;
      gain_net_pfu = gain_brut * 0.7; // 30% PFU
      gain_net_bareme = gain_brut * (1 - (tmi / 100 + 0.172));
    }

    return {
      label,
      multiplicateur: mult,
      valorisation_cible,
      prix_cession_estime,
      gain_brut,
      gain_net_pfu,
      gain_net_bareme,
      cout_exercice: coutExercice,
      isCustom,
    };
  });
}

export function calculateBSPCEFiscal(
  nbBspce: number,
  prixExercice: number,
  prixCession: number,
  dateEntree: string,
  dateCession: string,
  tmi: number,
): BSPCEFiscalResult {
  const gain_brut = (prixCession - prixExercice) * nbBspce;
  const cout_exercice = prixExercice * nbBspce;
  const anciennete_mois = calculateAncienneteMois(dateEntree, dateCession);
  const regime_applicable: 'pfu' | 'bareme' = anciennete_mois >= 36 ? 'pfu' : 'bareme';

  // PFU
  const ir_pfu = gain_brut * 0.128;
  const ps_pfu = gain_brut * 0.172;
  const total_impots_pfu = gain_brut * 0.3;
  const gain_net_pfu = gain_brut - total_impots_pfu;
  const gain_net_final_pfu = gain_net_pfu - cout_exercice;

  // Barème
  const ir_bareme = gain_brut * (tmi / 100);
  const ps_bareme = gain_brut * 0.172;
  const total_impots_bareme = ir_bareme + ps_bareme;
  const gain_net_bareme = gain_brut - total_impots_bareme;
  const gain_net_final_bareme = gain_net_bareme - cout_exercice;

  const taux_effectif_pfu = gain_brut > 0 ? (total_impots_pfu / gain_brut) * 100 : 0;
  const taux_effectif_bareme = gain_brut > 0 ? (total_impots_bareme / gain_brut) * 100 : 0;

  const economie_potentielle = total_impots_bareme - total_impots_pfu;
  const mois_restants_3ans = Math.max(0, 36 - anciennete_mois);

  return {
    gain_brut,
    cout_exercice,
    ir_pfu,
    ps_pfu,
    total_impots_pfu,
    gain_net_pfu,
    gain_net_final_pfu,
    taux_effectif_pfu,
    ir_bareme,
    ps_bareme,
    total_impots_bareme,
    gain_net_bareme,
    gain_net_final_bareme,
    taux_effectif_bareme,
    anciennete_mois,
    regime_applicable,
    economie_potentielle,
    mois_restants_3ans,
  };
}
