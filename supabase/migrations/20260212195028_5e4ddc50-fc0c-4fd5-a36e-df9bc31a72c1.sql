INSERT INTO public.profiles (id, email, first_name, last_name, total_points, completed_modules, current_module, children_count, is_active, employee_onboarding_completed)
VALUES (
  '573e60a5-201e-4703-bc0f-938313c98291',
  'xavier.clermont@perlib.fr',
  'Xavier',
  'Clermont',
  0,
  '{}',
  1,
  0,
  true,
  true
)
ON CONFLICT (id) DO NOTHING;