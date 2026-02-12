import { OnboardingData, CANAUX_OPTIONS } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface OnboardingStep6Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
}

export const OnboardingStep6 = ({ formData, updateFormData }: OnboardingStep6Props) => {
  const toggleCanal = (value: string) => {
    const newCanaux = formData.canauxCommunication.includes(value)
      ? formData.canauxCommunication.filter(c => c !== value)
      : [...formData.canauxCommunication, value];
    
    updateFormData({ canauxCommunication: newCanaux });
  };

  const showAutreInput = formData.canauxCommunication.includes('autre');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Canaux de communication
        </h2>
        <p className="text-muted-foreground">
          Comment préférez-vous communiquer avec vos équipes ?
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CANAUX_OPTIONS.map((option) => {
          const Icon = LucideIcons[option.icon as keyof typeof LucideIcons] as any;
          const isSelected = formData.canauxCommunication.includes(option.value);
          
          return (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => toggleCanal(option.value)}
              className={cn(
                "h-20 flex-col gap-2",
                isSelected && "border-primary bg-primary/10"
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="text-sm">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {showAutreInput && (
        <div>
          <Label htmlFor="autreCanal">Précisez</Label>
          <Input
            id="autreCanal"
            value={formData.canalCommunicationAutre || ''}
            onChange={(e) => updateFormData({ canalCommunicationAutre: e.target.value })}
            placeholder="Décrivez votre canal de communication"
          />
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Initiatives internes (optionnel)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Quelles initiatives avez-vous déjà mises en place ?
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="financial_education"
              checked={formData.internalInitiatives?.financial_education_service || false}
              onCheckedChange={(checked) => updateFormData({
                internalInitiatives: { ...formData.internalInitiatives, financial_education_service: checked as boolean }
              })}
            />
            <label htmlFor="financial_education" className="text-sm text-foreground cursor-pointer">
              Service d'éducation financière
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="internal_webinars"
              checked={formData.internalInitiatives?.internal_webinars || false}
              onCheckedChange={(checked) => updateFormData({
                internalInitiatives: { ...formData.internalInitiatives, internal_webinars: checked as boolean }
              })}
            />
            <label htmlFor="internal_webinars" className="text-sm text-foreground cursor-pointer">
              Webinaires internes
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rsu_program"
              checked={formData.internalInitiatives?.pee_perco_rsu_program || false}
              onCheckedChange={(checked) => updateFormData({
                internalInitiatives: { ...formData.internalInitiatives, pee_perco_rsu_program: checked as boolean }
              })}
            />
            <label htmlFor="rsu_program" className="text-sm text-foreground cursor-pointer">
              Programme PEE/PERCO/RSU
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="satisfaction_level">Niveau de satisfaction des employés</Label>
          <Select
            value={formData.internalInitiatives?.satisfaction_level || ''}
            onValueChange={(value) => updateFormData({
              internalInitiatives: { ...formData.internalInitiatives, satisfaction_level: value }
            })}
          >
            <SelectTrigger id="satisfaction_level">
              <SelectValue placeholder="Sélectionner un niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="faible">Faible</SelectItem>
              <SelectItem value="moyen">Moyen</SelectItem>
              <SelectItem value="eleve">Élevé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="missing_elements">Éléments manquants</Label>
          <Textarea
            id="missing_elements"
            value={formData.internalInitiatives?.missing_elements || ''}
            onChange={(e) => updateFormData({
              internalInitiatives: { ...formData.internalInitiatives, missing_elements: e.target.value }
            })}
            placeholder="Quels sont les éléments qui manquent selon vous ?"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="engagement_level">Niveau d'engagement des employés</Label>
          <Select
            value={formData.communicationDetails?.employee_engagement_level || ''}
            onValueChange={(value) => updateFormData({
              communicationDetails: { ...formData.communicationDetails, employee_engagement_level: value }
            })}
          >
            <SelectTrigger id="engagement_level">
              <SelectValue placeholder="Sélectionner un niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="faible">Faible</SelectItem>
              <SelectItem value="moyen">Moyen</SelectItem>
              <SelectItem value="eleve">Élevé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
