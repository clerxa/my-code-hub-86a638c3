import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, FlaskConical, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface BetaBadgeSettings {
  enabled: boolean;
  text: string;
}

export const BrandingTab: React.FC = () => {
  const [betaBadge, setBetaBadge] = useState<BetaBadgeSettings>({ enabled: true, text: 'Beta' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingIds, setSettingIds] = useState<{ enabled: string | null; text: string | null }>({ enabled: null, text: null });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("global_settings")
        .select("id, key, value")
        .eq("category", "branding")
        .in("key", ["beta_badge_enabled", "beta_badge_text"]);

      if (error) throw error;

      if (data) {
        const enabledSetting = data.find(s => s.key === "beta_badge_enabled");
        const textSetting = data.find(s => s.key === "beta_badge_text");

        setBetaBadge({
          enabled: enabledSetting?.value === true || enabledSetting?.value === "true" || enabledSetting?.value === 1,
          text: typeof textSetting?.value === 'string' ? textSetting.value.replace(/"/g, '') : 'Beta'
        });

        setSettingIds({
          enabled: enabledSetting?.id || null,
          text: textSetting?.id || null
        });
      }
    } catch (error) {
      console.error("Error fetching branding settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update enabled setting
      if (settingIds.enabled) {
        const { error: enabledError } = await supabase
          .from("global_settings")
          .update({ value: betaBadge.enabled ? "true" : "false", updated_at: new Date().toISOString() })
          .eq("id", settingIds.enabled);

        if (enabledError) throw enabledError;
      }

      // Update text setting
      if (settingIds.text) {
        const { error: textError } = await supabase
          .from("global_settings")
          .update({ value: `"${betaBadge.text}"`, updated_at: new Date().toISOString() })
          .eq("id", settingIds.text);

        if (textError) throw textError;
      }

      toast.success("Paramètres du badge enregistrés");
    } catch (error) {
      console.error("Error saving branding settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding & Apparence</h2>
          <p className="text-muted-foreground">Personnalisez l'apparence globale de l'application</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            Badge Version Beta
          </CardTitle>
          <CardDescription>
            Affichez un badge dans le header pour indiquer que l'application est en version beta, preview, alpha, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Aperçu
            </Label>
            <div className="flex items-center gap-3 mt-2">
              <div className="relative">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">F</span>
                </div>
                {betaBadge.enabled && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-3 text-[10px] px-1.5 py-0.5 bg-amber-500 text-white border-0 shadow-md"
                  >
                    <FlaskConical className="h-2.5 w-2.5 mr-0.5" />
                    {betaBadge.text}
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {betaBadge.enabled ? "Le badge est visible" : "Le badge est masqué"}
              </span>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="beta-enabled">Afficher le badge</Label>
              <p className="text-sm text-muted-foreground">
                Active ou désactive l'affichage du badge dans le header
              </p>
            </div>
            <Switch
              id="beta-enabled"
              checked={betaBadge.enabled}
              onCheckedChange={(checked) => setBetaBadge(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {/* Text input */}
          <div className="space-y-2">
            <Label htmlFor="beta-text">Texte du badge</Label>
            <Input
              id="beta-text"
              value={betaBadge.text}
              onChange={(e) => setBetaBadge(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Beta"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Suggestions : Beta, Alpha, Preview, Dev, Test, V2, Early Access...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
