-- Create table to store block order for different pages
CREATE TABLE public.block_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name text NOT NULL,
  block_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_name)
);

-- Enable RLS
ALTER TABLE public.block_orders ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read block orders
CREATE POLICY "Anyone can view block orders"
ON public.block_orders
FOR SELECT
USING (true);

-- Only admins can insert block orders
CREATE POLICY "Admins can insert block orders"
ON public.block_orders
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update block orders
CREATE POLICY "Admins can update block orders"
ON public.block_orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_block_orders_updated_at
BEFORE UPDATE ON public.block_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();