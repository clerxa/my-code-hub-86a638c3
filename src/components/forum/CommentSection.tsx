import { useState, useEffect } from "react";
import { ForumComment } from "@/types/forum";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, CheckCircle2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeComment } from "@/lib/sanitize";
import { ContributionLevelBadge } from "./ContributionLevelBadge";
import { useContributionLevels } from "@/hooks/useContributionLevels";
import { ModerationDeleteDialog } from "./ModerationDeleteDialog";
import { awardForumCommentPoints, awardForumGiveLikePoints, awardForumReceiveLikePoints } from "@/lib/pointsService";

interface CommentSectionProps {
  postId: string;
  comments: ForumComment[];
  onCommentAdded: () => void;
}

interface AuthorMetadata {
  contributionScore: number;
  userRole: string | null;
}

export function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [authorsMetadata, setAuthorsMetadata] = useState<Record<string, AuthorMetadata>>({});
  const [isModerator, setIsModerator] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const { toast } = useToast();
  const { levels } = useContributionLevels();

  // Fetch author metadata and check moderator status
  useEffect(() => {
    const fetchAuthorsMetadata = async () => {
      const authorIds = new Set<string>();
      const collectAuthorIds = (commentList: ForumComment[]) => {
        commentList.forEach(comment => {
          if (comment.author?.id) authorIds.add(comment.author.id);
          if (comment.replies && Array.isArray(comment.replies)) {
            collectAuthorIds(comment.replies as ForumComment[]);
          }
        });
      };
      collectAuthorIds(comments);
      if (authorIds.size === 0) return;

      const authorIdsArray = Array.from(authorIds);
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, forum_contribution_score")
          .in("id", authorIdsArray);

        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", authorIdsArray);

        const metadata: Record<string, AuthorMetadata> = {};
        authorIdsArray.forEach(id => {
          const profile = profilesData?.find(p => p.id === id);
          const role = rolesData?.find(r => r.user_id === id);
          metadata[id] = {
            contributionScore: profile?.forum_contribution_score || 0,
            userRole: role?.role || null,
          };
        });
        setAuthorsMetadata(metadata);
      } catch (error) {
        console.error("Error fetching authors metadata:", error);
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

    fetchAuthorsMetadata();
    checkModeratorStatus();
  }, [comments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour commenter",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user has anonymous mode enabled
      const { data: profileData } = await supabase
        .from("profiles")
        .select("forum_anonymous_mode, forum_pseudo, forum_avatar_url")
        .eq("id", user.id)
        .single();

      const isAnonymous = profileData?.forum_anonymous_mode || false;
      const displayPseudo = isAnonymous ? profileData?.forum_pseudo : null;
      const displayAvatarUrl = isAnonymous ? profileData?.forum_avatar_url : null;

      const { error } = await supabase.from("forum_comments").insert({
        post_id: postId,
        author_id: user.id,
        content: newComment,
        is_anonymous: isAnonymous,
        display_pseudo: displayPseudo,
        display_avatar_url: displayAvatarUrl,
      });

      if (error) throw error;
      
      // Award points for commenting
      await awardForumCommentPoints(user.id);

      toast({
        title: "Succès",
        description: "Votre commentaire a été publié" + (isAnonymous ? " de manière anonyme" : ""),
      });

      setNewComment("");
      onCommentAdded();
    } catch (error: any) {
      console.error("Error creating comment:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier le commentaire",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour répondre",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user has anonymous mode enabled
      const { data: profileData } = await supabase
        .from("profiles")
        .select("forum_anonymous_mode, forum_pseudo, forum_avatar_url")
        .eq("id", user.id)
        .single();

      const isAnonymous = profileData?.forum_anonymous_mode || false;
      const displayPseudo = isAnonymous ? profileData?.forum_pseudo : null;
      const displayAvatarUrl = isAnonymous ? profileData?.forum_avatar_url : null;

      const { error } = await supabase.from("forum_comments").insert({
        post_id: postId,
        author_id: user.id,
        content: replyContent,
        parent_comment_id: parentId,
        is_anonymous: isAnonymous,
        display_pseudo: displayPseudo,
        display_avatar_url: displayAvatarUrl,
      });

      if (error) throw error;
      
      // Award points for commenting (replies count as comments)
      await awardForumCommentPoints(user.id);

      toast({
        title: "Succès",
        description: "Votre réponse a été publiée" + (isAnonymous ? " de manière anonyme" : ""),
      });

      setReplyContent("");
      setReplyingTo(null);
      onCommentAdded();
    } catch (error: any) {
      console.error("Error creating reply:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier la réponse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour liker un commentaire",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("forum_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("forum_comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });
        
        // Award points for giving a like
        await awardForumGiveLikePoints(user.id);
        
        // Find the comment author and award them points for receiving a like
        const comment = comments.find(c => c.id === commentId) || 
                       comments.flatMap(c => (c.replies as ForumComment[]) || []).find(c => c.id === commentId);
        if (comment?.author?.id && comment.author.id !== user.id) {
          await awardForumReceiveLikePoints(comment.author.id);
        }
      }
      
      onCommentAdded();
    } catch (error) {
      console.error("Error toggling comment like:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le like",
        variant: "destructive",
      });
    }
  };

  const getAuthorName = (comment: ForumComment) => {
    // If comment is anonymous, show the display_pseudo
    if (comment.is_anonymous && comment.display_pseudo) {
      return comment.display_pseudo;
    }
    if (!comment.author) return "Utilisateur";
    return `${comment.author.first_name || ""} ${comment.author.last_name || ""}`.trim() || "Utilisateur";
  };

  const getAuthorInitials = (comment: ForumComment) => {
    // If comment is anonymous, use pseudo initial
    if (comment.is_anonymous && comment.display_pseudo) {
      return comment.display_pseudo.charAt(0).toUpperCase();
    }
    if (!comment.author) return "U";
    const firstName = comment.author.first_name || "";
    const lastName = comment.author.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getAuthorAvatar = (comment: ForumComment) => {
    // If comment is anonymous, use display_avatar_url
    if (comment.is_anonymous && comment.display_avatar_url) {
      return comment.display_avatar_url;
    }
    return comment.author?.avatar_url || undefined;
  };

  const renderComment = (comment: ForumComment, isReply = false) => {
    const authorMeta = comment.author?.id ? authorsMetadata[comment.author.id] : null;

    return (
      <div key={comment.id} className={isReply ? "ml-12 mt-4" : ""}>
        <Card className="p-4">
          <div className="space-y-4">
            {/* Comment Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAuthorAvatar(comment)} />
                  <AvatarFallback className={comment.is_anonymous ? "bg-primary/20 text-primary text-xs" : ""}>
                    {getAuthorInitials(comment)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{getAuthorName(comment)}</p>
                    {comment.is_anonymous && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Anonyme</Badge>
                    )}
                    {authorMeta && (
                      <ContributionLevelBadge
                        contributionScore={authorMeta.contributionScore}
                        userRole={authorMeta.userRole}
                        levels={levels}
                        compact
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
              {comment.is_best_answer && (
                <Badge variant="default" className="gap-1 bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3" />
                  Meilleure réponse
                </Badge>
              )}
            </div>

            {/* Comment Content */}
            <div 
              className="text-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeComment(comment.content) }}
            />

            {/* Comment Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8"
                onClick={() => handleLikeComment(comment.id, comment.is_liked || false)}
              >
                <Heart
                  className={`h-3 w-3 ${comment.is_liked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span className="text-xs">{comment.likes_count || 0}</span>
              </Button>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-xs">Répondre</span>
                </Button>
              )}
              {isModerator && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="space-y-2 pt-2">
                <Textarea
                  placeholder="Écrivez votre réponse..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={loading || !replyContent.trim()}
                  >
                    Publier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <ModerationDeleteDialog
          open={deleteDialogOpen === comment.id}
          onOpenChange={(open) => setDeleteDialogOpen(open ? comment.id : null)}
          targetType="comment"
          targetId={comment.id}
          onDeleted={onCommentAdded}
        />

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map((reply) => renderComment(reply as ForumComment, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Réponses ({comments.length})
        </h2>
        <div className="space-y-4">
          <Textarea
            placeholder="Partagez votre réponse, conseil ou expérience..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={loading || !newComment.trim()}
          >
            {loading ? "Publication..." : "Publier ma réponse"}
          </Button>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => renderComment(comment))}
        {comments.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Soyez le premier à répondre à cette question
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
