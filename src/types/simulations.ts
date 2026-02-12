import { z } from 'zod';

// ============================================
// Schémas de données par type de simulation
// ============================================

export const PERDataSchema = z.object({
  age_actuel: z.number(),
  age_retraite: z.number(),
  capital_futur: z.number(),
  economie_impots: z.number(),
  effort_reel: z.number(),
  gain_financier: z.number(),
  horizon_annees: z.number(),
  impot_avec_per: z.number(),
  impot_sans_per: z.number(),
  optimisation_fiscale: z.number(),
  parts_fiscales: z.number(),
  plafond_per_annuel: z.number(),
  plafond_per_reportable: z.number(),
  plafond_per_total: z.number(),
  reduction_impots_max: z.number(),
  revenu_fiscal: z.number(),
  taux_rendement: z.number(),
  tmi: z.number(),
  versements_per: z.number(),
});

export const LMNPDataSchema = z.object({
  amort_immo: z.number().nullable(),
  amort_mobilier: z.number().nullable(),
  amort_non_deduits: z.number().nullable(),
  amort_total: z.number().nullable(),
  assurance_gli: z.number(),
  assurance_pno: z.number(),
  autre_charge: z.number(),
  cfe: z.number(),
  charges_copro: z.number(),
  duree_immo: z.number(),
  duree_mobilier: z.number(),
  expert_comptable: z.number(),
  fiscalite_totale_micro: z.number().nullable(),
  fiscalite_totale_reel: z.number().nullable(),
  frais_deplacement: z.number(),
  gestion_locative: z.number(),
  interets_emprunt: z.number(),
  ir_micro: z.number().nullable(),
  ir_reel: z.number().nullable(),
  meilleur_regime: z.string().nullable(),
  petit_materiel: z.number(),
  ps_micro: z.number().nullable(),
  ps_reel: z.number().nullable(),
  recettes: z.number(),
  resultat_avant_amort: z.number().nullable(),
  resultat_fiscal_micro: z.number().nullable(),
  resultat_fiscal_reel: z.number().nullable(),
  taxe_fonciere: z.number(),
  tmi: z.number(),
  total_charges: z.number(),
  travaux_entretien: z.number(),
  valeur_bien: z.number(),
  valeur_mobilier: z.number(),
});

export const ESPPDataSchema = z.object({
  broker: z.string().nullable(),
  date_debut: z.string(),
  date_fin: z.string(),
  devise_plan: z.string().nullable(),
  discount_pct: z.number().nullable(),
  entreprise: z.string(),
  fmv_debut: z.number(),
  fmv_fin: z.number(),
  lookback: z.boolean().nullable(),
  montant_investi: z.number(),
  taux_change_payroll: z.number(),
});

export const ImpotsDataSchema = z.object({
  credits_impot: z.number().nullable(),
  impot_brut: z.number(),
  impot_net: z.number(),
  nombre_enfants: z.number(),
  parts: z.number(),
  quotient_familial: z.number(),
  reductions_impot: z.number().nullable(),
  revenu_imposable: z.number(),
  statut_marital: z.string(),
  taux_marginal: z.number(),
  taux_moyen: z.number(),
});

export const OptimisationFiscaleDataSchema = z.object({
  dispositifs_selectionnes: z.any().nullable(),
  dons_66_montant: z.number().nullable(),
  dons_75_montant: z.number().nullable(),
  duree_pinel: z.number().nullable(),
  duree_pinel_om: z.number().nullable(),
  economie_totale: z.number().nullable(),
  impot_apres: z.number().nullable(),
  impot_avant: z.number(),
  montant_aide_domicile: z.number().nullable(),
  montant_esus: z.number().nullable(),
  montant_garde_enfant: z.number().nullable(),
  montant_girardin: z.number().nullable(),
  montant_per: z.number().nullable(),
  montant_pme: z.number().nullable(),
  nb_enfants: z.number(),
  plafond_per: z.number().nullable(),
  plafond_per_report_n1: z.number().nullable(),
  plafond_per_report_n2: z.number().nullable(),
  plafond_per_report_n3: z.number().nullable(),
  plafond_per_total: z.number().nullable(),
  plafond_per_utilise: z.number().nullable(),
  prix_pinel: z.number().nullable(),
  prix_pinel_om: z.number().nullable(),
  reduction_aide_domicile: z.number().nullable(),
  reduction_dons_66: z.number().nullable(),
  reduction_dons_75: z.number().nullable(),
  reduction_esus: z.number().nullable(),
  reduction_garde_enfant: z.number().nullable(),
  reduction_girardin: z.number().nullable(),
  reduction_per: z.number().nullable(),
  reduction_pinel_annuelle: z.number().nullable(),
  reduction_pinel_om_annuelle: z.number().nullable(),
  reduction_pme: z.number().nullable(),
  revenu_imposable: z.number(),
  revenus_professionnels: z.number(),
  situation_familiale: z.string(),
  taux_pinel: z.number().nullable(),
  taux_pinel_om: z.number().nullable(),
  tmi: z.number(),
});

