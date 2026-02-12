import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaxDeclarationFormData, OPTIMISATION_OPTIONS } from "@/types/tax-declaration";
import { Sparkles, Plus, X } from "lucide-react";

interface StepProps {
  formData: TaxDeclarationFormData;
  updateFormData: (updates: Partial<TaxDeclarationFormData>) => void;
}

export function Step4Optimisation({ formData, updateFormData }: StepProps) {
  const [showAutreInput, setShowAutreInput] = useState(formData.optimisation_autres.length > 0);
  const [newAutre, setNewAutre] = useState("");

  const toggleOptimisation = (id: string) => {
    const current = formData.optimisation_types;
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    updateFormData({ optimisation_types: updated });
  };

  const handleAutreToggle = (checked: boolean) => {
    setShowAutreInput(checked);
    if (!checked) {
      updateFormData({ optimisation_autres: [] });
    }
  };

  const addAutre = () => {
    if (newAutre.trim()) {
      updateFormData({ 
        optimisation_autres: [...formData.optimisation_autres, newAutre.trim()] 
      });
      setNewAutre("");
    }
  };

  const removeAutre = (index: number) => {
    const updated = formData.optimisation_autres.filter((_, i) => i !== index);
    updateFormData({ optimisation_autres: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-5 w-5" />
        <p className="text-muted-foreground">
          Avez-vous utilisé des mécanismes d'optimisation fiscale en 2025 ?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {OPTIMISATION_OPTIONS.map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id={item.id}
              checked={formData.optimisation_types.includes(item.id)}
              onCheckedChange={() => toggleOptimisation(item.id)}
            />
            <Label htmlFor={item.id} className="cursor-pointer flex-1">
              {item.label}
            </Label>
          </div>
        ))}

        {/* Option "Autre" */}
        <div
          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors md:col-span-2"
        >
          <Checkbox
            id="autre_optimisation"
            checked={showAutreInput}
            onCheckedChange={(checked) => handleAutreToggle(!!checked)}
          />
          <Label htmlFor="autre_optimisation" className="cursor-pointer flex-1">
            Autre(s) dispositif(s)
          </Label>
        </div>
      </div>

      {/* Champ de saisie pour "Autre" */}
      {showAutreInput && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <Label>Précisez le(s) autre(s) dispositif(s) d'optimisation utilisé(s) :</Label>
          
          {/* Liste des dispositifs ajoutés */}
          {formData.optimisation_autres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.optimisation_autres.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeAutre(index)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Champ d'ajout */}
          <div className="flex gap-2">
            <Input
              value={newAutre}
              onChange={(e) => setNewAutre(e.target.value)}
              placeholder="Ex: FCPI, Investissement PME..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAutre();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={addAutre}
              disabled={!newAutre.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        💡 Ces dispositifs permettent de réduire votre impôt sur le revenu. 
        Si vous n'êtes pas sûr, laissez vide et nous en discuterons lors du rendez-vous.
      </p>
    </div>
  );
}
