import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, PartyPopper, Video, Palette, Type, Eye } from "lucide-react";
import { ParcoursCompletionCelebration } from "@/components/parcours/ParcoursCompletionCelebration";

interface CelebrationSettings {
  id: string;
  video_url: string;
  video_enabled: boolean;
  title: string;
  subtitle: string;
  motivational_message: string;
  button_text: string;
  button_url: string;
  show_confetti: boolean;
  show_points: boolean;
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
}

export const CelebrationSettingsTab = () => {
  const [settings, setSettings] = useState<CelebrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('celebration_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data as CelebrationSettings);
    } catch (error) {
      console.error('Error fetching celebration settings:', error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('celebration_settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;
      toast.success("Paramètres sauvegardés avec succès !");
    } catch (error) {
      console.error('Error saving celebration settings:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof CelebrationSettings>(
    key: K,
    value: CelebrationSettings[K]
  ) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun paramètre trouvé
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-primary" />
            Célébration de fin de parcours
          </h2>
          <p className="text-muted-foreground">
            Configurez l'expérience de célébration avec FinBear quand un utilisateur termine un parcours
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Vidéo FinBear
            </CardTitle>
            <CardDescription>
              Configuration de la vidéo de célébration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="video-enabled">Afficher la vidéo</Label>
              <Switch
                id="video-enabled"
                checked={settings.video_enabled}
                onCheckedChange={(checked) => updateSetting('video_enabled', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="video-url">URL de la vidéo</Label>
              <Input
                id="video-url"
                value={settings.video_url}
                onChange={(e) => updateSetting('video_url', e.target.value)}
                placeholder="/finbear_success.mp4"
              />
              <p className="text-xs text-muted-foreground">
                Chemin relatif ou URL complète de la vidéo
              </p>
            </div>

            {/* Video Preview */}
            {settings.video_enabled && (
              <div className="rounded-lg overflow-hidden border bg-black/10">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full aspect-video object-contain"
                >
                  <source src={settings.video_url} type="video/mp4" />
                </video>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Contenu textuel
            </CardTitle>
            <CardDescription>
              Personnalisez les textes de la célébration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={settings.title}
                onChange={(e) => updateSetting('title', e.target.value)}
                placeholder="Félicitations ! 🎉"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={settings.subtitle}
                onChange={(e) => updateSetting('subtitle', e.target.value)}
                placeholder="Tu as terminé le parcours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivational-message">Message motivant</Label>
              <Textarea
                id="motivational-message"
                value={settings.motivational_message}
                onChange={(e) => updateSetting('motivational_message', e.target.value)}
                placeholder="Continue sur ta lancée !"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-text">Texte du bouton</Label>
              <Input
                id="button-text"
                value={settings.button_text}
                onChange={(e) => updateSetting('button_text', e.target.value)}
                placeholder="Découvrir d'autres parcours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-url">URL du bouton</Label>
              <Input
                id="button-url"
                value={settings.button_url}
                onChange={(e) => updateSetting('button_url', e.target.value)}
                placeholder="/parcours"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence visuelle
            </CardTitle>
            <CardDescription>
              Configurez les couleurs et effets visuels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-confetti">Afficher les confettis</Label>
              <Switch
                id="show-confetti"
                checked={settings.show_confetti}
                onCheckedChange={(checked) => updateSetting('show_confetti', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-points">Afficher les points gagnés</Label>
              <Switch
                id="show-points"
                checked={settings.show_points}
                onCheckedChange={(checked) => updateSetting('show_points', checked)}
              />
            </div>

            <div className="pt-4 border-t">
              <Label className="text-base font-medium">Couleurs du dégradé</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Format HSL : "teinte saturation% luminosité%"
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="gradient-start" className="text-xs">Début</Label>
                  <Input
                    id="gradient-start"
                    value={settings.gradient_start}
                    onChange={(e) => updateSetting('gradient_start', e.target.value)}
                    placeholder="217 91% 60%"
                    className="text-xs"
                  />
                  <div 
                    className="h-6 rounded"
                    style={{ backgroundColor: `hsl(${settings.gradient_start})` }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradient-middle" className="text-xs">Milieu</Label>
                  <Input
                    id="gradient-middle"
                    value={settings.gradient_middle}
                    onChange={(e) => updateSetting('gradient_middle', e.target.value)}
                    placeholder="271 81% 56%"
                    className="text-xs"
                  />
                  <div 
                    className="h-6 rounded"
                    style={{ backgroundColor: `hsl(${settings.gradient_middle})` }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradient-end" className="text-xs">Fin</Label>
                  <Input
                    id="gradient-end"
                    value={settings.gradient_end}
                    onChange={(e) => updateSetting('gradient_end', e.target.value)}
                    placeholder="38 92% 50%"
                    className="text-xs"
                  />
                  <div 
                    className="h-6 rounded"
                    style={{ backgroundColor: `hsl(${settings.gradient_end})` }}
                  />
                </div>
              </div>

              {/* Gradient Preview */}
              <div className="mt-4">
                <Label className="text-xs">Aperçu du dégradé</Label>
                <div 
                  className="h-12 rounded-lg mt-2"
                  style={{
                    background: `linear-gradient(135deg, hsl(${settings.gradient_start}) 0%, hsl(${settings.gradient_middle}) 50%, hsl(${settings.gradient_end}) 100%)`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu en temps réel
            </CardTitle>
            <CardDescription>
              Visualisez vos modifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden bg-background">
              {/* Mini preview */}
              <div 
                className="p-[2px] rounded-xl"
                style={{
                  background: `linear-gradient(135deg, hsl(${settings.gradient_start}) 0%, hsl(${settings.gradient_middle}) 50%, hsl(${settings.gradient_end}) 100%)`
                }}
              >
                <div className="bg-background rounded-[10px] p-4">
                  {settings.video_enabled && (
                    <div className="rounded-lg overflow-hidden mb-4 bg-black/10">
                      <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full aspect-video object-contain"
                      >
                        <source src={settings.video_url} type="video/mp4" />
                      </video>
                    </div>
                  )}
                  <div className="text-center space-y-2">
                    <h3 
                      className="text-lg font-bold bg-clip-text text-transparent"
                      style={{
                        background: `linear-gradient(135deg, hsl(${settings.gradient_start}) 0%, hsl(${settings.gradient_middle}) 50%, hsl(${settings.gradient_end}) 100%)`,
                        WebkitBackgroundClip: 'text',
                      }}
                    >
                      {settings.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{settings.subtitle}</p>
                    <p className="text-sm font-medium">"Exemple de parcours"</p>
                    {settings.show_points && (
                      <div 
                        className="inline-block px-4 py-2 rounded-lg text-sm"
                        style={{
                          background: `linear-gradient(135deg, hsl(${settings.gradient_start} / 0.1) 0%, hsl(${settings.gradient_middle} / 0.1) 100%)`,
                          border: `1px solid hsl(${settings.gradient_start} / 0.3)`
                        }}
                      >
                        <span className="text-muted-foreground">Points: </span>
                        <span 
                          className="font-bold bg-clip-text text-transparent"
                          style={{
                            background: `linear-gradient(135deg, hsl(${settings.gradient_start}) 0%, hsl(${settings.gradient_middle}) 100%)`,
                            WebkitBackgroundClip: 'text',
                          }}
                        >
                          +150 pts
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {settings.motivational_message}
                    </p>
                    <button 
                      className="w-full py-2 rounded-lg text-white text-sm font-medium mt-2"
                      style={{
                        background: `linear-gradient(135deg, hsl(${settings.gradient_start}) 0%, hsl(${settings.gradient_middle}) 100%)`
                      }}
                    >
                      {settings.button_text}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setShowPreview(true)}
            >
              <PartyPopper className="h-4 w-4 mr-2" />
              Voir la célébration complète
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Full Preview Dialog */}
      <ParcoursCompletionCelebration
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        parcoursTitle="Exemple de parcours"
        totalPoints={150}
      />
    </div>
  );
};
