-- Table pour les demandes de parrainage (RDV expert)
CREATE TABLE public.referral_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  colleague_name TEXT NOT NULL,
  colleague_email TEXT NOT NULL,
  colleague_phone TEXT,
  message TEXT,
  expert_booking_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les invitations de collègues
CREATE TABLE public.colleague_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  colleague_first_name TEXT NOT NULL,
  colleague_last_name TEXT NOT NULL,
  colleague_email TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleague_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for referral_requests
CREATE POLICY "Users can create referral requests"
ON public.referral_requests
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referral requests"
ON public.referral_requests
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referral requests"
ON public.referral_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update referral requests"
ON public.referral_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete referral requests"
ON public.referral_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for colleague_invitations
CREATE POLICY "Users can create colleague invitations"
ON public.colleague_invitations
FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can view their own colleague invitations"
ON public.colleague_invitations
FOR SELECT
USING (auth.uid() = inviter_id);

CREATE POLICY "Admins can view all colleague invitations"
ON public.colleague_invitations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update colleague invitations"
ON public.colleague_invitations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete colleague invitations"
ON public.colleague_invitations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_referral_requests_updated_at
  BEFORE UPDATE ON public.referral_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colleague_invitations_updated_at
  BEFORE UPDATE ON public.colleague_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();