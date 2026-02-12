/**
 * ===========================================================
 * 📄 File: FormationsTab.tsx
 * 📌 Rôle : Gestion admin des formations avec support multi-thèmes
 * 🧩 Dépendances : Supabase, ThemeContext, UI components
 * 🔁 Logiques : CRUD des formations et édition des variantes par thème
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Crown, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import type { Villain, VillainThemeData, ThemeId } from "@/types/theme";

interface FinalBossThemeData {
  nom: string;
  description: string;
  image_url: string;
}

interface FinalBossSettings {
  id: string;
  nom: string;
  description: string;
  image_url: string;
  theme_data: Record<string, FinalBossThemeData>;
}

const THEMES = [
  "Les bases financières",
  "Fiscalité personnelle",
  "Optimisation fiscale",
  "Épargne salariale",
  "Enveloppes d'investissement",
  "Bourse",
  "Immobilier",
  "Vie familiale",
  "Retraite",
  "Assurances",
  "Stratégie patrimoniale",
  "Entrepreneurs",
  "Réglementation",
  "Thèmes avancés cadres supérieurs",
];

/**
 * 🔹 Props du composant FormationsTab
 */
interface FormationsTabProps {
  onRefresh?: () => void;
}

/**
 * 🔹 Composant d'édition des formations avec support multi-thèmes
 * 🔸 Permet aux admins de gérer les formations et leurs variantes par thème
 */
