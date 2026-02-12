-- Permettre aux utilisateurs anonymes d'insérer leur propre profil
CREATE POLICY "Allow anonymous to create own profile"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);

-- Permettre aux utilisateurs anonymes de lire leur propre profil
CREATE POLICY "Allow anonymous to read own profile"
ON public.profiles
FOR SELECT
TO anon
USING (id = auth.uid());