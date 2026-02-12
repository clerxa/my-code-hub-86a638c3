import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CSATBetaQuestion, CSATBetaResponse } from '@/types/csat';
import { cn } from '@/lib/utils';

interface CSATScreen2Props {
  questions: CSATBetaQuestion[];
  responses: CSATBetaResponse[];
  setResponses: (responses: CSATBetaResponse[]) => void;
}

export const CSATScreen2: React.FC<CSATScreen2Props> = ({
  questions,
  responses,
  setResponses,
}) => {
  const handleResponseChange = (question: CSATBetaQuestion, answer: string | number) => {
    const existingIndex = responses.findIndex(r => r.question_id === question.id);
    const newResponse: CSATBetaResponse = {
      question_id: question.id,
      question_text: question.question_text,
      answer,
    };

    if (existingIndex >= 0) {
      const newResponses = [...responses];
      newResponses[existingIndex] = newResponse;
      setResponses(newResponses);
    } else {
      setResponses([...responses, newResponse]);
    }
  };

  const getResponseValue = (questionId: string): string | number | undefined => {
    return responses.find(r => r.question_id === questionId)?.answer;
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune question bêta configurée.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Quelques questions supplémentaires pour améliorer notre produit :
      </p>

      {questions.map((question) => (
        <div key={question.id} className="space-y-3">
          <Label className="text-sm font-medium">{question.question_text}</Label>

          {question.question_type === 'rating_1_5' && (
            <div className="space-y-1">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleResponseChange(question, score)}
                    className={cn(
                      "flex-1 h-10 rounded-lg border-2 transition-all font-medium",
                      getResponseValue(question.id) === score
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
                <span>Tout à fait</span>
              </div>
            </div>
          )}

          {question.question_type === 'single_choice' && question.options && (
            <RadioGroup
              value={String(getResponseValue(question.id) || '')}
              onValueChange={(value) => handleResponseChange(question, value)}
              className="flex flex-wrap gap-2"
            >
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center">
                  <RadioGroupItem
                    value={option}
                    id={`${question.id}-${idx}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${question.id}-${idx}`}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 cursor-pointer transition-all",
                      getResponseValue(question.id) === option
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border hover:border-primary/50"
                    )}
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.question_type === 'yes_no' && (
            <RadioGroup
              value={String(getResponseValue(question.id) || '')}
              onValueChange={(value) => handleResponseChange(question, value)}
              className="flex gap-2"
            >
              {['Oui', 'Non'].map((option) => (
                <div key={option} className="flex items-center">
                  <RadioGroupItem
                    value={option}
                    id={`${question.id}-${option}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${question.id}-${option}`}
                    className={cn(
                      "px-6 py-2 rounded-lg border-2 cursor-pointer transition-all",
                      getResponseValue(question.id) === option
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border hover:border-primary/50"
                    )}
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      ))}
    </div>
  );
};
