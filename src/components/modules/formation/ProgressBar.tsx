import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Award, Target } from "lucide-react";

interface ProgressBarProps {
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  currentStepNum?: number;
  pointsAvailable: number;
}

export const ProgressBar = ({ 
  progress, 
  currentStep, 
  totalSteps, 
  currentStepNum,
  pointsAvailable 
}: ProgressBarProps) => {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-4 z-10">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            {totalSteps && currentStepNum && (
              <>
                <Target className="h-4 w-4" />
                <span>{currentStepNum}/{totalSteps} étapes</span>
              </>
            )}
            {currentStep && (
              <span className="text-foreground ml-2">• {currentStep}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-semibold">{pointsAvailable} points</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="text-primary font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 [&>div]:transition-transform [&>div]:duration-500" />
        </div>

        {progress < 100 && (
          <p className="text-xs text-center text-muted-foreground">
            Chaque module te rend plus confiant financièrement
          </p>
        )}
      </div>
    </Card>
  );
};
