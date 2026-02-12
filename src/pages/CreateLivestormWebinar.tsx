import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, Award, Zap, Building2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface Parcours {
  id: string;
  title: string;
}

interface Company {
  id: string;
  name: string;
}

const CreateLivestormWebinar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    webinar_date: "",
    duration: 60,
    points_registration: 50,
    points_participation: 100,
    parcours_id: "",
    webinar_image_url: "",
    difficulty_level: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: parcoursData } = await supabase
      .from("parcours")
      .select("id, title")
      .order("title");

    const { data: companiesData } = await supabase
      .from("companies")
      .select("id, name")
      .order("name");

    if (parcoursData) setParcoursList(parcoursData);
    if (companiesData) setCompaniesList(companiesData);
  };

  const addTheme = () => {
    if (currentTheme && !themes.includes(currentTheme)) {
      setThemes([...themes, currentTheme]);
      setCurrentTheme("");
    }
  };

  const removeTheme = (theme: string) => {
    setThemes(themes.filter((t) => t !== theme));
  };

  const addObjective = () => {
    if (currentObjective && !objectives.includes(currentObjective)) {
      setObjectives([...objectives, currentObjective]);
      setCurrentObjective("");
    }
  };

  const removeObjective = (objective: string) => {
    setObjectives(objectives.filter((o) => o !== objective));
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.webinar_date || !formData.parcours_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedCompanies.length === 0) {
      toast.error("Veuillez sélectionner au moins une entreprise");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-livestorm-webinar", {
        body: {
          ...formData,
          theme: themes,
          pedagogical_objectives: objectives,
          company_ids: selectedCompanies,
          estimated_time: formData.duration,
        },
      });

      if (error) {
        console.error("Error creating webinar:", error);
        toast.error(`Erreur lors de la création: ${error.message}`);
        return;
      }

      if (!data.success) {
        toast.error(`Erreur: ${data.error}`);
        return;
      }

      toast.success("Webinar Livestorm créé avec succès !", {
        description: `Le module a été ajouté au parcours et aux entreprises sélectionnées.`,
      });

      // Redirect to webinar tracking page
      navigate("/admin/webinar-tracking");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erreur lors de la création du webinar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold hero-gradient mb-2">Créer un webinar Livestorm</h1>
            <p className="text-muted-foreground">
              Créez un événement Livestorm et un module webinar associé automatiquement
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du webinar</CardTitle>
                  <CardDescription>
                    Ces informations seront utilisées pour créer l'événement sur Livestorm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre du webinar *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Maîtrisez votre fiscalité personnelle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description détaillée du webinar..."
                      rows={6}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="webinar_date">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Date et heure *
                      </Label>
                      <Input
                        id="webinar_date"
                        type="datetime-local"
                        value={formData.webinar_date}
                        onChange={(e) =>
                          setFormData({ ...formData, webinar_date: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Durée (minutes) *
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: parseInt(e.target.value) })
                        }
                        min={15}
                        step={15}
                      />
                    </div>
                  </div>

                  <ImageUpload
                    label="Image du webinar"
                    value={formData.webinar_image_url || ""}
                    onChange={(url) => setFormData({ ...formData, webinar_image_url: url })}
                    bucketName="landing-images"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="difficulty_level">Niveau de difficulté</Label>
                    <Select
                      value={formData.difficulty_level.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, difficulty_level: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Débutant</SelectItem>
                        <SelectItem value="2">Intermédiaire</SelectItem>
                        <SelectItem value="3">Avancé</SelectItem>
                        <SelectItem value="4">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thèmes et objectifs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Thèmes</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentTheme}
                        onChange={(e) => setCurrentTheme(e.target.value)}
                        placeholder="Ex: Fiscalité personnelle"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTheme();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTheme} size="sm">
                        Ajouter
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {themes.map((theme) => (
                        <Badge key={theme} variant="secondary" className="cursor-pointer" onClick={() => removeTheme(theme)}>
                          {theme} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Objectifs pédagogiques</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentObjective}
                        onChange={(e) => setCurrentObjective(e.target.value)}
                        placeholder="Ex: Comprendre le barème de l'impôt"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addObjective();
                          }
                        }}
                      />
                      <Button type="button" onClick={addObjective} size="sm">
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {objectives.map((objective, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm p-2 rounded bg-muted cursor-pointer hover:bg-muted/80"
                          onClick={() => removeObjective(objective)}
                        >
                          <span className="flex-1">{objective}</span>
                          <span className="text-muted-foreground">×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="points_registration">Points d'inscription</Label>
                    <Input
                      id="points_registration"
                      type="number"
                      value={formData.points_registration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          points_registration: parseInt(e.target.value),
                        })
                      }
                      min={0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points_participation">Points de participation</Label>
                    <Input
                      id="points_participation"
                      type="number"
                      value={formData.points_participation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          points_participation: parseInt(e.target.value),
                        })
                      }
                      min={0}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total possible</span>
                      <span className="text-2xl font-bold text-primary">
                        {formData.points_registration + formData.points_participation}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parcours *</CardTitle>
                  <CardDescription>
                    Le module sera ajouté à la fin de ce parcours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.parcours_id}
                    onValueChange={(value) => setFormData({ ...formData, parcours_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un parcours" />
                    </SelectTrigger>
                    <SelectContent>
                      {parcoursList.map((parcours) => (
                        <SelectItem key={parcours.id} value={parcours.id}>
                          {parcours.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Entreprises *
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez les entreprises qui auront accès
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {companiesList.map((company) => (
                    <div
                      key={company.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedCompanies.includes(company.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleCompany(company.id)}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedCompanies.includes(company.id)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedCompanies.includes(company.id) && (
                          <div className="w-2 h-2 bg-white rounded-sm" />
                        )}
                      </div>
                      <span className="text-sm">{company.name}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                <Zap className="mr-2 h-4 w-4" />
                {loading ? "Création en cours..." : "Créer le webinar Livestorm"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLivestormWebinar;
