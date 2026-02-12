import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Settings, Users, TrendingUp } from "lucide-react";
import { QuestionWithAnswers, RiskProfileSettings } from "@/types/risk-profile";
import { RiskProfileQuestionEditor } from "./RiskProfileQuestionEditor";
import { RiskProfileResultsEditor } from "./RiskProfileResultsEditor";

export const RiskProfileTab = () => {
  const [settings, setSettings] = useState<RiskProfileSettings>({
    module_active: true,
    mandatory_for_new_users: false,
    threshold_prudent: 30,
    threshold_equilibre: 55,
    threshold_dynamique: 80
  });
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    prudent: 0,
    equilibre: 0,
    dynamique: 0,
    audacieux: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from('risk_profile_settings')
        .select('*')
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('risk_questions')
        .select('*')
        .order('order_num');

      if (questionsData) {
        const questionsWithAnswers = await Promise.all(
          questionsData.map(async (question) => {
            const { data: answersData } = await supabase
              .from('risk_answers')
              .select('*')
              .eq('question_id', question.id)
              .order('order_num');

            return {
              ...question,
              answers: answersData || []
            };
          })
        );
        setQuestions(questionsWithAnswers);
      }

      // Fetch stats
      const { data: profilesData } = await supabase
        .from('risk_profile')
        .select('profile_type');

      if (profilesData) {
        setStats({
          totalProfiles: profilesData.length,
          prudent: profilesData.filter(p => p.profile_type === 'Prudent').length,
          equilibre: profilesData.filter(p => p.profile_type === 'Équilibré').length,
          dynamique: profilesData.filter(p => p.profile_type === 'Dynamique').length,
          audacieux: profilesData.filter(p => p.profile_type === 'Audacieux').length
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('risk_profile_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const toggleQuestionActive = async (questionId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('risk_questions')
        .update({ active })
        .eq('id', questionId);

      if (error) throw error;
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, active } : q
      ));
      
      toast.success(active ? "Question activée" : "Question désactivée");
    } catch (error) {
      console.error('Error toggling question:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleQuestionsUpdated = () => {
    fetchData();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Profil de Risque AMF / MiFID II
        </h2>
        <p className="text-muted-foreground mt-1">
          Gestion du questionnaire de profil de risque investisseur
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Profils</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {stats.totalProfiles}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Prudent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.prudent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Équilibré</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.equilibre}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dynamique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.dynamique}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Audacieux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.audacieux}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres du Module
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Module actif</Label>
              <p className="text-sm text-muted-foreground">
                Activer/désactiver le module de profil de risque
              </p>
            </div>
            <Switch
              checked={settings.module_active}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, module_active: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Obligatoire pour nouveaux inscrits</Label>
              <p className="text-sm text-muted-foreground">
                Forcer la complétion du questionnaire lors de l'inscription
              </p>
            </div>
            <Switch
              checked={settings.mandatory_for_new_users}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, mandatory_for_new_users: checked }))
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Seuils de Profil
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prudent (≤)</Label>
                <Input
                  type="number"
                  value={settings.threshold_prudent}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, threshold_prudent: parseInt(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Équilibré (≤)</Label>
                <Input
                  type="number"
                  value={settings.threshold_equilibre}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, threshold_equilibre: parseInt(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Dynamique (≤)</Label>
                <Input
                  type="number"
                  value={settings.threshold_dynamique}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, threshold_dynamique: parseInt(e.target.value) }))
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Note : Au-delà du seuil Dynamique = Audacieux
            </p>
          </div>

          <Button onClick={handleSaveSettings}>
            Enregistrer les paramètres
          </Button>
        </CardContent>
      </Card>

      {/* Questions Management */}
      <Card>
        <CardHeader>
          <CardTitle>Questions AMF ({questions.length})</CardTitle>
          <CardDescription>
            Créez, modifiez et gérez les questions du questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RiskProfileQuestionEditor 
            questions={questions} 
            onQuestionsUpdated={handleQuestionsUpdated}
          />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Results Text Editor */}
      <RiskProfileResultsEditor />
    </div>
  );
};
