-- FORUM_POSTS - L'insert doit vérifier l'auteur
DROP POLICY IF EXISTS "Anyone can insert posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authenticated users can insert forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.forum_posts;

CREATE POLICY "Users can create their own posts"
ON public.forum_posts FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- FORUM_COMMENTS - L'insert doit vérifier l'auteur  
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Authenticated users can insert forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON public.forum_comments;

CREATE POLICY "Users can create their own comments"
ON public.forum_comments FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- MODULE_VALIDATIONS - L'insert doit vérifier l'utilisateur
DROP POLICY IF EXISTS "Anyone can insert module validations" ON public.module_validations;
DROP POLICY IF EXISTS "Users can validate their own modules" ON public.module_validations;

CREATE POLICY "Users can validate their own modules"
ON public.module_validations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());