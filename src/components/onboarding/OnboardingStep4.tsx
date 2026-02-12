import { OnboardingData, DISPOSITIFS_OPTIONS } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface OnboardingStep4Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
}

export const OnboardingStep4 = ({ formData, updateFormData }: OnboardingStep4Props) => {
  const toggleDispositif = (value: string) => {
    let newDispositifs: string[];
    
    if (value === 'Aucun') {
      newDispositifs = formData.dispositifsRemuneration.includes('Aucun') ? [] : ['Aucun'];
    } else {
      newDispositifs = formData.dispositifsRemuneration.filter(d => d !== 'Aucun');
      if (newDispositifs.includes(value)) {
        newDispositifs = newDispositifs.filter(d => d !== value);
      } else {
        newDispositifs.push(value);
      }
    }
    
    updateFormData({ dispositifsRemuneration: newDispositifs });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Dispositifs de rémunération
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez les dispositifs que vous utilisez
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DISPOSITIFS_OPTIONS.map((option) => {
          const Icon = LucideIcons[option.icon as keyof typeof LucideIcons] as any;
          const isSelected = formData.dispositifsRemuneration.includes(option.value);
          
          return (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => toggleDispositif(option.value)}
              className={cn(
                "h-24 flex-col gap-2",
                isSelected && "border-primary bg-primary/10"
              )}
            >
              {Icon && <Icon className="h-6 w-6" />}
              <span className="text-sm">{option.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
