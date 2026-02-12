-- ============================================
-- Migration: Correction warnings sécurité fonction update_themes_updated_at
-- ============================================

-- Recréer la fonction avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_themes_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;