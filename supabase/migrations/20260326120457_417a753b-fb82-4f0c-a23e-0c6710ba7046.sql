
CREATE OR REPLACE FUNCTION public.get_filtered_forum_posts(
  p_limit integer DEFAULT 10,
  p_category_id uuid DEFAULT NULL::uuid,
  p_sort_by text DEFAULT 'newest'::text,
  p_since_days integer DEFAULT NULL::integer
)
 RETURNS SETOF forum_posts
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_company_id uuid;
  v_company_open boolean;
BEGIN
  -- Get the calling user's company_id
  SELECT company_id INTO v_user_company_id
  FROM public.profiles
  WHERE id = auth.uid();

  -- Get the company's forum_access_all_discussions setting
  SELECT COALESCE(forum_access_all_discussions, false) INTO v_company_open
  FROM public.companies
  WHERE id = v_user_company_id;

  RETURN QUERY
  SELECT fp.*
  FROM forum_posts fp
  JOIN profiles p_author ON p_author.id = fp.author_id
  WHERE (fp.is_deleted IS NULL OR fp.is_deleted = false)
    AND (p_category_id IS NULL OR fp.category_id = p_category_id)
    AND (p_since_days IS NULL OR fp.created_at >= NOW() - (p_since_days || ' days')::interval)
    AND (
      -- Always see posts from own company
      p_author.company_id = v_user_company_id
      OR (
        -- If user's company has opened global access,
        -- also see posts from other companies that have opened global access
        v_company_open = true
        AND EXISTS (
          SELECT 1 FROM public.companies c
          WHERE c.id = p_author.company_id
            AND COALESCE(c.forum_access_all_discussions, false) = true
        )
      )
    )
  ORDER BY
    CASE WHEN p_sort_by = 'trending' THEN fp.views_count ELSE 0 END DESC,
    CASE WHEN p_sort_by = 'unresolved' AND (fp.has_best_answer IS NULL OR fp.has_best_answer = false) THEN 1 ELSE 0 END DESC,
    fp.created_at DESC
  LIMIT p_limit;
END;
$function$;
