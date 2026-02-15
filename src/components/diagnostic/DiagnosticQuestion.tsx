import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DiagnosticQuestion as QuestionType } from "@/data/diagnostic-config";
import finBearImg from "@/assets/FinBear.png";

interface Props {
  question: QuestionType;
  sectionTitle: string;
  selectedPoints?: number;
  onAnswer: (points: number) => void;
}

export function DiagnosticQuestion({ question, sectionTitle, selectedPoints, onAnswer }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardContent className="pt-8 pb-8 px-6 space-y-6">
        {/* Question label */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground leading-snug">
            {question.label}
          </h2>
          {question.info && (
            <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 p-3">
              <img
                src={finBearImg}
                alt="FinBear"
                className="h-10 w-10 rounded-full object-cover shrink-0 bg-background shadow-sm"
              />
              <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">
                {question.info}
              </p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2" role="radiogroup" aria-label={question.label}>
          {question.options.map((opt, i) => {
            const isSelected = selectedPoints === opt.points;
            return (
              <button
                key={i}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onAnswer(opt.points)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onAnswer(opt.points);
                  }
                }}
                className={cn(
                  "w-full text-left px-4 py-3.5 rounded-lg border transition-all duration-200",
                  "text-sm font-medium",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : hoveredIndex === i
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