export const CapaciteEmpruntDataSchema = z.object({
  allocations_chomage: z.number(),
  apport_personnel: z.number(),
  autres_charges: z.number(),
  autres_revenus: z.number(),
  capacite_emprunt: z.number().nullable(),
  charges_fixes: z.number(),
  credit_auto: z.number(),
  credit_conso: z.number(),
  credit_immo: z.number(),
  duree_annees: z.number(),
  frais_notaire: z.number(),
  indemnites_maladie: z.number(),
  loyer_actuel: z.number(),
  mensualite_maximale: z.number().nullable(),
  montant_projet_max: z.number().nullable(),
  pensions_alimentaires: z.number(),
  reste_a_vivre: z.number().nullable(),
  reste_a_vivre_futur: z.number().nullable(),
  revenu_mensuel_net: z.number(),
  revenus_capital: z.number(),
  revenus_locatifs: z.number(),
  salaires: z.number(),
  taux_assurance: z.number(),
  taux_endettement_actuel: z.number().nullable(),
  taux_endettement_futur: z.number().nullable(),
  taux_interet: z.number(),
  taux_utilisation_capacite: z.number().nullable(),
});

export const PretImmobilierDataSchema = z.object({
  apport_personnel: z.number(),
  cout_global_credit: z.number().nullable(),
  cout_total_assurance: z.number().nullable(),
  cout_total_interets: z.number().nullable(),
  duree_annees: z.number(),
  mensualite_totale: z.number().nullable(),
  montant_emprunte: z.number().nullable(),
  montant_projet: z.number(),
  revenu_mensuel: z.number().nullable(),
  taux_assurance: z.number(),
  taux_endettement: z.number().nullable(),
  taux_interet: z.number(),
});

export const EpargnePrecautionDataSchema = z.object({
  capacite_epargne_mensuelle: z.number(),
  charges_abonnements: z.number().nullable(),
  charges_assurance_auto: z.number().nullable(),
  charges_assurance_habitation: z.number().nullable(),
  charges_autres: z.number().nullable(),
  charges_copropriete_taxes: z.number().nullable(),
  charges_energie: z.number().nullable(),
  charges_fixes_mensuelles: z.number(),
  charges_frais_scolarite: z.number().nullable(),
  charges_internet: z.number().nullable(),
  charges_lld_loa_auto: z.number().nullable(),
  charges_loyer_credit: z.number().nullable(),
  charges_mobile: z.number().nullable(),
  charges_transport_commun: z.number().nullable(),
  coefficient_metier: z.number(),
  cta_affiche: z.string().nullable(),
  depenses_mensuelles: z.number(),
  epargne_actuelle: z.number(),
  epargne_manquante: z.number(),
  epargne_mensuelle_optimale: z.number().nullable(),
  epargne_recommandee: z.number(),
  indice_resilience: z.number(),
  message_personnalise: z.string().nullable(),
  nb_mois_securite: z.number(),
  niveau_securite: z.string(),
  nombre_personnes: z.number(),
  revenu_mensuel: z.number(),
  temps_pour_objectif: z.number().nullable(),
  type_contrat: z.string().nullable(),
  type_metier: z.string(),
});

export const InteretsComposesDataSchema = z.object({
  montant_initial: z.number(),
  versement_mensuel: z.number(),
  duree_annees: z.number(),
  taux_interet: z.number(),
  capital_final: z.number().nullable(),
  total_interets: z.number().nullable(),
  total_investi: z.number().nullable(),
  multiplicateur: z.string().nullable(),
});

// ============================================
// PVI Data Schema
// ============================================

export const PVIDataSchema = z.object({
  nature_bien: z.string(),
  date_acquisition: z.string(),
  date_cession: z.string(),
  prix_cession: z.number(),
  prix_acquisition: z.number(),
  mode_frais_acquisition: z.string(),
  frais_acquisition_reel: z.number().nullable(),
  mode_travaux: z.string(),
  travaux_reel: z.number().nullable(),
  duree_detention_annees: z.number(),
  frais_acquisition: z.number(),
  travaux: z.number(),
  prix_acquisition_majore: z.number(),
  plus_value_brute: z.number(),
  abattement_ir_pct: z.number(),
  abattement_ps_pct: z.number(),
  abattement_ir_montant: z.number(),
  abattement_ps_montant: z.number(),
  assiette_ir_nette: z.number(),
  assiette_ps_nette: z.number(),
  impot_revenu: z.number(),
  prelevements_sociaux: z.number(),
  surtaxe_applicable: z.boolean(),
  surtaxe_montant: z.number(),
  surtaxe_taux: z.number(),
  impot_total: z.number(),
  net_vendeur: z.number(),
});

