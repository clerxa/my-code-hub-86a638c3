/**
 * ===========================================================
 * 📄 File: ForumAnonymousSettings.tsx
 * 📌 Rôle : Paramètres du mode anonyme pour le forum
 * ===========================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Upload, 
  Save, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ForumAnonymousSettingsProps {
  profileId: string;
  companyId: string | null;
  forumAnonymousMode?: boolean;
  forumPseudo?: string | null;
  forumAvatarUrl?: string | null;
  onUpdate?: () => void;
}

export function ForumAnonymousSettings({
  profileId,
  companyId,
  forumAnonymousMode = false,
  forumPseudo = null,
  forumAvatarUrl = null,
  onUpdate
}: ForumAnonymousSettingsProps) {
  const [anonymousMode, setAnonymousMode] = useState(forumAnonymousMode);
  const [pseudo, setPseudo] = useState(forumPseudo || "");
  const [avatarUrl, setAvatarUrl] = useState(forumAvatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [pseudoValid, setPseudoValid] = useState(false);
  const [checkingPseudo, setCheckingPseudo] = useState(false);

  // Reset state when props change
  useEffect(() => {
    setAnonymousMode(forumAnonymousMode);
    setPseudo(forumPseudo || "");
    setAvatarUrl(forumAvatarUrl || "");
  }, [forumAnonymousMode, forumPseudo, forumAvatarUrl]);

  // Check pseudo uniqueness
  useEffect(() => {
    const checkPseudo = async () => {
      if (!pseudo.trim() || !companyId) {
        setPseudoError(null);
        setPseudoValid(false);
        return;
      }

      setCheckingPseudo(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("company_id", companyId)
          .eq("forum_pseudo", pseudo.trim())
          .neq("id", profileId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPseudoError("Ce pseudo est déjà utilisé par un autre membre");
          setPseudoValid(false);
        } else {
          setPseudoError(null);
          setPseudoValid(true);
        }
      } catch (error) {
        console.error("Error checking pseudo:", error);
      } finally {
        setCheckingPseudo(false);
      }
    };

    const debounce = setTimeout(checkPseudo, 500);
    return () => clearTimeout(debounce);
  }, [pseudo, companyId, profileId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `forum-avatar-${Date.now()}.${fileExt}`;
      // IMPORTANT: garder le 1er segment du path = profileId pour respecter les règles d'accès du bucket avatars
      const filePath = `${profileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Avatar uploadé");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      // permet de re-uploader le même fichier si besoin
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (anonymousMode && !pseudo.trim()) {
      toast.error("Veuillez saisir un pseudo");
      return;
    }

    if (pseudoError) {
      toast.error(pseudoError);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          forum_anonymous_mode: anonymousMode,
          forum_pseudo: anonymousMode ? pseudo.trim() : null,
          forum_avatar_url: anonymousMode ? avatarUrl : null
        })
        .eq("id", profileId);

      if (error) throw error;

      toast.success("Paramètres du forum mis à jour");
      onUpdate?.();
    } catch (error: any) {
      console.error("Error updating forum settings:", error);
      if (error.code === "23505") {
        setPseudoError("Ce pseudo est déjà utilisé");
        toast.error("Ce pseudo est déjà utilisé par un autre membre");
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = 
    anonymousMode !== forumAnonymousMode ||
    pseudo !== (forumPseudo || "") ||
    avatarUrl !== (forumAvatarUrl || "");

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Forum Communauté</CardTitle>
            <CardDescription>Configurez votre identité sur le forum</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle Mode Anonyme */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            {anonymousMode ? (
              <EyeOff className="h-5 w-5 text-primary" />
            ) : (
              <Eye className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="anonymous-mode" className="text-base font-medium cursor-pointer">
                Mode anonyme
              </Label>
              <p className="text-sm text-muted-foreground">
                Utilisez un pseudo au lieu de votre vrai nom sur le forum
              </p>
            </div>
          </div>
          <Switch
            id="anonymous-mode"
            checked={anonymousMode}
            onCheckedChange={setAnonymousMode}
          />
        </div>

        {/* Paramètres si mode anonyme activé */}
        {anonymousMode && (
          <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <h4 className="font-medium text-sm text-primary">Configuration de votre identité anonyme</h4>
            
            {/* Pseudo */}
            <div className="space-y-2">
              <Label htmlFor="forum-pseudo">Pseudo *</Label>
              <div className="relative">
                <Input
                  id="forum-pseudo"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Choisissez un pseudo unique"
                  className={cn(
                    pseudoError && "border-destructive focus-visible:ring-destructive",
                    pseudoValid && "border-green-500 focus-visible:ring-green-500"
                  )}
                />
                {checkingPseudo && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  </div>
                )}
                {!checkingPseudo && pseudoValid && pseudo.trim() && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {!checkingPseudo && pseudoError && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
              </div>
              {pseudoError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {pseudoError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Ce pseudo sera affiché à la place de votre nom sur vos messages
              </p>
            </div>

            {/* Avatar anonyme */}
            <div className="space-y-2">
              <Label>Avatar anonyme</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-lg bg-primary/20 text-primary">
                    {pseudo ? pseudo[0]?.toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                    id="forum-avatar-upload"
                  />
                  <Label htmlFor="forum-avatar-upload">
                    <Button variant="outline" size="sm" disabled={uploading} asChild>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Upload..." : "Choisir un avatar"}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 2 Mo, formats JPG/PNG
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Bouton de sauvegarde */}
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={saving || (anonymousMode && (!pseudo.trim() || !!pseudoError))}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer les paramètres du forum"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
