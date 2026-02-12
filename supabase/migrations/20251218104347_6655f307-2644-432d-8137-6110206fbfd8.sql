-- Tighten RLS policies on user_financial_profiles: restrict to authenticated users only

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own financial profile" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Users can insert their own financial profile" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Users can update their own financial profile" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Admins can view all financial profiles" ON public.user_financial_profiles;

-- Recreate policies restricted to authenticated users only
CREATE POLICY "Users can view their own financial profile"
ON public.user_financial_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial profile"
ON public.user_financial_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial profile"
ON public.user_financial_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all financial profiles"
ON public.user_financial_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add admin update/delete policies for completeness
CREATE POLICY "Admins can update all financial profiles"
ON public.user_financial_profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete financial profiles"
ON public.user_financial_profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));