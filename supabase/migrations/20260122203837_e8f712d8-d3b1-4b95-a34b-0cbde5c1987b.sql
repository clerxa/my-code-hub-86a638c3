-- ============================================
-- Table unifiée simulations
-- ============================================

CREATE TABLE public.simulations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT
);

CREATE INDEX idx_simulations_user_id ON public.simulations(user_id);
CREATE INDEX idx_simulations_type ON public.simulations(type);
CREATE INDEX idx_simulations_created_at ON public.simulations(created_at DESC);
CREATE INDEX idx_simulations_data ON public.simulations USING GIN(data);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulations"
ON public.simulations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own simulations"
ON public.simulations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own simulations"
ON public.simulations FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own simulations"
ON public.simulations FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER update_simulations_updated_at
BEFORE UPDATE ON public.simulations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration PER
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, created_at, COALESCE(updated_at, created_at), 'per', nom_simulation,
    jsonb_build_object(
        'age_actuel', age_actuel, 'age_retraite', age_retraite, 'capital_futur', capital_futur,
        'economie_impots', economie_impots, 'effort_reel', effort_reel, 'gain_financier', gain_financier,
        'horizon_annees', horizon_annees, 'impot_avec_per', impot_avec_per, 'impot_sans_per', impot_sans_per,
        'optimisation_fiscale', optimisation_fiscale, 'parts_fiscales', parts_fiscales,
        'plafond_per_annuel', plafond_per_annuel, 'plafond_per_reportable', plafond_per_reportable,
        'plafond_per_total', plafond_per_total, 'reduction_impots_max', reduction_impots_max,
        'revenu_fiscal', revenu_fiscal, 'taux_rendement', taux_rendement, 'tmi', tmi, 'versements_per', versements_per
    )
FROM public.per_simulations ON CONFLICT (id) DO NOTHING;

-- Migration LMNP
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, created_at, COALESCE(updated_at, created_at), 'lmnp', nom_simulation,
    jsonb_build_object(
        'amort_immo', amort_immo, 'amort_mobilier', amort_mobilier, 'amort_non_deduits', amort_non_deduits,
        'amort_total', amort_total, 'assurance_gli', assurance_gli, 'assurance_pno', assurance_pno,
        'autre_charge', autre_charge, 'cfe', cfe, 'charges_copro', charges_copro,
        'duree_immo', duree_immo, 'duree_mobilier', duree_mobilier, 'expert_comptable', expert_comptable,
        'fiscalite_totale_micro', fiscalite_totale_micro, 'fiscalite_totale_reel', fiscalite_totale_reel,
        'frais_deplacement', frais_deplacement, 'gestion_locative', gestion_locative,
        'interets_emprunt', interets_emprunt, 'ir_micro', ir_micro, 'ir_reel', ir_reel,
        'meilleur_regime', meilleur_regime, 'petit_materiel', petit_materiel,
        'ps_micro', ps_micro, 'ps_reel', ps_reel, 'recettes', recettes,
        'resultat_avant_amort', resultat_avant_amort, 'resultat_fiscal_micro', resultat_fiscal_micro,
        'resultat_fiscal_reel', resultat_fiscal_reel, 'taxe_fonciere', taxe_fonciere, 'tmi', tmi,
        'total_charges', total_charges, 'travaux_entretien', travaux_entretien,
        'valeur_bien', valeur_bien, 'valeur_mobilier', valeur_mobilier
    )
FROM public.lmnp_simulations ON CONFLICT (id) DO NOTHING;

-- Migration ESPP
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, COALESCE(created_at, now()), COALESCE(updated_at, created_at, now()), 'espp', nom_plan,
    jsonb_build_object(
        'broker', broker, 'date_debut', date_debut, 'date_fin', date_fin, 'devise_plan', devise_plan,
        'discount_pct', discount_pct, 'entreprise', entreprise, 'fmv_debut', fmv_debut, 'fmv_fin', fmv_fin,
        'lookback', lookback, 'montant_investi', montant_investi, 'taux_change_payroll', taux_change_payroll
    )
FROM public.espp_plans ON CONFLICT (id) DO NOTHING;

-- Migration impots
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, COALESCE(created_at, now()), COALESCE(updated_at, created_at, now()), 'impots', nom_simulation,
    jsonb_build_object(
        'credits_impot', credits_impot, 'impot_brut', impot_brut, 'impot_net', impot_net,
        'nombre_enfants', nombre_enfants, 'parts', parts, 'quotient_familial', quotient_familial,
        'reductions_impot', reductions_impot, 'revenu_imposable', revenu_imposable,
        'statut_marital', statut_marital, 'taux_marginal', taux_marginal, 'taux_moyen', taux_moyen
    )
FROM public.simulations_impots ON CONFLICT (id) DO NOTHING;

