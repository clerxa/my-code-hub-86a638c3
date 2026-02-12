-- Migration 1: Migrate domaine_email to email_domains
-- First, copy existing domaine_email to email_domains if not already present
UPDATE companies 
SET email_domains = ARRAY[domaine_email]
WHERE domaine_email IS NOT NULL 
  AND domaine_email != ''
  AND (email_domains IS NULL OR NOT (domaine_email = ANY(email_domains)));

-- Migration 2: Drop unused columns from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS about_description;
ALTER TABLE companies DROP COLUMN IF EXISTS cover_image_url;
ALTER TABLE companies DROP COLUMN IF EXISTS domaine_email;

-- Migrate canaux_communication to internal_communications.channels if needed
UPDATE companies
SET internal_communications = jsonb_set(
  COALESCE(internal_communications, '{}'::jsonb),
  '{channels}',
  COALESCE(canaux_communication, '[]'::jsonb)
)
WHERE canaux_communication IS NOT NULL 
  AND canaux_communication != '[]'::jsonb
  AND (internal_communications IS NULL OR internal_communications->'channels' IS NULL);

ALTER TABLE companies DROP COLUMN IF EXISTS canaux_communication;

-- Migration 3: Drop unused columns from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS company;
ALTER TABLE profiles DROP COLUMN IF EXISTS total_time_connected;
ALTER TABLE profiles DROP COLUMN IF EXISTS total_connections;
ALTER TABLE profiles DROP COLUMN IF EXISTS date_derniere_invitation;
ALTER TABLE profiles DROP COLUMN IF EXISTS date_import;
ALTER TABLE profiles DROP COLUMN IF EXISTS date_premiere_connexion;
ALTER TABLE profiles DROP COLUMN IF EXISTS statut_invitation;
ALTER TABLE profiles DROP COLUMN IF EXISTS niveau_financier;
ALTER TABLE profiles DROP COLUMN IF EXISTS role_metier;

-- Migration 4: Drop unused columns from modules table
ALTER TABLE modules DROP COLUMN IF EXISTS auto_validate;
ALTER TABLE modules DROP COLUMN IF EXISTS completion_threshold;