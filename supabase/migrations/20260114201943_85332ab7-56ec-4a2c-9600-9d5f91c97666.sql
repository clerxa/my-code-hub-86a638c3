-- Add enable_points_ranking column to companies table (disabled by default)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS enable_points_ranking BOOLEAN NOT NULL DEFAULT false;