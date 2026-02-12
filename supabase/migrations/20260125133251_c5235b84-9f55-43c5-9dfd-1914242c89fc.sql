-- Ajout des colonnes pour la configuration des permanences fiscales par entreprise
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS tax_permanence_config JSONB DEFAULT '{
  "options": [
    {"id": "visio", "label": "En visio", "enabled": true, "booking_url": null},
    {"id": "bureaux_perlib", "label": "Dans les bureaux de Perlib", "enabled": true, "booking_url": null},
    {"id": "bureaux_entreprise", "label": "Dans les locaux de l''entreprise", "enabled": false, "dates": [], "booking_url": null}
  ],
  "post_submission_message": null
}'::jsonb;

-- Ajout de la colonne pour les optimisations personnalisées dans tax_declaration_requests
ALTER TABLE public.tax_declaration_requests
ADD COLUMN IF NOT EXISTS optimisation_autres JSONB DEFAULT '[]'::jsonb;

-- Ajout des champs pour tracker la source des données pré-remplies
ALTER TABLE public.tax_declaration_requests
ADD COLUMN IF NOT EXISTS prefilled_from_profile JSONB DEFAULT '{}'::jsonb;