export function FormationsTab({ onRefresh }: FormationsTabProps) {
  const { availableThemes } = useTheme();
  const [villains, setVillains] = useState<Villain[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVillain, setEditingVillain] = useState<Villain | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId | null>(null);
  
  // État pour chaque thème - initialisé dynamiquement
  const [themeData, setThemeData] = useState<Record<string, Partial<VillainThemeData>>>({});
  
  const [orderNum, setOrderNum] = useState(1);
  
  // État pour le boss final
  const [finalBoss, setFinalBoss] = useState<FinalBossSettings | null>(null);
  const [savingBoss, setSavingBoss] = useState(false);

  // Initialise le thème sélectionné et les données au premier thème disponible
  useEffect(() => {
    if (availableThemes.length > 0 && !selectedTheme) {
      setSelectedTheme(availableThemes[0].id);
      const initialData: Record<string, Partial<VillainThemeData>> = {};
      availableThemes.forEach(t => { initialData[t.id] = {}; });
      setThemeData(initialData);
    }
  }, [availableThemes, selectedTheme]);

  useEffect(() => {
    fetchVillains();
    fetchFinalBoss();
  }, []);

  /**
   * 🔹 Charge les paramètres du boss final
   */
  const fetchFinalBoss = async () => {
    try {
      const { data, error } = await supabase
        .from("final_boss_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFinalBoss(data as unknown as FinalBossSettings);
      }
    } catch (error: any) {
      console.error("Error fetching final boss:", error);
    }
  };

  /**
   * 🔹 Sauvegarde les paramètres du boss final
   */
  const saveFinalBoss = async () => {
    if (!finalBoss) return;
    
    setSavingBoss(true);
    try {
      const { error } = await supabase
        .from("final_boss_settings")
        .update({
          nom: finalBoss.nom,
          description: finalBoss.description,
          image_url: finalBoss.image_url,
          theme_data: finalBoss.theme_data as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", finalBoss.id);

      if (error) throw error;
      toast.success("Boss final mis à jour avec succès");
    } catch (error: any) {
      console.error("Error saving final boss:", error);
      toast.error("Erreur lors de la sauvegarde du boss final");
    } finally {
      setSavingBoss(false);
    }
  };

  /**
   * 🔹 Upload d'image pour le boss final
   */
  const handleFinalBossImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `final-boss-${Date.now()}.${fileExt}`;
      const filePath = `final-boss/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('villain-themes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('villain-themes')
        .getPublicUrl(filePath);

      setFinalBoss(prev => prev ? { ...prev, image_url: publicUrl } : null);
      toast.success("Image du boss final uploadée avec succès");
    } catch (error: any) {
      console.error("Error uploading final boss image:", error);
      toast.error("Erreur lors de l'upload de l'image");
    }
  };

  /**
   * 🔹 Charge tous les vilains depuis la DB
   */
  const fetchVillains = async () => {
    try {
      const { data, error } = await supabase
        .from("villains")
        .select("*")
        .order("order_num");

      if (error) throw error;
      setVillains(data as unknown as Villain[]);
    } catch (error: any) {
      console.error("Error fetching villains:", error);
      toast.error("Erreur lors du chargement des vilains");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Crée ou met à jour un vilain
   */
  const handleSubmit = async () => {
    try {
      // Obtenir le premier thème comme thème principal
      const primaryThemeId = availableThemes[0]?.id;
      if (!primaryThemeId) {
        toast.error("Aucun thème disponible");
        return;
      }
      
      const primaryData = themeData[primaryThemeId];
      
      // Validation
      if (!primaryData?.nom || !primaryData?.theme) {
        toast.error(`Veuillez remplir au moins le nom et le thème pour la version '${availableThemes[0]?.name || primaryThemeId}'`);
        return;
      }

      // Construction de l'objet theme_data complet
      const fullThemeData: Record<string, VillainThemeData> = {};
      
      availableThemes.forEach((theme) => {
        const data = themeData[theme.id];
        if (data && data.nom) {
          fullThemeData[theme.id] = {
            nom: data.nom || primaryData.nom || "",
            theme: data.theme || primaryData.theme || "",
            description: data.description || primaryData.description || "",
            score_a_battre: data.score_a_battre || primaryData.score_a_battre || 100,
            image_url: data.image_url || primaryData.image_url || "/placeholder.svg",
            origine: data.origine || "",
            pouvoirs: data.pouvoirs || [],
            faiblesses: data.faiblesses || []
          };
        }
      });

      // Données du thème principal pour les champs legacy
      const villainData = primaryData;

      if (editingVillain) {
        // Mise à jour
        const { error } = await supabase
          .from("villains")
          .update({
            nom: villainData.nom,
            theme: villainData.theme,
            description: villainData.description || "",
            score_a_battre: villainData.score_a_battre || 100,
            image_url: villainData.image_url || "/placeholder.svg",
            order_num: orderNum,
            theme_data: fullThemeData as any
          })
          .eq("id", editingVillain.id);

        if (error) throw error;
        toast.success("Vilain mis à jour avec succès");
      } else {
        // Création
        const { error } = await supabase
          .from("villains")
          .insert({
            nom: villainData.nom,
            theme: villainData.theme,
            description: villainData.description || "",
            score_a_battre: villainData.score_a_battre || 100,
            image_url: villainData.image_url || "/placeholder.svg",
            order_num: orderNum,
            theme_data: fullThemeData as any
          });

        if (error) throw error;
        toast.success("Vilain créé avec succès");
      }

      fetchVillains();
      resetForm();
      setDialogOpen(false);
      onRefresh?.();
    } catch (error: any) {
      console.error("Error saving villain:", error);
      toast.error("Erreur lors de la sauvegarde du vilain");
    }
  };

  /**
   * 🔹 Charge un vilain en édition
   */
  const handleEdit = (villain: Villain) => {
    setEditingVillain(villain);
    setOrderNum(villain.order_num);
    
    // Remplir les données pour chaque thème
    const newThemeData: Record<string, Partial<VillainThemeData>> = {};
    
    // Initialiser tous les thèmes disponibles
    availableThemes.forEach(t => { newThemeData[t.id] = {}; });

    availableThemes.forEach((theme) => {
      const data = villain.theme_data?.[theme.id];
      if (data) {
        newThemeData[theme.id] = data;
      } else {
        // Fallback vers villains
        newThemeData[theme.id] = {
          nom: villain.nom,
          theme: villain.theme,
          description: villain.description,
          score_a_battre: villain.score_a_battre,
          image_url: villain.image_url,
          origine: "",
          pouvoirs: [],
          faiblesses: []
        };
      }
    });

    setThemeData(newThemeData);
    setDialogOpen(true);
  };

  /**
   * 🔹 Supprime un vilain
   */
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce vilain ?")) return;

    try {
      const { error } = await supabase
        .from("villains")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Vilain supprimé avec succès");
      fetchVillains();
      onRefresh?.();
    } catch (error: any) {
      console.error("Error deleting villain:", error);
      toast.error("Erreur lors de la suppression du vilain");
    }
  };

  /**
   * 🔹 Réinitialise le formulaire
   */
  const resetForm = () => {
    setEditingVillain(null);
    const initialData: Record<string, Partial<VillainThemeData>> = {};
    availableThemes.forEach(t => { initialData[t.id] = {}; });
    setThemeData(initialData);
    setOrderNum(1);
    setSelectedTheme(availableThemes[0]?.id || null);
  };

  /**
   * 🔹 Ferme le dialog et réinitialise
   */
  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  /**
   * 🔹 Met à jour les données d'un thème spécifique
   */
  const updateThemeData = (themeId: ThemeId, field: keyof VillainThemeData, value: any) => {
    setThemeData(prev => ({
      ...prev,
      [themeId]: {
        ...prev[themeId],
        [field]: value
      }
    }));
  };

  /**
   * 🔹 Upload d'image pour un thème spécifique
   */
  const handleImageUpload = async (themeId: ThemeId, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${themeId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('villain-themes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('villain-themes')
        .getPublicUrl(filePath);

      updateThemeData(themeId, 'image_url', publicUrl);
      toast.success("Image uploadée avec succès");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Erreur lors de l'upload de l'image");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section Boss Final */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-destructive" />
            <div>
              <CardTitle>Boss Final</CardTitle>
              <CardDescription>
                Configurez le boss final qui apparaît au centre de la carte (différent selon le thème)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {finalBoss ? (
            <div className="space-y-4">
              <Tabs defaultValue={availableThemes[0]?.id} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  {availableThemes.map((theme) => (
                    <TabsTrigger key={theme.id} value={theme.id}>
                      {theme.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {availableThemes.map((theme) => {
                  const bossData = finalBoss.theme_data?.[theme.id] || {
                    nom: finalBoss.nom,
                    description: finalBoss.description,
                    image_url: finalBoss.image_url
                  };
                  
                  return (
                    <TabsContent key={theme.id} value={theme.id}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Nom du Boss Final ({theme.name})</Label>
                            <Input
                              value={bossData.nom || ""}
                              onChange={(e) => {
                                const newThemeData = { ...finalBoss.theme_data };
                                newThemeData[theme.id] = {
                                  ...newThemeData[theme.id],
                                  nom: e.target.value
                                };
                                setFinalBoss({ ...finalBoss, theme_data: newThemeData });
                              }}
                              placeholder="Nom du boss final"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={bossData.description || ""}
                              onChange={(e) => {
                                const newThemeData = { ...finalBoss.theme_data };
                                newThemeData[theme.id] = {
                                  ...newThemeData[theme.id],
                                  description: e.target.value
                                };
                                setFinalBoss({ ...finalBoss, theme_data: newThemeData });
                              }}
                              rows={3}
                              placeholder="Description du boss final..."
                            />
                          </div>
                          <div>
                            <Label>URL de l'image</Label>
                            <Input
                              value={bossData.image_url || ""}
                              onChange={(e) => {
                                const newThemeData = { ...finalBoss.theme_data };
                                newThemeData[theme.id] = {
                                  ...newThemeData[theme.id],
                                  image_url: e.target.value
                                };
                                setFinalBoss({ ...finalBoss, theme_data: newThemeData });
                              }}
                              placeholder="/villains/boss-final.png"
                            />
                          </div>
                          <div>
                            <Label>Uploader une image</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `final-boss-${theme.id}-${Date.now()}.${fileExt}`;
                                  const filePath = `final-boss/${fileName}`;

                                  const { error: uploadError } = await supabase.storage
                                    .from('villain-themes')
                                    .upload(filePath, file);

                                  if (uploadError) {
                                    toast.error("Erreur lors de l'upload");
                                    return;
                                  }

                                  const { data: { publicUrl } } = supabase.storage
                                    .from('villain-themes')
                                    .getPublicUrl(filePath);

                                  const newThemeData = { ...finalBoss.theme_data };
                                  newThemeData[theme.id] = {
                                    ...newThemeData[theme.id],
                                    image_url: publicUrl
                                  };
                                  setFinalBoss({ ...finalBoss, theme_data: newThemeData });
                                  toast.success("Image uploadée");
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
                            <img
                              src={bossData.image_url || "/villains/dominius-complexus.png"}
                              alt={bossData.nom || "Boss Final"}
                              className="relative w-40 h-40 object-cover rounded-full border-4 border-destructive/50"
                            />
                          </div>
                          <p className="mt-4 font-bold text-destructive text-lg">{bossData.nom || "BOSS FINAL"}</p>
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={saveFinalBoss} 
                  disabled={savingBoss}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingBoss ? "Sauvegarde..." : "Sauvegarder le Boss Final"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Chargement du boss final...</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Vilains</h2>
          <p className="text-muted-foreground">
            Créez et gérez les vilains avec leurs variantes multi-thèmes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Vilain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVillain ? "Modifier le vilain" : "Créer un nouveau vilain"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Ordre d'affichage</Label>
                <Input
                  type="number"
                  value={orderNum}
                  onChange={(e) => setOrderNum(parseInt(e.target.value))}
                  min={1}
                />
              </div>

              <Tabs value={selectedTheme} onValueChange={(v) => setSelectedTheme(v as ThemeId)}>
                <TabsList className="grid w-full grid-cols-3">
                  {availableThemes.map((theme) => (
                    <TabsTrigger key={theme.id} value={theme.id}>
                      {theme.name}
                      {!themeData[theme.id]?.nom && theme.id !== "villains" && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Incomplet
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {availableThemes.map((theme) => (
                  <TabsContent key={theme.id} value={theme.id} className="space-y-4">
                    <div>
                      <Label>Nom du {theme.labels.villainLabel}</Label>
                      <Input
                        value={themeData[theme.id]?.nom || ""}
                        onChange={(e) => updateThemeData(theme.id, "nom", e.target.value)}
                        placeholder={`Ex: ${theme.id === "villains" ? "Lord Taxon" : "Exemple"}`}
                      />
                    </div>

                    <div>
                      <Label>Thème financier</Label>
                      <Select
                        value={themeData[theme.id]?.theme || ""}
                        onValueChange={(value) => updateThemeData(theme.id, "theme", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un thème" />
                        </SelectTrigger>
                        <SelectContent>
                          {THEMES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={themeData[theme.id]?.description || ""}
                        onChange={(e) => updateThemeData(theme.id, "description", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Score à battre</Label>
                      <Input
                        type="number"
                        value={themeData[theme.id]?.score_a_battre || 100}
                        onChange={(e) => updateThemeData(theme.id, "score_a_battre", parseInt(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div>
                      <Label>{theme.labels.originLabel}</Label>
                      <Textarea
                        value={themeData[theme.id]?.origine || ""}
                        onChange={(e) => updateThemeData(theme.id, "origine", e.target.value)}
                        rows={3}
                        placeholder={`Histoire et contexte du ${theme.labels.villainLabel.toLowerCase()}`}
                      />
                    </div>

                    <div>
                      <Label>{theme.labels.powerLabel}</Label>
                      <Textarea
                        value={themeData[theme.id]?.pouvoirs?.join("\n") || ""}
                        onChange={(e) => updateThemeData(theme.id, "pouvoirs", e.target.value.split("\n").filter(Boolean))}
                        rows={3}
                        placeholder="Un pouvoir par ligne"
                      />
                    </div>

                    <div>
                      <Label>{theme.labels.weaknessLabel}</Label>
                      <Textarea
                        value={themeData[theme.id]?.faiblesses?.join("\n") || ""}
                        onChange={(e) => updateThemeData(theme.id, "faiblesses", e.target.value.split("\n").filter(Boolean))}
                        rows={3}
                        placeholder="Une faiblesse par ligne"
                      />
                    </div>

                    <div>
                      <Label>Image du {theme.labels.villainLabel}</Label>
                      <div className="flex items-center gap-4">
                        {themeData[theme.id]?.image_url && (
                          <img
                            src={themeData[theme.id].image_url}
                            alt="Preview"
                            className="h-20 w-20 object-cover rounded"
                          />
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(theme.id, file);
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit}>
                  {editingVillain ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {villains.map((villain) => (
          <Card key={villain.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{villain.nom}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline">{villain.theme}</Badge>
                  </CardDescription>
                </div>
                <img
                  src={villain.image_url}
                  alt={villain.nom}
                  className="h-20 w-20 object-cover rounded"
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {villain.description}
              </p>
              <div className="flex items-center gap-2 mb-4">
                <Badge>Points: {villain.score_a_battre}</Badge>
                <Badge variant="outline">Ordre: {villain.order_num}</Badge>
              </div>
              
              {/* Indicateur de thèmes complétés */}
              <div className="flex gap-1 mb-4">
                {availableThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`h-2 flex-1 rounded ${
                      villain.theme_data?.[theme.id]?.nom
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                    title={`Thème ${theme.name}: ${villain.theme_data?.[theme.id]?.nom ? "Complet" : "Incomplet"}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(villain)}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(villain.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
