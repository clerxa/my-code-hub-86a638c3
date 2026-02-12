-- Mettre à jour la fonction handle_new_user pour assigner automatiquement le plan Origin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    company_id,
    plan_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (NEW.raw_user_meta_data->>'company_id')::uuid,
    (SELECT id FROM public.plans WHERE niveau = 'origin' LIMIT 1)
  );
  RETURN NEW;
END;
$function$;