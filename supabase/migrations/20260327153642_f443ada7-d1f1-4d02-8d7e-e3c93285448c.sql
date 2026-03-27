ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS access_vega boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_atlas boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_horizon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_zenith boolean NOT NULL DEFAULT false;