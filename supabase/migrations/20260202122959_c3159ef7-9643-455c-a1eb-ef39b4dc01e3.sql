-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cta_text TEXT DEFAULT 'En savoir plus',
  cta_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create user offer views tracking table
CREATE TABLE public.user_offer_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_offer_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offers
CREATE POLICY "Anyone can view active offers"
ON public.offers FOR SELECT
USING (
  is_active = true 
  AND is_archived = false 
  AND now() >= start_date 
  AND now() <= end_date
);

CREATE POLICY "Admins can manage all offers"
ON public.offers FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_offer_views
CREATE POLICY "Users can view own offer views"
ON public.user_offer_views FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offer views"
ON public.user_offer_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offer views"
ON public.user_offer_views FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;

-- Create index for performance
CREATE INDEX idx_offers_dates ON public.offers(start_date, end_date);
CREATE INDEX idx_offers_active ON public.offers(is_active, is_archived);