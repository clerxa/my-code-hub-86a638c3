import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { cn } from "@/lib/utils";
import {
  Plus, ArrowLeft, Pencil, Trash2, Eye, EyeOff, Star,
  MonitorSmartphone, FileText, Search, Image, Settings2,
  MousePointerClick, ExternalLink, ArrowRight, Megaphone,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { RichText } from "@/components/ui/rich-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  cover_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  category_id: string | null;
  author_name: string;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  blog_categories: BlogCategory | null;
  cta_text: string | null;
  cta_url: string | null;
  cta_button_label: string | null;
  cta_style: string | null;
  cta_position: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// SEO score helper
function computeSeoScore(form: typeof INITIAL_FORM): { score: number; checks: { label: string; ok: boolean }[] } {
  const checks = [
    { label: "Titre renseigné", ok: form.title.length > 0 },
    { label: "Titre < 60 caractères", ok: (form.meta_title || form.title).length <= 60 && (form.meta_title || form.title).length > 0 },
    { label: "Meta description renseignée", ok: (form.meta_description || form.excerpt).length > 0 },
    { label: "Meta description < 160 car.", ok: (form.meta_description || form.excerpt).length <= 160 && (form.meta_description || form.excerpt).length > 0 },
    { label: "Image de couverture", ok: !!form.cover_image_url },
    { label: "Texte alt de l'image", ok: !!form.cover_image_alt },
    { label: "Extrait / chapô", ok: form.excerpt.length > 0 },
    { label: "Catégorie définie", ok: !!form.category_id },
    { label: "Contenu > 300 caractères", ok: form.content.replace(/<[^>]*>/g, '').length > 300 },
    { label: "CTA de conversion", ok: !!form.cta_text && !!form.cta_url },
  ];
  const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);
  return { score, checks };
}

const INITIAL_FORM = {
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
  cta_text: "",
  cta_url: "",
  cta_button_label: "En savoir plus",
  cta_style: "banner",
  cta_position: "end",
};

