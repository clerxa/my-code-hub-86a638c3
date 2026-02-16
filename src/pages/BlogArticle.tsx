import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/seo/PageMeta";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
  blog_categories: { name: string; color: string; slug: string } | null;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(*)")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Link to="/blog">
          <Button variant="outline">Retour au blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${post.title} – Blog MyFinCare`}
        description={post.excerpt || post.title}
        path={`/blog/${post.slug}`}
        type="article"
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <nav className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold hero-gradient">
            MyFinCare
          </Link>
          <Link to="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tous les articles
            </Button>
          </Link>
        </nav>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-12">
        {/* Category + date */}
        <div className="flex items-center gap-3 mb-6">
          {post.blog_categories && (
            <span
              className="text-xs font-medium px-3 py-1 rounded-full border"
              style={{
                color: post.blog_categories.color,
                borderColor: post.blog_categories.color + "40",
                backgroundColor: post.blog_categories.color + "10",
              }}
            >
              {post.blog_categories.name}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {post.author_name} • {format(new Date(post.published_at || post.created_at), "d MMMM yyyy", { locale: fr })}
          </span>
        </div>

        <h1 className="text-3xl lg:text-5xl font-bold mb-8 leading-tight">{post.title}</h1>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-auto rounded-2xl mb-10 shadow-lg"
          />
        )}

        {/* Article content rendered as markdown */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* Back to blog */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <Link to="/blog">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au blog
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
