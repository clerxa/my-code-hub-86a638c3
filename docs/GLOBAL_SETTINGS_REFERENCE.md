# Référence des Variables Globales FinCare

Ce document liste toutes les variables configurables de l'application avec leur description, utilisation et impact sur les recommandations/CTAs.

---

## 📊 RÈGLES FISCALES (`fiscal_rules`)

### Barème et Taux Généraux

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `tax_brackets` | Barème progressif IR | Tranches du barème de l'impôt sur le revenu | array | Calcul de l'IR dans tous les simulateurs |
| `social_charges_rate` | Prélèvements sociaux | Taux des prélèvements sociaux sur revenus du capital (17.2%) | % | ESPP, LMNP, PER, plus-values |
| `pfu_rate` | PFU (Flat Tax) | Prélèvement forfaitaire unique (12.8%) | % | Option PFU vs barème progressif |
| `csg_deductible_rate` | CSG déductible | Taux de CSG déductible du revenu imposable (6.8%) | % | Calculs fiscalité revenus capitaux |

### PER (Plan Épargne Retraite)

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `per_ceiling_rate` | Plafond PER (%) | % des revenus pro pour le plafond PER (10%) | % | Calcul plafond personnalisé |
| `per_ceiling_min` | Plafond PER minimum | Plafond minimum versements PER | € | Seuil plancher |
| `per_ceiling_max` | Plafond PER maximum | Plafond maximum versements PER | € | Seuil plafond |

### Dons et Réductions IR

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `dons_75_rate` | Taux dons urgence | Réduction pour dons associations d'aide (75%) | % | Simulateur optimisation |
| `dons_75_ceiling` | Plafond dons 75% | Montant max éligible au taux 75% | € | Limite calcul |
| `dons_66_rate` | Taux dons classiques | Réduction pour dons intérêt général (66%) | % | Simulateur optimisation |
| `dons_income_limit_rate` | Limite dons / revenu | % max du revenu imposable pour les dons (20%) | % | Plafonnement |

### Crédits d'Impôt

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `aide_domicile_rate` | Taux aide domicile | Crédit d'impôt emploi à domicile (50%) | % | Simulateur optimisation |
| `aide_domicile_ceiling` | Plafond aide domicile | Plafond annuel dépenses aide domicile | € | Limite calcul |
| `garde_enfant_rate` | Taux garde enfant | Crédit d'impôt frais de garde (50%) | % | Simulateur optimisation |
| `garde_enfant_ceiling` | Plafond garde enfant | Plafond par enfant gardé | € | Limite calcul |

### Investissements PME/ESUS

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `pme_reduction_rate` | Taux réduction PME | Réduction IR investissement PME (18%) | % | Simulateur optimisation |
| `pme_ceiling_single` | Plafond PME célibataire | Plafond versements PME (célibataire) | € | Limite calcul |
| `pme_ceiling_couple` | Plafond PME couple | Plafond versements PME (couple) | € | Limite calcul |
| `esus_reduction_rate` | Taux réduction ESUS | Réduction IR entreprises solidaires (18%) | % | Simulateur optimisation |
| `esus_ceiling` | Plafond ESUS | Plafond versements ESUS | € | Limite calcul |

### Plafonds Niches Fiscales

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `niche_ceiling_base` | Plafond niches base | Plafonnement global des niches (10 000€) | € | Limite totale réductions |
| `niche_ceiling_esus` | Plafond niches ESUS | Plafond majoré avec ESUS (13 000€) | € | Limite avec ESUS |
| `niche_ceiling_outremer` | Plafond niches Outre-mer | Plafond avec investissements Outre-mer (18 000€) | € | Limite avec Outre-mer |

### Girardin Industriel

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `girardin_ceiling_part` | Plafond Girardin/part | Plafond par part fiscale (44€) | € | Limite calcul |
| `girardin_rate_t1` | Taux T1 (Jan-Mar) | Taux de réduction Girardin T1 (125%) | % | Simulateur optimisation |
| `girardin_rate_t2` | Taux T2 (Avr-Jun) | Taux de réduction Girardin T2 (120%) | % | Simulateur optimisation |
| `girardin_rate_t3` | Taux T3 (Jul-Sep) | Taux de réduction Girardin T3 (117%) | % | Simulateur optimisation |
| `girardin_rate_t4` | Taux T4 (Oct-Déc) | Taux de réduction Girardin T4 (112%) | % | Simulateur optimisation |

### LMNP (Micro-BIC)

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `micro_bic_abatement` | Abattement Micro-BIC | Taux d'abattement micro-BIC (50%) | % | Comparaison régimes |
| `micro_bic_threshold` | Seuil Micro-BIC | Seuil de recettes micro-BIC | € | Éligibilité régime |

