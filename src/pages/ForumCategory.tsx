import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ForumCategory, ForumPost } from "@/types/forum";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/forum/PostCard";
import { CreatePostDialog } from "@/components/forum/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Plus, 
  Calculator,
  PiggyBank,
  Umbrella,
  Briefcase,
  TrendingUp,
  Home,
  Shield,
  Wallet,
  Heart,
  Rocket,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

type SortOption = "newest" | "most_liked" | "unresolved";

const iconMap: Record<string, any> = {
  Calculator,
  PiggyBank,
  Umbrella,
  Briefcase,
  TrendingUp,
  Home,
  Shield,
  Wallet,
  Heart,
  Rocket,
  HelpCircle,
  Sparkles,
};

export default function ForumCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    fetchCategoryAndPosts();
  }, [slug, sortBy]);

  const fetchCategoryAndPosts = async () => {
    if (!slug) return;

    try {
      setLoading(true);

      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from("forum_categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      // Fetch posts using RPC for company filtering and anonymity
      const { data: securePostsData, error: postsError } = await supabase
        .rpc("get_filtered_forum_posts", {
          p_limit: 100,
          p_category_id: categoryData.id,
          p_sort_by: sortBy === "unresolved" ? "unresolved" : "newest"
        });

      if (postsError) throw postsError;
      
      // Fetch author info for non-anonymous posts
      const postsData = await Promise.all(
        (securePostsData || []).map(async (post: any) => {
          let author = null;
          if (post.author_id) {
            const { data: authorData } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar_url, total_points")
              .eq("id", post.author_id)
              .single();
            author = authorData;
          }
          return { ...post, author, category: categoryData };
        })
      );

      // Enrich posts with likes and comments count
      const enrichedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase.from("forum_post_likes").select("id", { count: "exact" }).eq("post_id", post.id),
            supabase.from("forum_comments").select("id", { count: "exact" }).eq("post_id", post.id),
            supabase.auth.getUser().then(({ data: { user } }) =>
              user
                ? supabase.from("forum_post_likes").select("id").eq("post_id", post.id).eq("user_id", user.id).single()
                : { data: null }
            ),
          ]);

          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            is_liked: !!userLikeResult.data,
          };
        })
      );

      // Sort by likes if needed
      if (sortBy === "most_liked") {
        enrichedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching category data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la catégorie",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Catégorie introuvable</p>
            <Button onClick={() => navigate("/forum")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au forum
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/forum")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au forum
          </Button>

          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-4 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}
            >
              {iconMap[category.icon] ? (
                (() => {
                  const IconComponent = iconMap[category.icon];
                  return <IconComponent className="h-8 w-8" />;
                })()
              ) : (
                <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl hero-gradient mb-2">
                {category.name}
              </h1>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Plus récents</SelectItem>
                <SelectItem value="most_liked">Plus aimés</SelectItem>
                <SelectItem value="unresolved">Non résolus</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowCreatePost(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Poser une question
            </Button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Aucun post dans cette catégorie
              </p>
              <Button onClick={() => setShowCreatePost(true)}>
                Créer le premier post
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={fetchCategoryAndPosts}
              />
            ))
          )}
        </div>
      </main>

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        onPostCreated={fetchCategoryAndPosts}
        preselectedCategoryId={category.id}
      />
    </div>
  );
}
