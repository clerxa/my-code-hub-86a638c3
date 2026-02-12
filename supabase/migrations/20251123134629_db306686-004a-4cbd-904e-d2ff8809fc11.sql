-- Ajouter le revenu du foyer fiscal dans la table profiles
ALTER TABLE public.profiles
ADD COLUMN household_taxable_income NUMERIC;

COMMENT ON COLUMN public.profiles.household_taxable_income IS 'Revenu net imposable du foyer fiscal (pour couples/familles)';
COMMENT ON COLUMN public.profiles.net_taxable_income IS 'Revenu net imposable personnel de l''utilisateur';