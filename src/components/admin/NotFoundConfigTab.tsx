import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Eye, FileWarning, Image, Type, Palette } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { VideoUpload } from "./VideoUpload";
import { ColorPicker } from "./ColorPicker";

interface NotFoundConfig {
  title: string;
  message: string;
  button_text: string;
  button_url: string;
  image_url: string;
  video_url: string;
  use_video: boolean;
  background_color: string;
}

const defaultConfig: NotFoundConfig = {
  title: "404",
  message: "Oops! Page non trouvée",
  button_text: "Retour à l'accueil",
  button_url: "/",
  image_url: "",
  video_url: "",
  use_video: false,
  background_color: "",
};

export function NotFoundConfigTab() {
  const [config, setConfig] = useState<NotFoundConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "not_found_config")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.value) {
        const parsed = typeof data.value === 'string' 
          ? JSON.parse(data.value) 
          : data.value;
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch (error) {
      console.error("Error fetching 404 config:", error);
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "not_found_config",
          value: JSON.stringify(config),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;

      toast.success("Configuration sauvegardée");
    } catch (error) {
      console.error("Error saving 404 config:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setConfig(prev => ({ ...prev, image_url: url }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileWarning className="h-6 w-6" />
            Configuration Page 404
          </h1>
          <p className="text-muted-foreground">
            Personnalisez l'apparence de la page d'erreur 404
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/page-inexistante-test", "_blank")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Texte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Contenu textuel
            </CardTitle>
            <CardDescription>
              Personnalisez les textes affichés sur la page 404
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="404"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={config.message}
                onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Oops! Page non trouvée"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button_text">Texte du bouton</Label>
              <Input
                id="button_text"
                value={config.button_text}
                onChange={(e) => setConfig(prev => ({ ...prev, button_text: e.target.value }))}
                placeholder="Retour à l'accueil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button_url">URL du bouton</Label>
              <Input
                id="button_url"
                value={config.button_url}
                onChange={(e) => setConfig(prev => ({ ...prev, button_url: e.target.value }))}
                placeholder="/"
              />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Media
            </CardTitle>
            <CardDescription>
              Ajoutez une image ou une vidéo à la page 404
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Utiliser une vidéo</Label>
                <p className="text-sm text-muted-foreground">
                  Activer pour afficher une vidéo au lieu d'une image
                </p>
              </div>
              <Switch
                checked={config.use_video}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_video: checked }))}
              />
            </div>

            {config.use_video ? (
              <div className="space-y-2">
                <VideoUpload
                  value={config.video_url}
                  onChange={(url) => setConfig(prev => ({ ...prev, video_url: url }))}
                  label="Vidéo 404"
                  bucketName="landing-images"
                  hint="Vidéo affichée sur la page 404 (max 50MB)"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <ImageUpload
                  value={config.image_url}
                  onChange={handleImageUpload}
                  label="Image 404"
                  bucketName="landing-images"
                  hint="Image affichée sur la page 404"
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <ColorPicker
                label="Couleur de fond"
                value={config.background_color}
                onChange={(color) => setConfig(prev => ({ ...prev, background_color: color }))}
                description="Couleur d'arrière-plan de la page 404"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex flex-col items-center justify-center p-8 rounded-lg text-center space-y-4"
            style={{ 
              backgroundColor: config.background_color 
                ? `hsl(${config.background_color})` 
                : 'hsl(var(--muted))' 
            }}
          >
            {config.use_video && config.video_url ? (
              <video
                src={config.video_url}
                className="w-48 h-48 object-cover rounded-lg"
                muted
                loop
                autoPlay
              />
            ) : config.image_url ? (
              <img
                src={config.image_url}
                alt="404"
                className="w-48 h-48 object-cover rounded-lg"
              />
            ) : null}
            <h1 className="text-4xl font-bold">{config.title || "404"}</h1>
            <p className="text-xl text-muted-foreground">{config.message || "Page non trouvée"}</p>
            <Button variant="default">
              {config.button_text || "Retour à l'accueil"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
