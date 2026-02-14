
-- 1. Créer DemoCompany
INSERT INTO public.companies (id, name, company_size, enable_points_ranking, primary_color, secondary_color, partnership_type, work_mode, email_domains)
VALUES (
  'a0000000-de00-0000-0000-000000000001',
  'DemoCompany',
  150,
  true,
  '#2563EB',
  '#1E40AF',
  'premium',
  'hybride',
  ARRAY['democompany.fr']
);

-- 2. Contact entreprise Xavier
INSERT INTO public.company_contacts (company_id, nom, email, role_contact, telephone)
VALUES ('a0000000-de00-0000-0000-000000000001', 'Xavier Clermont', 'xavier.clermont@perlib.fr', 'Responsable RH', '+33 6 12 34 56 78');

-- 3. Rattacher Xavier à DemoCompany
UPDATE public.profiles SET company_id = 'a0000000-de00-0000-0000-000000000001' WHERE id = '9e20c9bc-9a27-4fac-b834-72477541868e';

-- 4. Activer tous les modules
INSERT INTO public.company_modules (company_id, module_id, is_active, custom_order)
SELECT 'a0000000-de00-0000-0000-000000000001', id, true, row_number() OVER (ORDER BY id) FROM modules;

-- 5. 20 profils demo
INSERT INTO public.profiles (id, first_name, last_name, email, total_points, completed_modules, current_module, company_id, phone_number, birth_date, net_taxable_income, marital_status, children_count, job_title, last_login, employee_onboarding_completed, a_pris_rdv, a_invite_collegue, theme_preference, created_at) VALUES
('d0000000-0001-0000-0000-000000000001', 'Sophie', 'Martin', 'sophie.martin@democompany.fr', 720, '{3,43,44,132,133,134,137}', 135, 'a0000000-de00-0000-0000-000000000001', '+33612000001', '1988-03-15', 42000, 'marié(e)', 2, 'Chef de projet', now() - interval '1 day', true, true, true, 'villains', now() - interval '4 months'),
('d0000000-0002-0000-0000-000000000001', 'Thomas', 'Durand', 'thomas.durand@democompany.fr', 580, '{3,43,132,133,137}', 134, 'a0000000-de00-0000-0000-000000000001', '+33612000002', '1992-07-22', 38000, 'célibataire', 0, 'Développeur', now() - interval '2 days', true, true, false, 'villains', now() - interval '3 months'),
('d0000000-0003-0000-0000-000000000001', 'Camille', 'Bernard', 'camille.bernard@democompany.fr', 450, '{3,43,44,132}', 133, 'a0000000-de00-0000-0000-000000000001', '+33612000003', '1985-11-08', 55000, 'marié(e)', 3, 'Directrice marketing', now() - interval '3 days', true, false, true, 'villains', now() - interval '5 months'),
('d0000000-0004-0000-0000-000000000001', 'Lucas', 'Petit', 'lucas.petit@democompany.fr', 350, '{3,132,133}', 134, 'a0000000-de00-0000-0000-000000000001', '+33612000004', '1995-01-30', 32000, 'célibataire', 0, 'Analyste financier', now() - interval '5 days', true, true, false, 'villains', now() - interval '2 months'),
('d0000000-0005-0000-0000-000000000001', 'Manon', 'Robert', 'manon.robert@democompany.fr', 280, '{3,43}', 44, 'a0000000-de00-0000-0000-000000000001', '+33612000005', '1990-06-12', 45000, 'pacsé(e)', 1, 'Responsable comptable', now() - interval '1 week', true, false, false, 'villains', now() - interval '3 months'),
('d0000000-0006-0000-0000-000000000001', 'Hugo', 'Richard', 'hugo.richard@democompany.fr', 650, '{3,4,43,44,132,133,134}', 135, 'a0000000-de00-0000-0000-000000000001', '+33612000006', '1987-09-25', 48000, 'marié(e)', 2, 'Ingénieur', now() - interval '12 hours', true, true, true, 'villains', now() - interval '6 months'),
('d0000000-0007-0000-0000-000000000001', 'Léa', 'Moreau', 'lea.moreau@democompany.fr', 180, '{3,132}', 133, 'a0000000-de00-0000-0000-000000000001', '+33612000007', '1998-04-03', 28000, 'célibataire', 0, 'Assistante RH', now() - interval '2 weeks', true, false, false, 'villains', now() - interval '1 month'),
('d0000000-0008-0000-0000-000000000001', 'Antoine', 'Simon', 'antoine.simon@democompany.fr', 500, '{3,43,44,132,133}', 134, 'a0000000-de00-0000-0000-000000000001', '+33612000008', '1983-12-18', 62000, 'marié(e)', 3, 'Directeur commercial', now() - interval '4 days', true, true, false, 'villains', now() - interval '5 months'),
('d0000000-0009-0000-0000-000000000001', 'Emma', 'Laurent', 'emma.laurent@democompany.fr', 90, '{3}', 43, 'a0000000-de00-0000-0000-000000000001', '+33612000009', '1996-08-07', 30000, 'célibataire', 0, 'Designer UX', now() - interval '3 weeks', true, false, false, 'villains', now() - interval '2 weeks'),
('d0000000-000a-0000-0000-000000000001', 'Maxime', 'Leroy', 'maxime.leroy@democompany.fr', 800, '{3,4,43,44,45,132,133,134,135,137,138}', 140, 'a0000000-de00-0000-0000-000000000001', '+33612000010', '1980-02-14', 72000, 'marié(e)', 2, 'Directeur technique', now() - interval '6 hours', true, true, true, 'villains', now() - interval '6 months'),
('d0000000-000b-0000-0000-000000000001', 'Chloé', 'Roux', 'chloe.roux@democompany.fr', 320, '{3,43,132}', 133, 'a0000000-de00-0000-0000-000000000001', '+33612000011', '1991-10-29', 40000, 'pacsé(e)', 1, 'Juriste', now() - interval '6 days', true, false, true, 'villains', now() - interval '4 months'),
('d0000000-000c-0000-0000-000000000001', 'Julien', 'David', 'julien.david@democompany.fr', 420, '{3,43,44,132,133}', 134, 'a0000000-de00-0000-0000-000000000001', '+33612000012', '1989-05-16', 46000, 'marié(e)', 1, 'Contrôleur de gestion', now() - interval '8 days', true, true, false, 'villains', now() - interval '3 months'),
('d0000000-000d-0000-0000-000000000001', 'Alice', 'Bertrand', 'alice.bertrand@democompany.fr', 150, '{3,132}', 43, 'a0000000-de00-0000-0000-000000000001', '+33612000013', '1997-01-21', 29000, 'célibataire', 0, 'Chargée de communication', null, false, false, false, 'villains', now() - interval '1 month'),
('d0000000-000e-0000-0000-000000000001', 'Nicolas', 'Morel', 'nicolas.morel@democompany.fr', 550, '{3,4,43,44,132,133}', 134, 'a0000000-de00-0000-0000-000000000001', '+33612000014', '1986-08-09', 52000, 'marié(e)', 2, 'Responsable logistique', now() - interval '3 days', true, true, true, 'villains', now() - interval '5 months'),
('d0000000-000f-0000-0000-000000000001', 'Julie', 'Fournier', 'julie.fournier@democompany.fr', 60, '{3}', 43, 'a0000000-de00-0000-0000-000000000001', '+33612000015', '1999-12-05', 26000, 'célibataire', 0, 'Stagiaire RH', null, false, false, false, 'villains', now() - interval '2 weeks'),
('d0000000-0010-0000-0000-000000000001', 'Pierre', 'Girard', 'pierre.girard@democompany.fr', 680, '{3,4,43,44,45,132,133,134}', 135, 'a0000000-de00-0000-0000-000000000001', '+33612000016', '1982-04-27', 65000, 'marié(e)', 3, 'DAF', now() - interval '1 day', true, true, true, 'villains', now() - interval '6 months'),
('d0000000-0011-0000-0000-000000000001', 'Marie', 'Bonnet', 'marie.bonnet@democompany.fr', 250, '{3,43,132}', 133, 'a0000000-de00-0000-0000-000000000001', '+33612000017', '1993-07-13', 36000, 'pacsé(e)', 0, 'Acheteuse', now() - interval '10 days', true, false, false, 'villains', now() - interval '3 months'),
('d0000000-0012-0000-0000-000000000001', 'Romain', 'Dupuis', 'romain.dupuis@democompany.fr', 400, '{3,43,44,132}', 133, 'a0000000-de00-0000-0000-000000000001', '+33612000018', '1984-11-02', 50000, 'divorcé(e)', 1, 'Chef de produit', now() - interval '5 days', true, true, false, 'villains', now() - interval '4 months'),
('d0000000-0013-0000-0000-000000000001', 'Laura', 'Lambert', 'laura.lambert@democompany.fr', 30, '{}', 3, 'a0000000-de00-0000-0000-000000000001', '+33612000019', '2000-03-20', 25000, 'célibataire', 0, 'Alternante', null, false, false, false, 'villains', now() - interval '1 week'),
('d0000000-0014-0000-0000-000000000001', 'Florian', 'Mercier', 'florian.mercier@democompany.fr', 620, '{3,4,43,44,132,133,134,137}', 135, 'a0000000-de00-0000-0000-000000000001', '+33612000020', '1988-06-11', 47000, 'marié(e)', 1, 'Responsable IT', now() - interval '2 days', true, true, true, 'villains', now() - interval '5 months');

