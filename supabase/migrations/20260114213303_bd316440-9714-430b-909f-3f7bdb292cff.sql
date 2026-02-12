-- Add columns for numeric condition evaluation
ALTER TABLE public.simulator_ctas 
ADD COLUMN IF NOT EXISTS condition_operator text DEFAULT '=' CHECK (condition_operator IN ('>', '<', '>=', '<=', '=', '!=', 'between')),
ADD COLUMN IF NOT EXISTS condition_value jsonb DEFAULT 'null'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.simulator_ctas.condition_operator IS 'Operator for condition evaluation: >, <, >=, <=, =, !=, between';
COMMENT ON COLUMN public.simulator_ctas.condition_value IS 'Value or range for condition. Single number or {"min": x, "max": y} for between';