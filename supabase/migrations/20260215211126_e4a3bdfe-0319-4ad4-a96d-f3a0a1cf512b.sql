UPDATE public.global_settings 
SET value_type = 'percentage', 
    label = 'Girardin - Part plafonnée niches fiscales (%)',
    description = 'Pourcentage de la réduction Girardin qui entre dans le plafond des niches fiscales'
WHERE category = 'fiscal_rules' AND key = 'girardin_ceiling_part';