import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

interface OnboardingNavButtonsProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  skipLabel?: string;
}

export function OnboardingNavButtons({
  onNext,
  onSkip,
  onBack,
  isLoading = false,
  nextLabel = "Continuer",
  skipLabel = "Enregistrer et compléter plus tard",
}: OnboardingNavButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      <div className="flex items-center gap-3 w-full max-w-md">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={isLoading}
          size="lg"
          className="flex-1 gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <button
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
      >
        {skipLabel}
      </button>
    </div>
  );
}
