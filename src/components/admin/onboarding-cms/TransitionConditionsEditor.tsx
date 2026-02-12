import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import {
  OnboardingScreen,
  OnboardingScreenType,
  TransitionCondition,
  SCREEN_TYPE_LABELS,
} from "@/types/onboarding-cms";
import { canTransitionTo } from "@/lib/onboarding-compatibility";

interface TransitionConditionsEditorProps {
  screen: OnboardingScreen;
  allScreens: OnboardingScreen[];
  onUpdate: (conditions: TransitionCondition[]) => void;
}

export function TransitionConditionsEditor({
  screen,
  allScreens,
  onUpdate,
}: TransitionConditionsEditorProps) {
  const conditions = screen.metadata.transitionConditions || [];

  // Get compatible screens (exclude current and filter by compatibility rules)
  const targetScreens = allScreens.filter(
    (s) => s.id !== screen.id && canTransitionTo(screen.type as OnboardingScreenType, s.type as OnboardingScreenType)
  );

  // Determine if screen type supports numeric conditions
  const isNumericType = screen.type === 'SLIDER' || 
    (screen.type === 'TEXT_INPUT' && screen.metadata.inputType === 'number');
  
  const isTextType = screen.type === 'TEXT_INPUT' && screen.metadata.inputType !== 'number';

  // For choice types, conditions are on options directly (nextStepId)
  const isChoiceType = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'TOGGLE'].includes(screen.type);

  const addCondition = () => {
    const newCondition: TransitionCondition = {
      id: `cond_${Date.now()}`,
      label: isNumericType ? `Plage ${conditions.length + 1}` : `Condition ${conditions.length + 1}`,
      targetScreenId: "",
      priority: conditions.length + 1,
      ...(isNumericType ? { minValue: 0, maxValue: 100 } : {}),
      ...(isTextType ? { exactValue: "" } : {}),
    };
    onUpdate([...conditions, newCondition]);
  };

  const updateCondition = (conditionId: string, updates: Partial<TransitionCondition>) => {
    onUpdate(
      conditions.map((cond) =>
        cond.id === conditionId ? { ...cond, ...updates } : cond
      )
    );
  };

  const deleteCondition = (conditionId: string) => {
    onUpdate(conditions.filter((cond) => cond.id !== conditionId));
  };

  // Get helpful description based on screen type
  const getHelpText = () => {
    if (isChoiceType) {
      return "💡 Pour les écrans de choix, vous pouvez aussi définir des branchements directement sur chaque option ci-dessus.";
    }
    if (screen.type === 'WELCOME') {
      return "💡 Définissez des conditions basées sur les réponses des écrans précédents pour orienter le parcours.";
    }
    if (screen.type === 'CALCULATION_RESULT') {
      return "💡 Vous pouvez rediriger vers différents écrans selon le résultat du calcul.";
    }
    if (isNumericType) {
      return "Définissez des plages de valeurs pour orienter vers différents écrans selon la réponse.";
    }
    return "Définissez des conditions sur la réponse pour orienter vers différents écrans.";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Conditions de transition</h4>
          <Badge variant="outline" className="text-xs">
            Optionnel
          </Badge>
          {conditions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {conditions.length} condition{conditions.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {getHelpText()}
      </p>

      {conditions.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground mb-1">
            Aucune condition définie
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Sans condition, l'écran suivant par défaut sera utilisé.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCondition}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une condition
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions
            .sort((a, b) => a.priority - b.priority)
            .map((condition) => {
              const targetScreen = allScreens.find((s) => s.id === condition.targetScreenId);

              return (
                <div
                  key={condition.id}
                  className="border rounded-lg p-3 bg-card space-y-3"
                >
                  {/* Label and Delete */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{condition.priority}
                    </Badge>
                    <Input
                      value={condition.label}
                      onChange={(e) =>
                        updateCondition(condition.id, { label: e.target.value })
                      }
                      placeholder="Nom de la condition"
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteCondition(condition.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Condition values */}
                  <div className="grid grid-cols-3 gap-2">
                    {isNumericType ? (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Min</Label>
                          <Input
                            type="number"
                            value={condition.minValue ?? ""}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                              })
                            }
                            placeholder="Min"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Max</Label>
                          <Input
                            type="number"
                            value={condition.maxValue ?? ""}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                              })
                            }
                            placeholder="Max"
                            className="h-8 text-sm"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Valeur</Label>
                        <Input
                          value={String(condition.exactValue ?? "")}
                          onChange={(e) =>
                            updateCondition(condition.id, {
                              exactValue: e.target.value,
                            })
                          }
                          placeholder="Valeur exacte"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className={isNumericType ? "" : "col-span-1"}>
                      <Label className="text-xs text-muted-foreground">→ Écran cible</Label>
                      <Select
                        value={condition.targetScreenId || "_none"}
                        onValueChange={(v) =>
                          updateCondition(condition.id, {
                            targetScreenId: v === "_none" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="_none">Non défini</SelectItem>
                          {targetScreens.length === 0 ? (
                            <SelectItem value="_no_compat" disabled>
                              Aucun écran compatible
                            </SelectItem>
                          ) : (
                            targetScreens.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.order_num + 1}. {s.title}
                                <span className="text-muted-foreground ml-1">
                                  ({SCREEN_TYPE_LABELS[s.type as OnboardingScreenType]})
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview */}
                  {targetScreen && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                      <span>
                        {isNumericType
                          ? `Si valeur entre ${condition.minValue ?? "∞"} et ${condition.maxValue ?? "∞"}`
                          : `Si valeur = "${condition.exactValue}"`
                        }
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium text-foreground">
                        {targetScreen.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {conditions.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            💡 Les conditions sont évaluées dans l'ordre de priorité.
          </p>
          <Button size="sm" variant="outline" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