### Pinel

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `pinel_rate_6_years` | Pinel 6 ans | Taux réduction Pinel 6 ans (9%) | % | Simulateur |
| `pinel_rate_9_years` | Pinel 9 ans | Taux réduction Pinel 9 ans (12%) | % | Simulateur |
| `pinel_rate_12_years` | Pinel 12 ans | Taux réduction Pinel 12 ans (14%) | % | Simulateur |
| `pinel_om_rate_6_years` | Pinel OM 6 ans | Taux Pinel Outre-mer 6 ans (23%) | % | Simulateur |
| `pinel_om_rate_9_years` | Pinel OM 9 ans | Taux Pinel Outre-mer 9 ans (29%) | % | Simulateur |
| `pinel_om_rate_12_years` | Pinel OM 12 ans | Taux Pinel Outre-mer 12 ans (32%) | % | Simulateur |
| `pinel_ceiling` | Plafond Pinel | Plafond d'investissement Pinel | € | Limite calcul |

---

## 🎯 SEUILS RECOMMANDATIONS (`recommendation_thresholds`)

### Déclencheurs de CTAs et Recommandations

| Clé | Label | Description | Type | Impact |
|-----|-------|-------------|------|--------|
| `cta_tmi_high_threshold` | Seuil TMI élevée | TMI à partir duquel recommander optimisation fiscale | % | Déclenche CTA optimisation |
| `cta_tmi_very_high_threshold` | Seuil TMI très élevée | TMI à partir duquel recommander RDV expert urgent | % | CTA RDV prioritaire |
| `cta_epargne_insuffisante_mois` | Seuil épargne insuffisante | Mois de dépenses en épargne = alerte | nombre | CTA épargne de précaution |
| `cta_epargne_ok_mois` | Seuil épargne OK | Mois de dépenses = épargne suffisante | nombre | Suggestion placement |
| `cta_per_eligible_min_tmi` | TMI min éligible PER | TMI minimum pour recommander le PER | % | CTA vers PER |
| `cta_per_optimal_min_tmi` | TMI optimale PER | TMI à partir de laquelle le PER est très avantageux | % | CTA PER prioritaire |
| `cta_lmnp_min_recettes` | Recettes min LMNP | Recettes annuelles min pour recommander LMNP réel | € | CTA régime réel |
| `cta_capacite_emprunt_bon` | Ratio dette bon | Taux d'endettement considéré comme sain | % | Indicateur vert |
| `cta_capacite_emprunt_attention` | Ratio dette attention | Taux d'endettement nécessitant attention | % | Indicateur orange |
| `cta_capacite_emprunt_danger` | Ratio dette danger | Taux d'endettement dangereux | % | Indicateur rouge |
| `cta_espp_gain_min_percent` | Gain ESPP min intéressant | % de gain ESPP considéré comme intéressant | % | CTA ESPP |
| `cta_reste_a_vivre_min` | Reste à vivre min | Reste à vivre minimum par adulte après emprunt | € | Alerte capacité |

### Seuils de Qualification Lead

| Clé | Label | Description | Type | Impact |
|-----|-------|-------------|------|--------|
| `lead_revenu_rang1_max` | Revenu max rang 1 | Revenu max pour lead rang 1 (potentiel faible) | € | Scoring lead |
| `lead_revenu_rang2_max` | Revenu max rang 2 | Revenu max pour lead rang 2 (potentiel moyen) | € | Scoring lead |
| `lead_revenu_rang3_min` | Revenu min rang 3 | Revenu min pour lead rang 3 (potentiel élevé) | € | Scoring lead |
| `lead_patrimoine_min_premium` | Patrimoine min premium | Patrimoine min pour lead premium | € | Scoring lead |

---

## 💰 PARAMÈTRES SIMULATIONS (`simulation_defaults`)

### Valeurs par Défaut

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `default_tmi` | TMI par défaut | Taux marginal d'imposition par défaut (30%) | % | Pré-remplissage |
| `default_interest_rate` | Taux intérêt défaut | Taux d'intérêt emprunt par défaut | % | Simulateur prêt |
| `default_insurance_rate` | Taux assurance défaut | Taux d'assurance emprunteur par défaut | % | Simulateur prêt |
| `default_loan_duration` | Durée emprunt défaut | Durée d'emprunt par défaut (20 ans) | années | Simulateur prêt |
| `default_amort_duration_immo` | Durée amort immo | Durée amortissement bien immobilier | années | LMNP réel |
| `default_amort_duration_mobilier` | Durée amort mobilier | Durée amortissement mobilier | années | LMNP réel |

### Capacité d'Emprunt

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `max_debt_ratio` | Taux endettement max | Taux d'endettement maximum accepté (35%) | % | Calcul capacité |
| `min_living_remainder_adult` | Reste à vivre min/adulte | Reste à vivre minimum par adulte | € | Calcul capacité |
| `min_living_remainder_child` | Reste à vivre min/enfant | Reste à vivre minimum par enfant | € | Calcul capacité |

