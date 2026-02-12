-- Migration: Nettoyage des doublons dans la base de données
-- 1. Migrer contact_names vers company_contacts si nécessaire
DO $$
DECLARE
  company_record RECORD;
  contact_name TEXT;
BEGIN
  FOR company_record IN 
    SELECT id, contact_names 
    FROM public.companies 
    WHERE contact_names IS NOT NULL AND array_length(contact_names, 1) > 0
  LOOP
    FOREACH contact_name IN ARRAY company_record.contact_names
    LOOP
      -- Insérer uniquement si le contact n'existe pas déjà
      INSERT INTO public.company_contacts (company_id, nom, email)
      VALUES (company_record.id, contact_name, '')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 2. Migrer financial_maturity de compensation_devices vers niveau_maturite_financiere
UPDATE public.companies
SET niveau_maturite_financiere = compensation_devices->>'financial_maturity'
WHERE 
  niveau_maturite_financiere IS NULL 
  AND compensation_devices->>'financial_maturity' IS NOT NULL;

-- 3. Supprimer financial_maturity de compensation_devices
UPDATE public.companies
SET compensation_devices = compensation_devices - 'financial_maturity'
WHERE compensation_devices ? 'financial_maturity';

-- 4. Supprimer la colonne contact_names (doublon avec company_contacts)
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS contact_names;

-- 5. Ajouter un commentaire pour documenter la structure
COMMENT ON COLUMN public.companies.niveau_maturite_financiere IS 'Niveau de maturité financière des salariés (débutant, intermédiaire, avancé, expert)';
COMMENT ON TABLE public.company_contacts IS 'Contacts référents de l''entreprise - remplace l''ancien champ contact_names';