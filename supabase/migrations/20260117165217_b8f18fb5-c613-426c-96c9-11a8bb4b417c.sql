-- Mettre à jour la fonction pour exclure "Aucun" comme partenariat valide
CREATE OR REPLACE FUNCTION public.set_premium_plan_on_partnership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  premium_plan_id uuid;
BEGIN
  -- If partnership_type is set (not null, not empty, and not "Aucun")
  IF NEW.partnership_type IS NOT NULL 
     AND NEW.partnership_type != '' 
     AND LOWER(NEW.partnership_type) != 'aucun' THEN
    -- Get the premium plan id
    SELECT id INTO premium_plan_id FROM public.plans WHERE niveau = 'premium' LIMIT 1;
    
    -- Set the plan_id to premium
    IF premium_plan_id IS NOT NULL THEN
      NEW.plan_id := premium_plan_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;