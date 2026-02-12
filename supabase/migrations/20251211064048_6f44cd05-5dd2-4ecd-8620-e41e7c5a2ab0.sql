-- Ajouter le champ téléphone à colleague_invitations
ALTER TABLE public.colleague_invitations 
ADD COLUMN IF NOT EXISTS colleague_phone TEXT;

-- Ajouter un token unique pour le tracking
ALTER TABLE public.colleague_invitations 
ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid();

-- Ajouter la date d'envoi de l'email
ALTER TABLE public.colleague_invitations 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Créer un index sur le token pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_colleague_invitations_token ON public.colleague_invitations(invitation_token);