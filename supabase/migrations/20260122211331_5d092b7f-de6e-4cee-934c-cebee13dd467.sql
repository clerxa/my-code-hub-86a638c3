-- Recréer les vues avec SECURITY INVOKER (comportement par défaut et sécurisé)
-- Les vues utiliseront les permissions de l'utilisateur qui les interroge

DROP VIEW IF EXISTS public.secure_forum_posts;
DROP VIEW IF EXISTS public.secure_forum_comments;

-- Vue sécurisée pour les posts du forum avec SECURITY INVOKER explicite
CREATE VIEW public.secure_forum_posts 
WITH (security_invoker = true)
AS
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
    WHEN fp.author_id = auth.uid() THEN fp.author_id
    WHEN public.has_role(auth.uid(), 'admin') THEN fp.author_id
    WHEN fp.is_anonymous = TRUE THEN NULL
    ELSE fp.author_id
  END AS author_id,
  CASE 
    WHEN fp.author_id = auth.uid() THEN fp.display_pseudo
    WHEN public.has_role(auth.uid(), 'admin') THEN fp.display_pseudo
    WHEN fp.is_anonymous = TRUE THEN 'Membre Anonyme'
    ELSE fp.display_pseudo
  END AS display_pseudo,
  CASE 
    WHEN fp.author_id = auth.uid() THEN fp.display_avatar_url
    WHEN public.has_role(auth.uid(), 'admin') THEN fp.display_avatar_url
    WHEN fp.is_anonymous = TRUE THEN NULL
    ELSE fp.display_avatar_url
  END AS display_avatar_url
FROM public.forum_posts fp;

-- Vue sécurisée pour les commentaires du forum avec SECURITY INVOKER explicite
CREATE VIEW public.secure_forum_comments 
WITH (security_invoker = true)
AS
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
  CASE 
    WHEN fc.author_id = auth.uid() THEN fc.author_id
    WHEN public.has_role(auth.uid(), 'admin') THEN fc.author_id
    WHEN fc.is_anonymous = TRUE THEN NULL
    ELSE fc.author_id
  END AS author_id,
  CASE 
    WHEN fc.author_id = auth.uid() THEN fc.display_pseudo
    WHEN public.has_role(auth.uid(), 'admin') THEN fc.display_pseudo
    WHEN fc.is_anonymous = TRUE THEN 'Membre Anonyme'
    ELSE fc.display_pseudo
  END AS display_pseudo,
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