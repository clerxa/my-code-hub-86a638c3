
-- Table budget utilisateur pour Horizon
CREATE TABLE public.horizon_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_initial_capital NUMERIC NOT NULL DEFAULT 0,
  total_monthly_savings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.horizon_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget" ON public.horizon_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budget" ON public.horizon_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget" ON public.horizon_budgets FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_horizon_budgets_updated_at
  BEFORE UPDATE ON public.horizon_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Catégories de projets prédéfinies
CREATE TABLE public.horizon_project_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Target',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.horizon_project_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.horizon_project_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.horizon_project_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Données initiales
INSERT INTO public.horizon_project_categories (name, icon, color, display_order) VALUES
  ('Immobilier', 'Home', '#8B5CF6', 1),
  ('Véhicule', 'Car', '#F59E0B', 2),
  ('Épargne de précaution', 'Shield', '#10B981', 3),
  ('Retraite', 'Sunset', '#6366F1', 4),
  ('Voyage', 'Plane', '#EC4899', 5),
  ('Éducation', 'GraduationCap', '#14B8A6', 6),
  ('Projet personnel', 'Star', '#F97316', 7);

-- Table projets financiers
CREATE TABLE public.horizon_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Target',
  category_id UUID REFERENCES public.horizon_project_categories(id),
  custom_category TEXT,
  apport NUMERIC NOT NULL DEFAULT 0,
  monthly_allocation NUMERIC NOT NULL DEFAULT 0,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  duration_months INT,
  placement_product_id UUID REFERENCES public.financial_products(id),
  annual_return_rate NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.horizon_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.horizon_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.horizon_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.horizon_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.horizon_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_horizon_projects_updated_at
  BEFORE UPDATE ON public.horizon_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
