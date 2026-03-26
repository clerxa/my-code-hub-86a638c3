INSERT INTO intention_score_config (signal_key, signal_label, signal_category, points_per_unit, max_points, description, is_active, display_order)
VALUES
  ('appointment_booked', 'RDV expert pris', 'intent_rdv', 20, 20, 'L''utilisateur a pris un rendez-vous expert (table appointments)', true, 11),
  ('financial_profile_complete', 'Profil financier complet', 'profile_maturity', 10, 10, 'Le profil financier est marqué is_complete = true', true, 12),
  ('risk_profile_completed', 'Profil de risque complété', 'profile_maturity', 8, 8, 'L''utilisateur a complété son profil de risque', true, 13),
  ('real_estate_added', 'Bien immobilier ajouté', 'profile_maturity', 5, 10, 'L''utilisateur a ajouté un ou plusieurs biens immobiliers', true, 14),
  ('appointment_preparation_done', 'Préparation RDV remplie', 'intent_rdv', 10, 10, 'L''utilisateur a rempli la préparation de rendez-vous', true, 15);