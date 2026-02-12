/**
 * ===========================================================
 * 📄 File: DesignSystemTab.tsx
 * 📌 Rôle du fichier : Interface admin pour personnaliser le design system Perlib
 * 🧩 Dépendances importantes :
 *   - Supabase pour la persistence
 *   - shadcn/ui components (Card, Button, Input, etc.)
 *   - sonner pour les notifications
 * 🔁 Logiques principales :
 *   - Charge les tokens depuis le thème Perlib en BDD
 *   - Prévisualisation en temps réel des changements
 *   - Sauvegarde directement dans la table themes
 * ===========================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Save, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ColorPicker } from "./ColorPicker";

interface DesignTokens {
  background: string;
  foreground: string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  accent: string;
  "accent-foreground": string;
  muted: string;
  "muted-foreground": string;
  card: string;
  "card-foreground": string;
  border: string;
  input: string;
  ring: string;
  success: string;
  "success-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  warning: string;
  "warning-foreground": string;
}

interface ColorToken {
  name: string;
  variable: string;
  description: string;
}

const designTokensConfig: ColorToken[] = [
  { name: "Background", variable: "background", description: "📄 Fond de la page principale" },
  { name: "Foreground", variable: "foreground", description: "✍️ Texte principal" },
  { name: "Primary", variable: "primary", description: "⭐ Couleur principale - Boutons importants" },
  { name: "Primary Foreground", variable: "primary-foreground", description: "📝 Texte sur Primary" },
  { name: "Secondary", variable: "secondary", description: "🎨 Couleur secondaire" },
  { name: "Secondary Foreground", variable: "secondary-foreground", description: "📝 Texte sur Secondary" },
  { name: "Accent", variable: "accent", description: "✨ Couleur d'accent" },
  { name: "Accent Foreground", variable: "accent-foreground", description: "📝 Texte sur Accent" },
  { name: "Muted", variable: "muted", description: "🔇 Fond discret" },
  { name: "Muted Foreground", variable: "muted-foreground", description: "💬 Texte discret" },
  { name: "Card", variable: "card", description: "🎴 Fond des cartes" },
  { name: "Card Foreground", variable: "card-foreground", description: "📝 Texte dans les cartes" },
  { name: "Border", variable: "border", description: "📐 Bordures" },
  { name: "Input", variable: "input", description: "⌨️ Champs de saisie" },
  { name: "Ring", variable: "ring", description: "🎯 Contour de focus" },
  { name: "Success", variable: "success", description: "✅ Succès" },
  { name: "Success Foreground", variable: "success-foreground", description: "📝 Texte sur Success" },
  { name: "Destructive", variable: "destructive", description: "❌ Erreur" },
  { name: "Destructive Foreground", variable: "destructive-foreground", description: "📝 Texte sur Destructive" },
  { name: "Warning", variable: "warning", description: "⚠️ Avertissement" },
  { name: "Warning Foreground", variable: "warning-foreground", description: "📝 Texte sur Warning" },
];

const defaultTokens: DesignTokens = {
  background: "30 30% 95%",
  foreground: "200 50% 20%",
  primary: "22 95% 71%",
  "primary-foreground": "0 0% 100%",
  secondary: "190 35% 40%",
  "secondary-foreground": "0 0% 100%",
  accent: "22 95% 71%",
  "accent-foreground": "0 0% 100%",
  muted: "30 20% 88%",
  "muted-foreground": "200 30% 35%",
  card: "30 30% 98%",
  "card-foreground": "200 50% 20%",
  border: "30 20% 82%",
  input: "30 20% 82%",
  ring: "22 95% 71%",
  success: "145 55% 42%",
  "success-foreground": "0 0% 100%",
  destructive: "0 70% 50%",
  "destructive-foreground": "0 0% 100%",
  warning: "38 90% 50%",
  "warning-foreground": "0 0% 100%"
};

export function DesignSystemTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designTokens, setDesignTokens] = useState<DesignTokens>(defaultTokens);
  const [originalTokens, setOriginalTokens] = useState<DesignTokens>(defaultTokens);

  useEffect(() => {
    fetchPerlibTheme();
  }, []);

  const fetchPerlibTheme = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("themes")
        .select("design_tokens")
        .eq("id", "perlib")
        .single();

      if (error) {
        console.error("Erreur lors du chargement du thème Perlib:", error);
        toast.error("Erreur lors du chargement du design system");
        return;
      }

      if (data?.design_tokens) {
        const tokens = data.design_tokens as unknown as DesignTokens;
        setDesignTokens(tokens);
        setOriginalTokens(tokens);
        applyTokensToDOM(tokens);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const applyTokensToDOM = (tokens: DesignTokens) => {
    const root = document.documentElement;
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  };

  const handleTokenChange = (variable: string, value: string) => {
    setDesignTokens(prev => ({ ...prev, [variable]: value }));
  };

  const applyPreview = () => {
    applyTokensToDOM(designTokens);
    toast.success("Aperçu appliqué !");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("themes")
        .update({ design_tokens: designTokens as any })
        .eq("id", "perlib");

      if (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        toast.error("Erreur lors de la sauvegarde");
        return;
      }

      setOriginalTokens(designTokens);
      applyTokensToDOM(designTokens);
      toast.success("Design system sauvegardé !");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDesignTokens(originalTokens);
    applyTokensToDOM(originalTokens);
    toast.info("Modifications annulées");
  };

  const handleResetToDefault = () => {
    setDesignTokens(defaultTokens);
    applyTokensToDOM(defaultTokens);
    toast.info("Valeurs par défaut restaurées (non sauvegardées)");
  };

  if (loading) {
    return <div className="p-6">Chargement du design system...</div>;
  }

  const hasChanges = JSON.stringify(designTokens) !== JSON.stringify(originalTokens);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight hero-gradient">Design System</h2>
          <p className="text-muted-foreground">Personnalisez les couleurs du thème Perlib</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-orange-500 font-medium">
              Modifications non sauvegardées
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tokens de couleur (HSL)</CardTitle>
                  <CardDescription>
                    Format: hue saturation% lightness% (ex: 22 95% 71%)
                  </CardDescription>
                </div>
                <Button onClick={applyPreview} variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Aperçu en direct
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 max-h-[500px] overflow-y-auto pr-2">
                {designTokensConfig.map((token) => (
                  <ColorPicker
                    key={token.variable}
                    label={token.name}
                    value={designTokens[token.variable as keyof DesignTokens] || ""}
                    onChange={(value) => handleTokenChange(token.variable, value)}
                    description={token.description}
                  />
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSave} disabled={saving || !hasChanges} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={!hasChanges}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleResetToDefault} variant="ghost">
                  Défaut
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prévisualisation des composants</CardTitle>
              <CardDescription>
                Voyez comment vos couleurs s'appliquent aux différents composants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Titres</h3>
                  <h1 className="hero-gradient text-4xl font-bold mb-2">Titre Hero Gradient</h1>
                  <h2 className="text-2xl font-bold text-foreground">Titre Standard</h2>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Boutons</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="default">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Cartes</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card description</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Contenu de la carte avec du texte normal.</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary text-primary-foreground">
                      <CardHeader>
                        <CardTitle>Primary Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Carte avec couleur primaire</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted">
                      <CardHeader>
                        <CardTitle>Muted Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Carte atténuée</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Inputs</h3>
                  <div className="flex gap-2 max-w-md">
                    <Input placeholder="Champ de saisie..." />
                    <Button>Envoyer</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">États</h3>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 rounded bg-success text-success-foreground text-sm">Succès</div>
                    <div className="px-3 py-1 rounded bg-warning text-warning-foreground text-sm">Attention</div>
                    <div className="px-3 py-1 rounded bg-destructive text-destructive-foreground text-sm">Erreur</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
