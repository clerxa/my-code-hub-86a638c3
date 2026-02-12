
-- Add missing foreign keys for relationships used in queries

-- hubspot_appointments.company_id -> companies.id
ALTER TABLE public.hubspot_appointments
ADD CONSTRAINT hubspot_appointments_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- user_financial_profiles.user_id -> profiles.id
ALTER TABLE public.user_financial_profiles
ADD CONSTRAINT user_financial_profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- user_notifications.notification_id -> notifications.id
ALTER TABLE public.user_notifications
ADD CONSTRAINT user_notifications_notification_id_fkey
FOREIGN KEY (notification_id) REFERENCES public.notifications(id);

-- parcours_modules.parcours_id -> parcours.id
ALTER TABLE public.parcours_modules
ADD CONSTRAINT parcours_modules_parcours_id_fkey
FOREIGN KEY (parcours_id) REFERENCES public.parcours(id);

-- parcours_modules.module_id -> modules.id
ALTER TABLE public.parcours_modules
ADD CONSTRAINT parcours_modules_module_id_fkey
FOREIGN KEY (module_id) REFERENCES public.modules(id);

-- profiles.company_id -> companies.id
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- Create missing RPC functions

CREATE OR REPLACE FUNCTION public.get_filtered_forum_posts(
  p_limit integer DEFAULT 10,
  p_category_id uuid DEFAULT NULL,
  p_sort_by text DEFAULT 'newest',
  p_since_days integer DEFAULT NULL
)
RETURNS SETOF forum_posts
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT fp.*
  FROM forum_posts fp
  WHERE (fp.is_deleted IS NULL OR fp.is_deleted = false)
    AND (p_category_id IS NULL OR fp.category_id = p_category_id)
    AND (p_since_days IS NULL OR fp.created_at >= NOW() - (p_since_days || ' days')::interval)
  ORDER BY
    CASE WHEN p_sort_by = 'trending' THEN fp.views_count ELSE 0 END DESC,
    CASE WHEN p_sort_by = 'unresolved' AND (fp.has_best_answer IS NULL OR fp.has_best_answer = false) THEN 1 ELSE 0 END DESC,
    fp.created_at DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_employee_stats(
  p_company_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_employees', (SELECT count(*) FROM profiles WHERE company_id = p_company_id),
    'active_employees', (SELECT count(*) FROM profiles WHERE company_id = p_company_id AND last_login IS NOT NULL),
    'avg_points', (SELECT coalesce(avg(total_points), 0) FROM profiles WHERE company_id = p_company_id)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_extended_stats(
  p_company_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_modules_completed', (SELECT count(*) FROM module_validations mv JOIN profiles p ON mv.user_id = p.id WHERE p.company_id = p_company_id),
    'total_simulations', (SELECT count(*) FROM simulation_logs sl JOIN profiles p ON sl.user_id = p.id WHERE p.company_id = p_company_id),
    'total_appointments', 0
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_module_chart_data(
  p_company_id uuid
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) INTO result
  FROM (
    SELECT m.title as module_name, count(mv.id) as completion_count
    FROM modules m
    LEFT JOIN module_validations mv ON mv.module_id = m.id
    LEFT JOIN profiles p ON mv.user_id = p.id AND p.company_id = p_company_id
    WHERE mv.id IS NOT NULL
    GROUP BY m.id, m.title
    ORDER BY completion_count DESC
    LIMIT 10
  ) t;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_simulation_stats(
  p_company_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) INTO result
  FROM (
    SELECT sl.simulator_type, count(*) as usage_count
    FROM simulation_logs sl
    JOIN profiles p ON sl.user_id = p.id
    WHERE p.company_id = p_company_id
    GROUP BY sl.simulator_type
    ORDER BY usage_count DESC
  ) t;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_registration_trends(
  p_company_id uuid
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) INTO result
  FROM (
    SELECT 
      to_char(date_trunc('month', created_at), 'YYYY-MM') as month_key,
      to_char(date_trunc('month', created_at), 'Mon YYYY') as month_label,
      count(*) as registrations
    FROM profiles
    WHERE company_id = p_company_id
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
  ) t;
  RETURN result;
END;
$$;