-- Migration optimisation_fiscale (colonnes corrigées)
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, created_at, COALESCE(updated_at, created_at), 'optimisation_fiscale', nom_simulation,
    jsonb_build_object(
        'dispositifs_selectionnes', dispositifs_selectionnes, 'dons_66_montant', dons_66_montant,
        'dons_75_montant', dons_75_montant, 'duree_pinel', duree_pinel, 'duree_pinel_om', duree_pinel_om,
        'economie_totale', economie_totale, 'impot_apres', impot_apres, 'impot_avant', impot_avant,
        'montant_aide_domicile', montant_aide_domicile, 'montant_esus', montant_esus,
        'montant_garde_enfant', montant_garde_enfant, 'montant_girardin', montant_girardin,
        'montant_per', montant_per, 'montant_pme', montant_pme, 'nb_enfants', nb_enfants,
        'plafond_per', plafond_per, 'plafond_per_report_n1', plafond_per_report_n1,
        'plafond_per_report_n2', plafond_per_report_n2, 'plafond_per_report_n3', plafond_per_report_n3,
        'plafond_per_total', plafond_per_total, 'plafond_per_utilise', plafond_per_utilise,
        'prix_pinel', prix_pinel, 'prix_pinel_om', prix_pinel_om,
        'reduction_aide_domicile', reduction_aide_domicile, 'reduction_dons_66', reduction_dons_66,
        'reduction_dons_75', reduction_dons_75, 'reduction_esus', reduction_esus,
        'reduction_garde_enfant', reduction_garde_enfant, 'reduction_girardin', reduction_girardin,
        'reduction_per', reduction_per, 'reduction_pinel_annuelle', reduction_pinel_annuelle,
        'reduction_pinel_om_annuelle', reduction_pinel_om_annuelle, 'reduction_pme', reduction_pme,
        'revenu_imposable', revenu_imposable, 'revenus_professionnels', revenus_professionnels,
        'situation_familiale', situation_familiale, 'taux_pinel', taux_pinel,
        'taux_pinel_om', taux_pinel_om, 'tmi', tmi
    )
FROM public.optimisation_fiscale_simulations ON CONFLICT (id) DO NOTHING;

-- Migration capacite_emprunt
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, created_at, COALESCE(updated_at, created_at), 'capacite_emprunt', nom_simulation,
    jsonb_build_object(
        'allocations_chomage', allocations_chomage, 'apport_personnel', apport_personnel,
        'autres_charges', autres_charges, 'autres_revenus', autres_revenus, 'capacite_emprunt', capacite_emprunt,
        'charges_fixes', charges_fixes, 'credit_auto', credit_auto, 'credit_conso', credit_conso,
        'credit_immo', credit_immo, 'duree_annees', duree_annees, 'frais_notaire', frais_notaire,
        'indemnites_maladie', indemnites_maladie, 'loyer_actuel', loyer_actuel,
        'mensualite_maximale', mensualite_maximale, 'montant_projet_max', montant_projet_max,
        'pensions_alimentaires', pensions_alimentaires, 'reste_a_vivre', reste_a_vivre,
        'reste_a_vivre_futur', reste_a_vivre_futur, 'revenu_mensuel_net', revenu_mensuel_net,
        'revenus_capital', revenus_capital, 'revenus_locatifs', revenus_locatifs, 'salaires', salaires,
        'taux_assurance', taux_assurance, 'taux_endettement_actuel', taux_endettement_actuel,
        'taux_endettement_futur', taux_endettement_futur, 'taux_interet', taux_interet,
        'taux_utilisation_capacite', taux_utilisation_capacite
    )
FROM public.capacite_emprunt_simulations ON CONFLICT (id) DO NOTHING;

-- Migration pret_immobilier
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, created_at, COALESCE(updated_at, created_at), 'pret_immobilier', nom_simulation,
    jsonb_build_object(
        'apport_personnel', apport_personnel, 'cout_global_credit', cout_global_credit,
        'cout_total_assurance', cout_total_assurance, 'cout_total_interets', cout_total_interets,
        'duree_annees', duree_annees, 'mensualite_totale', mensualite_totale,
        'montant_emprunte', montant_emprunte, 'montant_projet', montant_projet,
        'revenu_mensuel', revenu_mensuel, 'taux_assurance', taux_assurance,
        'taux_endettement', taux_endettement, 'taux_interet', taux_interet
    )
FROM public.pret_immobilier_simulations ON CONFLICT (id) DO NOTHING;

-- Migration epargne_precaution
INSERT INTO public.simulations (id, user_id, created_at, updated_at, type, name, data)
SELECT id, user_id, created_at, COALESCE(updated_at, created_at), 'epargne_precaution', nom_simulation,
    jsonb_build_object(
        'capacite_epargne_mensuelle', capacite_epargne_mensuelle, 'charges_abonnements', charges_abonnements,
        'charges_assurance_auto', charges_assurance_auto, 'charges_assurance_habitation', charges_assurance_habitation,
        'charges_autres', charges_autres, 'charges_copropriete_taxes', charges_copropriete_taxes,
        'charges_energie', charges_energie, 'charges_fixes_mensuelles', charges_fixes_mensuelles,
        'charges_frais_scolarite', charges_frais_scolarite, 'charges_internet', charges_internet,
        'charges_lld_loa_auto', charges_lld_loa_auto, 'charges_loyer_credit', charges_loyer_credit,
        'charges_mobile', charges_mobile, 'charges_transport_commun', charges_transport_commun,
        'coefficient_metier', coefficient_metier, 'cta_affiche', cta_affiche,
        'depenses_mensuelles', depenses_mensuelles, 'epargne_actuelle', epargne_actuelle,
        'epargne_manquante', epargne_manquante, 'epargne_mensuelle_optimale', epargne_mensuelle_optimale,
        'epargne_recommandee', epargne_recommandee, 'indice_resilience', indice_resilience,
        'message_personnalise', message_personnalise, 'nb_mois_securite', nb_mois_securite,
        'niveau_securite', niveau_securite, 'nombre_personnes', nombre_personnes,
        'revenu_mensuel', revenu_mensuel, 'temps_pour_objectif', temps_pour_objectif,
        'type_contrat', type_contrat, 'type_metier', type_metier
    )
FROM public.epargne_precaution_simulations ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.simulations IS 'Table unifiée pour toutes les simulations financières';