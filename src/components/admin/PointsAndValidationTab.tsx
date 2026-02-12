import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Save, 
  BookOpen, 
  Video, 
  HelpCircle, 
  Calculator, 
  Calendar, 
  LogIn, 
  MessageSquare, 
  Heart,
  Trophy,
  Sparkles,
  UserPlus,
  Handshake
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PointsConfig {
  id: string;
  category: string;
  points: number;
  description: string | null;
  is_active: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  guide_completion: <BookOpen className="h-5 w-5" />,
  video_completion: <Video className="h-5 w-5" />,
  quiz_completion: <HelpCircle className="h-5 w-5" />,
  simulator_completion: <Calculator className="h-5 w-5" />,
  webinar_registration: <Calendar className="h-5 w-5" />,
  daily_login: <LogIn className="h-5 w-5" />,
  forum_create_post: <MessageSquare className="h-5 w-5" />,
  forum_create_comment: <MessageSquare className="h-5 w-5" />,
  forum_receive_like: <Heart className="h-5 w-5" />,
  forum_give_like: <Heart className="h-5 w-5" />,
  colleague_invitation: <UserPlus className="h-5 w-5" />,
  partnership_request: <Handshake className="h-5 w-5" />,
  appointment_booking: <Calendar className="h-5 w-5" />,
  financial_profile_completion: <Trophy className="h-5 w-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  guide_completion: "Lecture de guide",
  video_completion: "Visionnage de vidéo",
  quiz_completion: "Complétion de quiz",
  simulator_completion: "Utilisation simulateur",
  webinar_registration: "Inscription webinar",
  daily_login: "Connexion quotidienne",
  forum_create_post: "Création de post",
  forum_create_comment: "Commentaire",
  forum_receive_like: "Recevoir un like",
  forum_give_like: "Donner un like",
  colleague_invitation: "Invitation d'un collègue",
  partnership_request: "Demande de partenariat",
  appointment_booking: "Prise de rendez-vous",
  financial_profile_completion: "Profil financier complété",
};

const CATEGORY_GROUPS = {
  "Formations & Modules": ["guide_completion", "video_completion", "quiz_completion"],
  "Outils & Événements": ["simulator_completion", "webinar_registration", "appointment_booking"],
  "Profil": ["financial_profile_completion"],
  "Engagement": ["daily_login"],
  "Communauté": ["forum_create_post", "forum_create_comment", "forum_receive_like", "forum_give_like"],
  "Croissance": ["colleague_invitation", "partnership_request"],
};

export const PointsAndValidationTab = () => {
  const [configs, setConfigs] = useState<PointsConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('points_configuration')
        .select('*')
        .order('category');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const updatePointsConfig = (category: string, field: keyof PointsConfig, value: any) => {
    setConfigs(prev =>
      prev.map(c =>
        c.category === category ? { ...c, [field]: value } : c
      )
    );
    setHasChanges(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const config of configs) {
        const { error } = await supabase
          .from('points_configuration')
          .update({
            points: config.points,
            is_active: config.is_active,
          })
          .eq('id', config.id);

        if (error) throw error;
      }
      
      toast.success("Configuration enregistrée avec succès");
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const getConfigByCategory = (category: string) => {
    return configs.find(c => c.category === category);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Points
          </h2>
          <p className="text-muted-foreground">
            Configurez les points attribués pour chaque action
          </p>
        </div>
        <Button 
          onClick={saveAll} 
          disabled={saving || !hasChanges}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Enregistrer
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => (
          <Card key={groupName}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {groupName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map(category => {
                const config = getConfigByCategory(category);
                if (!config) return null;

                return (
                  <div 
                    key={category}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      {CATEGORY_ICONS[category]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{CATEGORY_LABELS[category]}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {config.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Actif</Label>
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={(checked) => updatePointsConfig(category, 'is_active', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={config.points}
                          onChange={(e) => updatePointsConfig(category, 'points', parseInt(e.target.value) || 0)}
                          className="w-24 text-center"
                          disabled={!config.is_active}
                        />
                        <span className="text-sm text-muted-foreground">pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
