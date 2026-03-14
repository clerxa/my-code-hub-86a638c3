/**
 * TypeScript interfaces for the payslip analysis backend response.
 * Architecture "1 seul appel" — extraction complète en une fois.
 */

export interface PayslipData {
  salarie: {
    nom: string | null;
    prenom: string | null;
    matricule: string | null;
    poste: string | null;
    statut?: string | null;
    classification?: string | null;
    anciennete_annees?: number | null;
    date_entree?: string | null;
    convention_collective?: string | null;
  };
  employeur: {
    nom: string | null;
    siret: string | null;
    code_naf?: string | null;
  };
  periode: {
    mois: number | null;
    annee: number | null;
    date_paiement: string | null;
  };
  remuneration_brute: {
    salaire_base: number | null;
    taux_horaire_ou_mensuel?: number | null;
    heures_travaillees?: number | null;
    total_brut: number | null;
    heures_supplementaires?: number | null;
    prime_anciennete?: number | null;
    prime_objectifs?: number | null;
    prime_exceptionnelle?: number | null;
    avantages_en_nature?: number | null;
    tickets_restaurant_part_patronale?: number | null;
    autres_elements_bruts?: Array<{ label: string; montant: number } | string>;
  };
  cotisations_salariales: {
    total_cotisations_salariales: number | null;
    sante_maladie?: number | null;
    vieillesse_plafonnee?: number | null;
    vieillesse_deplafonnee?: number | null;
    retraite_complementaire_tranche1?: number | null;
    retraite_complementaire_tranche2?: number | null;
    assurance_chomage?: number | null;
    csg_deductible?: number | null;
    csg_crds_non_deductible?: number | null;
    ceg_salarie?: number | null;
    cet_salarie?: number | null;
    apec_ou_agirc_arrco?: number | null;
    complementaire_sante_salarie?: number | null;
    prevoyance_salarie?: number | null;
    autres_cotisations_salariales?: any[];
  };
  cotisations_patronales?: {
    total_cotisations_patronales?: number | null;
    sante_maladie_patronale?: number | null;
    vieillesse_patronale?: number | null;
    retraite_complementaire_patronale?: number | null;
    assurance_chomage_patronale?: number | null;
    accidents_travail?: number | null;
    allocations_familiales?: number | null;
    formation_professionnelle?: number | null;
    prevoyance_patronale?: number | null;
    complementaire_sante_patronale?: number | null;
  };
  net: {
    net_avant_impot: number | null;
    base_pas: number | null;
    taux_pas_pct: number | null;
    montant_pas: number | null;
    net_paye: number | null;
  };
  remuneration_equity?: {
    rsu_detected?: boolean;
    rsu_montant_brut?: number | null;
    actions_gratuites_detected?: boolean;
    actions_gratuites_nb?: number | null;
    actions_gratuites_valeur?: number | null;
    espp_detected?: boolean;
    espp_contribution?: number | null;
    avantages_nature_detected?: boolean;
    avantages_nature_montant?: number | null;
    // Advanced structured fields
    rsu_restricted_stock_units?: {
      variante?: string;
      gain_brut_total?: number | null;
      nb_actions_acquises?: number | null;
      nb_actions_vendues?: number | null;
      nb_actions_conservees?: number | null;
      valeur_actions_vendues?: number | null;
      valeur_actions_conservees?: number | null;
      remboursement_stc_ou_broker?: number | null;
      mecanisme_description?: string;
    };
    actions_gratuites_acquises?: Array<{
      nb_actions?: number | null;
      prix_unitaire?: number | null;
      valeur_fiscale_totale?: number | null;
      type_plan?: string;
      impact_pas_immediat?: boolean;
    }>;
    espp_employee_stock_purchase_plan?: {
      contribution_mensuelle?: number | null;
      contribution_periode?: number | null;
      periode?: string;
    };
    avantages_nature_compenses?: {
      food_bik_benefit_in_kind?: number | null;
      gross_up_compensation?: number | null;
      total_brut?: number | null;
    };
  };
  conges_rtt?: {
    conges_n_moins_1?: { solde: number | null; acquis?: number | null; pris?: number | null };
    conges_n?: { solde: number | null; acquis?: number | null; pris?: number | null };
    rtt?: { solde: number | null; acquis?: number | null; pris?: number | null };
    conges_pris_mois?: number | null;
    rtt_pris_mois?: number | null;
  };
  epargne_salariale?: {
    participation?: number | null;
    interessement?: number | null;
    pee_versement?: number | null;
    perco_versement?: number | null;
    abondement_employeur?: number | null;
  };
  cumuls_annuels?: {
    brut_cumule: number | null;
    net_imposable_cumule: number | null;
    pas_cumule: number | null;
    heures_ou_jours_travailles_cumule?: number | null;
  };
  points_attention: PointAttention[];
  actions_recommandees: ActionRecommandee[];

  // Advanced fields
  explications_pedagogiques?: Record<string, any>;
  cas_particuliers_mois?: Record<string, any>;
  informations_complementaires?: any;
  conseils_optimisation?: string[];

  // Meta
  _meta?: {
    analysis_level: string;
    has_equity: boolean;
  };
  _usage?: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens?: number;
    cost_total_usd: number;
  };
}

export interface PointAttention {
  id: string;
  priorite: number; // 1=urgent, 2=important, 3=info
  titre: string;
  resume: string;
  explication_detaillee?: string;
  a_modal?: boolean;
}

export interface ActionRecommandee {
  id: string;
  priorite: number;
  texte: string;
  cta_label?: string;
  cta_url?: string | null;
}