export function BlogManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const [form, setForm] = useState({ ...INITIAL_FORM });

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
    setForm({ ...INITIAL_FORM });
    setEditing(null);
    setCreating(false);
    setPreviewMode(false);
    setActiveTab("content");
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
      cover_image_alt: post.cover_image_alt || "",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      category_id: post.category_id || "",
      author_name: post.author_name,
      is_published: post.is_published,
      is_featured: post.is_featured,
      cta_text: post.cta_text || "",
      cta_url: post.cta_url || "",
      cta_button_label: post.cta_button_label || "En savoir plus",
      cta_style: post.cta_style || "banner",
      cta_position: post.cta_position || "end",
    });
    setEditing(post);
    setCreating(false);
    setPreviewMode(false);
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
        cta_text: form.cta_text || null,
        cta_url: form.cta_url || null,
        cta_button_label: form.cta_button_label || "En savoir plus",
        cta_style: form.cta_style || "banner",
        cta_position: form.cta_position || "end",
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
  const seo = computeSeoScore(form);

  // ─── EDITOR VIEW ─────────────────────────────────────
  if (isEditorOpen) {
    return (
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h2 className="text-lg font-semibold flex-1">
            {editing ? "Modifier l'article" : "Nouvel article"}
          </h2>

          {/* SEO score pill */}
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border",
            seo.score >= 80 ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50" :
            seo.score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" :
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
          )}>
            {seo.score >= 80 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            SEO {seo.score}%
          </div>

          <Button
            variant={previewMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <MonitorSmartphone className="h-4 w-4 mr-2" />
            {previewMode ? "Éditer" : "Aperçu"}
          </Button>

          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={!form.title || saveMutation.isPending}
            size="sm"
          >
            {editing ? "Enregistrer" : "Créer"}
          </Button>
        </div>

        {previewMode ? (
          <Card>
            <CardContent className="pt-6">
              <article className="max-w-3xl mx-auto">
                {form.cover_image_url && (
                  <img
                    src={form.cover_image_url}
                    alt={form.cover_image_alt || form.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                  {form.category_id && categories.find(c => c.id === form.category_id) && (
                    <Badge variant="outline">{categories.find(c => c.id === form.category_id)!.name}</Badge>
                  )}
                  <span>Par {form.author_name}</span>
                </div>
                <h1 className="text-3xl font-bold mb-4">{form.title || "Sans titre"}</h1>
                {form.excerpt && (
                  <p className="text-lg text-muted-foreground mb-8">{form.excerpt}</p>
                )}
                
                {/* CTA in middle position */}
                {form.cta_text && form.cta_url && (form.cta_position === "middle" || form.cta_position === "both") && (
                  <CTAPreview form={form} className="my-8" />
                )}

                <RichText content={form.content} className="prose prose-lg dark:prose-invert max-w-none" />

                {/* CTA at end */}
                {form.cta_text && form.cta_url && (form.cta_position === "end" || form.cta_position === "both") && (
                  <CTAPreview form={form} className="mt-10" />
                )}
              </article>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="content" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5">
                <Image className="h-3.5 w-3.5" />
                Média
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="cta" className="gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" />
                CTA
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            {/* ── CONTENT TAB ── */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Titre de l'article</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: editing ? form.slug : slugify(e.target.value),
                    });
                  }}
                  placeholder="Un titre accrocheur et descriptif"
                  className="text-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Extrait / chapô</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Résumé en 1-2 phrases qui donne envie de lire l'article (affiché dans la liste et en meta description par défaut)"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Contenu</Label>
                  <p className="text-xs text-muted-foreground">
                    Utilisez H1, H2, H3 pour structurer • {form.content.replace(/<[^>]*>/g, '').length} caractères
                  </p>
                </div>
                <RichTextEditor
                  value={form.content}
                  onChange={(value) => setForm({ ...form, content: value })}
                  placeholder="Rédigez votre article avec des titres, sous-titres, listes, liens..."
                  className="min-h-[450px]"
                />
              </div>
            </TabsContent>

            {/* ── MEDIA TAB ── */}
            <TabsContent value="media" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Image de couverture</CardTitle>
                  <CardDescription>Format recommandé : 1200×630px (ratio 1.91:1) pour un rendu optimal sur les réseaux sociaux</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ImageUpload
                    label=""
                    value={form.cover_image_url}
                    onChange={(url) => setForm({ ...form, cover_image_url: url })}
                    bucketName="landing-images"
                    aspectRatio="landscape"
                  />
                  <div className="space-y-2">
                    <Label>Texte alternatif (alt)</Label>
                    <Input
                      value={form.cover_image_alt}
                      onChange={(e) => setForm({ ...form, cover_image_alt: e.target.value })}
                      placeholder="Décrivez l'image pour l'accessibilité et le SEO"
                    />
                    <p className="text-xs text-muted-foreground">Indispensable pour le SEO et l'accessibilité. Décrivez ce que montre l'image.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SEO TAB ── */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Score card */}
                <Card className={cn(
                  "md:col-span-1",
                  seo.score >= 80 ? "border-green-200 dark:border-green-900/50" : 
                  seo.score >= 50 ? "border-amber-200 dark:border-amber-900/50" : 
                  "border-red-200 dark:border-red-900/50"
                )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Score SEO</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-4xl font-bold mb-3",
                      seo.score >= 80 ? "text-green-600 dark:text-green-400" :
                      seo.score >= 50 ? "text-amber-600 dark:text-amber-400" :
                      "text-red-600 dark:text-red-400"
                    )}>
                      {seo.score}%
                    </div>
                    <div className="space-y-1.5">
                      {seo.checks.map((check, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {check.ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className={check.ok ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* SEO fields */}
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
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
                          placeholder={form.title || "Titre SEO (laissez vide = titre article)"}
                        />
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
                          placeholder={form.excerpt || "Description SEO (laissez vide = extrait)"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Slug (URL)</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground shrink-0">/blog/</span>
                          <Input
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            placeholder={slugify(form.title) || "titre-de-larticle"}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Google Preview */}
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aperçu Google</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-background rounded-lg p-4 space-y-1 border">
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
                </div>
              </div>
            </TabsContent>

            {/* ── CTA TAB ── */}
            <TabsContent value="cta" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Bloc de conversion (CTA)
                  </CardTitle>
                  <CardDescription>
                    Ajoutez un call-to-action dans l'article pour maximiser les conversions (prise de RDV, téléchargement, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Texte d'accroche</Label>
                    <Textarea
                      value={form.cta_text}
                      onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                      rows={2}
                      placeholder="Ex : Envie d'optimiser votre fiscalité ? Échangez gratuitement avec un expert certifié."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>URL du lien</Label>
                      <Input
                        value={form.cta_url}
                        onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                        placeholder="/expert-booking ou https://..."
                      />
                      <p className="text-xs text-muted-foreground">Lien interne (/expert-booking) ou externe</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte du bouton</Label>
                      <Input
                        value={form.cta_button_label}
                        onChange={(e) => setForm({ ...form, cta_button_label: e.target.value })}
                        placeholder="En savoir plus"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Style</Label>
                      <RadioGroup value={form.cta_style} onValueChange={(v) => setForm({ ...form, cta_style: v })} className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="banner" id="cta-banner" />
                          <Label htmlFor="cta-banner" className="font-normal cursor-pointer">Bannière</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="card" id="cta-card" />
                          <Label htmlFor="cta-card" className="font-normal cursor-pointer">Carte</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="inline" id="cta-inline" />
                          <Label htmlFor="cta-inline" className="font-normal cursor-pointer">Inline</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <RadioGroup value={form.cta_position} onValueChange={(v) => setForm({ ...form, cta_position: v })} className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="end" id="cta-end" />
                          <Label htmlFor="cta-end" className="font-normal cursor-pointer">Fin</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="middle" id="cta-middle" />
                          <Label htmlFor="cta-middle" className="font-normal cursor-pointer">Milieu</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="both" id="cta-both" />
                          <Label htmlFor="cta-both" className="font-normal cursor-pointer">Les deux</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* CTA live preview */}
                  {form.cta_text && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Aperçu du CTA</p>
                      <CTAPreview form={form} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SETTINGS TAB ── */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
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

                  <div className="flex items-center gap-8 pt-2">
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────
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

// ─── CTA Preview Component ─────────────────────────────
function CTAPreview({ form, className }: { form: typeof INITIAL_FORM; className?: string }) {
  if (form.cta_style === "inline") {
    return (
      <div className={cn("flex items-center gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5", className)}>
        <p className="flex-1 text-sm font-medium">{form.cta_text}</p>
        <Button size="sm" className="shrink-0 gap-1.5">
          {form.cta_button_label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (form.cta_style === "card") {
    return (
      <Card className={cn("border-primary/20 overflow-hidden", className)}>
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium">{form.cta_text}</p>
          <Button className="gap-1.5">
            {form.cta_button_label}
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // banner (default)
  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden p-6 md:p-8",
      "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20",
      className
    )}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-foreground">{form.cta_text}</p>
        </div>
        <Button className="shrink-0 gap-1.5">
          {form.cta_button_label}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
