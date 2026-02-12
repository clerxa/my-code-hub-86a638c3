-- Drop the old constraint and add a new one that includes expert_booking
ALTER TABLE simulator_ctas DROP CONSTRAINT simulator_ctas_action_type_check;

ALTER TABLE simulator_ctas ADD CONSTRAINT simulator_ctas_action_type_check 
CHECK (action_type = ANY (ARRAY['internal_link'::text, 'external_link'::text, 'html_script'::text, 'modal'::text, 'expert_booking'::text]));