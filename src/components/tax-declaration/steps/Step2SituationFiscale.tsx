import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaxDeclarationFormData, SITUATION_MARITALE_OPTIONS, TMI_OPTIONS } from "@/types/tax-declaration";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface StepProps {
  formData: TaxDeclarationFormData;
  updateFormData: (updates: Partial<TaxDeclarationFormData>) => void;
}

export function Step2SituationFiscale({ formData, updateFormData }: StepProps) {
  const { prefilled_from_profile } = formData;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Quelle est votre situation maritale ?</Label>
          {prefilled_from_profile?.situation_maritale && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Info className="h-3 w-3" />
              Récupéré du profil
            </Badge>
          )}
        </div>
        <Select
          value={formData.situation_maritale}
          onValueChange={(value) => updateFormData({ situation_maritale: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre situation" />
          </SelectTrigger>
          <SelectContent>
            {SITUATION_MARITALE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="nombre_enfants">Nombre d'enfants à charge</Label>
          {prefilled_from_profile?.nombre_enfants && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Info className="h-3 w-3" />
              Récupéré du profil
            </Badge>
          )}
        </div>
        <Input
          id="nombre_enfants"
          type="number"
          min="0"
          value={formData.nombre_enfants}
          onChange={(e) => updateFormData({ nombre_enfants: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="revenu_imposable">
            Quel était votre revenu imposable de l'année précédente (2025) ?
          </Label>
          {prefilled_from_profile?.revenu_imposable_precedent && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Info className="h-3 w-3" />
              Récupéré du profil
            </Badge>
          )}
        </div>
        <div className="relative">
          <Input
            id="revenu_imposable"
            type="number"
            min="0"
            value={formData.revenu_imposable_precedent || ''}
            onChange={(e) => updateFormData({ revenu_imposable_precedent: parseFloat(e.target.value) || 0 })}
            placeholder="Ex: 50000"
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Quel était votre taux marginal d'imposition (TMI) ?</Label>
          {prefilled_from_profile?.tmi_auto_calculated && (
            <Badge variant="outline" className="text-xs gap-1 border-primary/50 text-primary">
              <Info className="h-3 w-3" />
              Calculé automatiquement
            </Badge>
          )}
        </div>
        <Select
          value={formData.tmi}
          onValueChange={(value) => updateFormData({ tmi: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre TMI" />
          </SelectTrigger>
          <SelectContent>
            {TMI_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Le TMI correspond à la tranche d'imposition la plus élevée à laquelle vous êtes soumis.
        </p>
      </div>
    </div>
  );
}
