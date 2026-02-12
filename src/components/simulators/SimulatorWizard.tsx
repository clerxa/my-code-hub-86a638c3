import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface SimulatorStep {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  content: ReactNode;
  isValid?: () => boolean;
}

export interface SimulatorWizardProps {
  steps: SimulatorStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onValidate: () => void;
  isValidating?: boolean;
  resultsContent?: ReactNode;
  showResults?: boolean;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backPath?: string;
  className?: string;
  /** Texte personnalisé pour le bouton de la première étape (au lieu de "Continuer") */
  firstStepButtonText?: string;
  /** Callback pour revenir du résultat vers la dernière étape du formulaire */
  onBackFromResults?: () => void;
}

/**
 * Composant Wizard unifié pour tous les simulateurs
 * Offre une expérience progressive et cohérente
 */
export function SimulatorWizard({
  steps,
  currentStep,
  onStepChange,
  onValidate,
  isValidating = false,
  resultsContent,
  showResults = false,
  title,
  subtitle,
  onBack,
  backPath,
  className,
  firstStepButtonText,
  onBackFromResults,
}: SimulatorWizardProps) {
  const navigate = useNavigate();
  const progress = showResults 
    ? 100 
    : ((currentStep + 1) / steps.length) * 100;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = currentStepData?.isValid ? currentStepData.isValid() : true;
  const StepIcon = currentStepData?.icon;

  const handleNext = () => {
    if (isLastStep) {
      onValidate();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    // Si on est sur les résultats, revenir à la dernière étape du formulaire
    if (showResults) {
      if (onBackFromResults) {
        onBackFromResults();
      } else {
        // Par défaut, revenir à la dernière étape
        onStepChange(steps.length - 1);
      }
      return;
    }
    
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    } else if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background via-background to-muted/20", className)}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header avec progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button type="button" variant="ghost" onClick={handlePrevious} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? "Retour" : "Précédent"}
            </Button>
            {!showResults && (
              <div className="text-sm text-muted-foreground">
                Étape {currentStep + 1} sur {steps.length}
              </div>
            )}
          </div>

          {/* Titre principal */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>

          {/* Barre de progression */}
          <div className="relative">
            <Progress value={progress} className="h-2" />
            
            {/* Steps indicators */}
            {!showResults && (
              <div className="flex justify-between mt-4">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => index < currentStep && onStepChange(index)}
                    disabled={index > currentStep}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all",
                      index < currentStep && "cursor-pointer",
                      index > currentStep && "opacity-40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-all",
                        index < currentStep && "bg-primary text-primary-foreground border-primary",
                        index === currentStep && "border-primary text-primary bg-primary/10",
                        index > currentStep && "border-muted text-muted-foreground"
                      )}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={cn(
                      "text-xs hidden md:block max-w-[80px] text-center",
                      index === currentStep ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenu animé */}
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {resultsContent}
            </motion.div>
          ) : (
            <motion.div
              key={currentStepData?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                {/* Step header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    {StepIcon && (
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <StepIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">{currentStepData?.title}</h2>
                      {currentStepData?.subtitle && (
                        <p className="text-sm text-muted-foreground">{currentStepData.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step content */}
                <div className="min-h-[200px]">
                  {currentStepData?.content}
                </div>

                {/* Navigation */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext || isValidating}
                    className="gap-2"
                    size="lg"
                  >
                    {isValidating ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Calcul en cours...
                      </>
                    ) : isLastStep ? (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Voir mes résultats
                      </>
                    ) : currentStep === 0 && firstStepButtonText ? (
                      <>
                        {firstStepButtonText}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continuer
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
