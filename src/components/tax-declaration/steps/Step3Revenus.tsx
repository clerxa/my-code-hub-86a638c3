import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TaxDeclarationFormData, REVENUS_ACTIVITE, REVENUS_CAPITAL, REVENUS_PLUS_VALUES } from "@/types/tax-declaration";
import { Briefcase, Building, TrendingUp } from "lucide-react";

interface StepProps {
  formData: TaxDeclarationFormData;
  updateFormData: (updates: Partial<TaxDeclarationFormData>) => void;
}

export function Step3Revenus({ formData, updateFormData }: StepProps) {
  const toggleRevenuType = (id: string) => {
    const current = formData.revenus_types;
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    updateFormData({ revenus_types: updated });
  };

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">
        Sélectionnez les types de revenus que vous avez perçus en 2025 :
      </p>

      {/* Activité */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Briefcase className="h-5 w-5" />
          <h3 className="font-semibold">Activité</h3>
        </div>
        <div className="grid gap-3 pl-7">
          {REVENUS_ACTIVITE.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <Checkbox
                id={item.id}
                checked={formData.revenus_types.includes(item.id)}
                onCheckedChange={() => toggleRevenuType(item.id)}
              />
              <Label htmlFor={item.id} className="cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Capital & Immobilier */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Building className="h-5 w-5" />
          <h3 className="font-semibold">Capital & Immobilier</h3>
        </div>
        <div className="grid gap-3 pl-7 md:grid-cols-2">
          {REVENUS_CAPITAL.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <Checkbox
                id={item.id}
                checked={formData.revenus_types.includes(item.id)}
                onCheckedChange={() => toggleRevenuType(item.id)}
              />
              <Label htmlFor={item.id} className="cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Plus-values */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Plus-values</h3>
        </div>
        <div className="grid gap-3 pl-7">
          {REVENUS_PLUS_VALUES.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <Checkbox
                id={item.id}
                checked={formData.revenus_types.includes(item.id)}
                onCheckedChange={() => toggleRevenuType(item.id)}
              />
              <Label htmlFor={item.id} className="cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