-- 6. Module validations
INSERT INTO public.module_validations (user_id, module_id, success, attempted_at) VALUES
('d0000000-0001-0000-0000-000000000001', 3, true, now() - interval '3 months'),
('d0000000-0001-0000-0000-000000000001', 43, true, now() - interval '2 months 20 days'),
('d0000000-0001-0000-0000-000000000001', 44, true, now() - interval '2 months'),
('d0000000-0001-0000-0000-000000000001', 132, true, now() - interval '1 month 20 days'),
('d0000000-0001-0000-0000-000000000001', 133, true, now() - interval '1 month'),
('d0000000-0001-0000-0000-000000000001', 134, true, now() - interval '2 weeks'),
('d0000000-0001-0000-0000-000000000001', 137, true, now() - interval '1 week'),
('d0000000-0002-0000-0000-000000000001', 3, true, now() - interval '2 months'),
('d0000000-0002-0000-0000-000000000001', 43, true, now() - interval '6 weeks'),
('d0000000-0002-0000-0000-000000000001', 132, true, now() - interval '1 month'),
('d0000000-0002-0000-0000-000000000001', 133, true, now() - interval '3 weeks'),
('d0000000-0002-0000-0000-000000000001', 137, true, now() - interval '2 weeks'),
('d0000000-0006-0000-0000-000000000001', 3, true, now() - interval '5 months'),
('d0000000-0006-0000-0000-000000000001', 4, true, now() - interval '4 months'),
('d0000000-0006-0000-0000-000000000001', 43, true, now() - interval '3 months'),
('d0000000-0006-0000-0000-000000000001', 44, true, now() - interval '2 months'),
('d0000000-0006-0000-0000-000000000001', 132, true, now() - interval '6 weeks'),
('d0000000-0006-0000-0000-000000000001', 133, true, now() - interval '1 month'),
('d0000000-0006-0000-0000-000000000001', 134, true, now() - interval '2 weeks'),
('d0000000-000a-0000-0000-000000000001', 3, true, now() - interval '5 months 15 days'),
('d0000000-000a-0000-0000-000000000001', 4, true, now() - interval '5 months'),
('d0000000-000a-0000-0000-000000000001', 43, true, now() - interval '4 months'),
('d0000000-000a-0000-0000-000000000001', 44, true, now() - interval '3 months 15 days'),
('d0000000-000a-0000-0000-000000000001', 45, true, now() - interval '3 months'),
('d0000000-000a-0000-0000-000000000001', 132, true, now() - interval '2 months'),
('d0000000-000a-0000-0000-000000000001', 133, true, now() - interval '6 weeks'),
('d0000000-000a-0000-0000-000000000001', 134, true, now() - interval '1 month'),
('d0000000-000a-0000-0000-000000000001', 135, true, now() - interval '3 weeks'),
('d0000000-000a-0000-0000-000000000001', 137, true, now() - interval '2 weeks'),
('d0000000-000a-0000-0000-000000000001', 138, true, now() - interval '1 week'),
('d0000000-0010-0000-0000-000000000001', 3, true, now() - interval '5 months'),
('d0000000-0010-0000-0000-000000000001', 4, true, now() - interval '4 months 15 days'),
('d0000000-0010-0000-0000-000000000001', 43, true, now() - interval '4 months'),
('d0000000-0010-0000-0000-000000000001', 44, true, now() - interval '3 months'),
('d0000000-0010-0000-0000-000000000001', 45, true, now() - interval '2 months'),
('d0000000-0010-0000-0000-000000000001', 132, true, now() - interval '6 weeks'),
('d0000000-0010-0000-0000-000000000001', 133, true, now() - interval '1 month'),
('d0000000-0010-0000-0000-000000000001', 134, true, now() - interval '2 weeks'),
('d0000000-0014-0000-0000-000000000001', 3, true, now() - interval '4 months'),
('d0000000-0014-0000-0000-000000000001', 4, true, now() - interval '3 months 15 days'),
('d0000000-0014-0000-0000-000000000001', 43, true, now() - interval '3 months'),
('d0000000-0014-0000-0000-000000000001', 44, true, now() - interval '2 months'),
('d0000000-0014-0000-0000-000000000001', 132, true, now() - interval '6 weeks'),
('d0000000-0014-0000-0000-000000000001', 133, true, now() - interval '1 month'),
('d0000000-0014-0000-0000-000000000001', 134, true, now() - interval '3 weeks'),
('d0000000-0014-0000-0000-000000000001', 137, true, now() - interval '2 weeks'),
('d0000000-0008-0000-0000-000000000001', 3, true, now() - interval '4 months'),
('d0000000-0008-0000-0000-000000000001', 43, true, now() - interval '3 months'),
('d0000000-0008-0000-0000-000000000001', 44, true, now() - interval '2 months'),
('d0000000-0008-0000-0000-000000000001', 132, true, now() - interval '6 weeks'),
('d0000000-0008-0000-0000-000000000001', 133, true, now() - interval '1 month'),
('d0000000-000e-0000-0000-000000000001', 3, true, now() - interval '4 months'),
('d0000000-000e-0000-0000-000000000001', 4, true, now() - interval '3 months'),
('d0000000-000e-0000-0000-000000000001', 43, true, now() - interval '2 months'),
('d0000000-000e-0000-0000-000000000001', 44, true, now() - interval '6 weeks'),
('d0000000-000e-0000-0000-000000000001', 132, true, now() - interval '1 month'),
('d0000000-000e-0000-0000-000000000001', 133, true, now() - interval '2 weeks'),
('d0000000-000c-0000-0000-000000000001', 3, true, now() - interval '2 months 15 days'),
('d0000000-000c-0000-0000-000000000001', 43, true, now() - interval '2 months'),
('d0000000-000c-0000-0000-000000000001', 44, true, now() - interval '6 weeks'),
('d0000000-000c-0000-0000-000000000001', 132, true, now() - interval '1 month'),
('d0000000-000c-0000-0000-000000000001', 133, true, now() - interval '2 weeks');

