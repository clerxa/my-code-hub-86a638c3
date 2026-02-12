-- Update check constraint to allow 'admin' sidebar type
ALTER TABLE public.sidebar_configurations DROP CONSTRAINT sidebar_configurations_sidebar_type_check;

ALTER TABLE public.sidebar_configurations ADD CONSTRAINT sidebar_configurations_sidebar_type_check 
CHECK (sidebar_type = ANY (ARRAY['company'::text, 'employee'::text, 'admin'::text]));