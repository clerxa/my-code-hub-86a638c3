
-- Create missing profile for xavier.clermont@gmail.com
INSERT INTO public.profiles (id, email, company_id)
VALUES ('f971ef5c-d50b-466a-95a6-4c6d5171eee5', 'xavier.clermont@gmail.com', 'ca9e865e-d30c-4cfc-9f52-1ceb8886d0e2')
ON CONFLICT (id) DO NOTHING;
