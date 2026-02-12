import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Loader2, Smartphone, Tablet, Monitor } from "lucide-react";

type BannerType = "desktop" | "tablet" | "mobile";

interface BannerConfig {
  desktop: string | null;
  tablet: string | null;
  mobile: string | null;
}

const bannerSettings: Record<BannerType, { key: string; label: string; description: string; dimensions: string; icon: typeof Monitor }> = {
  desktop: {
    key: "default_banner_url",
    label: "Desktop",
    description: "Écrans larges (> 1024px)",
    dimensions: "1920x400 pixels",
    icon: Monitor,
  },
  tablet: {
    key: "default_banner_tablet_url",
    label: "Tablette",
    description: "Écrans moyens (768px - 1024px)",
    dimensions: "1024x300 pixels",
    icon: Tablet,
  },
  mobile: {
    key: "default_banner_mobile_url",
    label: "Mobile",
    description: "Écrans petits (< 768px)",
    dimensions: "640x200 pixels",
    icon: Smartphone,
  },
};

export function BannerTab() {
  const [uploading, setUploading] = useState<BannerType | null>(null);
  const [saving, setSaving] = useState<BannerType | null>(null);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<BannerConfig>({
    desktop: null,
    tablet: null,
    mobile: null,
  });

  useEffect(() => {
    fetchBannerUrls();
  }, []);

  const fetchBannerUrls = async () => {
    try {
      const { data, error } = await supabase
        .from("global_settings")
        .select("key, value")
        .eq("category", "branding")
        .in("key", ["default_banner_url", "default_banner_tablet_url", "default_banner_mobile_url"]);

      if (error) throw error;
      
      const newBanners: BannerConfig = {
        desktop: null,
        tablet: null,
        mobile: null,
      };
      
      data?.forEach((item) => {
        if (item.key === "default_banner_url" && item.value) {
          newBanners.desktop = item.value as string;
        } else if (item.key === "default_banner_tablet_url" && item.value) {
          newBanners.tablet = item.value as string;
        } else if (item.key === "default_banner_mobile_url" && item.value) {
          newBanners.mobile = item.value as string;
        }
      });
      
      setBanners(newBanners);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveBannerUrl = async (type: BannerType, url: string) => {
    const setting = bannerSettings[type];
    
    try {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("global_settings")
        .select("id")
        .eq("key", setting.key)
        .eq("category", "branding")
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("global_settings")
          .update({ value: url })
          .eq("id", existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("global_settings")
          .insert({
            key: setting.key,
            category: "branding",
            value: url,
            value_type: "string",
            label: `Bannière par défaut (${setting.label})`,
            description: `URL de la bannière affichée par défaut pour ${setting.description}`,
            is_active: true,
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving banner URL:", error);
      throw error;
    }
  };

  const handleFileUpload = async (type: BannerType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(type);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `default-banner-${type}-${Date.now()}.${fileExt}`;
      const filePath = `default/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("banners")
        .getPublicUrl(filePath);

      setBanners((prev) => ({ ...prev, [type]: publicUrl }));
      
      // Save to global settings
      await saveBannerUrl(type, publicUrl);
      
      toast.success(`Bannière ${bannerSettings[type].label} uploadée avec succès !`);
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Erreur lors de l'upload de la bannière");
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveBanner = async (type: BannerType) => {
    try {
      setSaving(type);
      await saveBannerUrl(type, "");
      setBanners((prev) => ({ ...prev, [type]: null }));
      toast.success(`Bannière ${bannerSettings[type].label} supprimée`);
    } catch (error) {
      console.error("Error removing banner:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderBannerUploader = (type: BannerType) => {
    const setting = bannerSettings[type];
    const IconComponent = setting.icon;
    const previewUrl = banners[type];
    const isUploading = uploading === type;
    const isSaving = saving === type;

    return (
      <Card key={type}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{setting.label}</CardTitle>
              <CardDescription>
                {setting.description} - Recommandé : {setting.dimensions}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview */}
          <div className="relative w-full h-36 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt={`Bannière ${setting.label}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemoveBanner(type)}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2" />
                <p className="text-sm">Aucune bannière configurée</p>
              </div>
            )}
          </div>

          {/* Upload button */}
          <div className="flex items-center gap-4">
            <Label htmlFor={`banner-upload-${type}`} className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{isUploading ? "Upload en cours..." : "Choisir une image"}</span>
              </div>
              <Input
                id={`banner-upload-${type}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(type, e)}
                disabled={isUploading}
              />
            </Label>
            <span className="text-sm text-muted-foreground">
              PNG, JPG ou WebP (max 5 Mo)
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Bannières par défaut</h2>
        <p className="text-muted-foreground">
          Configurez les bannières adaptées à chaque taille d'écran. 
          Les contacts entreprise pourront les personnaliser pour leur propre entreprise.
        </p>
      </div>

      {/* Banner uploaders for each device type */}
      <div className="grid gap-6">
        {(["desktop", "tablet", "mobile"] as BannerType[]).map(renderBannerUploader)}
      </div>

      {/* Info card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Comment ça fonctionne ?</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Ces bannières seront affichées par défaut sur tous les dashboards entreprise</li>
                <li>La bannière appropriée est automatiquement sélectionnée selon la taille d'écran</li>
                <li>Si une taille n'a pas de bannière, la version desktop sera utilisée par défaut</li>
                <li>Les contacts entreprise peuvent uploader leurs propres bannières personnalisées</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
