
-- Add contribution tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS forum_posts_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS forum_comments_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS forum_contribution_score integer DEFAULT 0;

-- Insert default contribution levels configuration
INSERT INTO public.forum_settings (key, value)
VALUES ('contribution_levels', '{
  "levels": [
    {"name": "Contributeur Explorateur", "min_score": 0, "icon": "Compass", "color": "#6B7280"},
    {"name": "Contributeur Actif", "min_score": 10, "icon": "Zap", "color": "#3B82F6"},
    {"name": "Contributeur Référent", "min_score": 50, "icon": "Award", "color": "#8B5CF6"},
    {"name": "Contributeur Expert", "min_score": 150, "icon": "Star", "color": "#F59E0B"},
    {"name": "Contributeur Leader", "min_score": 300, "icon": "Crown", "color": "#EF4444"}
  ],
  "points_per_post": 5,
  "points_per_comment": 2,
  "points_per_like_received": 1
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create function to update contribution score
CREATE OR REPLACE FUNCTION public.update_user_contribution_score()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_posts_count integer;
  v_comments_count integer;
  v_contribution_config jsonb;
  v_points_per_post integer;
  v_points_per_comment integer;
  v_new_score integer;
BEGIN
  -- Determine which user to update based on the operation
  IF TG_TABLE_NAME = 'forum_posts' THEN
    IF TG_OP = 'DELETE' THEN
      v_user_id := OLD.author_id;
    ELSE
      v_user_id := NEW.author_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'forum_comments' THEN
    IF TG_OP = 'DELETE' THEN
      v_user_id := OLD.author_id;
    ELSE
      v_user_id := NEW.author_id;
    END IF;
  END IF;

  -- Get contribution config
  SELECT value INTO v_contribution_config
  FROM public.forum_settings
  WHERE key = 'contribution_levels';

  v_points_per_post := COALESCE((v_contribution_config->>'points_per_post')::integer, 5);
  v_points_per_comment := COALESCE((v_contribution_config->>'points_per_comment')::integer, 2);

  -- Count posts and comments
  SELECT COUNT(*) INTO v_posts_count
  FROM public.forum_posts
  WHERE author_id = v_user_id;

  SELECT COUNT(*) INTO v_comments_count
  FROM public.forum_comments
  WHERE author_id = v_user_id;

  -- Calculate new score
  v_new_score := (v_posts_count * v_points_per_post) + (v_comments_count * v_points_per_comment);

  -- Update profile
  UPDATE public.profiles
  SET 
    forum_posts_count = v_posts_count,
    forum_comments_count = v_comments_count,
    forum_contribution_score = v_new_score
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for posts
DROP TRIGGER IF EXISTS trigger_update_contribution_on_post ON public.forum_posts;
CREATE TRIGGER trigger_update_contribution_on_post
AFTER INSERT OR DELETE ON public.forum_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_user_contribution_score();

-- Create triggers for comments
DROP TRIGGER IF EXISTS trigger_update_contribution_on_comment ON public.forum_comments;
CREATE TRIGGER trigger_update_contribution_on_comment
AFTER INSERT OR DELETE ON public.forum_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_user_contribution_score();
