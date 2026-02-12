import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExpertIntent } from '@/types/csat';
import { cn } from '@/lib/utils';
import { UserCheck, Clock, X } from 'lucide-react';

interface CSATScreen4Props {
  expertIntent: ExpertIntent | null;
  setExpertIntent: (value: ExpertIntent) => void;
}

export const CSATScreen4: React.FC<CSATScreen4Props> = ({
  expertIntent,
  setExpertIntent,
}) => {
  const options: { value: ExpertIntent; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      value: 'yes', 
      label: 'Oui, pourquoi pas', 
      icon: <UserCheck className="h-5 w-5" />,
      description: 'Je serais intéressé par un échange'
    },
    { 
      value: 'not_now', 
      label: 'Pas maintenant', 
      icon: <Clock className="h-5 w-5" />,
      description: 'Peut-être plus tard'
    },
    { 
      value: 'no', 
      label: 'Non', 
      icon: <X className="h-5 w-5" />,
      description: 'Je préfère continuer seul'
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          À ce stade, auriez-vous envie d'échanger avec un expert pour aller plus loin ?
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Votre réponse nous aide à mieux comprendre vos besoins.
        </p>
      </div>

      <RadioGroup
        value={expertIntent || ''}
        onValueChange={(value) => setExpertIntent(value as ExpertIntent)}
        className="space-y-3"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <RadioGroupItem
              value={option.value}
              id={`expert-${option.value}`}
              className="sr-only"
            />
            <Label
              htmlFor={`expert-${option.value}`}
              className={cn(
                "flex items-start gap-3 w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
                expertIntent === option.value
                  ? "bg-primary/5 border-primary"
                  : "bg-background hover:bg-muted border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "mt-0.5",
                expertIntent === option.value ? "text-primary" : "text-muted-foreground"
              )}>
                {option.icon}
              </div>
              <div>
                <div className={cn(
                  "font-medium",
                  expertIntent === option.value ? "text-primary" : ""
                )}>
                  {option.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <p className="text-xs text-muted-foreground italic pt-2">
        ⚠️ En version bêta, aucun rendez-vous n'est proposé. Cette information nous aide simplement à évaluer l'intérêt pour ce service.
      </p>
    </div>
  );
};
