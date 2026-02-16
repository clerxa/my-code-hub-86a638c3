import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/seo/PageMeta";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
  blog_categories: BlogCategory | null;
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as BlogCategory[];
    },
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts", activeCategory],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*, blog_categories(*)")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (activeCategory) {
        query = query.eq("category_id", activeCategory);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const featured = posts.find((p) => p.is_featured) || posts[0];
  const otherPosts = posts.filter((p) => p.id !== featured?.id);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Blog – MyFinCare"
        description="Retrouvez nos articles sur l'éducation financière, la politique sociale et le bien-être au travail."
        path="/blog"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <nav className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold hero-gradient">
            MyFinCare
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "text-sm transition-colors",
                  activeCategory === cat.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au site
            </Button>
          </Link>
        </nav>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-12">
        {/* Hero header */}
        <div className="mb-16 max-w-2xl">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4">
            <span className="hero-gradient">Le Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Ressources et conseils en éducation financière pour les entreprises et CSE.
          </p>
        </div>

        {/* Category pills (mobile) */}
        <div className="flex md:hidden gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              !activeCategory
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading && (
          <p className="text-muted-foreground text-center py-20">Chargement…</p>
        )}

        {!isLoading && posts.length === 0 && (
          <p className="text-muted-foreground text-center py-20">Aucun article pour le moment.</p>
        )}

        {/* Featured post */}
        {featured && (
          <Link
            to={`/blog/${featured.slug}`}
            className="block mb-12 group"
          >
            <article className="grid md:grid-cols-2 gap-8 bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card hover:shadow-hover transition-all duration-300">
              {featured.cover_image_url ? (
                <img
                  src={featured.cover_image_url}
                  alt={featured.title}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Pas d'image</span>
                </div>
              )}
              <div className="p-8 flex flex-col justify-center">
                {featured.blog_categories && (
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full w-fit mb-4 border"
                    style={{
                      color: featured.blog_categories.color,
                      borderColor: featured.blog_categories.color + "40",
                      backgroundColor: featured.blog_categories.color + "10",
                    }}
                  >
                    {featured.blog_categories.name}
                  </span>
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  {featured.author_name} • {format(new Date(featured.published_at || featured.created_at), "d MMM yyyy", { locale: fr })}
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {featured.excerpt}
                  </p>
                )}
                <span className="text-primary font-medium inline-flex items-center gap-2 text-sm">
                  Lire l'article
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </article>
          </Link>
        )}

        {/* Grid of posts */}
        {otherPosts.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group"
              >
                <article className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 h-full flex flex-col">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-muted" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    {post.blog_categories && (
                      <span
                        className="text-xs font-medium px-2.5 py-0.5 rounded-full w-fit mb-3 border"
                        style={{
                          color: post.blog_categories.color,
                          borderColor: post.blog_categories.color + "40",
                          backgroundColor: post.blog_categories.color + "10",
                        }}
                      >
                        {post.blog_categories.name}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground mb-2">
                      {post.author_name} • {format(new Date(post.published_at || post.created_at), "d MMM yyyy", { locale: fr })}
                    </p>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1">
                      {post.title}
                    </h3>
                    <span className="text-primary text-sm font-medium inline-flex items-center gap-1 mt-auto">
                      Lire
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
