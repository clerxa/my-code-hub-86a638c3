-- Rendre company_id optionnel pour les ressources visuelles (null = toutes entreprises)
ALTER TABLE public.company_visual_resources ALTER COLUMN company_id DROP NOT NULL;

-- Rendre company_id optionnel pour les FAQs (null = toutes entreprises)
ALTER TABLE public.company_faqs ALTER COLUMN company_id DROP NOT NULL;

-- Ajouter photo aux contacts entreprise
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Mettre à jour les policies pour permettre l'accès aux ressources globales
DROP POLICY IF EXISTS "Company contacts can view their company resources" ON public.company_visual_resources;
CREATE POLICY "Users can view resources for their company or global"
ON public.company_visual_resources
FOR SELECT
USING (
  company_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = company_visual_resources.company_id
  )
);

DROP POLICY IF EXISTS "Company employees can view their company FAQs" ON public.company_faqs;
CREATE POLICY "Users can view FAQs for their company or global"
ON public.company_faqs
FOR SELECT
USING (
  company_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = company_faqs.company_id
  )
);