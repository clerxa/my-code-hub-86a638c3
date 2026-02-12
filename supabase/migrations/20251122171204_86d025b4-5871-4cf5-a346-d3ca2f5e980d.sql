-- Create block_orders table for managing page layouts
CREATE TABLE IF NOT EXISTS public.block_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL, -- 'employee', 'company', 'parcours', etc.
  block_order JSONB NOT NULL DEFAULT '[]', -- Array of block IDs in order
  layout_config JSONB, -- Additional layout configuration per block
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.block_orders ENABLE ROW LEVEL SECURITY;

-- Policies for block_orders
CREATE POLICY "Admins can manage block orders"
  ON public.block_orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view block orders"
  ON public.block_orders
  FOR SELECT
  USING (true);

-- Insert default block orders for employee page
INSERT INTO public.block_orders (page_name, block_order, layout_config)
VALUES 
  ('employee', 
   '["profile", "progression", "personalInfo", "expertBooking", "simulations", "upcomingWebinars"]'::jsonb,
   '{
     "profile": {"visible": true},
     "progression": {"visible": true, "title": "La Quête FinCare", "description": "Partez à l aventure et terrassez les vilains de la finance!"},
     "personalInfo": {"visible": true},
     "expertBooking": {"visible": true},
     "simulations": {"visible": true},
     "upcomingWebinars": {"visible": true}
   }'::jsonb
  ),
  ('company',
   '["header", "stats", "employees", "leaderboard", "modules"]'::jsonb,
   '{
     "header": {"visible": true},
     "stats": {"visible": true},
     "employees": {"visible": true},
     "leaderboard": {"visible": true},
     "modules": {"visible": true}
   }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Update settings table to include quest block configuration
INSERT INTO public.settings (key, value, metadata)
VALUES (
  'quete_fincare_block',
  'enabled',
  '{
    "background_image_url": "/quete-fincare-default.png",
    "background_position": "center",
    "background_size": "cover",
    "overlay_opacity": 0.3,
    "title_text": "La Quête FinCare",
    "title_color": "#FFFFFF",
    "title_align": "center",
    "description_text": "Partez à l aventure et terrassez les vilains de la finance ! Complétez les modules pour gagner des points et débloquer de nouveaux niveaux.",
    "description_color": "#FFFFFF",
    "description_align": "center",
    "crop_config": {
      "x": 0,
      "y": 0,
      "width": 100,
      "height": 100,
      "zoom": 1
    }
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET metadata = EXCLUDED.metadata;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_block_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_block_orders_timestamp
BEFORE UPDATE ON public.block_orders
FOR EACH ROW
EXECUTE FUNCTION update_block_orders_updated_at();