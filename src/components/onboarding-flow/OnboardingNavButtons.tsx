import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
  skipLabel = "Compléter plus tard",
}: OnboardingNavButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center gap-3 pt-6"
    >
      <div className="flex items-center gap-3 w-full max-w-md">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="gap-2 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={isLoading}
          size="lg"
          className="flex-1 gap-2 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
          style={{ background: "var(--gradient-hero)" }}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <button
        onClick={onSkip}
        className="text-sm text-white/30 hover:text-white/60 underline-offset-4 hover:underline transition-colors"
      >
        {skipLabel}
      </button>
    </motion.div>
  );
}
