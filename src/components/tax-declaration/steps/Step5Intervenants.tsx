import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaxDeclarationFormData, EXPERTISE_AVOCAT_OPTIONS } from "@/types/tax-declaration";
import { Scale, AlertCircle } from "lucide-react";

interface StepProps {
  formData: TaxDeclarationFormData;
  updateFormData: (updates: Partial<TaxDeclarationFormData>) => void;
}

export function Step5Intervenants({ formData, updateFormData }: StepProps) {
  const toggleExpertise = (id: string) => {
    const current = formData.expertise_avocat;
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    updateFormData({ expertise_avocat: updated });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Expertise avocat fiscaliste</h3>
        </div>
        <p className="text-muted-foreground">
          Souhaitez-vous qu'un avocat fiscaliste soit présent pour des questions spécifiques ?
        </p>
        
        <div className="grid gap-3 md:grid-cols-2">
          {EXPERTISE_AVOCAT_OPTIONS.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={item.id}
                checked={formData.expertise_avocat.includes(item.id)}
                onCheckedChange={() => toggleExpertise(item.id)}
              />
              <Label htmlFor={item.id} className="cursor-pointer flex-1">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="space-y-2 flex-1">
            <Label>
              Souhaitez-vous déléguer à 100% votre déclaration à un avocat fiscaliste ?
            </Label>
            <p className="text-xs text-muted-foreground">
              Cette option implique un accompagnement complet et des honoraires supplémentaires.
            </p>
          </div>
        </div>
        <Select
          value={formData.delegation_complete ? "oui" : "non"}
          onValueChange={(value) => updateFormData({ delegation_complete: value === "oui" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oui">Oui, je souhaite une délégation complète</SelectItem>
            <SelectItem value="non">Non, je gère moi-même avec accompagnement</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