// ============================================
// Types de simulation supportés
// ============================================

export const SimulationType = z.enum([
  'per',
  'lmnp',
  'espp',
  'impots',
  'optimisation_fiscale',
  'capacite_emprunt',
  'pret_immobilier',
  'epargne_precaution',
  'interets_composes',
  'pvi',
]);

export type SimulationType = z.infer<typeof SimulationType>;

// ============================================
// Discriminated Union principale
// ============================================

export const SimulationDataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('per'), data: PERDataSchema }),
  z.object({ type: z.literal('lmnp'), data: LMNPDataSchema }),
  z.object({ type: z.literal('espp'), data: ESPPDataSchema }),
  z.object({ type: z.literal('impots'), data: ImpotsDataSchema }),
  z.object({ type: z.literal('optimisation_fiscale'), data: OptimisationFiscaleDataSchema }),
  z.object({ type: z.literal('capacite_emprunt'), data: CapaciteEmpruntDataSchema }),
  z.object({ type: z.literal('pret_immobilier'), data: PretImmobilierDataSchema }),
  z.object({ type: z.literal('epargne_precaution'), data: EpargnePrecautionDataSchema }),
  z.object({ type: z.literal('interets_composes'), data: InteretsComposesDataSchema }),
  z.object({ type: z.literal('pvi'), data: PVIDataSchema }),
]);

// ============================================
// Schéma complet d'une simulation
// ============================================

export const SimulationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  type: SimulationType,
  data: z.record(z.unknown()),
  name: z.string().nullable(),
});

export type Simulation = z.infer<typeof SimulationSchema>;
export type SimulationData = z.infer<typeof SimulationDataSchema>;
export type PERData = z.infer<typeof PERDataSchema>;
export type LMNPData = z.infer<typeof LMNPDataSchema>;
export type ESPPData = z.infer<typeof ESPPDataSchema>;
export type ImpotsData = z.infer<typeof ImpotsDataSchema>;
export type OptimisationFiscaleData = z.infer<typeof OptimisationFiscaleDataSchema>;
export type CapaciteEmpruntData = z.infer<typeof CapaciteEmpruntDataSchema>;
export type PretImmobilierData = z.infer<typeof PretImmobilierDataSchema>;
export type EpargnePrecautionData = z.infer<typeof EpargnePrecautionDataSchema>;
export type InteretsComposesData = z.infer<typeof InteretsComposesDataSchema>;

// ============================================
// Mapping des labels pour l'affichage
// ============================================

export const SIMULATION_TYPE_LABELS: Record<SimulationType, string> = {
  per: 'PER',
  lmnp: 'LMNP',
  espp: 'ESPP',
  impots: 'Impôts',
  optimisation_fiscale: 'Optimisation',
  capacite_emprunt: 'Capacité',
  pret_immobilier: 'Prêt',
  epargne_precaution: 'Épargne',
  interets_composes: 'Intérêts',
  pvi: 'Plus-Value Immo',
};

export const SIMULATION_TYPE_URLS: Record<SimulationType, { edit: string; view: string }> = {
  per: { edit: '/simulateur-per', view: '/simulateur-per' },
  lmnp: { edit: '/simulateur-lmnp', view: '/simulateur-lmnp' },
  espp: { edit: '/simulateur-espp', view: '/simulateur-espp?step=resultats' },
  impots: { edit: '/simulateur-impots', view: '/simulateur-impots' },
  optimisation_fiscale: { edit: '/optimisation-fiscale', view: '/optimisation-fiscale?step=resultats' },
  capacite_emprunt: { edit: '/simulateur-capacite-emprunt', view: '/simulateur-capacite-emprunt' },
  pret_immobilier: { edit: '/simulateur-pret-immobilier', view: '/simulateur-pret-immobilier' },
  epargne_precaution: { edit: '/simulateur-epargne-precaution', view: '/simulateur-epargne-precaution' },
  interets_composes: { edit: '/simulateur-interets-composes', view: '/simulateur-interets-composes' },
  pvi: { edit: '/simulateur-pvi', view: '/simulateur-pvi' },
};
