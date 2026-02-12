-- Ajouter les nouvelles colonnes pour les différents types de modules
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS webinar_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webinar_registration_url TEXT,
ADD COLUMN IF NOT EXISTS webinar_image_url TEXT,
ADD COLUMN IF NOT EXISTS quiz_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS appointment_calendar_url TEXT,
ADD COLUMN IF NOT EXISTS validation_code TEXT;

-- Créer une table pour les tentatives de validation de modules
CREATE TABLE IF NOT EXISTS module_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE module_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own validation attempts"
ON module_validations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own validation attempts"
ON module_validations FOR INSERT
WITH CHECK (auth.uid() = user_id);