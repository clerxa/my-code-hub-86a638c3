import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/contexts/ThemeContext";

interface QueteConfig {
  background_image_url: string;
  background_position: string;
  background_size: string;
  overlay_opacity: number;
  title_text: string;
  title_color: string;
  title_align: string;
  description_text: string;
  description_color: string;
  description_align: string;
}

export const QueteFinCareEditor = () => {
  const { availableThemes, currentTheme } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentTheme?.id || "villains");
  const [configs, setConfigs] = useState<Record<string, QueteConfig>>({});

  const getDefaultConfig = (): QueteConfig => ({
    background_image_url: "/quete-fincare-default.png",
    background_position: "center",
    background_size: "cover",
    overlay_opacity: 0.3,
    title_text: "La Quête FinCare",
    title_color: "#FFFFFF",
    title_align: "center",
    description_text: "Partez à l'aventure et terrassez les vilains de la finance !",
    description_color: "#FFFFFF",
    description_align: "center",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (currentTheme && !selectedThemeId) {
      setSelectedThemeId(currentTheme.id);
    }
  }, [currentTheme]);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("settings")
      .select("metadata")
      .eq("key", "quete_fincare_block")
      .single();

    if (data?.metadata && typeof data.metadata === 'object') {
      setConfigs(data.metadata as unknown as Record<string, QueteConfig>);
    } else {
      // Initialize with default config for all themes
      const defaultConfigs: Record<string, QueteConfig> = {};
      availableThemes.forEach(theme => {
        defaultConfigs[theme.id] = getDefaultConfig();
      });
      setConfigs(defaultConfigs);
    }
  };

  const currentConfig = configs[selectedThemeId] || getDefaultConfig();

  const updateCurrentConfig = (updates: Partial<QueteConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [selectedThemeId]: {
        ...currentConfig,
        ...updates,
      },
    }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "quete_fincare_block",
          value: "quete_fincare",
          metadata: configs as any,
        }, {
          onConflict: "key",
        });

      if (error) {
        console.error("Save error:", error);
        toast.error(`Erreur: ${error.message}`);
        return;
      }

      toast.success("Configuration enregistrée");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleImageUpload = (url: string) => {
    updateCurrentConfig({ background_image_url: url });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>La Quête FinCare - Configuration</CardTitle>
          <CardDescription>
            Personnalisez l'apparence du bloc de progression pour chaque thème
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélecteur de thème */}
          <div>
            <Label>Thème à configurer</Label>
            <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableThemes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Image de fond</Label>
            <ImageUpload
              value={currentConfig.background_image_url}
              onChange={handleImageUpload}
              label="Image de fond"
              bucketName="company-assets"
            />
          </div>

          {/* Background Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Position de l'image</Label>
              <Select
                value={currentConfig.background_position}
                onValueChange={(value) => updateCurrentConfig({ background_position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="top">Haut</SelectItem>
                  <SelectItem value="bottom">Bas</SelectItem>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Taille de l'image</Label>
              <Select
                value={currentConfig.background_size}
                onValueChange={(value) => updateCurrentConfig({ background_size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Couvrir</SelectItem>
                  <SelectItem value="contain">Contenir</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Opacité du calque (overlay)</Label>
            <Slider
              value={[currentConfig.overlay_opacity * 100]}
              onValueChange={(value) => updateCurrentConfig({ overlay_opacity: value[0] / 100 })}
              max={80}
              step={5}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round(currentConfig.overlay_opacity * 100)}%
            </p>
          </div>

          {/* Title Settings */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Titre</Label>
            <div>
              <Label>Texte</Label>
              <Input
                value={currentConfig.title_text}
                onChange={(e) => updateCurrentConfig({ title_text: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Couleur</Label>
                <Input
                  type="color"
                  value={currentConfig.title_color}
                  onChange={(e) => updateCurrentConfig({ title_color: e.target.value })}
                />
              </div>

              <div>
                <Label>Alignement</Label>
                <Select
                  value={currentConfig.title_align}
                  onValueChange={(value) => updateCurrentConfig({ title_align: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description Settings */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Description</Label>
            <div>
              <Label>Texte</Label>
              <Textarea
                value={currentConfig.description_text}
                onChange={(e) => updateCurrentConfig({ description_text: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Couleur</Label>
                <Input
                  type="color"
                  value={currentConfig.description_color}
                  onChange={(e) => updateCurrentConfig({ description_color: e.target.value })}
                />
              </div>

              <div>
                <Label>Alignement</Label>
                <Select
                  value={currentConfig.description_align}
                  onValueChange={(value) => updateCurrentConfig({ description_align: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-lg font-semibold">Aperçu</Label>
            <div
              key={`preview-${selectedThemeId}`}
              className="mt-2 rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center p-8 relative"
              style={{
                backgroundImage: `url(${currentConfig.background_image_url}?theme=${selectedThemeId})`,
                backgroundPosition: currentConfig.background_position,
                backgroundSize: currentConfig.background_size,
                backgroundRepeat: "no-repeat",
              }}
            >
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: currentConfig.overlay_opacity }}
              />
              <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
                <h2
                  className="text-3xl font-bold"
                  style={{
                    color: currentConfig.title_color,
                    textAlign: currentConfig.title_align as any,
                  }}
                >
                  {currentConfig.title_text}
                </h2>
                <p
                  className="text-lg"
                  style={{
                    color: currentConfig.description_color,
                    textAlign: currentConfig.description_align as any,
                  }}
                >
                  {currentConfig.description_text}
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Enregistrer la configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
