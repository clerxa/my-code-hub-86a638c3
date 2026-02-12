-- Remove the overly permissive policy that allows users to view all profiles from same company
DROP POLICY IF EXISTS "Users can view profiles from same company" ON public.profiles;

-- The remaining policies are:
-- 1. "Users can view their own profile" - users can only see their own data (secure)
-- 2. "Admins can view all profiles" - only admins can see all data (required for admin panel)