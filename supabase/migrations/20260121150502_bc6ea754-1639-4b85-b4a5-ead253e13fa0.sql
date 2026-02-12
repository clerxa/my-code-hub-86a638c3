-- Add tracking columns to colleague_invitations
ALTER TABLE public.colleague_invitations 
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS link_clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registered_user_id UUID REFERENCES public.profiles(id);

-- Update status enum values
COMMENT ON COLUMN public.colleague_invitations.status IS 'Status: pending, sent, opened, clicked, registered';