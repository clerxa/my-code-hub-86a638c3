-- Supprimer toutes les politiques RLS restrictives et permettre l'accès complet

-- Companies: supprimer les anciennes politiques et permettre tout
DROP POLICY IF EXISTS "Admins can manage all companies" ON public.companies;
DROP POLICY IF EXISTS "Anyone can view companies list" ON public.companies;

CREATE POLICY "Allow all operations on companies"
ON public.companies
FOR ALL
USING (true)
WITH CHECK (true);

-- Profiles: supprimer les anciennes politiques et permettre tout
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous to create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous to read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

CREATE POLICY "Allow all operations on profiles"
ON public.profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- Modules: supprimer les anciennes politiques et permettre tout
DROP POLICY IF EXISTS "Admins can delete modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can update modules" ON public.modules;
DROP POLICY IF EXISTS "Anyone can view modules" ON public.modules;

CREATE POLICY "Allow all operations on modules"
ON public.modules
FOR ALL
USING (true)
WITH CHECK (true);

-- Company modules: supprimer les anciennes politiques et permettre tout
DROP POLICY IF EXISTS "Admins can manage company modules" ON public.company_modules;
DROP POLICY IF EXISTS "Users can view their company modules" ON public.company_modules;

CREATE POLICY "Allow all operations on company_modules"
ON public.company_modules
FOR ALL
USING (true)
WITH CHECK (true);

-- User roles: supprimer les anciennes politiques et permettre tout
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Allow all operations on user_roles"
ON public.user_roles
FOR ALL
USING (true)
WITH CHECK (true);

-- Registrations: supprimer les anciennes politiques et permettre tout
DROP POLICY IF EXISTS "Admins can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anon can insert registrations" ON public.registrations;

CREATE POLICY "Allow all operations on registrations"
ON public.registrations
FOR ALL
USING (true)
WITH CHECK (true);