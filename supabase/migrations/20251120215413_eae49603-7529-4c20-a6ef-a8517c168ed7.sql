-- Ajouter les champs manquants à la table profiles pour gérer les statuts et dates
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS statut_invitation text DEFAULT 'invitation_non_envoyée' CHECK (statut_invitation IN ('invitation_non_envoyée', 'invitation_envoyée_en_attente_d_inscription', 'inscrit', 'desactive')),
ADD COLUMN IF NOT EXISTS date_derniere_invitation timestamp with time zone,
ADD COLUMN IF NOT EXISTS date_premiere_connexion timestamp with time zone,
ADD COLUMN IF NOT EXISTS date_import timestamp with time zone,
ADD COLUMN IF NOT EXISTS niveau_financier text,
ADD COLUMN IF NOT EXISTS role_metier text;

-- Créer un index pour optimiser les recherches par statut
CREATE INDEX IF NOT EXISTS idx_profiles_statut_invitation ON profiles(statut_invitation);

-- Créer un index pour optimiser les recherches par entreprise
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- Trigger pour mettre à jour automatiquement le statut à "inscrit" lors de la première connexion
CREATE OR REPLACE FUNCTION update_first_login()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.last_login IS NULL AND NEW.last_login IS NOT NULL THEN
    NEW.statut_invitation := 'inscrit';
    NEW.date_premiere_connexion := NEW.last_login;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_first_login ON profiles;
CREATE TRIGGER trigger_update_first_login
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_first_login();