-- Add requires_partnership column to features table
ALTER TABLE public.features 
ADD COLUMN IF NOT EXISTS requires_partnership BOOLEAN DEFAULT true;

-- Drop plan_minimum_id column as we're removing plans
ALTER TABLE public.features 
DROP COLUMN IF EXISTS plan_minimum_id;