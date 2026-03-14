import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  FileSearch,
  Brain,
  TrendingUp,
  Shield,
  BarChart3,
  Calculator,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TaxNoticeAnalysisOverlayProps {
  isAnalyzing: boolean;
  apiDone: boolean;
  onComplete: () => void;
}

const ANALYSIS_STEPS = [
  { icon: FileSearch, text: "Lecture de votre avis d'imposition…", duration: 3000 },
  { icon: BarChart3, text: "Extraction de vos revenus déclarés…", duration: 3500 },
  { icon: Calculator, text: "Reconstitution du calcul par tranches…", duration: 4000 },
  { icon: Shield, text: "Vérification du prélèvement à la source…", duration: 3500 },
  { icon: TrendingUp, text: "Identification des pistes d'optimisation…", duration: 4000 },
  { icon: Brain, text: "Rédaction de vos explications personnalisées…", duration: 4000 },
];

const WAITING_MESSAGES = [
  "Analyse approfondie des tranches d'imposition…",
  "Vérification croisée des montants déclarés…",
  "Détection des réductions et crédits d'impôt…",
  "Calcul de votre taux moyen réel…",
  "Finalisation de votre analyse fiscale…",
  "Presque terminé, patience…",
];

export function TaxNoticeAnalysisOverlay({
  isAnalyzing,
  apiDone,
  onComplete,
}: TaxNoticeAnalysisOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [visible, setVisible] = useState(false);
  const [waitingMessageIndex, setWaitingMessageIndex] = useState(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const steps = ANALYSIS_STEPS;
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  // Start animation
  useEffect(() => {
    if (isAnalyzing) {
      setVisible(true);
      setShowSuccess(false);
      setCurrentStep(0);
      setProgressValue(0);
      setWaitingMessageIndex(0);
      startTimeRef.current = Date.now();
    }
  }, [isAnalyzing]);

  // Animation loop
  useEffect(() => {
    if (!visible || showSuccess) return;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const fraction = Math.min(elapsed / totalDuration, 1);

      if (apiDone) {
        setProgressValue((prev) => Math.min(100, prev + 3));
      } else if (fraction < 1) {
        setProgressValue(fraction * 70);
      } else {
        const extraTime = elapsed - totalDuration;
        const crawl = 70 + 27 * (1 - 1 / (1 + extraTime / 30000));
        setProgressValue(crawl);
      }

      let accumulated = 0;
      let foundStep = false;
      for (let i = 0; i < steps.length; i++) {
        accumulated += steps[i].duration;
        if (elapsed < accumulated) {
          setCurrentStep(i);
          foundStep = true;
          break;
        }
      }
      if (!foundStep) {
        setCurrentStep(steps.length - 1);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, showSuccess, apiDone, steps, totalDuration]);

  // Cycle waiting messages
  useEffect(() => {
    if (!visible || showSuccess || apiDone) {
      if (waitingIntervalRef.current) {
        clearInterval(waitingIntervalRef.current);
        waitingIntervalRef.current = null;
      }
      return;
    }

    waitingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > totalDuration) {
        setWaitingMessageIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
      }
    }, 4000);

    return () => {
      if (waitingIntervalRef.current) clearInterval(waitingIntervalRef.current);
    };
  }, [visible, showSuccess, apiDone, totalDuration]);

  // Complete when progress hits 100
  useEffect(() => {
    if (progressValue >= 99 && apiDone && !showSuccess) {
      setShowSuccess(true);
      completionTimerRef.current = setTimeout(() => {
        setVisible(false);
        onCompleteRef.current();
      }, 1200);
    }
  }, [progressValue, apiDone, showSuccess]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      if (waitingIntervalRef.current) clearInterval(waitingIntervalRef.current);
    };
  }, []);

  if (!visible) return null;

  const elapsed = Date.now() - startTimeRef.current;
  const isPastSteps = elapsed > totalDuration && !apiDone;

  const CurrentIcon = showSuccess
    ? CheckCircle2
    : isPastSteps
    ? steps[steps.length - 1].icon
    : steps[currentStep]?.icon || FileSearch;

  const currentText = showSuccess
    ? "Votre analyse est prête !"
    : isPastSteps
    ? WAITING_MESSAGES[waitingMessageIndex]
    : steps[currentStep]?.text || "";

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
              key={showSuccess ? "success" : `step-${currentStep}-${waitingMessageIndex}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`p-5 rounded-full ${
                showSuccess
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {!showSuccess ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <CurrentIcon className="h-10 w-10" />
                </motion.div>
              ) : (
                <CurrentIcon className="h-10 w-10" />
              )}
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
                  Moteur de réflexion Fincare
                </p>
              )}
            </div>

            {/* Progress bar */}
            {!showSuccess && (
              <div className="w-full space-y-2">
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {isPastSteps
                      ? "Finalisation en cours…"
                      : `Étape ${currentStep + 1}/${steps.length}`}
                  </span>
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
                    animate={
                      index === currentStep || isPastSteps
                        ? { opacity: [0.5, 1, 0.5] }
                        : {}
                    }
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
                    <Sparkles className="h-5 w-5 text-amber-500" />
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
