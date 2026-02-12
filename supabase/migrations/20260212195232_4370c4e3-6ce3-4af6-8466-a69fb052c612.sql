-- Add missing foreign keys for parcours_companies
ALTER TABLE public.parcours_companies
  ADD CONSTRAINT parcours_companies_parcours_id_fkey
  FOREIGN KEY (parcours_id) REFERENCES public.parcours(id) ON DELETE CASCADE;

ALTER TABLE public.parcours_companies
  ADD CONSTRAINT parcours_companies_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;