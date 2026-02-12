-- Create forum categories table
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  order_num integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create forum posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tags text[] DEFAULT '{}',
  views_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  has_best_answer boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create forum comments table
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  is_best_answer boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create forum post likes table
CREATE TABLE IF NOT EXISTS public.forum_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create forum comment likes table
CREATE TABLE IF NOT EXISTS public.forum_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_categories (read-only for all authenticated users)
CREATE POLICY "Anyone can view categories"
  ON public.forum_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for forum_posts
CREATE POLICY "Anyone can view posts"
  ON public.forum_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.forum_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON public.forum_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.forum_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for forum_comments
CREATE POLICY "Anyone can view comments"
  ON public.forum_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.forum_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON public.forum_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON public.forum_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for forum_post_likes
CREATE POLICY "Anyone can view post likes"
  ON public.forum_post_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.forum_post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.forum_post_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for forum_comment_likes
CREATE POLICY "Anyone can view comment likes"
  ON public.forum_comment_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.forum_comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON public.forum_comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON public.forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_author ON public.forum_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON public.forum_comments(parent_comment_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_forum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_updated_at();

CREATE TRIGGER update_forum_comments_updated_at
  BEFORE UPDATE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_updated_at();

-- Insert the 12 categories
INSERT INTO public.forum_categories (name, slug, description, icon, color, order_num) VALUES
  ('Fiscalité & Impôts', 'fiscalite-impots', 'Optimisation fiscale, déclarations, niches fiscales et stratégies pour réduire vos impôts', 'Calculator', '#ef4444', 1),
  ('Épargne & Stratégie Financière', 'epargne-strategie', 'Livrets, comptes à terme, allocation d''actifs et construction de votre patrimoine', 'PiggyBank', '#f59e0b', 2),
  ('Retraite & PER', 'retraite-per', 'Préparation retraite, Plan Épargne Retraite, simulateurs et optimisation', 'Umbrella', '#10b981', 3),
  ('Plans d''Entreprise', 'plans-entreprise', 'RSU, ESPP, BSPCE, PEE, PERCO : tout sur l''actionnariat salarié et l''épargne entreprise', 'Briefcase', '#3b82f6', 4),
  ('Investir en Bourse', 'investir-bourse', 'Actions, ETF, PEA, compte-titres, analyse et stratégies d''investissement', 'TrendingUp', '#8b5cf6', 5),
  ('Investissement Immobilier', 'investissement-immobilier', 'Locatif, SCPI, LMNP, SCI et toutes les stratégies immobilières', 'Home', '#ec4899', 6),
  ('Assurance-vie & Assurance-vie Luxembourgeoise', 'assurance-vie', 'Contrats, fonds euro, unités de compte, et fiscalité de l''assurance-vie', 'Shield', '#06b6d4', 7),
  ('Gestion du Budget & Vie Quotidienne', 'budget-quotidien', 'Budget familial, économies du quotidien, banques en ligne et cartes bancaires', 'Wallet', '#84cc16', 8),
  ('Protection & Prévoyance', 'protection-prevoyance', 'Assurances santé, prévoyance, protection juridique et sécurité financière', 'Heart', '#f43f5e', 9),
  ('Carrière & Rémunération', 'carriere-remuneration', 'Négociation salariale, mobilité, évolution professionnelle et avantages en nature', 'Rocket', '#14b8a6', 10),
  ('Questions de Débutants', 'questions-debutants', 'Posez vos premières questions sans jugement, on est tous passés par là', 'HelpCircle', '#a855f7', 11),
  ('Grandes Décisions de Vie', 'grandes-decisions', 'Achat immobilier, mariage, PACS, divorce, expatriation, héritage', 'Sparkles', '#f97316', 12)
ON CONFLICT (slug) DO NOTHING;