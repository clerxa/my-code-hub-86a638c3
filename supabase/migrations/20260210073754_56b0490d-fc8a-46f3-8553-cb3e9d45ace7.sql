-- Add revenu_annuel_brut to progress config (replacing revenu_mensuel_net as the tracked field)
-- Update existing revenu_mensuel_net entry to point to revenu_annuel_brut instead
UPDATE public.financial_profile_required_fields 
SET field_key = 'revenu_annuel_brut', 
    field_label = 'Revenu annuel brut'
WHERE field_key = 'revenu_mensuel_net';

-- Add revenu_annuel_brut_conjoint entry (optional by default)
INSERT INTO public.financial_profile_required_fields (field_key, field_label, is_required, display_order)
VALUES ('revenu_annuel_brut_conjoint', 'Revenu annuel brut du conjoint', false, 
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM public.financial_profile_required_fields))
ON CONFLICT DO NOTHING;