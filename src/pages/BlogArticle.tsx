import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/seo/PageMeta";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  blog_categories: { name: string; color: string; slug: string } | null;
}

const BASE_URL = "https://myfincare-perlib.lovable.app";

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

  const seoTitle = post.meta_title || post.title;
  const seoDescription = post.meta_description || post.excerpt || post.title;
  const articleUrl = `${BASE_URL}/blog/${post.slug}`;
  const publishedDate = post.published_at || post.created_at;

  // JSON-LD Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: seoDescription,
    image: post.cover_image_url || undefined,
    author: {
      "@type": "Person",
      name: post.author_name,
    },
    publisher: {
      "@type": "Organization",
      name: "MyFinCare",
      url: BASE_URL,
    },
    datePublished: publishedDate,
    dateModified: post.updated_at || publishedDate,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${seoTitle} – Blog MyFinCare`}
        description={seoDescription}
        path={`/blog/${post.slug}`}
        type="article"
      />

      {/* JSON-LD + article-specific OG tags */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <meta property="article:published_time" content={publishedDate} />
        <meta property="article:modified_time" content={post.updated_at || publishedDate} />
        <meta property="article:author" content={post.author_name} />
        {post.blog_categories && (
          <meta property="article:section" content={post.blog_categories.name} />
        )}
        {post.cover_image_url && (
          <meta property="og:image" content={post.cover_image_url} />
        )}
      </Helmet>

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
            {post.author_name} • {format(new Date(publishedDate), "d MMMM yyyy", { locale: fr })}
          </span>
        </div>

        <h1 className="text-3xl lg:text-5xl font-bold mb-8 leading-tight">{post.title}</h1>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt || post.title}
            className="w-full h-auto rounded-2xl mb-10 shadow-lg"
            loading="lazy"
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
