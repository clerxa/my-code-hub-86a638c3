-- Allow company_id to be NULL in partnership_requests for users without a company
ALTER TABLE public.partnership_requests ALTER COLUMN company_id DROP NOT NULL;