/**
 * Admin tab for editing financial profile page settings
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2, GripVertical, FileText, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialProfileProgressConfigTab } from "./FinancialProfileProgressConfigTab";

const availableIcons = [
  "Calculator", "Clock", "Target", "Shield", "Wallet", "Euro", 
  "Home", "Briefcase", "Users", "Percent", "PiggyBank"
];

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface Settings {
  id: string;
  hero_title: string;
  hero_description: string;
  benefits: Benefit[];
  cta_text: string;
  footer_note: string;
}

export const FinancialProfileSettingsTab = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_profile_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          hero_title: data.hero_title || "",
          hero_description: data.hero_description || "",
          benefits: (data.benefits as unknown as Benefit[]) || [],
          cta_text: data.cta_text || "",
          footer_note: data.footer_note || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from("financial_profile_settings")
        .update({
          hero_title: settings.hero_title,
          hero_description: settings.hero_description,
          benefits: settings.benefits as unknown as any,
          cta_text: settings.cta_text,
          footer_note: settings.footer_note,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Settings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const addBenefit = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      benefits: [...settings.benefits, { icon: "Calculator", title: "", description: "" }],
    });
  };

  const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
    if (!settings) return;
    const newBenefits = [...settings.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setSettings({ ...settings, benefits: newBenefits });
  };

  const removeBenefit = (index: number) => {
    if (!settings) return;
    const newBenefits = settings.benefits.filter((_, i) => i !== index);
    setSettings({ ...settings, benefits: newBenefits });
  };

  if (loading) {
    return <div className="p-4 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profil Financier</h2>
        <p className="text-muted-foreground">
          Configurez la page profil financier et la barre de progression
        </p>
      </div>

      <Tabs defaultValue="page" className="space-y-6">
        <TabsList>
          <TabsTrigger value="page" className="gap-2">
            <FileText className="h-4 w-4" />
            Contenu de la page
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Barre de progression
          </TabsTrigger>
        </TabsList>

        <TabsContent value="page" className="space-y-6">
          {!settings ? (
            <div className="p-4 text-center">Aucun paramètre trouvé</div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>

              {/* Hero Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Section Hero</CardTitle>
                  <CardDescription>Titre et description en haut de la page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre principal</Label>
                    <Input
                      value={settings.hero_title}
                      onChange={(e) => updateField("hero_title", e.target.value)}
                      placeholder="Votre Profil Financier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={settings.hero_description}
                      onChange={(e) => updateField("hero_description", e.target.value)}
                      placeholder="Complétez votre profil financier pour une expérience personnalisée"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Avantages</CardTitle>
                      <CardDescription>Les bénéfices affichés pour encourager les utilisateurs</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addBenefit}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Icône</Label>
                            <Select
                              value={benefit.icon}
                              onValueChange={(value) => updateBenefit(index, "icon", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIcons.map((icon) => (
                                  <SelectItem key={icon} value={icon}>
                                    {icon}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Titre</Label>
                            <Input
                              value={benefit.title}
                              onChange={(e) => updateBenefit(index, "title", e.target.value)}
                              placeholder="Titre de l'avantage"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={benefit.description}
                            onChange={(e) => updateBenefit(index, "description", e.target.value)}
                            placeholder="Description détaillée de l'avantage..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeBenefit(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {settings.benefits.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun avantage configuré. Cliquez sur "Ajouter" pour en créer un.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA Text */}
              <Card>
                <CardHeader>
                  <CardTitle>Bouton d'appel à l'action (CTA)</CardTitle>
                  <CardDescription>Texte du bouton principal qui invite l'utilisateur à compléter son profil</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Texte du bouton</Label>
                    <Input
                      value={settings.cta_text}
                      onChange={(e) => updateField("cta_text", e.target.value)}
                      placeholder="Compléter mon profil"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Footer Note */}
              <Card>
                <CardHeader>
                  <CardTitle>Note de bas de page</CardTitle>
                  <CardDescription>Message d'information affiché sous le formulaire</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={settings.footer_note}
                    onChange={(e) => updateField("footer_note", e.target.value)}
                    placeholder="Ces informations sont facultatives et peuvent être modifiées à tout moment."
                    rows={2}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="progress">
          <FinancialProfileProgressConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
