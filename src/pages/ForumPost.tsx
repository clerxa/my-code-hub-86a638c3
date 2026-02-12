import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ForumPost as ForumPostType, ForumComment } from "@/types/forum";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, MessageSquare, Eye, CheckCircle2, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CommentSection } from "@/components/forum/CommentSection";
import { sanitizeHtml } from "@/lib/sanitize";
import { ContributionLevelBadge } from "@/components/forum/ContributionLevelBadge";
import { useContributionLevels } from "@/hooks/useContributionLevels";

interface AuthorMetadata {
  contributionScore: number;
  userRole: string | null;
}

export default function ForumPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<ForumPostType | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorMetadata, setAuthorMetadata] = useState<AuthorMetadata | null>(null);
  const { toast } = useToast();
  const { levels } = useContributionLevels();

  useEffect(() => {
    if (postId) {
      fetchPost();
      incrementViewCount();
    }
  }, [postId]);

  const incrementViewCount = async () => {
    if (!postId) return;
    
    // Increment view count
    const { data: postData } = await supabase
      .from("forum_posts")
      .select("views_count")
      .eq("id", postId)
      .single();
    
    if (postData) {
      await supabase
        .from("forum_posts")
        .update({ views_count: (postData.views_count || 0) + 1 })
        .eq("id", postId);
    }
  };

  const fetchPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);

      // Fetch post using secure view for anonymity
      const { data: rawSecurePostData, error: postError } = await supabase
        .from("secure_forum_posts" as any)
        .select("*")
        .eq("id", postId)
        .single();

      if (postError) throw postError;
      
      const securePostData = rawSecurePostData as any;
      
      // Fetch author info if author_id is visible (not null = not anonymous for this user)
      let author = null;
      if (securePostData?.author_id) {
        const { data: authorData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, total_points")
          .eq("id", securePostData.author_id)
          .single();
        author = authorData;
      }
      
      // Fetch category
      const { data: categoryData } = await supabase
        .from("forum_categories")
        .select("*")
        .eq("id", securePostData?.category_id)
        .single();
      
      const postData = { ...securePostData, author, category: categoryData };

      // Fetch author metadata (contribution score and role)
      if (postData.author?.id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("forum_contribution_score")
          .eq("id", postData.author.id)
          .maybeSingle();

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", postData.author.id)
          .maybeSingle();

        setAuthorMetadata({
          contributionScore: profileData?.forum_contribution_score || 0,
          userRole: roleData?.role || null,
        });
      }

      // Get likes count and current user's like status
      const { data: { user } } = await supabase.auth.getUser();
      
      const { count: likesCount } = await supabase
        .from("forum_post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      let isLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from("forum_post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        isLiked = !!likeData;
      }

      const { count: commentsCount } = await supabase
        .from("forum_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      setPost({
        ...postData,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        is_liked: isLiked,
      });

      // Fetch comments
      await fetchComments();

    } catch (error: any) {
      console.error("Error fetching post:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;

    // Use secure view for comments to ensure anonymity
    const { data: secureCommentsData, error: commentsError } = await supabase
      .from("secure_forum_comments" as any)
      .select("*")
      .eq("post_id", postId)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return;
    }
    
    // Fetch author info for non-anonymous comments
    const commentsData = await Promise.all(
      (secureCommentsData || []).map(async (comment: any) => {
        let author = null;
        if (comment.author_id) {
          const { data: authorData } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url, total_points")
            .eq("id", comment.author_id)
            .single();
          author = authorData;
        }
        return { ...comment, author };
      })
    );

    // Enrich comments with likes and replies
    const enrichedComments = await Promise.all(
      (commentsData || []).map(async (comment) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { count: likesCount } = await supabase
          .from("forum_comment_likes")
          .select("*", { count: "exact", head: true })
          .eq("comment_id", comment.id);

        let isLiked = false;
        if (user) {
          const { data: likeData } = await supabase
            .from("forum_comment_likes")
            .select("id")
            .eq("comment_id", comment.id)
            .eq("user_id", user.id)
            .maybeSingle();
          
          isLiked = !!likeData;
        }

        // Fetch replies using secure view
        const { data: secureRepliesData } = await supabase
          .from("secure_forum_comments" as any)
          .select("*")
          .eq("parent_comment_id", comment.id)
          .order("created_at", { ascending: true });
        
        // Enrich replies with author info
        const repliesData = await Promise.all(
          (secureRepliesData || []).map(async (reply: any) => {
            let author = null;
            if (reply.author_id) {
              const { data: authorData } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, avatar_url, total_points")
                .eq("id", reply.author_id)
                .single();
              author = authorData;
            }
            return { ...reply, author };
          })
        );

        return {
          ...comment,
          likes_count: likesCount || 0,
          is_liked: isLiked,
          replies: repliesData || [],
        };
      })
    );

    setComments(enrichedComments);
  };

  const handleLike = async () => {
    if (!post) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour aimer un post",
        variant: "destructive",
      });
      return;
    }

    try {
      if (post.is_liked) {
        await supabase
          .from("forum_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("forum_post_likes")
          .insert({ post_id: post.id, user_id: user.id });
      }
      
      fetchPost();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le like",
        variant: "destructive",
      });
    }
  };

  const getAuthorName = () => {
    // If post is anonymous, show the display_pseudo
    if (post?.is_anonymous && post?.display_pseudo) {
      return post.display_pseudo;
    }
    if (!post?.author) return "Utilisateur";
    return `${post.author.first_name || ""} ${post.author.last_name || ""}`.trim() || "Utilisateur";
  };

  const getAuthorInitials = () => {
    // If post is anonymous, use pseudo initial
    if (post?.is_anonymous && post?.display_pseudo) {
      return post.display_pseudo.charAt(0).toUpperCase();
    }
    if (!post?.author) return "U";
    const firstName = post.author.first_name || "";
    const lastName = post.author.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getAuthorAvatar = () => {
    // If post is anonymous, use display_avatar_url
    if (post?.is_anonymous && post?.display_avatar_url) {
      return post.display_avatar_url;
    }
    return post?.author?.avatar_url || undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Post non trouvé</p>
          <Button onClick={() => navigate("/forum")}>
            Retour au forum
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate("/forum")}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au forum
        </Button>

        {/* Post Card */}
        <Card className="p-8 mb-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getAuthorAvatar()} />
                  <AvatarFallback className={post.is_anonymous ? "bg-primary/20 text-primary" : ""}>
                    {getAuthorInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{getAuthorName()}</p>
                    {post.is_anonymous && (
                      <Badge variant="outline" className="text-xs">Anonyme</Badge>
                    )}
                    {authorMetadata && (
                      <ContributionLevelBadge
                        contributionScore={authorMetadata.contributionScore}
                        userRole={authorMetadata.userRole}
                        levels={levels}
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {post.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    Épinglé
                  </Badge>
                )}
                {post.has_best_answer && (
                  <Badge variant="default" className="gap-1 bg-green-500/20 text-green-500 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Résolu
                  </Badge>
                )}
              </div>
            </div>

            {/* Category */}
            {post.category && (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${post.category.color}20`,
                  color: post.category.color,
                  borderColor: post.category.color,
                }}
              >
                {post.category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl hero-gradient">{post.title}</h1>

            {/* Content */}
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={handleLike}
              >
                <Heart
                  className={`h-4 w-4 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span>{post.likes_count || 0}</span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{post.comments_count || 0} réponses</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{post.views_count || 0} vues</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Comments Section */}
        <CommentSection
          postId={post.id}
          comments={comments}
          onCommentAdded={fetchComments}
        />
      </div>
    </div>
  );
}