-- 7. Simulation logs
INSERT INTO public.simulation_logs (user_id, simulator_type, simulation_data, results_data, created_at) VALUES
('d0000000-0001-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 3500}', '{"recommande": 10500}', now() - interval '2 months'),
('d0000000-0001-0000-0000-000000000001', 'capacite_emprunt', '{"revenu": 3500}', '{"capacite": 180000}', now() - interval '1 month'),
('d0000000-0002-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 3200}', '{"recommande": 9600}', now() - interval '6 weeks'),
('d0000000-0004-0000-0000-000000000001', 'capacite_emprunt', '{"revenu": 2700}', '{"capacite": 140000}', now() - interval '1 month'),
('d0000000-0006-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 4000}', '{"recommande": 12000}', now() - interval '3 months'),
('d0000000-0006-0000-0000-000000000001', 'lmnp', '{"recettes": 12000}', '{"meilleur_regime": "reel"}', now() - interval '2 months'),
('d0000000-0006-0000-0000-000000000001', 'capacite_emprunt', '{"revenu": 4000}', '{"capacite": 220000}', now() - interval '1 month'),
('d0000000-0008-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 5200}', '{"recommande": 15600}', now() - interval '2 months'),
('d0000000-000a-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 6000}', '{"recommande": 18000}', now() - interval '4 months'),
('d0000000-000a-0000-0000-000000000001', 'capacite_emprunt', '{"revenu": 6000}', '{"capacite": 350000}', now() - interval '3 months'),
('d0000000-000a-0000-0000-000000000001', 'lmnp', '{"recettes": 18000}', '{"meilleur_regime": "reel"}', now() - interval '2 months'),
('d0000000-000a-0000-0000-000000000001', 'espp', '{"montant": 5000}', '{"gain": 2500}', now() - interval '1 month'),
('d0000000-000e-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 4300}', '{"recommande": 12900}', now() - interval '3 months'),
('d0000000-000e-0000-0000-000000000001', 'capacite_emprunt', '{"revenu": 4300}', '{"capacite": 230000}', now() - interval '2 months'),
('d0000000-0010-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 5400}', '{"recommande": 16200}', now() - interval '4 months'),
('d0000000-0010-0000-0000-000000000001', 'lmnp', '{"recettes": 15000}', '{"meilleur_regime": "reel"}', now() - interval '3 months'),
('d0000000-0010-0000-0000-000000000001', 'capacite_emprunt', '{"revenu": 5400}', '{"capacite": 300000}', now() - interval '1 month'),
('d0000000-0014-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 3900}', '{"recommande": 11700}', now() - interval '2 months'),
('d0000000-0014-0000-0000-000000000001', 'capacite_emprunt', '{"revenu": 3900}', '{"capacite": 200000}', now() - interval '1 month'),
('d0000000-000c-0000-0000-000000000001', 'epargne_precaution', '{"revenu": 3800}', '{"recommande": 11400}', now() - interval '6 weeks');

