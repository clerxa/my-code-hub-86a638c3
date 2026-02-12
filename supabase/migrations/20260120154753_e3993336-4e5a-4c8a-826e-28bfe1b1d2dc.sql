-- Add detailed charge fields to user_financial_profiles
-- 🏠 Logement et Énergie
ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS charges_copropriete_taxes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_energie NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_assurance_habitation NUMERIC DEFAULT 0;

-- 🚗 Transports et Mobilité
ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS charges_transport_commun NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_assurance_auto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_lld_loa_auto NUMERIC DEFAULT 0;

-- 📱 Communication et Services
ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS charges_internet NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_mobile NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_abonnements NUMERIC DEFAULT 0;

-- 👨‍👩‍👧 Famille
ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS charges_frais_scolarite NUMERIC DEFAULT 0;

-- 🔢 Autres charges
ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS charges_autres NUMERIC DEFAULT 0;

-- Also add to epargne_precaution_simulations for saving detailed charges
ALTER TABLE public.epargne_precaution_simulations 
ADD COLUMN IF NOT EXISTS charges_loyer_credit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_copropriete_taxes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_energie NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_assurance_habitation NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_transport_commun NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_assurance_auto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_lld_loa_auto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_internet NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_mobile NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_abonnements NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_frais_scolarite NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS charges_autres NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS type_contrat TEXT DEFAULT 'cdi';

-- Add comment for documentation
COMMENT ON COLUMN public.user_financial_profiles.charges_copropriete_taxes IS 'Charges de copropriété ou taxes foncières';
COMMENT ON COLUMN public.user_financial_profiles.charges_energie IS 'Factures énergie: électricité, gaz, eau';
COMMENT ON COLUMN public.user_financial_profiles.charges_assurance_habitation IS 'Assurance habitation mensuelle';
COMMENT ON COLUMN public.user_financial_profiles.charges_transport_commun IS 'Abonnement transports en commun (Pass Navigo, etc.)';
COMMENT ON COLUMN public.user_financial_profiles.charges_assurance_auto IS 'Assurance automobile mensuelle';
COMMENT ON COLUMN public.user_financial_profiles.charges_lld_loa_auto IS 'Location longue durée (LLD/LOA) ou crédit auto';
COMMENT ON COLUMN public.user_financial_profiles.charges_internet IS 'Abonnement Internet (Box fibre)';
COMMENT ON COLUMN public.user_financial_profiles.charges_mobile IS 'Forfait mobile';
COMMENT ON COLUMN public.user_financial_profiles.charges_abonnements IS 'Abonnements récurrents: streaming, sport, presse';
COMMENT ON COLUMN public.user_financial_profiles.charges_frais_scolarite IS 'Frais de scolarité';
COMMENT ON COLUMN public.user_financial_profiles.charges_autres IS 'Autres charges fixes';