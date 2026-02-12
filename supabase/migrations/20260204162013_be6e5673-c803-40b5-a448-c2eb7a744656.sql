
-- Create table for user real estate properties (investment/rental properties)
CREATE TABLE public.user_real_estate_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_bien TEXT NOT NULL DEFAULT 'Bien immobilier',
  valeur_estimee NUMERIC NOT NULL DEFAULT 0,
  capital_restant_du NUMERIC NOT NULL DEFAULT 0,
  mensualite_credit NUMERIC NOT NULL DEFAULT 0,
  charges_mensuelles NUMERIC NOT NULL DEFAULT 0,
  revenus_locatifs_mensuels NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_real_estate_properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own properties" 
ON public.user_real_estate_properties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties" 
ON public.user_real_estate_properties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" 
ON public.user_real_estate_properties 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" 
ON public.user_real_estate_properties 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_real_estate_properties_updated_at
BEFORE UPDATE ON public.user_real_estate_properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_user_real_estate_properties_user_id ON public.user_real_estate_properties(user_id);
