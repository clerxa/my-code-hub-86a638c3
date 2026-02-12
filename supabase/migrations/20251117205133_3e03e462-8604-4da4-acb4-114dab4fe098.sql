-- Étape 1: Supprimer toutes les dépendances en cascade
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

-- Étape 2: Modifier le type enum
ALTER TYPE public.app_role RENAME TO app_role_old;

CREATE TYPE public.app_role AS ENUM ('admin', 'contact_entreprise', 'user');

ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING (
    CASE role::text
      WHEN 'moderator' THEN 'contact_entreprise'::public.app_role
      ELSE role::text::public.app_role
    END
  );

DROP TYPE public.app_role_old;

-- Étape 3: Recréer la fonction has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Étape 4: Recréer toutes les politiques RLS
-- Profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Companies
CREATE POLICY "Admins can insert companies" ON public.companies
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update companies" ON public.companies
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies" ON public.companies
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Modules
CREATE POLICY "Admins can insert modules" ON public.modules
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update modules" ON public.modules
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete modules" ON public.modules
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Parcours
CREATE POLICY "Admins can insert parcours" ON public.parcours
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parcours" ON public.parcours
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parcours" ON public.parcours
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Company modules
CREATE POLICY "Admins can insert company_modules" ON public.company_modules
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company_modules" ON public.company_modules
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company_modules" ON public.company_modules
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Parcours modules
CREATE POLICY "Admins can insert parcours_modules" ON public.parcours_modules
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parcours_modules" ON public.parcours_modules
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parcours_modules" ON public.parcours_modules
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Parcours companies
CREATE POLICY "Admins can insert parcours_companies" ON public.parcours_companies
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parcours_companies" ON public.parcours_companies
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parcours_companies" ON public.parcours_companies
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Registrations
CREATE POLICY "Admins can view all registrations" ON public.registrations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update registrations" ON public.registrations
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registrations" ON public.registrations
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Block orders
CREATE POLICY "Admins can insert block orders" ON public.block_orders
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update block orders" ON public.block_orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies
CREATE POLICY "avatar_insert_admin_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "avatar_update_admin_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "avatar_delete_admin_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    public.has_role(auth.uid(), 'admin')
  );