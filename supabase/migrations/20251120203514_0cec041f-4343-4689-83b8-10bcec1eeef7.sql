-- Modifier la table webinar_registrations
ALTER TABLE webinar_registrations
  DROP COLUMN IF EXISTS email,
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'registration_pending',
  ADD COLUMN IF NOT EXISTS registered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS points_awarded integer DEFAULT 0;

-- Ajouter les colonnes pour les deux types de points dans modules
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS points_registration integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS points_participation integer DEFAULT 100;

-- Mettre à jour les modules webinar existants
UPDATE modules
SET points_registration = 50,
    points_participation = 100
WHERE type = 'webinar' AND points_registration IS NULL;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_status ON webinar_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_user_module ON webinar_registrations(user_id, module_id);

-- Ajouter une contrainte pour les statuts valides
ALTER TABLE webinar_registrations
  DROP CONSTRAINT IF EXISTS valid_registration_status;

ALTER TABLE webinar_registrations
  ADD CONSTRAINT valid_registration_status 
  CHECK (registration_status IN ('registration_pending', 'registration_confirmed', 'joined', 'completed'));