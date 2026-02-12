-- =====================================================
-- 1. VUE SÉCURISÉE POUR LE FORUM (VRAI ANONYMAT)
-- =====================================================

-- Vue sécurisée pour les posts du forum
CREATE OR REPLACE VIEW public.secure_forum_posts AS
SELECT 
  fp.id,
  fp.title,
  fp.content,
  fp.category_id,
  fp.tags,
  fp.views_count,
  fp.is_pinned,
  fp.is_closed,
  fp.has_best_answer,
  fp.created_at,
  fp.updated_at,
  fp.is_anonymous,
  fp.is_deleted,
  fp.deleted_at,
  fp.deleted_by,
  fp.deletion_reason_id,
  -- Logique de masquage de l'auteur
  CASE 
    -- L'auteur voit toujours ses propres infos
    WHEN fp.author_id = auth.uid() THEN fp.author_id
    -- Les admins voient toujours les vraies infos
    WHEN public.has_role(auth.uid(), 'admin') THEN fp.author_id
    -- Si anonyme, masquer l'author_id
    WHEN fp.is_anonymous = TRUE THEN NULL
    -- Sinon, afficher normalement
    ELSE fp.author_id
  END AS author_id,
  -- Pseudo affiché
  CASE 
    WHEN fp.author_id = auth.uid() THEN fp.display_pseudo
    WHEN public.has_role(auth.uid(), 'admin') THEN fp.display_pseudo
    WHEN fp.is_anonymous = TRUE THEN 'Membre Anonyme'
    ELSE fp.display_pseudo
  END AS display_pseudo,
  -- Avatar affiché
  CASE 
    WHEN fp.author_id = auth.uid() THEN fp.display_avatar_url
    WHEN public.has_role(auth.uid(), 'admin') THEN fp.display_avatar_url
    WHEN fp.is_anonymous = TRUE THEN NULL
    ELSE fp.display_avatar_url
  END AS display_avatar_url
FROM public.forum_posts fp;

-- Vue sécurisée pour les commentaires du forum
CREATE OR REPLACE VIEW public.secure_forum_comments AS
SELECT 
  fc.id,
  fc.post_id,
  fc.content,
  fc.parent_comment_id,
  fc.is_best_answer,
  fc.created_at,
  fc.updated_at,
  fc.is_anonymous,
  fc.is_deleted,
  fc.deleted_at,
  fc.deleted_by,
  fc.deletion_reason_id,
  -- Logique de masquage de l'auteur
  CASE 
    WHEN fc.author_id = auth.uid() THEN fc.author_id
    WHEN public.has_role(auth.uid(), 'admin') THEN fc.author_id
    WHEN fc.is_anonymous = TRUE THEN NULL
    ELSE fc.author_id
  END AS author_id,
  -- Pseudo affiché
  CASE 
    WHEN fc.author_id = auth.uid() THEN fc.display_pseudo
    WHEN public.has_role(auth.uid(), 'admin') THEN fc.display_pseudo
    WHEN fc.is_anonymous = TRUE THEN 'Membre Anonyme'
    ELSE fc.display_pseudo
  END AS display_pseudo,
  -- Avatar affiché
  CASE 
    WHEN fc.author_id = auth.uid() THEN fc.display_avatar_url
    WHEN public.has_role(auth.uid(), 'admin') THEN fc.display_avatar_url
    WHEN fc.is_anonymous = TRUE THEN NULL
    ELSE fc.display_avatar_url
  END AS display_avatar_url
FROM public.forum_comments fc;

-- Accorder les permissions de lecture sur les vues
GRANT SELECT ON public.secure_forum_posts TO authenticated;
GRANT SELECT ON public.secure_forum_comments TO authenticated;
GRANT SELECT ON public.secure_forum_posts TO anon;
GRANT SELECT ON public.secure_forum_comments TO anon;

-- =====================================================
-- 2. RLS RENFORCÉE POUR LES DONNÉES FINANCIÈRES
-- =====================================================

-- Supprimer les anciennes politiques sur user_financial_profiles
DROP POLICY IF EXISTS "Users can view their own financial profile" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Admins can view all financial profiles" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Users can insert their own financial profile" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Users can update their own financial profile" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Admins can update all financial profiles" ON public.user_financial_profiles;
DROP POLICY IF EXISTS "Admins can delete financial profiles" ON public.user_financial_profiles;

-- Nouvelles politiques STRICTES pour user_financial_profiles
-- SELECT: Propriétaire OU Admin uniquement
CREATE POLICY "owner_or_admin_select_financial_profiles" 
ON public.user_financial_profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- INSERT: Propriétaire uniquement
CREATE POLICY "owner_insert_financial_profiles" 
ON public.user_financial_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Propriétaire OU Admin uniquement
CREATE POLICY "owner_or_admin_update_financial_profiles" 
ON public.user_financial_profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- DELETE: Admin uniquement
CREATE POLICY "admin_delete_financial_profiles" 
ON public.user_financial_profiles 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Supprimer les anciennes politiques sur simulations
DROP POLICY IF EXISTS "Users can view own simulations" ON public.simulations;
DROP POLICY IF EXISTS "Users can insert own simulations" ON public.simulations;
DROP POLICY IF EXISTS "Users can update own simulations" ON public.simulations;
DROP POLICY IF EXISTS "Users can delete own simulations" ON public.simulations;

-- Nouvelles politiques STRICTES pour simulations
CREATE POLICY "owner_or_admin_select_simulations" 
ON public.simulations 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "owner_insert_simulations" 
ON public.simulations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_or_admin_update_simulations" 
ON public.simulations 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "owner_or_admin_delete_simulations" 
ON public.simulations 
FOR DELETE 
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- 3. RPC FUNCTION POUR STATS AGRÉGÉES (Dashboard RH)
-- =====================================================

-- Fonction pour récupérer des stats agrégées sans exposer les données individuelles
CREATE OR REPLACE FUNCTION public.get_company_financial_stats(company_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier que l'appelant est admin OU contact_entreprise de cette company
  IF NOT (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'contact_entreprise')
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Retourner uniquement des stats agrégées, jamais de données individuelles
  SELECT json_build_object(
    'total_employees_with_profile', COUNT(ufp.id),
    'avg_age', ROUND(AVG(ufp.age)::numeric, 1),
    'profiles_complete_count', COUNT(CASE WHEN ufp.is_complete THEN 1 END),
    'profiles_incomplete_count', COUNT(CASE WHEN NOT ufp.is_complete OR ufp.is_complete IS NULL THEN 1 END),
    'has_immo_project_count', COUNT(CASE WHEN ufp.objectif_achat_immo THEN 1 END)
  ) INTO result
  FROM public.user_financial_profiles ufp
  INNER JOIN public.profiles p ON p.id = ufp.user_id
  WHERE p.company_id = company_uuid;

  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Accorder l'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_company_financial_stats(UUID) TO authenticated;