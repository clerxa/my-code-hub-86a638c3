-- =============================================
-- MIGRATION : Sécurisation et optimisation DB
-- =============================================

-- 1. CRÉER TRIGGER POUR AUTO-CRÉATION DES PROFILS
-- ================================================
-- Vérifier si le trigger n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW 
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2. CORRIGER SEARCH_PATH DES FONCTIONS
-- ======================================
CREATE OR REPLACE FUNCTION public.get_user_level(user_points integer, max_points integer)
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  select case
    when max_points = 0 then 'débutant'
    when (user_points::float / max_points::float) < 0.25 then 'débutant'
    when (user_points::float / max_points::float) < 0.50 then 'intermédiaire'
    when (user_points::float / max_points::float) < 0.75 then 'avancé'
    else 'expert'
  end;
$$;

-- 3. SUPPRIMER LES ANCIENNES POLITIQUES RLS TROP PERMISSIVES
-- ===========================================================
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all operations on modules" ON public.modules;
DROP POLICY IF EXISTS "Allow all operations on parcours" ON public.parcours;
DROP POLICY IF EXISTS "Allow all operations on company_modules" ON public.company_modules;
DROP POLICY IF EXISTS "Allow all operations on parcours_modules" ON public.parcours_modules;
DROP POLICY IF EXISTS "Allow all operations on parcours_companies" ON public.parcours_companies;
DROP POLICY IF EXISTS "Allow all operations on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;

-- 4. CRÉER NOUVELLES POLITIQUES RLS SÉCURISÉES
-- =============================================

-- PROFILES : Users peuvent voir/modifier leur propre profil, admins tout
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- COMPANIES : Lecture publique, admins peuvent modifier
CREATE POLICY "Anyone can view companies"
ON public.companies FOR SELECT
USING (true);

CREATE POLICY "Admins can insert companies"
ON public.companies FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update companies"
ON public.companies FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies"
ON public.companies FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- MODULES : Lecture publique, admins peuvent modifier
CREATE POLICY "Anyone can view modules"
ON public.modules FOR SELECT
USING (true);

CREATE POLICY "Admins can insert modules"
ON public.modules FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update modules"
ON public.modules FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete modules"
ON public.modules FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- PARCOURS : Lecture publique, admins peuvent modifier
CREATE POLICY "Anyone can view parcours"
ON public.parcours FOR SELECT
USING (true);

CREATE POLICY "Admins can insert parcours"
ON public.parcours FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parcours"
ON public.parcours FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parcours"
ON public.parcours FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- COMPANY_MODULES : Lecture publique, admins peuvent modifier
CREATE POLICY "Anyone can view company_modules"
ON public.company_modules FOR SELECT
USING (true);

CREATE POLICY "Admins can insert company_modules"
ON public.company_modules FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company_modules"
ON public.company_modules FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company_modules"
ON public.company_modules FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- PARCOURS_MODULES : Lecture publique, admins peuvent modifier
CREATE POLICY "Anyone can view parcours_modules"
ON public.parcours_modules FOR SELECT
USING (true);

CREATE POLICY "Admins can insert parcours_modules"
ON public.parcours_modules FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parcours_modules"
ON public.parcours_modules FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parcours_modules"
ON public.parcours_modules FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- PARCOURS_COMPANIES : Lecture publique, admins peuvent modifier
CREATE POLICY "Anyone can view parcours_companies"
ON public.parcours_companies FOR SELECT
USING (true);

CREATE POLICY "Admins can insert parcours_companies"
ON public.parcours_companies FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parcours_companies"
ON public.parcours_companies FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parcours_companies"
ON public.parcours_companies FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- REGISTRATIONS : Admins peuvent tout voir, users authentifiés peuvent créer
CREATE POLICY "Admins can view all registrations"
ON public.registrations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create registrations"
ON public.registrations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update registrations"
ON public.registrations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registrations"
ON public.registrations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES : Users peuvent voir leurs rôles, admins peuvent tout
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. AJOUTER INDEX POUR LA PERFORMANCE
-- =====================================

-- Index sur company_id dans profiles
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Index sur parcours_companies
CREATE INDEX IF NOT EXISTS idx_parcours_companies_parcours_id ON public.parcours_companies(parcours_id);
CREATE INDEX IF NOT EXISTS idx_parcours_companies_company_id ON public.parcours_companies(company_id);

-- Index sur company_modules
CREATE INDEX IF NOT EXISTS idx_company_modules_module_id ON public.company_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_company_modules_company_id ON public.company_modules(company_id);

-- Index sur parcours_modules
CREATE INDEX IF NOT EXISTS idx_parcours_modules_module_id ON public.parcours_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_parcours_modules_parcours_id ON public.parcours_modules(parcours_id);

-- Index sur user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Index sur modules
CREATE INDEX IF NOT EXISTS idx_modules_webinar_date ON public.modules(webinar_date) WHERE webinar_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_modules_type ON public.modules(type);

-- Index sur forum
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON public.forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON public.forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON public.forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_author_id ON public.forum_comments(author_id);