-- 8. Daily logins (engagement varié)
INSERT INTO public.daily_logins (user_id, login_date, points_awarded)
SELECT u.id, d::date, true
FROM (VALUES 
  ('d0000000-0001-0000-0000-000000000001'::uuid),
  ('d0000000-0002-0000-0000-000000000001'::uuid),
  ('d0000000-0006-0000-0000-000000000001'::uuid),
  ('d0000000-000a-0000-0000-000000000001'::uuid),
  ('d0000000-0010-0000-0000-000000000001'::uuid),
  ('d0000000-0014-0000-0000-000000000001'::uuid)
) AS u(id)
CROSS JOIN generate_series(now() - interval '30 days', now(), interval '1 day') AS d
WHERE random() > 0.3;

INSERT INTO public.daily_logins (user_id, login_date, points_awarded)
SELECT u.id, d::date, true
FROM (VALUES 
  ('d0000000-0004-0000-0000-000000000001'::uuid),
  ('d0000000-0008-0000-0000-000000000001'::uuid),
  ('d0000000-000b-0000-0000-000000000001'::uuid),
  ('d0000000-000c-0000-0000-000000000001'::uuid),
  ('d0000000-000e-0000-0000-000000000001'::uuid),
  ('d0000000-0012-0000-0000-000000000001'::uuid)
) AS u(id)
CROSS JOIN generate_series(now() - interval '30 days', now(), interval '1 day') AS d
WHERE random() > 0.6;

INSERT INTO public.daily_logins (user_id, login_date, points_awarded)
SELECT u.id, d::date, true
FROM (VALUES 
  ('d0000000-0003-0000-0000-000000000001'::uuid),
  ('d0000000-0005-0000-0000-000000000001'::uuid),
  ('d0000000-0007-0000-0000-000000000001'::uuid),
  ('d0000000-0011-0000-0000-000000000001'::uuid)
) AS u(id)
CROSS JOIN generate_series(now() - interval '30 days', now(), interval '1 day') AS d
WHERE random() > 0.75;
