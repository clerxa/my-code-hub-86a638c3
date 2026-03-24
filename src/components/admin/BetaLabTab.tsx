import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { Loader2, Save, FlaskConical, Eye, Palette, Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';


interface BetaBadgeSettings {
  enabled: boolean;
  text: string;
  color: string;
}

interface BetaSettings {
  allowPersonalEmails: boolean;
  requirePartnerDomain: boolean;
}

// Predefined colors for quick selection
const colorPresets = [
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
];

export const BetaLabTab: React.FC = () => {
  const [betaBadge, setBetaBadge] = useState<BetaBadgeSettings>({ enabled: true, text: 'Beta', color: '#f59e0b' });
  const [betaSettings, setBetaSettings] = useState<BetaSettings>({ allowPersonalEmails: false, requirePartnerDomain: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingIds, setSettingIds] = useState<{ 
    enabled: string | null; 
    text: string | null; 
    color: string | null;
    allowPersonalEmails: string | null;
    requirePartnerDomain: string | null;
  }>({ 
    enabled: null, 
    text: null, 
    color: null,
    allowPersonalEmails: null,
    requirePartnerDomain: null
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch branding settings
      const { data: brandingData, error: brandingError } = await supabase
        .from("global_settings")
        .select("id, key, value")
        .eq("category", "branding")
        .in("key", ["beta_badge_enabled", "beta_badge_text", "beta_badge_color"]);

      if (brandingError) throw brandingError;

      // Fetch beta settings
      const { data: betaData, error: betaError } = await supabase
        .from("global_settings")
        .select("id, key, value")
        .eq("category", "beta")
        .in("key", ["allow_personal_emails", "require_partner_domain"]);

      if (betaError) throw betaError;

      if (brandingData) {
        const enabledSetting = brandingData.find(s => s.key === "beta_badge_enabled");
        const textSetting = brandingData.find(s => s.key === "beta_badge_text");
        const colorSetting = brandingData.find(s => s.key === "beta_badge_color");

        setBetaBadge({
          enabled: enabledSetting?.value === true || enabledSetting?.value === "true" || enabledSetting?.value === 1,
          text: typeof textSetting?.value === 'string' ? textSetting.value.replace(/"/g, '') : 'Beta',
          color: typeof colorSetting?.value === 'string' ? colorSetting.value.replace(/"/g, '') : '#f59e0b'
        });

        const allowPersonalEmailsSetting = betaData?.find(s => s.key === "allow_personal_emails");
        const requirePartnerDomainSetting = betaData?.find(s => s.key === "require_partner_domain");
        setBetaSettings({
          allowPersonalEmails: allowPersonalEmailsSetting?.value === true || allowPersonalEmailsSetting?.value === "true",
          requirePartnerDomain: requirePartnerDomainSetting?.value === true || requirePartnerDomainSetting?.value === "true"
        });

        setSettingIds({
          enabled: enabledSetting?.id || null,
          text: textSetting?.id || null,
          color: colorSetting?.id || null,
          allowPersonalEmails: allowPersonalEmailsSetting?.id || null,
          requirePartnerDomain: requirePartnerDomainSetting?.id || null
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

      // Update color setting
      if (settingIds.color) {
        const { error: colorError } = await supabase
          .from("global_settings")
          .update({ value: `"${betaBadge.color}"`, updated_at: new Date().toISOString() })
          .eq("id", settingIds.color);

        if (colorError) throw colorError;
      }

      // Update allow personal emails setting
      if (settingIds.allowPersonalEmails) {
        const { error: personalEmailsError } = await supabase
          .from("global_settings")
          .update({ value: betaSettings.allowPersonalEmails ? "true" : "false", updated_at: new Date().toISOString() })
          .eq("id", settingIds.allowPersonalEmails);

        if (personalEmailsError) throw personalEmailsError;
      } else {
        const { error: insertError } = await supabase
          .from("global_settings")
          .insert({
            category: "beta",
            key: "allow_personal_emails",
            label: "Autoriser les emails personnels",
            value: (betaSettings.allowPersonalEmails ? "true" : "false") as unknown as any,
            value_type: "boolean",
          });
        if (insertError) throw insertError;
        await fetchSettings();
      }

      // Update require partner domain setting
      if (settingIds.requirePartnerDomain) {
        const { error: partnerDomainError } = await supabase
          .from("global_settings")
          .update({ value: betaSettings.requirePartnerDomain ? "true" : "false", updated_at: new Date().toISOString() })
          .eq("id", settingIds.requirePartnerDomain);

        if (partnerDomainError) throw partnerDomainError;
      } else {
        const { error: insertError } = await supabase
          .from("global_settings")
          .insert({
            category: "beta",
            key: "require_partner_domain",
            label: "Restreindre aux domaines partenaires",
            value: (betaSettings.requirePartnerDomain ? "true" : "false") as unknown as any,
            value_type: "boolean",
          });
        if (insertError) throw insertError;
        await fetchSettings();
      }

      toast.success("Paramètres enregistrés");
    } catch (error) {
      console.error("Error saving settings:", error);
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-amber-500" />
            Beta Lab
          </h2>
          <p className="text-muted-foreground">Fonctionnalités en beta et retours utilisateurs</p>
        </div>
      </div>

      <div className="w-full">

        <div className="mt-6 space-y-6">
          {/* Personal Emails Toggle */}
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Mail className="h-5 w-5" />
                Emails personnels (Mode Beta)
              </CardTitle>
              <CardDescription>
                Autoriser temporairement les inscriptions avec des emails personnels (Gmail, Yahoo, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-personal-emails">Autoriser les emails personnels</Label>
                  <p className="text-sm text-muted-foreground">
                    En mode beta uniquement. À désactiver avant la mise en production.
                  </p>
                </div>
                <Switch
                  id="allow-personal-emails"
                  checked={betaSettings.allowPersonalEmails}
                  onCheckedChange={(checked) => setBetaSettings(prev => ({ ...prev, allowPersonalEmails: checked }))}
                />
              </div>
              
              {betaSettings.allowPersonalEmails && (
                <Alert variant="destructive" className="bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    <strong>Attention :</strong> Les emails personnels sont autorisés. 
                    Pensez à désactiver cette option avant le lancement en production pour garantir que seuls les emails professionnels sont acceptés.
                  </AlertDescription>
                </Alert>
              )}

              {/* Require partner domain toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="require-partner-domain">Restreindre aux domaines partenaires</Label>
                  <p className="text-sm text-muted-foreground">
                    Si activé, seuls les emails dont le domaine est enregistré dans une entreprise partenaire peuvent s'inscrire.
                  </p>
                </div>
                <Switch
                  id="require-partner-domain"
                  checked={betaSettings.requirePartnerDomain}
                  onCheckedChange={(checked) => setBetaSettings(prev => ({ ...prev, requirePartnerDomain: checked }))}
                />
              </div>

              {betaSettings.requirePartnerDomain && (
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <strong>Restriction active :</strong> Seuls les utilisateurs dont le domaine email correspond à une entreprise enregistrée dans le CMS pourront s'inscrire. Les autres verront un message d'erreur.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          {/* Badge Settings Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-amber-500" />
                  Badge Version Beta
                </CardTitle>
                <CardDescription>
                  Affichez un badge personnalisé dans le header
                </CardDescription>
              </div>
              <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </Button>
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
                        className="absolute -top-1 -right-3 text-[10px] px-1.5 py-0.5 text-white border-0 shadow-md"
                        style={{ backgroundColor: betaBadge.color }}
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

              {/* Color picker */}
              <div className="space-y-3">
                <Label>Couleur du badge</Label>
                
                {/* Color presets */}
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBetaBadge(prev => ({ ...prev, color: preset.value }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        betaBadge.color === preset.value ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>

                {/* Custom color input */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={betaBadge.color}
                      onChange={(e) => setBetaBadge(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={betaBadge.color}
                      onChange={(e) => setBetaBadge(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#f59e0b"
                      className="w-28 font-mono text-sm"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Couleur personnalisée (HEX)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
