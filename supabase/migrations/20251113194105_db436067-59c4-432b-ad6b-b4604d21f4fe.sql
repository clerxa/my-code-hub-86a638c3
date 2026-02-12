-- Create function to calculate user level based on points
create or replace function public.get_user_level(user_points integer, max_points integer)
returns text
language sql
stable
as $$
  select case
    when max_points = 0 then 'débutant'
    when (user_points::float / max_points::float) < 0.25 then 'débutant'
    when (user_points::float / max_points::float) < 0.50 then 'intermédiaire'
    when (user_points::float / max_points::float) < 0.75 then 'avancé'
    else 'expert'
  end;
$$;