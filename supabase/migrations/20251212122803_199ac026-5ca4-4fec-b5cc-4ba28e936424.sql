-- Function to set premium plan when partnership_type is set
CREATE OR REPLACE FUNCTION public.set_premium_plan_on_partnership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  premium_plan_id uuid;
BEGIN
  -- If partnership_type is set (not null and not empty)
  IF NEW.partnership_type IS NOT NULL AND NEW.partnership_type != '' THEN
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

-- Create trigger on companies table
DROP TRIGGER IF EXISTS trigger_set_premium_on_partnership ON public.companies;

CREATE TRIGGER trigger_set_premium_on_partnership
BEFORE INSERT OR UPDATE OF partnership_type ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_premium_plan_on_partnership();