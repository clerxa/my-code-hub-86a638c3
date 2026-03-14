import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { label: "Synthèse", icon: "📊" },
  { label: "Calcul de l'impôt", icon: "🧮" },
  { label: "Prélèvement à la source", icon: "💳" },
  { label: "Optimisation", icon: "🎯" },
];

interface AtlasResultsStepperProps {
  children: React.ReactNode[];
  onReset: () => void;
}

export function AtlasResultsStepper({ children, onReset }: AtlasResultsStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  }, [currentStep]);

  const next = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-6">
      {/* Stepper navigation */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary/10 border border-primary/20 shadow-sm"
                  : "hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.icon}
              </div>
              <span
                className={cn(
                  "text-[11px] sm:text-xs font-medium leading-tight text-center",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {/* Progress bar */}
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isActive || isCompleted ? "bg-primary" : "bg-transparent"
                  )}
                  style={{ width: isActive || isCompleted ? "100%" : "0%" }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Step content with animation */}
      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {children[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={prev}
          disabled={currentStep === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" /> Précédent
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {STEPS.length}
        </span>

        {currentStep < STEPS.length - 1 ? (
          <Button
            size="sm"
            onClick={next}
            className="gap-1.5"
          >
            Suivant <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
            Nouvelle analyse
          </Button>
        )}
      </div>
    </div>
  );
}
