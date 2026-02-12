-- Drop the old check constraint and recreate with 'header' included
ALTER TABLE sidebar_configurations 
DROP CONSTRAINT sidebar_configurations_sidebar_type_check;

ALTER TABLE sidebar_configurations 
ADD CONSTRAINT sidebar_configurations_sidebar_type_check 
CHECK (sidebar_type = ANY (ARRAY['company'::text, 'employee'::text, 'admin'::text, 'header'::text]));