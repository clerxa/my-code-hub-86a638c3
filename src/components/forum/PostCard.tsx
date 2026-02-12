import { useState, useEffect } from "react";
import { ForumPost } from "@/types/forum";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, Eye, CheckCircle2, Pin, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/sanitize";
import { ContributionLevelBadge } from "./ContributionLevelBadge";
import { useContributionLevels } from "@/hooks/useContributionLevels";
import { ModerationDeleteDialog } from "./ModerationDeleteDialog";
import { awardForumGiveLikePoints, awardForumReceiveLikePoints } from "@/lib/pointsService";

interface PostCardProps {
  post: ForumPost;
  onUpdate?: () => void;
}

interface AuthorData {
  contributionScore: number;
  userRole: string | null;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { levels } = useContributionLevels();
  const [authorData, setAuthorData] = useState<AuthorData | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!post.author?.id) return;

      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("forum_contribution_score")
          .eq("id", post.author.id)
          .maybeSingle();

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", post.author.id)
          .maybeSingle();

        setAuthorData({
          contributionScore: profileData?.forum_contribution_score || 0,
          userRole: roleData?.role || null,
        });
      } catch (error) {
        console.error("Error fetching author data:", error);
      }
    };

    const checkModeratorStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsModerator(roleData?.role === "admin" || roleData?.role === "contact_entreprise");
    };

    fetchAuthorData();
    checkModeratorStatus();
  }, [post.author?.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
        
        // Award points for giving a like
        await awardForumGiveLikePoints(user.id);
        
        // Award points to the post author for receiving a like
        if (post.author?.id && post.author.id !== user.id) {
          await awardForumReceiveLikePoints(post.author.id);
        }
      }
      
      onUpdate?.();
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
    if (post.is_anonymous && post.display_pseudo) {
      return post.display_pseudo;
    }
    if (!post.author) return "Utilisateur";
    return `${post.author.first_name || ""} ${post.author.last_name || ""}`.trim() || "Utilisateur";
  };

  const getAuthorInitials = () => {
    // If post is anonymous, use pseudo initial
    if (post.is_anonymous && post.display_pseudo) {
      return post.display_pseudo.charAt(0).toUpperCase();
    }
    if (!post.author) return "U";
    const firstName = post.author.first_name || "";
    const lastName = post.author.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getAuthorAvatar = () => {
    // If post is anonymous, use display_avatar_url
    if (post.is_anonymous && post.display_avatar_url) {
      return post.display_avatar_url;
    }
    return post.author?.avatar_url || undefined;
  };

  return (
    <Card
      className="p-6 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/forum/post/${post.id}`)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getAuthorAvatar()} />
              <AvatarFallback className={post.is_anonymous ? "bg-primary/20 text-primary" : ""}>
                {getAuthorInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground">
                  {getAuthorName()}
                </p>
                {post.is_anonymous && (
                  <Badge variant="outline" className="text-xs">Anonyme</Badge>
                )}
                {authorData && (
                  <ContributionLevelBadge
                    contributionScore={authorData.contributionScore}
                    userRole={authorData.userRole}
                    levels={levels}
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                </span>
                {post.is_pinned && (
                  <Pin className="h-4 w-4 text-primary" />
                )}
              </div>
              {post.category && (
                <Badge
                  variant="secondary"
                  className="mt-1"
                  style={{
                    backgroundColor: `${post.category.color}20`,
                    color: post.category.color,
                    borderColor: post.category.color,
                  }}
                >
                  {post.category.name}
                </Badge>
              )}
            </div>
          </div>
          {post.has_best_answer && (
            <Badge variant="default" className="gap-1 bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle2 className="h-3 w-3" />
              Résolu
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* Content Preview */}
        <div 
          className="text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
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
              <span>{post.comments_count || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{post.views_count || 0}</span>
            </div>
            {isModerator && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ModerationDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        targetType="post"
        targetId={post.id}
        onDeleted={() => onUpdate?.()}
      />
    </Card>
  );
}
