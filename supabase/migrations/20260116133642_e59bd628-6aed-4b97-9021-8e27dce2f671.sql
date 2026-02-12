-- Table pour tracer les transferts d'entreprise
CREATE TABLE public.company_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  to_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL NOT NULL,
  transferred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  transfer_options jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour recherche rapide
CREATE INDEX idx_company_transfers_user_id ON public.company_transfers(user_id);
CREATE INDEX idx_company_transfers_from_company ON public.company_transfers(from_company_id);
CREATE INDEX idx_company_transfers_to_company ON public.company_transfers(to_company_id);

-- Enable RLS
ALTER TABLE public.company_transfers ENABLE ROW LEVEL SECURITY;

-- Only admins can view transfers
CREATE POLICY "Admins can view all transfers"
ON public.company_transfers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert transfers
CREATE POLICY "Admins can insert transfers"
ON public.company_transfers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Comment on table
COMMENT ON TABLE public.company_transfers IS 'Historique des transferts d''utilisateurs entre entreprises';