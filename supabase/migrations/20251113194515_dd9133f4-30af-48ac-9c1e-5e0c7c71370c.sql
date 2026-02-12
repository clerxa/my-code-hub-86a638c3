-- Fix search_path for get_user_level function
CREATE OR REPLACE FUNCTION public.get_user_level(user_points integer, max_points integer)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select case
    when max_points = 0 then 'débutant'
    when (user_points::float / max_points::float) < 0.25 then 'débutant'
    when (user_points::float / max_points::float) < 0.50 then 'intermédiaire'
    when (user_points::float / max_points::float) < 0.75 then 'avancé'
    else 'expert'
  end;
$$;