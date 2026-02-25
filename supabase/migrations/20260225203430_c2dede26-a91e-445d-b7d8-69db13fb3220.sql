
CREATE TABLE public.booking_context_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_key TEXT NOT NULL UNIQUE,
  origin_label TEXT NOT NULL,
  dialog_title TEXT NOT NULL DEFAULT 'Réserver un rendez-vous',
  dialog_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_context_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read booking context messages" ON public.booking_context_messages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage booking context messages" ON public.booking_context_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default entries for all known origins
INSERT INTO public.booking_context_messages (origin_key, origin_label, dialog_title, dialog_description) VALUES
  ('dashboard', 'Tableau de bord', 'Réserver un rendez-vous', 'Prenez rendez-vous pour faire le point sur votre situation financière.'),
  ('simulateur_epargne_precaution', 'Simulateur Épargne de précaution', 'Parlons de votre épargne de précaution', 'Un expert peut vous aider à optimiser votre matelas de sécurité.'),
  ('simulateur_capacite_emprunt', 'Simulateur Capacité d''emprunt', 'Concrétisez votre projet immobilier', 'Discutons ensemble de votre capacité d''emprunt et des meilleures options.'),
  ('simulateur_per', 'Simulateur PER', 'Optimisez votre retraite', 'Un expert vous accompagne pour tirer le meilleur parti de votre PER.'),
  ('simulateur_optimisation_per', 'Simulateur Optimisation PER', 'Optimisez votre PER', 'Discutons des résultats de votre simulation pour maximiser vos avantages.'),
  ('simulateur_espp', 'Simulateur ESPP', 'Parlons de votre plan ESPP', 'Un expert vous aide à comprendre et optimiser votre plan d''actionnariat.'),
  ('optimisation_fiscale', 'Optimisation fiscale', 'Optimisez votre fiscalité', 'Un expert vous accompagne pour réduire votre imposition en toute légalité.'),
  ('parcours', 'Parcours', 'Réserver un rendez-vous', 'Continuez votre parcours avec l''aide d''un expert.'),
  ('modules', 'Modules', 'Réserver un rendez-vous', 'Un expert peut approfondir les sujets abordés dans vos modules.'),
  ('profil_risque', 'Profil de risque', 'Parlons de votre profil investisseur', 'Discutons de votre profil de risque et des placements adaptés.'),
  ('forum', 'Forum', 'Réserver un rendez-vous', 'Posez vos questions directement à un expert.'),
  ('bilan_financier', 'Bilan financier', 'Analysons votre bilan financier', 'Un expert décrypte votre bilan et vous propose des actions concrètes.'),
  ('horizon', 'Horizon patrimonial', 'Passez à l''action sur votre patrimoine', 'Transformez votre stratégie patrimoniale en plan d''action concret.'),
  ('acces_direct', 'Accès direct', 'Réserver un rendez-vous', 'Prenez rendez-vous avec un de nos experts certifiés.');

CREATE TRIGGER update_booking_context_messages_updated_at
  BEFORE UPDATE ON public.booking_context_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
