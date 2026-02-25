-- Allow anonymous users to read basic company info for signup pages
CREATE POLICY "Anyone can view company signup info" ON public.companies
FOR SELECT TO anon
USING (signup_slug IS NOT NULL);
