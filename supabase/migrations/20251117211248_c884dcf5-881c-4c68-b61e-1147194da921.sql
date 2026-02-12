-- Add plan_id to companies table
ALTER TABLE public.companies 
ADD COLUMN plan_id uuid REFERENCES public.plans(id);

-- Set all existing companies to Legend plan by default
UPDATE public.companies 
SET plan_id = (SELECT id FROM public.plans WHERE niveau = 'legend' LIMIT 1)
WHERE plan_id IS NULL;