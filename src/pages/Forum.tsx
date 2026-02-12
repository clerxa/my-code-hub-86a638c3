import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ForumCategory, ForumPost } from "@/types/forum";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  TrendingUp,
  Clock,
  MessageSquarePlus,
  Calculator,
  PiggyBank,
  Umbrella,
  Briefcase,
  Home,
  Shield,
  Wallet,
  Heart,
  Rocket,
  HelpCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { CategoryCard } from "@/components/forum/CategoryCard";
import { PostCard } from "@/components/forum/PostCard";
import { CreatePostDialog } from "@/components/forum/CreatePostDialog";
import logo from "@/assets/logo.png";

const iconMap: Record<string, any> = {
  Calculator,
  PiggyBank,
  Umbrella,
  Briefcase,
  TrendingUp: TrendingUp,
  Home,
  Shield,
  Wallet,
  Heart,
  Rocket,
  HelpCircle,
  Sparkles,
};

export default function Forum() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([]);
  const [latestPosts, setLatestPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("forum_categories")
        .select("*")
        .order("order_num");
      if (categoriesError) throw categoriesError;

      // Fetch post counts for each category using company-filtered RPC
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // Use the same RPC that filters by company to get accurate counts
          const { data: posts } = await supabase
            .rpc("get_filtered_forum_posts", {
              p_limit: 1000, // High limit to get accurate count
              p_category_id: category.id
            });
          return {
            ...category,
            post_count: posts?.length || 0,
          };
        }),
      );
      setCategories(categoriesWithCounts);

      // Fetch trending posts (most viewed in last 7 days) - Using RPC for company filtering
      const { data: trendingData, error: trendingError } = await supabase
        .rpc("get_filtered_forum_posts", {
          p_limit: 5,
          p_sort_by: "trending",
          p_since_days: 7
        });
      if (trendingError) throw trendingError;
      
      // Fetch author info for non-anonymous posts and category info
      const enrichedTrendingData = await Promise.all(
        (trendingData || []).map(async (post: any) => {
          let author = null;
          if (post.author_id) {
            const { data: authorData } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar_url, total_points")
              .eq("id", post.author_id)
              .single();
            author = authorData;
          }
          const { data: categoryData } = await supabase
            .from("forum_categories")
            .select("name, slug, color")
            .eq("id", post.category_id)
            .single();
          return { ...post, author, category: categoryData };
        })
      );

      // Get likes and comments counts for trending posts
      const trendingWithCounts = await enrichPostsWithCounts(enrichedTrendingData || []);
      setTrendingPosts(trendingWithCounts);

      // Fetch latest posts - Using RPC for company filtering
      const { data: latestData, error: latestError } = await supabase
        .rpc("get_filtered_forum_posts", {
          p_limit: 10,
          p_sort_by: "newest"
        });
      if (latestError) throw latestError;
      
      // Fetch author info for non-anonymous posts and category info
      const enrichedLatestData = await Promise.all(
        (latestData || []).map(async (post: any) => {
          let author = null;
          if (post.author_id) {
            const { data: authorData } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar_url, total_points")
              .eq("id", post.author_id)
              .single();
            author = authorData;
          }
          const { data: categoryData } = await supabase
            .from("forum_categories")
            .select("name, slug, color")
            .eq("id", post.category_id)
            .single();
          return { ...post, author, category: categoryData };
        })
      );
      const latestWithCounts = await enrichPostsWithCounts(enrichedLatestData || []);
      setLatestPosts(latestWithCounts);
    } catch (error: any) {
      console.error("Error fetching forum data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du forum",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enrichPostsWithCounts = async (posts: any[]): Promise<ForumPost[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return await Promise.all(
      posts.map(async (post) => {
        const { count: likesCount } = await supabase
          .from("forum_post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);
        const { count: commentsCount } = await supabase
          .from("forum_comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);
        let isLiked = false;
        if (user) {
          const { data: likeData } = await supabase
            .from("forum_post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle();
          isLiked = !!likeData;
        }
        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: isLiked,
        };
      }),
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality in Phase 3
    toast({
      title: "Recherche",
      description: "Fonctionnalité de recherche à venir",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du forum...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Back to Employee Dashboard */}
      <div className="container mx-auto px-4 pt-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/employee")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mon espace
        </Button>
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 border-b border-border">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 overflow-hidden">
            <h1 className="text-2xl sm:text-4xl md:text-5xl hero-gradient break-words px-2">🦸‍♂️ Communauté FinCare</h1>
            <p className="text-base sm:text-xl text-muted-foreground px-2">
              Reprenez le pouvoir sur vos finances personnelles avec l'aide de la communauté
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setCreatePostOpen(true)}
                  size="lg"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2 shrink-0" />
                  <span className="hidden sm:inline">Poser une question</span>
                  <span className="sm:hidden">Question</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Posts Tabs - Above Categories */}
        <Tabs defaultValue="trending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Tendances</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
            <TabsTrigger value="latest" className="gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              Récent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4">
            <div className="space-y-4">
              {trendingPosts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={fetchData} />
              ))}
              {trendingPosts.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Aucun post tendance pour le moment</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="latest" className="space-y-4">
            <div className="space-y-4">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={fetchData} />
              ))}
              {latestPosts.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Aucun post pour le moment</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Categories Section */}
        <section className="mt-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Catégories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = iconMap[category.icon];
              return (
                <CategoryCard 
                  key={category.id} 
                  category={category} 
                  icon={IconComponent ? <IconComponent className="h-6 w-6" /> : <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />} 
                />
              );
            })}
          </div>
        </section>
      </div>

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        categories={categories}
        onPostCreated={fetchData}
      />
    </div>
  );
}
