import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CSATScreen3Props {
  improvementFeedback: string;
  setImprovementFeedback: (value: string) => void;
  positiveFeedback: string;
  setPositiveFeedback: (value: string) => void;
}

export const CSATScreen3: React.FC<CSATScreen3Props> = ({
  improvementFeedback,
  setImprovementFeedback,
  positiveFeedback,
  setPositiveFeedback,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="improvement" className="text-sm font-medium">
          Qu'est-ce qui pourrait être amélioré en priorité ?
        </Label>
        <Textarea
          id="improvement"
          value={improvementFeedback}
          onChange={(e) => setImprovementFeedback(e.target.value)}
          placeholder="Partagez vos idées d'amélioration..."
          className="min-h-[100px] resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {improvementFeedback.length}/1000
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="positive" className="text-sm font-medium">
          Qu'est-ce qui vous a le plus aidé ou marqué ? <span className="text-muted-foreground">(optionnel)</span>
        </Label>
        <Textarea
          id="positive"
          value={positiveFeedback}
          onChange={(e) => setPositiveFeedback(e.target.value)}
          placeholder="Ce que vous avez apprécié..."
          className="min-h-[80px] resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {positiveFeedback.length}/1000
        </p>
      </div>
    </div>
  );
};
