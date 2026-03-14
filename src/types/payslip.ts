/**
 * TypeScript interfaces for the payslip analysis backend response (Option 2 Hybrid).
 */

export interface PayslipData {
  salarie: {
    nom: string | null;
    prenom: string | null;
    matricule: string | null;
    poste: string | null;
  };
  employeur: {
    nom: string | null;
    siret: string | null;
  };
  periode: {
    mois: number | null;
    annee: number | null;
    date_paiement: string | null;
  };
  remuneration_brute: {
    salaire_base: number | null;
    total_brut: number | null;
    heures_supplementaires?: number | null;
    prime_anciennete?: number | null;
    prime_objectifs?: number | null;
    prime_exceptionnelle?: number | null;
    avantages_en_nature?: number | null;
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
  };
  cotisations_patronales?: {
    total_cotisations_patronales?: number | null;
    sante_maladie_patronale?: number | null;
    vieillesse_patronale?: number | null;
    retraite_complementaire_patronale?: number | null;
    assurance_chomage_patronale?: number | null;
    complementaire_sante_patronale?: number | null;
    prevoyance_patronale?: number | null;
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
    // Advanced fields (from PROMPT_ADVANCED_EQUITY)
    rsu_restricted_stock_units?: any;
    actions_gratuites_acquises?: any[];
    espp_employee_stock_purchase_plan?: any;
    avantages_nature_compenses?: any;
  };
  conges_rtt?: {
    conges_n_moins_1?: { solde: number | null; acquis?: number | null; pris?: number | null };
    conges_n?: { solde: number | null; acquis?: number | null; pris?: number | null };
    rtt?: { solde: number | null };
  };
  cumuls_annuels?: {
    brut_cumule: number | null;
    net_imposable_cumule: number | null;
    pas_cumule: number | null;
  };
  points_attention: PointAttention[];
  actions_recommandees: ActionRecommandee[];

  // Advanced-only fields
  explications_pedagogiques?: Record<string, string>;
  cas_particuliers_mois?: Record<string, any>;
  epargne_salariale?: any;
  informations_complementaires?: any;
  conseils_optimisation?: any[];

  // Meta
  _usage?: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_total_usd: string;
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
