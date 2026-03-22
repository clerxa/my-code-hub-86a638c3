import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Loader2 } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";

interface StepHorizonProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepHorizon({ onNext, onSkip }: StepHorizonProps) {
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [hasImmoProject, setHasImmoProject] = useState(profile?.objectif_achat_immo || false);
  const [budget, setBudget] = useState(profile?.budget_achat_immo || 0);
  const [horizon, setHorizon] = useState(profile?.duree_emprunt_souhaitee || 5);
  const [projectsChecked, setProjectsChecked] = useState({
    retraite: false,
    enfants: false,
    autre: false,
  });

  const handleSubmit = () => {
    const data: FinancialProfileInput = {
      objectif_achat_immo: hasImmoProject,
      budget_achat_immo: hasImmoProject ? budget : null,
      duree_emprunt_souhaitee: hasImmoProject ? horizon : profile?.duree_emprunt_souhaitee || 0,
    };
    saveProfile(data, { onSuccess: () => onNext() });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Vos projets de vie</CardTitle>
          <CardDescription>
            Planifiez vos objectifs financiers à moyen et long terme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Projet immobilier */}
          <div className="flex items-center justify-between">
            <Label htmlFor="immo-toggle">Avez-vous un projet immobilier ?</Label>
            <Switch
              id="immo-toggle"
              checked={hasImmoProject}
              onCheckedChange={setHasImmoProject}
            />
          </div>

          {hasImmoProject && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label>Budget estimé (€)</Label>
                <Input
                  type="number"
                  min={0}
                  value={budget || ""}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 300 000"
                />
              </div>
              <div className="space-y-2">
                <Label>Horizon (années)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={horizon}
                  onChange={(e) => setHorizon(parseInt(e.target.value) || 5)}
                />
              </div>
            </div>
          )}

          {/* Autres projets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Autres projets</Label>
            <div className="space-y-2">
              {[
                { key: "retraite" as const, label: "Préparer ma retraite" },
                { key: "enfants" as const, label: "Épargne pour mes enfants" },
                { key: "autre" as const, label: "Autre projet" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`project-${key}`}
                    checked={projectsChecked[key]}
                    onCheckedChange={(c) =>
                      setProjectsChecked((prev) => ({ ...prev, [key]: !!c }))
                    }
                  />
                  <Label htmlFor={`project-${key}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continuer <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}
