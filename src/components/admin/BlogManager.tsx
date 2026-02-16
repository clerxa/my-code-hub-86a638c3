import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { cn } from "@/lib/utils";
import { Plus, ArrowLeft, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  content: string;
  cover_image_url: string | null;
  category_id: string | null;
  author_name: string;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  blog_categories: BlogCategory | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BlogManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    cover_image_alt: "",
    meta_title: "",
    meta_description: "",
    category_id: "",
    author_name: "L'équipe MyFinCare",
    is_published: false,
    is_featured: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-blog-categories"],
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
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      cover_image_alt: "",
      meta_title: "",
      meta_description: "",
      category_id: "",
      author_name: "L'équipe MyFinCare",
      is_published: false,
      is_featured: false,
    });
    setEditing(null);
    setCreating(false);
  };

  const openCreate = () => {
    resetForm();
    setCreating(true);
  };

  const openEdit = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image_url: post.cover_image_url || "",
      cover_image_alt: (post as any).cover_image_alt || "",
      meta_title: (post as any).meta_title || "",
      meta_description: (post as any).meta_description || "",
      category_id: post.category_id || "",
      author_name: post.author_name,
      is_published: post.is_published,
      is_featured: post.is_featured,
    });
    setEditing(post);
    setCreating(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || null,
        content: form.content,
        cover_image_url: form.cover_image_url || null,
        cover_image_alt: form.cover_image_alt || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        category_id: form.category_id || null,
        author_name: form.author_name,
        is_published: form.is_published,
        is_featured: form.is_featured,
        published_at: form.is_published ? new Date().toISOString() : null,
      };

      if (editing) {
        const { error } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(editing ? "Article mis à jour" : "Article créé");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Article supprimé");
    },
  });

  const isEditorOpen = creating || editing !== null;

  if (isEditorOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h2 className="text-lg font-semibold">
            {editing ? "Modifier l'article" : "Nouvel article"}
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: editing ? form.slug : slugify(e.target.value),
                    });
                  }}
                  placeholder="Titre de l'article"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="titre-de-larticle"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Auteur</Label>
                <Input
                  value={form.author_name}
                  onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                />
              </div>
            </div>

            {/* SEO Section */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  🔍 Optimisation SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Meta Title</Label>
                    <span className={cn("text-xs", (form.meta_title || form.title).length > 60 ? "text-destructive" : "text-muted-foreground")}>
                      {(form.meta_title || form.title).length}/60
                    </span>
                  </div>
                  <Input
                    value={form.meta_title}
                    onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                    placeholder={form.title || "Titre SEO (laissez vide pour utiliser le titre)"}
                  />
                  <p className="text-xs text-muted-foreground">Titre affiché dans Google. Max 60 caractères recommandés.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Meta Description</Label>
                    <span className={cn("text-xs", (form.meta_description || form.excerpt).length > 160 ? "text-destructive" : "text-muted-foreground")}>
                      {(form.meta_description || form.excerpt).length}/160
                    </span>
                  </div>
                  <Textarea
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    rows={2}
                    placeholder={form.excerpt || "Description SEO (laissez vide pour utiliser l'extrait)"}
                  />
                  <p className="text-xs text-muted-foreground">Description affichée dans Google. Max 160 caractères recommandés.</p>
                </div>

                {/* Google Preview */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Aperçu Google</p>
                  <p className="text-sm text-[#1a0dab] truncate font-medium">
                    {form.meta_title || form.title || "Titre de l'article"} – Blog MyFinCare
                  </p>
                  <p className="text-xs text-[#006621] truncate">
                    myfincare-perlib.lovable.app/blog/{form.slug || slugify(form.title) || "slug"}
                  </p>
                  <p className="text-xs text-[#545454] line-clamp-2">
                    {form.meta_description || form.excerpt || "Description de l'article..."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Extrait (chapô)</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                placeholder="Résumé affiché dans la liste du blog et utilisé comme meta description par défaut"
              />
            </div>

            <ImageUpload
              label="Image de couverture (OG Image)"
              value={form.cover_image_url}
              onChange={(url) => setForm({ ...form, cover_image_url: url })}
              bucketName="landing-images"
              aspectRatio="landscape"
            />

            <div className="space-y-2">
              <Label>Texte alternatif de l'image (alt)</Label>
              <Input
                value={form.cover_image_alt}
                onChange={(e) => setForm({ ...form, cover_image_alt: e.target.value })}
                placeholder="Description de l'image pour l'accessibilité et le SEO"
              />
            </div>

            <div className="space-y-2">
              <Label>Contenu (Markdown)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={20}
                placeholder="Rédigez votre article en Markdown..."
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
                <Label>Publié</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                />
                <Label>Mis en avant</Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                {editing ? "Enregistrer" : "Créer l'article"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Articles du blog</h2>
          <p className="text-sm text-muted-foreground">
            {posts.length} article{posts.length !== 1 ? "s" : ""} — {posts.filter((p) => p.is_published).length} publié{posts.filter((p) => p.is_published).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Chargement…</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun article. Créez votre premier article de blog.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt=""
                    className="h-16 w-24 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="h-16 w-24 bg-muted rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{post.title}</h3>
                    {post.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.blog_categories && (
                      <Badge variant="outline" className="text-xs">
                        {post.blog_categories.name}
                      </Badge>
                    )}
                    <span>{format(new Date(post.created_at), "d MMM yyyy", { locale: fr })}</span>
                    {post.is_published ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Eye className="h-3 w-3" /> Publié
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> Brouillon
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Supprimer cet article ?")) deleteMutation.mutate(post.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
