import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, FileSearch, Brain, TrendingUp, Shield, BarChart3, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Progress } from "@/components/ui/progress";

interface PayslipAnalysisOverlayProps {
  isAnalyzing: boolean;
  apiDone: boolean;
  onComplete: () => void;
  mode: "simple" | "advanced";
  hasEquity?: boolean;
}

const SIMPLE_STEPS = [
  { icon: FileSearch, text: "Lecture du bulletin de paie…", duration: 2500 },
  { icon: Layers, text: "Extraction des lignes de paie…", duration: 3000 },
  { icon: Brain, text: "Identification des éléments clés…", duration: 2500 },
  { icon: Sparkles, text: "Génération de l'analyse…", duration: 2000 },
];

const ADVANCED_STEPS = [
  { icon: FileSearch, text: "Relecture complète du bulletin…", duration: 3000 },
  { icon: BarChart3, text: "Décomposition brut → net…", duration: 4000 },
  { icon: Shield, text: "Vérification des cotisations…", duration: 3500 },
  { icon: TrendingUp, text: "Analyse des dispositifs equity…", duration: 4000 },
  { icon: Brain, text: "Calcul des optimisations fiscales…", duration: 3500 },
  { icon: Sparkles, text: "Rédaction des conseils personnalisés…", duration: 2000 },
];

const ADVANCED_NO_EQUITY_STEPS = [
  { icon: FileSearch, text: "Relecture complète du bulletin…", duration: 3000 },
  { icon: BarChart3, text: "Décomposition brut → net…", duration: 4000 },
  { icon: Shield, text: "Vérification des cotisations…", duration: 4000 },
  { icon: Brain, text: "Calcul des optimisations fiscales…", duration: 4000 },
  { icon: Sparkles, text: "Rédaction des conseils personnalisés…", duration: 2000 },
];

export function PayslipAnalysisOverlay({
  isAnalyzing,
  apiDone,
  onComplete,
  mode,
  hasEquity = false,
}: PayslipAnalysisOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [visible, setVisible] = useState(false);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = mode === "simple"
    ? SIMPLE_STEPS
    : hasEquity
      ? ADVANCED_STEPS
      : ADVANCED_NO_EQUITY_STEPS;

  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  // Start animation
  useEffect(() => {
    if (isAnalyzing) {
      setVisible(true);
      setShowSuccess(false);
      setCurrentStep(0);
      setProgressValue(0);
      startTimeRef.current = Date.now();
    }
  }, [isAnalyzing]);

  // Animation loop
  useEffect(() => {
    if (!visible || showSuccess) return;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const fraction = Math.min(elapsed / totalDuration, 1);

      // Progress: go to 80% over totalDuration, then slow crawl until API done
      let target: number;
      if (apiDone) {
        target = 100;
      } else if (fraction < 1) {
        target = fraction * 80;
      } else {
        // Slow crawl from 80 to 95 over extra time
        const extraTime = elapsed - totalDuration;
        target = 80 + Math.min(15, extraTime / 2000 * 5);
      }

      setProgressValue(prev => {
        if (apiDone) return Math.min(100, prev + 2.5);
        return target;
      });

      // Update current step
      let accumulated = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulated += steps[i].duration;
        if (elapsed < accumulated) {
          setCurrentStep(i);
          break;
        }
        if (i === steps.length - 1) setCurrentStep(i);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, showSuccess, apiDone, steps, totalDuration]);

  // Complete when progress hits 100
  useEffect(() => {
    if (progressValue >= 99 && apiDone && !showSuccess) {
      setShowSuccess(true);
      // Use ref-based timer so cleanup on re-render won't cancel it
      completionTimerRef.current = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 1200);
    }
  }, [progressValue, apiDone, showSuccess, onComplete]);

  // Safety net: if API is done but animation is stuck, force complete after 2s
  useEffect(() => {
    if (apiDone && visible && !showSuccess) {
      const safety = setTimeout(() => {
        setProgressValue(100);
      }, 2000);
      return () => clearTimeout(safety);
    }
  }, [apiDone, visible, showSuccess]);

  // Cleanup completion timer on unmount only
  useEffect(() => {
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  const CurrentIcon = showSuccess ? CheckCircle2 : steps[currentStep]?.icon || FileSearch;
  const currentText = showSuccess ? "Analyse terminée !" : steps[currentStep]?.text || "";

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
          className="bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-2xl max-w-md mx-4 w-full"
        >
          <div className="flex flex-col items-center space-y-6">
            {/* Animated Icon */}
            <motion.div
              key={showSuccess ? "success" : currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`p-5 rounded-full ${
                showSuccess
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <CurrentIcon className="h-10 w-10" />
            </motion.div>

            {/* Title */}
            <div className="text-center space-y-1">
              <motion.p
                key={currentText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base font-semibold text-foreground"
              >
                {currentText}
              </motion.p>
              {!showSuccess && (
                <p className="text-xs text-muted-foreground">
                  {mode === "simple" ? "Moteur d'analyse Fincare" : "Analyse approfondie Fincare"}
                </p>
              )}
            </div>

            {/* Progress bar */}
            {!showSuccess && (
              <div className="w-full space-y-2">
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Étape {currentStep + 1}/{steps.length}</span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
              </div>
            )}

            {/* Step dots */}
            {!showSuccess && (
              <div className="flex gap-1.5">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index < currentStep
                        ? "w-4 bg-primary"
                        : index === currentStep
                          ? "w-6 bg-primary"
                          : "w-1.5 bg-muted"
                    }`}
                    animate={index === currentStep ? { opacity: [0.6, 1, 0.6] } : {}}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                ))}
              </div>
            )}

            {/* Success sparkles */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex gap-2"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
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
