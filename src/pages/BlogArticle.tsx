import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/seo/PageMeta";
import { ArrowLeft, ArrowRight, ExternalLink, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RichText } from "@/components/ui/rich-text";
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";

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
  cta_text: string | null;
  cta_url: string | null;
  cta_button_label: string | null;
  cta_style: string | null;
  cta_position: string | null;
}

const BASE_URL = "https://myfincare-perlib.lovable.app";

function ArticleCTA({ post, className }: { post: BlogPost; className?: string }) {
  if (!post.cta_text || !post.cta_url) return null;

  const isExternal = post.cta_url.startsWith("http");
  const buttonLabel = post.cta_button_label || "En savoir plus";

  const ctaButton = isExternal ? (
    <a href={post.cta_url} target="_blank" rel="noopener noreferrer">
      <Button className="gap-1.5">
        {buttonLabel}
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </a>
  ) : (
    <Link to={post.cta_url}>
      <Button className="gap-1.5">
        {buttonLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );

  if (post.cta_style === "inline") {
    return (
      <div className={cn("flex items-center gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5", className)}>
        <p className="flex-1 text-sm font-medium">{post.cta_text}</p>
        {ctaButton}
      </div>
    );
  }

  if (post.cta_style === "card") {
    return (
      <Card className={cn("border-primary/20 overflow-hidden not-prose", className)}>
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium text-foreground">{post.cta_text}</p>
          {ctaButton}
        </CardContent>
      </Card>
    );
  }

  // banner (default)
  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden p-6 md:p-8 not-prose",
      "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20",
      className
    )}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-foreground">{post.cta_text}</p>
        </div>
        {ctaButton}
      </div>
    </div>
  );
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

  const seoTitle = post.meta_title || post.title;
  const seoDescription = post.meta_description || post.excerpt || post.title;
  const articleUrl = `${BASE_URL}/blog/${post.slug}`;
  const publishedDate = post.published_at || post.created_at;

  const hasCTA = !!post.cta_text && !!post.cta_url;
  const showCtaMiddle = hasCTA && (post.cta_position === "middle" || post.cta_position === "both");
  const showCtaEnd = hasCTA && (post.cta_position === "end" || post.cta_position === "both");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: seoDescription,
    image: post.cover_image_url || undefined,
    author: { "@type": "Person", name: post.author_name },
    publisher: { "@type": "Organization", name: "MyFinCare", url: BASE_URL },
    datePublished: publishedDate,
    dateModified: post.updated_at || publishedDate,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${seoTitle} – Blog MyFinCare`}
        description={seoDescription}
        path={`/blog/${post.slug}`}
        type="article"
      />

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

        {/* CTA middle position - before content */}
        {showCtaMiddle && <ArticleCTA post={post} className="mb-10" />}

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <RichText content={post.content} />
        </article>

        {/* CTA end position - after content */}
        {showCtaEnd && <ArticleCTA post={post} className="mt-10" />}

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
