-- Supprimer le trigger qui cause l'erreur
DROP TRIGGER IF EXISTS trigger_set_premium_on_partnership ON public.companies;

-- Supprimer la fonction qui référence la table plans inexistante
DROP FUNCTION IF EXISTS public.set_premium_plan_on_partnership();

-- Nettoyer aussi handle_new_user qui référence plans
-- D'abord supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recréer handle_new_user sans la référence à plans
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    company_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (NEW.raw_user_meta_data->>'company_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;