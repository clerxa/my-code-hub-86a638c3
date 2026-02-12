-- =============================================
-- SUITE DES CORRECTIONS - Policies existantes à corriger
-- =============================================

-- WEBINAR_REGISTRATIONS - Corriger les policies
DROP POLICY IF EXISTS "Users can register for webinars" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Anyone can insert webinar registrations" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.webinar_registrations;

CREATE POLICY "Users can register for webinars"
ON public.webinar_registrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own registrations"
ON public.webinar_registrations FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- VIDEO_PROGRESS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.video_progress;
DROP POLICY IF EXISTS "Users can view own video progress" ON public.video_progress;

CREATE POLICY "Users can view own video progress"
ON public.video_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- USER_PARCOURS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_parcours;
DROP POLICY IF EXISTS "Users can view own parcours" ON public.user_parcours;

CREATE POLICY "Users can view own parcours"
ON public.user_parcours FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- DAILY_LOGINS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.daily_logins;
DROP POLICY IF EXISTS "Users can view own logins" ON public.daily_logins;

CREATE POLICY "Users can view own logins"
ON public.daily_logins FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- COMPANY_TRANSFERS - Admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_transfers;
DROP POLICY IF EXISTS "Only admins can view transfers" ON public.company_transfers;

CREATE POLICY "Only admins can view transfers"
ON public.company_transfers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- COMPANIES - Authenticated users only (public read is OK for company list)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;

CREATE POLICY "Authenticated users can view companies"
ON public.companies FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- NETTOYAGE : Suppression des tables coach_mark
-- =============================================

DROP TABLE IF EXISTS public.coach_mark_progress CASCADE;
DROP TABLE IF EXISTS public.coach_mark_steps CASCADE;
DROP TABLE IF EXISTS public.coach_mark_tours CASCADE;