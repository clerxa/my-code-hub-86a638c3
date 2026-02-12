-- Ajouter les champs pour la fiche détaillée des entreprises
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS company_size INTEGER,
ADD COLUMN IF NOT EXISTS employee_locations TEXT[],
ADD COLUMN IF NOT EXISTS has_foreign_employees BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS work_mode TEXT, -- 'remote', 'hybrid', 'office'
ADD COLUMN IF NOT EXISTS compensation_devices JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS hr_challenges JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.companies.company_size IS 'Effectif de l''entreprise';
COMMENT ON COLUMN public.companies.employee_locations IS 'Localisation des salariés';
COMMENT ON COLUMN public.companies.has_foreign_employees IS 'Présence de salariés étrangers';
COMMENT ON COLUMN public.companies.work_mode IS 'Mode de travail (remote/hybrid/office)';
COMMENT ON COLUMN public.companies.compensation_devices IS 'Dispositifs de rémunération (RSU, ESPP, Stock-Options, etc.)';
COMMENT ON COLUMN public.companies.hr_challenges IS 'Enjeux RH/CSE';