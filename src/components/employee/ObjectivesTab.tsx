/**
 * Objectives Tab - Displays user objectives from onboarding
 * Fetches objectives dynamically from onboarding_screens and matches user responses
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { 
  Target, TrendingDown, Briefcase, PiggyBank, Home, 
  Sparkles, RefreshCw, CheckCircle2, Loader2, Star,
  GraduationCap, Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ObjectivesTabProps {
  profileObjectives?: string[];
  onUpdateObjectives?: (objectives: string[]) => void;
}

interface OnboardingOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

// Map icon names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  TrendingDown: <TrendingDown className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  PiggyBank: <PiggyBank className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Compass: <Compass className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
};

export function ObjectivesTab({ profileObjectives = [], onUpdateObjectives }: ObjectivesTabProps) {
  const { user } = useAuth();
  const [userObjectives, setUserObjectives] = useState<OnboardingOption[]>([]);
  const [availableObjectives, setAvailableObjectives] = useState<OnboardingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedObjectiveValues, setSelectedObjectiveValues] = useState<string[]>(profileObjectives);
  const [objectivesScreenId, setObjectivesScreenId] = useState<string | null>(null);

  useEffect(() => {
    fetchObjectivesData();
  }, [user?.id]);

  const fetchObjectivesData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 1. First, fetch user's saved objectives from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("objectives")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile objectives:", profileError);
      }

      const savedObjectives: string[] = profileData?.objectives || [];

      // 2. Fetch the objectives screen from onboarding_screens (employee-onboarding flow)
      const { data: screens, error: screensError } = await supabase
        .from("onboarding_screens")
        .select("id, options, title")
        .eq("flow_id", "employee-onboarding")
        .ilike("title", "%objectif%")
        .single();

      if (screensError && screensError.code !== "PGRST116") {
        console.error("Error fetching objectives screen:", screensError);
      }

      let allOptions: OnboardingOption[] = [];
      
      if (screens?.options && Array.isArray(screens.options)) {
        allOptions = (screens.options as unknown as OnboardingOption[]).map(opt => ({
          value: opt.value || "",
          label: opt.label || "",
          icon: opt.icon,
          description: opt.description,
        }));
        setAvailableObjectives(allOptions);
        setObjectivesScreenId(screens.id);
      }

      // 3. If user has saved objectives in profile, use those
      if (savedObjectives.length > 0) {
        const matchedObjectives = allOptions.filter(opt => 
          savedObjectives.includes(opt.value)
        );
        setUserObjectives(matchedObjectives);
        setSelectedObjectiveValues(savedObjectives);
        setLoading(false);
        return;
      }

      // 4. Otherwise, fetch from onboarding_responses for initial values
      const { data: responses, error: responsesError } = await supabase
        .from("onboarding_responses")
        .select("response_value, screen_id")
        .eq("user_id", user.id)
        .eq("flow_id", "employee-onboarding");

      if (responsesError) throw responsesError;

      // Find responses that match objective options
      const userObjectiveValues: string[] = [];
      
      responses?.forEach((response) => {
        const value = response.response_value;
        // Check if it's a single value
        if (typeof value === "string") {
          userObjectiveValues.push(value);
        } 
        // Check if it's an array of values
        else if (Array.isArray(value)) {
          value.forEach((v) => {
            if (typeof v === "string") {
              userObjectiveValues.push(v);
            }
          });
        }
        // Check if it's an object with a value property
        else if (value && typeof value === "object" && "value" in value) {
          userObjectiveValues.push((value as { value: string }).value);
        }
      });

      // Match user responses with available options
      const matchedObjectives = allOptions.filter(opt => 
        userObjectiveValues.includes(opt.value)
      );

      // Combine with profile objectives
      const combinedValues = [...new Set([
        ...profileObjectives,
        ...matchedObjectives.map(o => o.value)
      ])];

      setUserObjectives(matchedObjectives);
      setSelectedObjectiveValues(combinedValues);
    } catch (error) {
      console.error("Error fetching objectives:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleObjective = (objectiveValue: string) => {
    setSelectedObjectiveValues((prev) => {
      const newValues = prev.includes(objectiveValue)
        ? prev.filter((v) => v !== objectiveValue)
        : [...prev, objectiveValue];
      
      onUpdateObjectives?.(newValues);
      return newValues;
    });
  };

  const handleSaveObjectives = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ objectives: selectedObjectiveValues })
        .eq("id", user.id);

      if (error) throw error;
      
      // Update userObjectives to reflect saved state
      const savedObjectives = availableObjectives.filter(opt => 
        selectedObjectiveValues.includes(opt.value)
      );
      setUserObjectives(savedObjectives);
      onUpdateObjectives?.(selectedObjectiveValues);
      toast.success("Objectifs enregistrés avec succès !");
    } catch (error) {
      console.error("Error saving objectives:", error);
      toast.error("Erreur lors de l'enregistrement des objectifs");
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return <Target className="h-5 w-5" />;
    return ICON_MAP[iconName] || <Target className="h-5 w-5" />;
  };

  const hasChanges = () => {
    const currentSorted = selectedObjectiveValues.slice().sort().join(",");
    const originalSorted = userObjectives.map(o => o.value).sort().join(",");
    return currentSorted !== originalSorted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Vos objectifs</CardTitle>
              <CardDescription>
                {userObjectives.length > 0 
                  ? "Objectifs renseignés lors de votre inscription"
                  : "Définissez vos objectifs financiers"
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userObjectives.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                {userObjectives.map((objective) => (
                  <div
                    key={objective.value}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border transition-all",
                      selectedObjectiveValues.includes(objective.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getIcon(objective.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{objective.label}</h4>
                        {selectedObjectiveValues.includes(objective.value) && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        )}
                      </div>
                      {objective.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {objective.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h4 className="font-medium text-muted-foreground">Aucun objectif défini</h4>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Sélectionnez vos objectifs ci-dessous pour personnaliser votre expérience et recevoir des recommandations adaptées.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available objectives to modify */}
      {availableObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modifier mes objectifs</CardTitle>
            <CardDescription>
              Cliquez sur un objectif pour l'activer ou le désactiver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableObjectives.map((objective) => (
                <button
                  key={objective.value}
                  onClick={() => toggleObjective(objective.value)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    selectedObjectiveValues.includes(objective.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-md",
                    selectedObjectiveValues.includes(objective.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {getIcon(objective.icon)}
                  </div>
                  <span className="text-sm font-medium">{objective.label}</span>
                  {selectedObjectiveValues.includes(objective.value) && (
                    <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />
                  )}
                </button>
              ))}
            </div>

            {hasChanges() && (
              <Button onClick={handleSaveObjectives} className="mt-4 w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}