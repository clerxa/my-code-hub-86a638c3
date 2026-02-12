import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ForumCategory } from "@/types/forum";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { awardForumPostPoints } from "@/lib/pointsService";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: ForumCategory[];
  onPostCreated: () => void;
  preselectedCategoryId?: string;
}

export function CreatePostDialog({ open, onOpenChange, categories: categoriesProp, onPostCreated, preselectedCategoryId }: CreatePostDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(preselectedCategoryId || "");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState<ForumCategory[]>(categoriesProp || []);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch categories if not provided
  useState(() => {
    if (!categoriesProp) {
      const fetchCategories = async () => {
        const { data } = await supabase
          .from("forum_categories")
          .select("*")
          .order("order_num");
        if (data) setCategories(data);
      };
      fetchCategories();
    }
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !categoryId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour créer un post",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user has completed their identity and anonymous mode settings
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, forum_anonymous_mode, forum_pseudo, forum_avatar_url")
        .eq("id", user.id)
        .single();

      const hasIdentity = profileData?.first_name?.trim() && profileData?.last_name?.trim();
      const isAnonymous = profileData?.forum_anonymous_mode || false;
      const hasAnonymousConfig = profileData?.forum_pseudo?.trim();
      
      // Block posting if identity is incomplete AND anonymous mode is not properly configured
      if (!hasIdentity && !hasAnonymousConfig) {
        toast({
          title: "Profil incomplet",
          description: "Veuillez compléter votre identité (prénom et nom) ou configurer le mode anonyme dans votre profil avant de publier.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const displayPseudo = isAnonymous ? profileData?.forum_pseudo : null;
      const displayAvatarUrl = isAnonymous ? profileData?.forum_avatar_url : null;

      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error } = await supabase.from("forum_posts").insert({
        title: title.trim(),
        content: content,
        category_id: categoryId,
        author_id: user.id,
        tags: tagsArray,
        is_anonymous: isAnonymous,
        display_pseudo: displayPseudo,
        display_avatar_url: displayAvatarUrl,
      });

      if (error) throw error;
      
      // Award points for creating a post
      await awardForumPostPoints(user.id);

      toast({
        title: "Succès",
        description: "Votre question a été publiée" + (isAnonymous ? " de manière anonyme" : ""),
      });

      setTitle("");
      setContent("");
      setCategoryId("");
      setTags("");
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Poser une question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de votre question *</Label>
            <Input
              id="title"
              placeholder="Ex: Comment optimiser mon PER ?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Description détaillée *</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Décrivez votre situation en détail..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
            <Input
              id="tags"
              placeholder="Ex: PER, retraite, fiscalité"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ajoutez des mots-clés pour aider les autres à trouver votre question
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Publication..." : "Publier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
