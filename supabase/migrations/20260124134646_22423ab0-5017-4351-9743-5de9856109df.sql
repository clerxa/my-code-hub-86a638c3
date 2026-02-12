-- Add new point categories for colleague invitation and partnership request
INSERT INTO public.points_configuration (category, points, description, is_active)
VALUES 
  ('colleague_invitation', 50, 'Points attribués lors de l''invitation d''un collègue', true),
  ('partnership_request', 100, 'Points attribués lors d''une demande de partenariat (utilisateurs sans partenariat)', true)
ON CONFLICT (category) DO NOTHING;