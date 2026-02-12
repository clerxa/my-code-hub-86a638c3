-- Create a function to get forum posts filtered by company access settings
CREATE OR REPLACE FUNCTION public.get_filtered_forum_posts(
  p_limit integer DEFAULT 10,
  p_category_id uuid DEFAULT NULL,
  p_sort_by text DEFAULT 'newest',
  p_since_days integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category_id uuid,
  tags text[],
  views_count integer,
  is_pinned boolean,
  is_closed boolean,
  has_best_answer boolean,
  created_at timestamptz,
  updated_at timestamptz,
  is_anonymous boolean,
  is_deleted boolean,
  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason_id uuid,
  author_id uuid,
  display_pseudo text,
  display_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_company_id uuid;
  v_has_global_access boolean;
  v_is_admin boolean;
BEGIN
  -- Get user's company and check if they're admin
  SELECT p.company_id INTO v_user_company_id
  FROM profiles p
  WHERE p.id = v_user_id;
  
  v_is_admin := has_role(v_user_id, 'admin'::app_role);
  
  -- Check if company has global forum access enabled
  IF v_user_company_id IS NOT NULL AND NOT v_is_admin THEN
    SELECT COALESCE(c.forum_access_all_discussions, false) INTO v_has_global_access
    FROM companies c
    WHERE c.id = v_user_company_id;
  ELSE
    -- Admins or users without company have global access
    v_has_global_access := true;
  END IF;

  RETURN QUERY
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
    -- Handle anonymity
    CASE
      WHEN fp.author_id = v_user_id THEN fp.author_id
      WHEN v_is_admin THEN fp.author_id
      WHEN fp.is_anonymous = true THEN NULL::uuid
      ELSE fp.author_id
    END AS author_id,
    CASE
      WHEN fp.author_id = v_user_id THEN fp.display_pseudo
      WHEN v_is_admin THEN fp.display_pseudo
      WHEN fp.is_anonymous = true THEN 'Membre Anonyme'::text
      ELSE fp.display_pseudo
    END AS display_pseudo,
    CASE
      WHEN fp.author_id = v_user_id THEN fp.display_avatar_url
      WHEN v_is_admin THEN fp.display_avatar_url
      WHEN fp.is_anonymous = true THEN NULL::text
      ELSE fp.display_avatar_url
    END AS display_avatar_url
  FROM forum_posts fp
  -- Join to filter by author's company if needed
  LEFT JOIN profiles author_profile ON fp.author_id = author_profile.id
  WHERE 
    -- Filter by company access
    (
      v_has_global_access = true 
      OR author_profile.company_id = v_user_company_id 
      OR author_profile.company_id IS NULL
    )
    -- Filter by category if provided
    AND (p_category_id IS NULL OR fp.category_id = p_category_id)
    -- Filter by time if provided
    AND (p_since_days IS NULL OR fp.created_at >= (now() - (p_since_days || ' days')::interval))
  ORDER BY
    CASE WHEN p_sort_by = 'newest' THEN fp.created_at END DESC,
    CASE WHEN p_sort_by = 'trending' THEN fp.views_count END DESC,
    CASE WHEN p_sort_by = 'unresolved' AND fp.has_best_answer = false THEN fp.created_at END DESC
  LIMIT p_limit;
END;
$$;