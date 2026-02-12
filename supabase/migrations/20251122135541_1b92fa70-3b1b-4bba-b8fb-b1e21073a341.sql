-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  url_action TEXT,
  display_type TEXT NOT NULL CHECK (display_type IN ('dropdown', 'popup', 'toast_left', 'toast_right', 'banner', 'silent')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'auto', 'company')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create user_notifications table (junction table)
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Create notification_rules table
CREATE TABLE public.notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_key TEXT UNIQUE NOT NULL,
  trigger_condition TEXT NOT NULL,
  threshold_value JSONB,
  display_type TEXT NOT NULL CHECK (display_type IN ('dropdown', 'popup', 'toast_left', 'toast_right', 'banner', 'silent')),
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  segmentation JSONB,
  frequency_limit TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notification_logs table to track when rules were triggered for users
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.notification_rules(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add tracking fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS a_pris_rdv BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS a_invite_collegue BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Admins can manage notifications"
  ON public.notifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification status"
  ON public.user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user notifications"
  ON public.user_notifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notification_rules
CREATE POLICY "Anyone can view active rules"
  ON public.notification_rules
  FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage rules"
  ON public.notification_rules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own logs"
  ON public.notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage logs"
  ON public.notification_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default notification rules
INSERT INTO public.notification_rules (rule_name, rule_key, trigger_condition, threshold_value, display_type, title_template, message_template, cta_text, cta_url, frequency_limit, active) VALUES
  ('Absence de connexion', 'no_login', 'last_login_days_ago', '{"days": 7}'::jsonb, 'banner', 'Vous nous manquez ! 👋', 'Cela fait {{days}} jours que vous n''êtes pas venu. Reprenez le pouvoir sur vos finances dès maintenant.', 'Continuer ma formation', '/employee', '1_per_week', true),
  ('Module commencé non terminé', 'incomplete_module', 'module_started_not_completed', '{"days": 3}'::jsonb, 'toast_right', 'Terminez votre module 🎯', 'Vous aviez commencé "{{module_title}}". Finissez-le pour gagner des points !', 'Reprendre', '/parcours', '1_per_day', true),
  ('Progression faible', 'low_progress', 'progress_below_threshold', '{"percentage": 20}'::jsonb, 'dropdown', 'Boostez votre progression 📈', 'Votre progression est de {{progress}}%. Continuez pour débloquer plus de fonctionnalités !', 'Voir les modules', '/parcours', '1_per_week', true),
  ('Score faible au quiz', 'low_quiz_score', 'quiz_score_below', '{"score": 60}'::jsonb, 'popup', 'Vous pouvez faire mieux ! 💪', 'Votre score au quiz "{{quiz_title}}" est de {{score}}%. Refaites-le pour améliorer vos connaissances.', 'Refaire le quiz', null, '1_per_quiz', true),
  ('Nouveau module disponible', 'new_module', 'module_added_to_path', '{}'::jsonb, 'toast_right', 'Nouveau contenu disponible ! 🎉', 'Le module "{{module_title}}" vient d''être ajouté à votre parcours.', 'Découvrir', '/parcours', 'immediate', true),
  ('Palier 20% atteint', 'milestone_20', 'progress_reached', '{"percentage": 20}'::jsonb, 'popup', 'Félicitations ! 🎊', 'Vous avez atteint 20% de progression. Continuez comme ça !', 'Continuer', '/employee', '1_per_milestone', true),
  ('Palier 50% atteint', 'milestone_50', 'progress_reached', '{"percentage": 50}'::jsonb, 'popup', 'À mi-chemin ! 🚀', 'Bravo ! Vous êtes à 50% de votre parcours. Plus que la moitié !', 'Continuer', '/employee', '1_per_milestone', true),
  ('Palier 75% atteint', 'milestone_75', 'progress_reached', '{"percentage": 75}'::jsonb, 'popup', 'Presque là ! ⭐', 'Incroyable ! 75% accomplis. La ligne d''arrivée approche !', 'Continuer', '/employee', '1_per_milestone', true),
  ('Relance webinar J-7', 'webinar_reminder_7d', 'webinar_in_days', '{"days": 7}'::jsonb, 'banner', 'Webinar dans 7 jours 📅', 'N''oubliez pas : "{{webinar_title}}" a lieu dans une semaine !', 'S''inscrire', null, '1_per_webinar', true),
  ('Relance webinar J-1', 'webinar_reminder_1d', 'webinar_in_days', '{"days": 1}'::jsonb, 'toast_right', 'Webinar demain ! ⏰', 'Dernière chance : "{{webinar_title}}" c''est demain !', 'Rejoindre', null, '1_per_webinar', true),
  ('Relance webinar H-1', 'webinar_reminder_1h', 'webinar_in_hours', '{"hours": 1}'::jsonb, 'popup', 'Webinar dans 1h ! 🔔', 'Le webinar "{{webinar_title}}" commence dans 1 heure !', 'Rejoindre maintenant', null, '1_per_webinar', true),
  ('Parcours terminé', 'journey_completed', 'progress_reached', '{"percentage": 100}'::jsonb, 'popup', 'Parcours terminé ! 🏆', 'Félicitations ! Vous avez complété votre parcours FinCare. Vous êtes maintenant un expert !', 'Voir mon profil', '/employee', '1_per_journey', true),
  ('Jamais pris RDV expert', 'never_booked_expert', 'never_booked_appointment', '{"days_since_signup": 14}'::jsonb, 'banner', 'Bénéficiez d''un accompagnement gratuit 🎁', 'Saviez-vous que vous pouvez prendre RDV avec un expert FinCare gratuitement ? Profitez-en !', 'Prendre RDV', '/employee', '1_per_month', true),
  ('Jamais invité de collègue', 'never_invited_colleague', 'never_referred', '{"days_since_signup": 21}'::jsonb, 'toast_left', 'Partagez FinCare avec vos collègues 🤝', 'Aidez vos collègues à reprendre le pouvoir sur leurs finances en les invitant !', 'Inviter', '/employee', '1_per_month', true),
  ('Vilain vaincu', 'villain_defeated', 'villain_defeated', '{}'::jsonb, 'popup', 'Vilain vaincu ! ⚔️', 'Bravo ! Vous avez vaincu {{villain_name}}. Vous gagnez {{points}} points !', 'Voir les vilains', '/villains', 'immediate', true);

-- Create indexes for performance
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(is_read);
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_triggered_at ON public.notification_logs(triggered_at);