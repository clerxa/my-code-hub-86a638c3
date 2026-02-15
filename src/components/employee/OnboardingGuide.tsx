import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Sparkles, BookOpen, Calculator, User, Calendar, Compass, ChevronRight, ChevronLeft, X, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  highlight?: string; // CSS selector or data-coach attribute
}

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bienvenue sur FinCare ! 🎉",
    description: "Votre plateforme de bien-être financier personnalisée. Découvrons ensemble les fonctionnalités clés pour vous aider à prendre les meilleures décisions financières.",
    icon: Sparkles,
  },
  {
    id: "modules",
    title: "Parcours de formation",
    description: "Accédez à des modules éducatifs sur l'épargne, la fiscalité, l'investissement et bien plus. Complétez-les pour gagner des points et progresser !",
    icon: BookOpen,
    highlight: "parcours",
  },
  {
    id: "simulators",
    title: "Simulateurs financiers",
    description: "Simulez votre capacité d'emprunt, votre épargne de précaution, optimisez votre fiscalité… Des outils puissants pour éclairer vos choix.",
    icon: Calculator,
    highlight: "simulations",
  },
  {
    id: "profile",
    title: "Votre profil financier",
    description: "Complétez votre profil pour recevoir des recommandations personnalisées adaptées à votre situation. Plus votre profil est complet, plus les conseils sont pertinents.",
    icon: User,
    highlight: "profile",
  },
  {
    id: "expert",
    title: "Rendez-vous expert",
    description: "Prenez rendez-vous avec un conseiller financier certifié pour un accompagnement personnalisé et gratuit dans le cadre de votre entreprise.",
    icon: Calendar,
    highlight: "appointments",
  },
  {
    id: "horizon",
    title: "Horizon — Votre stratégie",
    description: "Planifiez vos projets patrimoniaux, définissez vos objectifs et visualisez votre stratégie d'épargne globale avec notre outil de planification avancé.",
    icon: Compass,
    highlight: "horizon",
  },
];

interface OnboardingGuideProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export function OnboardingGuide({ forceShow = false, onClose }: OnboardingGuideProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Handle forceShow changes (replay button)
  useEffect(() => {
    if (forceShow) {
      setOpen(true);
      setCurrentStep(0);
    }
  }, [forceShow]);

  // Auto-show on first login
  useEffect(() => {
    if (!user?.id || forceShow) {
      setLoaded(true);
      return;
    }

    const checkGuide = async () => {
      const { data } = await supabase
        .from("user_onboarding_guide" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        setOpen(true);
        setCurrentStep(0);
        await supabase.from("user_onboarding_guide" as any).insert({ user_id: user.id, current_step: 0 });
      }
      setLoaded(true);
    };

    checkGuide();
  }, [user?.id, forceShow]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    if (user?.id) {
      await supabase
        .from("user_onboarding_guide" as any)
        .update({ completed_at: new Date().toISOString(), dismissed: true, current_step: STEPS.length } as any)
        .eq("user_id", user.id);
    }
    setOpen(false);
    onClose?.();
  }, [user?.id, onClose]);

  const handleDismiss = useCallback(async () => {
    if (user?.id) {
      await supabase
        .from("user_onboarding_guide" as any)
        .update({ dismissed: true, current_step: currentStep } as any)
        .eq("user_id", user.id);
    }
    setOpen(false);
    onClose?.();
  }, [user?.id, currentStep, onClose]);

  if (!loaded) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground font-medium">
              {currentStep + 1} / {STEPS.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground hover:text-foreground -mr-2">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="text-left">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <StepIcon className="h-8 w-8 text-primary" />
                </div>
                <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
                <DialogDescription className="text-center text-base mt-2 leading-relaxed">
                  {step.description}
                </DialogDescription>
              </DialogHeader>
            </motion.div>
          </AnimatePresence>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === currentStep ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
            )}
            <div className="flex-1" />
            {isLast ? (
              <Button onClick={handleComplete} className="gap-2">
                <PartyPopper className="h-4 w-4" />
                C'est parti !
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
