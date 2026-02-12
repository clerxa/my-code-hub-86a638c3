-- Table pour stocker les tours de coach marks
CREATE TABLE public.coach_mark_tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    target_role TEXT NOT NULL DEFAULT 'employee', -- 'employee', 'admin', 'contact_entreprise', 'all'
    is_active BOOLEAN DEFAULT true,
    trigger_type TEXT DEFAULT 'first_login', -- 'first_login', 'manual', 'page_visit'
    trigger_page TEXT, -- Route qui déclenche le tour (ex: '/employee')
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour stocker les étapes individuelles des tours
CREATE TABLE public.coach_mark_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.coach_mark_tours(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_selector TEXT NOT NULL, -- CSS selector pour l'élément cible
    target_page TEXT, -- Page où l'élément se trouve
    placement TEXT DEFAULT 'bottom', -- 'top', 'bottom', 'left', 'right', 'auto'
    highlight_padding INTEGER DEFAULT 8,
    step_order INTEGER NOT NULL,
    action_type TEXT DEFAULT 'next', -- 'next', 'click', 'input'
    action_label TEXT DEFAULT 'Suivant',
    skip_label TEXT DEFAULT 'Passer',
    show_progress BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    custom_styles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour tracker la progression des utilisateurs
CREATE TABLE public.coach_mark_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tour_id UUID REFERENCES public.coach_mark_tours(id) ON DELETE CASCADE NOT NULL,
    current_step INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    skipped BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, tour_id)
);

-- Enable RLS
ALTER TABLE public.coach_mark_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_mark_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_mark_progress ENABLE ROW LEVEL SECURITY;

-- Policies pour coach_mark_tours (lecture publique, écriture admin)
CREATE POLICY "Anyone can view active tours"
ON public.coach_mark_tours
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage tours"
ON public.coach_mark_tours
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Policies pour coach_mark_steps (lecture publique, écriture admin)
CREATE POLICY "Anyone can view active steps"
ON public.coach_mark_steps
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage steps"
ON public.coach_mark_steps
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Policies pour coach_mark_progress
CREATE POLICY "Users can view their own progress"
ON public.coach_mark_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.coach_mark_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.coach_mark_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_coach_mark_steps_tour_id ON public.coach_mark_steps(tour_id);
CREATE INDEX idx_coach_mark_steps_order ON public.coach_mark_steps(tour_id, step_order);
CREATE INDEX idx_coach_mark_progress_user_tour ON public.coach_mark_progress(user_id, tour_id);

-- Trigger pour updated_at
CREATE TRIGGER update_coach_mark_tours_updated_at
BEFORE UPDATE ON public.coach_mark_tours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_mark_steps_updated_at
BEFORE UPDATE ON public.coach_mark_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert un tour de démonstration pour les employés
INSERT INTO public.coach_mark_tours (name, slug, description, target_role, trigger_type, trigger_page, priority_order)
VALUES (
    'Découverte du Dashboard',
    'employee-dashboard-tour',
    'Tour de bienvenue pour découvrir les fonctionnalités principales du dashboard employé',
    'employee',
    'first_login',
    '/employee',
    1
);

-- Insérer quelques étapes de démonstration
INSERT INTO public.coach_mark_steps (tour_id, title, content, target_selector, target_page, placement, step_order, action_label)
SELECT 
    id,
    'Bienvenue sur FinCare ! 👋',
    'Découvrez votre espace personnel et toutes les fonctionnalités à votre disposition pour gérer vos finances.',
    '[data-coach="welcome"]',
    '/employee',
    'bottom',
    1,
    'Commencer'
FROM public.coach_mark_tours WHERE slug = 'employee-dashboard-tour';

INSERT INTO public.coach_mark_steps (tour_id, title, content, target_selector, target_page, placement, step_order, action_label)
SELECT 
    id,
    'Vos statistiques 📊',
    'Suivez votre progression, vos points accumulés et votre rang dans le classement.',
    '[data-coach="stats"]',
    '/employee',
    'bottom',
    2,
    'Suivant'
FROM public.coach_mark_tours WHERE slug = 'employee-dashboard-tour';

INSERT INTO public.coach_mark_steps (tour_id, title, content, target_selector, target_page, placement, step_order, action_label)
SELECT 
    id,
    'Simulateurs financiers 🧮',
    'Accédez à nos simulateurs pour évaluer votre capacité d''emprunt, votre épargne et bien plus.',
    '[data-coach="simulations"]',
    '/employee',
    'top',
    3,
    'Suivant'
FROM public.coach_mark_tours WHERE slug = 'employee-dashboard-tour';

INSERT INTO public.coach_mark_steps (tour_id, title, content, target_selector, target_page, placement, step_order, action_label)
SELECT 
    id,
    'Prêt à commencer ! 🚀',
    'Vous êtes maintenant prêt à explorer FinCare. N''hésitez pas à relancer ce guide depuis votre profil.',
    '[data-coach="sidebar"]',
    '/employee',
    'right',
    4,
    'Terminer'
FROM public.coach_mark_tours WHERE slug = 'employee-dashboard-tour';