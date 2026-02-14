
-- Assigner des parcours aux utilisateurs demo
INSERT INTO public.user_parcours (user_id, parcours_id, assigned_at, source) VALUES
-- Parcours "Débuter avec l'application MyFinCare" pour presque tous
('d0000000-0001-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '4 months', 'onboarding'),
('d0000000-0002-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '3 months', 'onboarding'),
('d0000000-0003-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '5 months', 'onboarding'),
('d0000000-0004-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '2 months', 'onboarding'),
('d0000000-0005-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '3 months', 'onboarding'),
('d0000000-0006-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '6 months', 'onboarding'),
('d0000000-0007-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '1 month', 'onboarding'),
('d0000000-0008-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '5 months', 'onboarding'),
('d0000000-000a-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '6 months', 'onboarding'),
('d0000000-000b-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '4 months', 'onboarding'),
('d0000000-000c-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '3 months', 'onboarding'),
('d0000000-000e-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '5 months', 'onboarding'),
('d0000000-0010-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '6 months', 'onboarding'),
('d0000000-0012-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '4 months', 'onboarding'),
('d0000000-0014-0000-0000-000000000001', '616f1f28-f160-4713-9911-9f3deb81f2ec', now() - interval '5 months', 'onboarding'),
-- Parcours "Finir le mois serein"
('d0000000-0001-0000-0000-000000000001', '72935d5d-bcb0-4593-a0b9-1934f1c4c416', now() - interval '2 months', 'manual'),
('d0000000-0006-0000-0000-000000000001', '72935d5d-bcb0-4593-a0b9-1934f1c4c416', now() - interval '3 months', 'manual'),
('d0000000-000a-0000-0000-000000000001', '72935d5d-bcb0-4593-a0b9-1934f1c4c416', now() - interval '2 months', 'manual'),
('d0000000-0010-0000-0000-000000000001', '72935d5d-bcb0-4593-a0b9-1934f1c4c416', now() - interval '3 months', 'manual'),
('d0000000-0014-0000-0000-000000000001', '72935d5d-bcb0-4593-a0b9-1934f1c4c416', now() - interval '2 months', 'manual'),
-- Parcours "Réduire ses impôts"
('d0000000-000a-0000-0000-000000000001', 'f98d8313-9d73-41cf-a856-645ebe0941f9', now() - interval '1 month', 'manual'),
('d0000000-0010-0000-0000-000000000001', 'f98d8313-9d73-41cf-a856-645ebe0941f9', now() - interval '2 months', 'manual'),
('d0000000-0008-0000-0000-000000000001', 'f98d8313-9d73-41cf-a856-645ebe0941f9', now() - interval '1 month', 'manual'),
-- Parcours "Faire le point sur sa situation"
('d0000000-0003-0000-0000-000000000001', '55ea9492-36aa-4407-a444-040bb37799bb', now() - interval '3 months', 'manual'),
('d0000000-000e-0000-0000-000000000001', '55ea9492-36aa-4407-a444-040bb37799bb', now() - interval '2 months', 'manual');
