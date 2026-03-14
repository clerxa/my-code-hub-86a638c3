
-- Add all extracted data columns to ocr_avis_imposition_analyses
ALTER TABLE public.ocr_avis_imposition_analyses
  -- Contribuable
  ADD COLUMN IF NOT EXISTS adresse_complete TEXT,
  ADD COLUMN IF NOT EXISTS numero_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS reference_avis TEXT,
  ADD COLUMN IF NOT EXISTS situation_familiale TEXT,
  ADD COLUMN IF NOT EXISTS nombre_parts NUMERIC,
  -- Revenus
  ADD COLUMN IF NOT EXISTS salaires_traitements_bruts NUMERIC,
  ADD COLUMN IF NOT EXISTS abattement_10_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS salaires_nets_imposables NUMERIC,
  ADD COLUMN IF NOT EXISTS revenus_fonciers_nets NUMERIC,
  ADD COLUMN IF NOT EXISTS revenus_capitaux_mobiliers NUMERIC,
  ADD COLUMN IF NOT EXISTS plus_values_mobilieres NUMERIC,
  ADD COLUMN IF NOT EXISTS bic_bnc_ba NUMERIC,
  ADD COLUMN IF NOT EXISTS pensions_retraites NUMERIC,
  ADD COLUMN IF NOT EXISTS autres_revenus NUMERIC,
  ADD COLUMN IF NOT EXISTS revenu_brut_global NUMERIC,
  ADD COLUMN IF NOT EXISTS charges_deductibles NUMERIC,
  ADD COLUMN IF NOT EXISTS revenu_net_global NUMERIC,
  ADD COLUMN IF NOT EXISTS abattements_speciaux NUMERIC,
  ADD COLUMN IF NOT EXISTS revenu_net_imposable NUMERIC,
  -- Impôt
  ADD COLUMN IF NOT EXISTS impot_brut_progressif NUMERIC,
  ADD COLUMN IF NOT EXISTS taux_marginal_imposition_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS plafonnement_quotient_familial NUMERIC,
  ADD COLUMN IF NOT EXISTS reductions_impot NUMERIC,
  ADD COLUMN IF NOT EXISTS credits_impot NUMERIC,
  ADD COLUMN IF NOT EXISTS impot_net_avant_contributions NUMERIC,
  ADD COLUMN IF NOT EXISTS prelevement_forfaitaire_unique NUMERIC,
  ADD COLUMN IF NOT EXISTS contributions_sociales_revenus_capital NUMERIC,
  ADD COLUMN IF NOT EXISTS taxe_habitation NUMERIC,
  ADD COLUMN IF NOT EXISTS total_a_payer NUMERIC,
  ADD COLUMN IF NOT EXISTS mensualisation_ou_prelevement NUMERIC,
  -- Prélèvement à la source
  ADD COLUMN IF NOT EXISTS taux_pas_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS montant_preleve_annee_n NUMERIC,
  -- Meta
  ADD COLUMN IF NOT EXISTS type_document TEXT,
  ADD COLUMN IF NOT EXISTS confidence TEXT,
  ADD COLUMN IF NOT EXISTS champs_manquants TEXT[];