### Épargne de Précaution

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `epargne_niveau_minimum_mois` | Mois niveau minimum | Mois de dépenses pour niveau "minimum" (2) | nombre | Simulateur épargne |
| `epargne_niveau_confortable_mois` | Mois niveau confortable | Mois de dépenses pour niveau "confortable" (4) | nombre | Simulateur épargne |
| `epargne_niveau_optimal_mois` | Mois niveau optimal | Mois de dépenses pour niveau "optimal" (6) | nombre | Simulateur épargne |
| `epargne_coef_cdi_tech` | Coef CDI Tech | Multiplicateur pour CDI secteur tech (1.0) | ratio | Ajustement besoins |
| `epargne_coef_cdi_non_tech` | Coef CDI Non Tech | Multiplicateur pour CDI non tech (1.2) | ratio | Ajustement besoins |
| `epargne_coef_independant` | Coef Indépendant | Multiplicateur pour indépendants (1.5) | ratio | Ajustement besoins |
| `epargne_coef_variable` | Coef Salaire Variable | Multiplicateur pour salaire variable (1.5) | ratio | Ajustement besoins |
| `epargne_seuil_charges_bon` | Seuil charges bon | Ratio charges/revenus considéré comme bon (0.3) | ratio | Scoring résilience |
| `epargne_seuil_charges_moyen` | Seuil charges moyen | Ratio charges/revenus moyen (0.5) | ratio | Scoring résilience |
| `epargne_seuil_charges_eleve` | Seuil charges élevé | Ratio charges/revenus élevé (0.6) | ratio | Scoring résilience |
| `epargne_objectif_mois` | Mois pour objectif | Nombre de mois pour atteindre l'objectif épargne (12) | mois | Calcul mensualité |

---

## 📈 CONSTANTES PRODUITS (`product_constants`)

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `espp_discount_rate` | Décote ESPP | Taux de décote ESPP standard (15%) | % | Simulateur ESPP |
| `expected_market_growth` | Croissance marché | Croissance attendue du marché actions (8%) | % | Projections |
| `rsu_social_charges_employer` | Charges patronales RSU | Charges patronales sur les RSU (50%) | % | Calcul coût employeur |
| `retirement_age_default` | Âge retraite défaut | Âge de départ à la retraite par défaut (64) | années | Simulateur PER |
| `return_rate_short` | Rendement court terme | Taux rendement horizon court (<5 ans) | % | Projections PER |
| `return_rate_medium` | Rendement moyen terme | Taux rendement horizon moyen (5-10 ans) | % | Projections PER |
| `return_rate_long` | Rendement long terme | Taux rendement horizon long (10-20 ans) | % | Projections PER |
| `return_rate_very_long` | Rendement très long terme | Taux rendement horizon très long (>20 ans) | % | Projections PER |

---

## 🎯 QUALIFICATION LEADS (`lead_qualification`)

| Clé | Label | Description | Type | Utilisation |
|-----|-------|-------------|------|-------------|
| `rang_1_min_income` | Revenu min rang 1 | Revenu minimum pour rang 1 | € | Scoring |
| `rang_1_max_income` | Revenu max rang 1 | Revenu maximum pour rang 1 | € | Scoring |
| `rang_2_min_income` | Revenu min rang 2 | Revenu minimum pour rang 2 | € | Scoring |
| `rang_2_max_income` | Revenu max rang 2 | Revenu maximum pour rang 2 | € | Scoring |
| `rang_3_min_income` | Revenu min rang 3 | Revenu minimum pour rang 3 | € | Scoring |
| `rang_3_max_income` | Revenu max rang 3 | Revenu maximum pour rang 3 | € | Scoring |

---

## 🚀 LOGIQUE DES RECOMMANDATIONS

### Comment les variables déclenchent les CTAs

1. **TMI élevée** → Si `user.tmi >= cta_tmi_high_threshold` → Afficher CTA "Optimisez vos impôts"
2. **TMI très élevée** → Si `user.tmi >= cta_tmi_very_high_threshold` → CTA prioritaire "RDV expert fiscal"
3. **Épargne insuffisante** → Si `user.epargne / user.charges < cta_epargne_insuffisante_mois` → CTA "Constituez votre matelas"
4. **PER pertinent** → Si `user.tmi >= cta_per_eligible_min_tmi` → Suggérer simulateur PER
5. **Capacité emprunt** → Couleur indicateur selon seuils dette
6. **LMNP réel** → Si `recettes >= cta_lmnp_min_recettes` → Suggérer passage au réel

### Priorité des CTAs

Les CTAs sont affichés selon un ordre de priorité basé sur l'urgence et l'impact potentiel :
1. Urgence (épargne insuffisante, dette élevée)
2. Économie d'impôt potentielle élevée
3. Optimisation de situation existante
4. Éducation financière
