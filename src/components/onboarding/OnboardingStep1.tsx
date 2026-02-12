import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { OnboardingData, PARTNERSHIP_OPTIONS, WORK_MODE_OPTIONS, LOCATION_OPTIONS } from '@/types/onboarding';

interface OnboardingStep1Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
}

export const OnboardingStep1 = ({ formData, updateFormData }: OnboardingStep1Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Informations générales
        </h2>
        <p className="text-muted-foreground">
          Commençons par les informations de base de votre entreprise
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nomEntreprise">Nom de l'entreprise *</Label>
          <Input
            id="nomEntreprise"
            value={formData.nomEntreprise}
            onChange={(e) => updateFormData({ nomEntreprise: e.target.value })}
            placeholder="Ex: FinCare Solutions"
          />
        </div>

        <div>
          <Label htmlFor="domaineEmail">Domaine de messagerie *</Label>
          <Input
            id="domaineEmail"
            value={formData.domaineEmail}
            onChange={(e) => updateFormData({ domaineEmail: e.target.value })}
            placeholder="@entreprise.com"
          />
        </div>

        <div>
          <Label htmlFor="effectif">Effectif *</Label>
          <Input
            id="effectif"
            type="number"
            min="1"
            value={formData.effectif || ''}
            onChange={(e) => updateFormData({ effectif: parseInt(e.target.value) || 0 })}
            placeholder="Nombre de salariés"
          />
        </div>

        <div>
          <Label htmlFor="partnershipType">Entité en charge du partenariat</Label>
          <Select
            value={formData.partnershipType || ''}
            onValueChange={(value) => updateFormData({ partnershipType: value })}
          >
            <SelectTrigger id="partnershipType" className="bg-background">
              <SelectValue placeholder="Sélectionner une entité" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {PARTNERSHIP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.partnershipType === 'autre' && (
          <div>
            <Label htmlFor="partnershipTypeOther">Précisez le type de partenariat</Label>
            <Input
              id="partnershipTypeOther"
              value={formData.partnershipTypeOther || ''}
              onChange={(e) => updateFormData({ partnershipTypeOther: e.target.value })}
              placeholder="Précisez..."
            />
          </div>
        )}

        <div>
          <Label htmlFor="selectedPlan">Plan FinCare</Label>
          <div className="flex items-center gap-2">
            <Select
              value={formData.selectedPlan || 'origin'}
              onValueChange={(value) => updateFormData({ selectedPlan: value as 'origin' | 'hero' | 'legend' })}
            >
              <SelectTrigger id="selectedPlan">
                <SelectValue placeholder="Sélectionner un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="origin">FinCare Origin</SelectItem>
                <SelectItem value="hero">FinCare Hero</SelectItem>
                <SelectItem value="legend">FinCare Legend</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('/plans?mode=selection', '_blank')}
              className="whitespace-nowrap"
            >
              Comparer les plans
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="workMode">Mode de travail</Label>
          <Select
            value={formData.workMode || ''}
            onValueChange={(value) => updateFormData({ workMode: value })}
          >
            <SelectTrigger id="workMode">
              <SelectValue placeholder="Sélectionner un mode" />
            </SelectTrigger>
            <SelectContent>
              {WORK_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Localisation des employés</Label>
          <div className="space-y-2 mt-2">
            {LOCATION_OPTIONS.map((location) => (
              <div key={location} className="flex items-center space-x-2">
                <Checkbox
                  id={`location-${location}`}
                  checked={formData.employeeLocations?.includes(location) || false}
                  onCheckedChange={(checked) => {
                    const currentLocations = formData.employeeLocations || [];
                    updateFormData({
                      employeeLocations: checked
                        ? [...currentLocations, location]
                        : currentLocations.filter((l) => l !== location)
                    });
                  }}
                />
                <label htmlFor={`location-${location}`} className="text-sm text-foreground cursor-pointer">
                  {location}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasForeignEmployees"
            checked={formData.hasForeignEmployees || false}
            onCheckedChange={(checked) => updateFormData({ hasForeignEmployees: checked as boolean })}
          />
          <label htmlFor="hasForeignEmployees" className="text-sm text-foreground cursor-pointer">
            Des salariés à l'étranger
          </label>
        </div>
      </div>
    </div>
  );
};
