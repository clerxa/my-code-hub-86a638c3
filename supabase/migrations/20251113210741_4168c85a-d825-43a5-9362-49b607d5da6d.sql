-- Ajouter les champs supplémentaires à la table companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS contact_names text[],
ADD COLUMN IF NOT EXISTS referral_typeform_url text,
ADD COLUMN IF NOT EXISTS simulators_config jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS expert_booking_url text,
ADD COLUMN IF NOT EXISTS documents_resources jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS webinar_replays jsonb DEFAULT '[]'::jsonb;