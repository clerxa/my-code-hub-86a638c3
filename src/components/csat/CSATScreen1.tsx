import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { InformationLevel } from '@/types/csat';
import { cn } from '@/lib/utils';

interface CSATScreen1Props {
  contentQualityScore: number;
  setContentQualityScore: (value: number) => void;
  experienceScore: number;
  setExperienceScore: (value: number) => void;
  visualScore: number;
  setVisualScore: (value: number) => void;
  relevanceScore: number;
  setRelevanceScore: (value: number) => void;
  informationLevel: InformationLevel | null;
  setInformationLevel: (value: InformationLevel) => void;
}

interface RatingScaleProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const RatingScale: React.FC<RatingScaleProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn(
              "flex-1 h-10 rounded-lg border-2 transition-all font-medium",
              value === score
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border hover:border-primary/50"
            )}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Pas du tout</span>
        <span>Parfait</span>
      </div>
    </div>
  );
};

export const CSATScreen1: React.FC<CSATScreen1Props> = ({
  contentQualityScore,
  setContentQualityScore,
  experienceScore,
  setExperienceScore,
  visualScore,
  setVisualScore,
  relevanceScore,
  setRelevanceScore,
  informationLevel,
  setInformationLevel,
}) => {
  const informationLevelOptions: { value: InformationLevel; label: string }[] = [
    { value: 'too_simple', label: 'Trop simple' },
    { value: 'adapted', label: 'Adapté' },
    { value: 'too_complex', label: 'Trop complexe' },
  ];

  return (
    <div className="space-y-6">
      <RatingScale
        label="Qualité du contenu"
        value={contentQualityScore}
        onChange={setContentQualityScore}
      />

      <RatingScale
        label="Expérience utilisateur"
        value={experienceScore}
        onChange={setExperienceScore}
      />

      <RatingScale
        label="Visuel / design"
        value={visualScore}
        onChange={setVisualScore}
      />

      <RatingScale
        label="Pertinence par rapport à ma situation"
        value={relevanceScore}
        onChange={setRelevanceScore}
      />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Niveau d'information</Label>
        <RadioGroup
          value={informationLevel || ''}
          onValueChange={(value) => setInformationLevel(value as InformationLevel)}
          className="flex flex-wrap gap-2"
        >
          {informationLevelOptions.map((option) => (
            <div key={option.value} className="flex items-center">
              <RadioGroupItem
                value={option.value}
                id={`info-${option.value}`}
                className="sr-only"
              />
              <Label
                htmlFor={`info-${option.value}`}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 cursor-pointer transition-all",
                  informationLevel === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border hover:border-primary/50"
                )}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};
