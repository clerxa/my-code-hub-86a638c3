
CREATE TABLE public.financial_product_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.financial_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_product_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product partners"
ON public.financial_product_partners FOR SELECT
USING (true);

CREATE POLICY "Admins can insert product partners"
ON public.financial_product_partners FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product partners"
ON public.financial_product_partners FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product partners"
ON public.financial_product_partners FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_financial_product_partners_updated_at
BEFORE UPDATE ON public.financial_product_partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
