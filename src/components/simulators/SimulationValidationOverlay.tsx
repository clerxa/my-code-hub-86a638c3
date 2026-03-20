import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Brain, TrendingUp, Calculator } from "lucide-react";
import { useCSATTrigger } from "@/hooks/useCSATTrigger";
import { CSATPanel } from "@/components/csat";

export interface ValidationStep {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  duration: number;
}

interface SimulationValidationOverlayProps {
  isValidating: boolean;
  onComplete: () => void;
  simulatorName?: string;
  simulatorId?: string;
  steps?: ValidationStep[];
}

const DEFAULT_STEPS: ValidationStep[] = [
  { icon: Calculator, text: "Analyse de vos données...", duration: 800 },
  { icon: Brain, text: "Calcul des optimisations...", duration: 1000 },
  { icon: TrendingUp, text: "Génération des recommandations...", duration: 800 },
  { icon: Sparkles, text: "Finalisation des résultats...", duration: 600 },
];

export function SimulationValidationOverlay({ 
  isValidating, 
  onComplete,
  simulatorName = "Simulateur",
  simulatorId = "simulator",
}: SimulationValidationOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // CSAT trigger
  const { showCSAT, closeCSAT, triggerCSAT, contentType, contentId, contentName } = useCSATTrigger({
    contentType: 'simulator',
    contentId: simulatorId,
    contentName: simulatorName,
  });

  useEffect(() => {
    if (!isValidating) {
      setCurrentStep(0);
      setShowSuccess(false);
      return;
    }

    let totalElapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Progress through each step
    STEPS.forEach((step, index) => {
      if (index > 0) {
        const timer = setTimeout(() => {
          setCurrentStep(index);
        }, totalElapsed);
        timers.push(timer);
      }
      totalElapsed += step.duration;
    });

    // Show success state
    const successTimer = setTimeout(() => {
      setShowSuccess(true);
      // Trigger CSAT after success
      triggerCSAT();
    }, totalElapsed);
    timers.push(successTimer);

    // Complete after success animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, totalElapsed + 1000);
    timers.push(completeTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isValidating, onComplete, triggerCSAT]);

  if (!isValidating) {
    return (
      <CSATPanel
        open={showCSAT}
        onOpenChange={closeCSAT}
        contentType={contentType}
        contentId={contentId}
        contentName={contentName}
      />
    );
  }

  const CurrentIcon = showSuccess ? CheckCircle2 : STEPS[currentStep].icon;
  const currentText = showSuccess ? "Analyse terminée !" : STEPS[currentStep].text;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-2xl max-w-md mx-4"
        >
          <div className="flex flex-col items-center space-y-6">
            {/* Animated Icon */}
            <motion.div
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`p-6 rounded-full ${
                showSuccess 
                  ? "bg-green-100 text-green-600" 
                  : "bg-primary/10 text-primary"
              }`}
            >
              <CurrentIcon className="h-12 w-12" />
            </motion.div>

            {/* Text */}
            <motion.p
              key={currentText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-medium text-center"
            >
              {currentText}
            </motion.p>

            {/* Progress Dots */}
            {!showSuccess && (
              <div className="flex gap-2">
                {STEPS.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      index <= currentStep ? "bg-primary" : "bg-muted"
                    }`}
                    animate={index === currentStep ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  />
                ))}
              </div>
            )}

            {/* Success Sparkles */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex gap-2"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 0 }}
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.8, 
                      delay: i * 0.2 
                    }}
                  >
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
