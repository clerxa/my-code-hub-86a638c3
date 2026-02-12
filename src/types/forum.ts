export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order_num: number;
  created_at: string;
  post_count?: number;
  latest_posts?: ForumPost[];
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category_id: string;
  author_id: string;
  tags: string[];
  views_count: number;
  is_pinned: boolean;
  is_closed: boolean;
  has_best_answer: boolean;
  is_anonymous: boolean;
  display_pseudo: string | null;
  display_avatar_url: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    total_points: number;
    forum_pseudo?: string | null;
    forum_avatar_url?: string | null;
    forum_anonymous_mode?: boolean;
  };
  category?: ForumCategory;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  is_best_answer: boolean;
  is_anonymous?: boolean;
  display_pseudo?: string | null;
  display_avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    total_points: number;
    forum_pseudo?: string | null;
    forum_avatar_url?: string | null;
    forum_anonymous_mode?: boolean;
  };
  likes_count?: number;
  is_liked?: boolean;
  replies?: ForumComment[];
}
