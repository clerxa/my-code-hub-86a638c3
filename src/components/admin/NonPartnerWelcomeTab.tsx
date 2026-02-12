import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, Plus, Trash2, Eye, Calculator, Settings2 } from "lucide-react";
import { IconSelector } from "./IconSelector";

interface Benefit {
  title: string;
  description: string;
}

interface SimulatorOption {
  feature_key: string;
  name: string;
}

interface Settings {
  id: string;
  hero_icon: string;
  hero_title: string;
  hero_description: string;
  benefits_title: string;
  benefits: Benefit[];
  contacts_title: string;
  contacts: string[];
  email_subject: string;
  email_body: string;
  primary_button_text: string;
  secondary_button_text: string;
  footer_text: string;
  // New fields
  max_simulations: number;
  allowed_simulators: string[];
  quota_banner_label: string;
}

export function NonPartnerWelcomeTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableSimulators, setAvailableSimulators] = useState<SimulatorOption[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchSimulators();
  }, []);

  const fetchSimulators = async () => {
    try {
      const { data, error } = await supabase
        .from("simulators")
        .select("feature_key, name")
        .eq("is_active", true)
        .order("order_num");
      
      if (error) throw error;
      setAvailableSimulators(data?.filter(s => s.feature_key) as SimulatorOption[] || []);
    } catch (error) {
      console.error("Error fetching simulators:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("non_partner_welcome_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;

      setSettings({
        ...data,
        benefits: (data.benefits as unknown) as Benefit[],
        contacts: (data.contacts as unknown) as string[],
        max_simulations: data.max_simulations ?? 10,
        allowed_simulators: data.allowed_simulators ?? [],
        quota_banner_label: data.quota_banner_label ?? 'Analyses gratuites',
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
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
        .from("non_partner_welcome_settings")
        .update({
          hero_icon: settings.hero_icon,
          hero_title: settings.hero_title,
          hero_description: settings.hero_description,
          benefits_title: settings.benefits_title,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          benefits: settings.benefits as any,
          contacts_title: settings.contacts_title,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contacts: settings.contacts as any,
          email_subject: settings.email_subject,
          email_body: settings.email_body,
          primary_button_text: settings.primary_button_text,
          secondary_button_text: settings.secondary_button_text,
          footer_text: settings.footer_text,
          // New fields
          max_simulations: settings.max_simulations,
          allowed_simulators: settings.allowed_simulators,
          quota_banner_label: settings.quota_banner_label,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Paramètres sauvegardés");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const toggleSimulator = (featureKey: string) => {
    if (!settings) return;
    const current = settings.allowed_simulators || [];
    const isSelected = current.includes(featureKey);
    
    if (isSelected) {
      setSettings({
        ...settings,
        allowed_simulators: current.filter(k => k !== featureKey)
      });
    } else {
      setSettings({
        ...settings,
        allowed_simulators: [...current, featureKey]
      });
    }
  };

  const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
    if (!settings) return;
    const newBenefits = [...settings.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setSettings({ ...settings, benefits: newBenefits });
  };

  const addBenefit = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      benefits: [...settings.benefits, { title: "", description: "" }],
    });
  };

  const removeBenefit = (index: number) => {
    if (!settings) return;
    const newBenefits = settings.benefits.filter((_, i) => i !== index);
    setSettings({ ...settings, benefits: newBenefits });
  };

  const updateContact = (index: number, value: string) => {
    if (!settings) return;
    const newContacts = [...settings.contacts];
    newContacts[index] = value;
    setSettings({ ...settings, contacts: newContacts });
  };

  const addContact = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      contacts: [...settings.contacts, ""],
    });
  };

  const removeContact = (index: number) => {
    if (!settings) return;
    const newContacts = settings.contacts.filter((_, i) => i !== index);
    setSettings({ ...settings, contacts: newContacts });
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!settings) {
    return <div className="p-6">Erreur: paramètres non trouvés</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Paramètres Non-Partenaires</h2>
          <p className="text-muted-foreground">
            Configurez l'expérience des utilisateurs sans partenariat actif (quotas, accès, page d'accueil)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/non-partner-welcome" target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Prévisualiser
            </a>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="quotas" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quotas">Quotas & Accès</TabsTrigger>
          <TabsTrigger value="hero">En-tête</TabsTrigger>
          <TabsTrigger value="benefits">Avantages</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="email">Email & Boutons</TabsTrigger>
        </TabsList>

        <TabsContent value="quotas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Quota de simulations
              </CardTitle>
              <CardDescription>
                Définissez le nombre maximum de simulations autorisées avant restriction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre maximum de simulations</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.max_simulations}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      max_simulations: parseInt(e.target.value) || 10 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Après ce nombre, l'utilisateur devra proposer un partenariat
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Libellé du compteur</Label>
                  <Input
                    value={settings.quota_banner_label}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      quota_banner_label: e.target.value 
                    })}
                    placeholder="Analyses gratuites"
                  />
                  <p className="text-xs text-muted-foreground">
                    Texte affiché dans la sidebar à côté du compteur
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Simulateurs accessibles
              </CardTitle>
              <CardDescription>
                Sélectionnez les simulateurs disponibles pour les utilisateurs sans partenariat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {availableSimulators.map((sim) => (
                  <div 
                    key={sim.feature_key} 
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={sim.feature_key}
                      checked={settings.allowed_simulators?.includes(sim.feature_key)}
                      onCheckedChange={() => toggleSimulator(sim.feature_key)}
                    />
                    <Label 
                      htmlFor={sim.feature_key} 
                      className="cursor-pointer flex-1 text-sm"
                    >
                      {sim.name}
                    </Label>
                  </div>
                ))}
              </div>
              {availableSimulators.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun simulateur configuré
                </p>
              )}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>{settings.allowed_simulators?.length || 0}</strong> simulateur(s) sélectionné(s) sur {availableSimulators.length} disponibles
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section En-tête</CardTitle>
              <CardDescription>
                Personnalisez le titre et la description. Utilisez {"{companyName}"} pour afficher le nom de l'entreprise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <IconSelector
                  value={settings.hero_icon}
                  onChange={(value) => setSettings({ ...settings, hero_icon: value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={settings.hero_title}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  placeholder="Bienvenue chez {companyName} !"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={settings.hero_description}
                  onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avantages FinCare</CardTitle>
              <CardDescription>
                Liste des avantages présentés aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de la section</Label>
                <Input
                  value={settings.benefits_title}
                  onChange={(e) => setSettings({ ...settings, benefits_title: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                {settings.benefits.map((benefit, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Avantage {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={benefit.title}
                        onChange={(e) => updateBenefit(index, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={benefit.description}
                        onChange={(e) => updateBenefit(index, "description", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addBenefit} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un avantage
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contacts suggérés</CardTitle>
              <CardDescription>
                Liste des personnes à contacter. Vous pouvez utiliser du HTML (ex: {"<strong>texte</strong>"})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de la section</Label>
                <Input
                  value={settings.contacts_title}
                  onChange={(e) => setSettings({ ...settings, contacts_title: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                {settings.contacts.map((contact, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={contact}
                      onChange={(e) => updateContact(index, e.target.value)}
                      placeholder="Votre <strong>responsable RH</strong>"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContact(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addContact} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email d'invitation</CardTitle>
              <CardDescription>
                Contenu de l'email envoyé lors du clic sur le bouton principal. Utilisez {"{companyName}"} pour le nom de l'entreprise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sujet de l'email</Label>
                <Input
                  value={settings.email_subject}
                  onChange={(e) => setSettings({ ...settings, email_subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Corps de l'email</Label>
                <Textarea
                  value={settings.email_body}
                  onChange={(e) => setSettings({ ...settings, email_body: e.target.value })}
                  rows={10}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Boutons et pied de page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Texte du bouton principal</Label>
                <Input
                  value={settings.primary_button_text}
                  onChange={(e) => setSettings({ ...settings, primary_button_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Texte du bouton secondaire</Label>
                <Input
                  value={settings.secondary_button_text}
                  onChange={(e) => setSettings({ ...settings, secondary_button_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Texte du pied de page</Label>
                <Textarea
                  value={settings.footer_text}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}