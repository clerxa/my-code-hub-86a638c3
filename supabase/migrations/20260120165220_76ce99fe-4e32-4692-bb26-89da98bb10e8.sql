-- Drop the old constraint and add a new one that includes all simulator types
ALTER TABLE simulator_ctas DROP CONSTRAINT simulator_ctas_simulator_type_check;

ALTER TABLE simulator_ctas ADD CONSTRAINT simulator_ctas_simulator_type_check 
CHECK (simulator_type = ANY (ARRAY[
  'per'::text, 
  'espp'::text, 
  'impots'::text, 
  'optimisation_fiscale'::text, 
  'epargne_precaution'::text, 
  'lmnp'::text, 
  'capacite_emprunt'::text, 
  'pret_immobilier'::text, 
  'interets_composes'::text
]));