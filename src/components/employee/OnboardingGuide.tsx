import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  Sparkles, BookOpen, Calculator, User, Calendar, Compass, ChevronRight, ChevronLeft, X, PartyPopper,
  Heart, Star, Trophy, Target, Zap, Shield, TrendingUp, PiggyBank, Wallet, HandCoins, Landmark,
  Lightbulb, Gift, Award, Clock, Bell, Settings, Home, FileText, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, BookOpen, Calculator, User, Calendar, Compass,
  Heart, Star, Trophy, Target, Zap, Shield, TrendingUp, PiggyBank,
  Wallet, HandCoins, Landmark, Lightbulb, Gift, Award, Clock, Bell,
  Settings, Home, FileText, BarChart3,
};

// Fallback steps in case DB is empty
const FALLBACK_STEPS = [
  { id: "welcome", title: "Bienvenue sur FinCare ! 🎉", description: "Votre plateforme de bien-être financier personnalisée.", icon: "Sparkles" },
];

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export function OnboardingGuide({ forceShow = false, onClose }: { forceShow?: boolean; onClose?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoChecked, setAutoChecked] = useState(false);
  const [steps, setSteps] = useState<GuideStep[]>(FALLBACK_STEPS);

  // Fetch guide steps from DB
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const { data, error } = await supabase
          .from("onboarding_guide_steps" as any)
          .select("id, title, description, icon")
          .eq("is_active", true)
          .order("order_num");
        if (!error && data && (data as any[]).length > 0) {
          setSteps(data as unknown as GuideStep[]);
        }
      } catch (e) {
        console.error("Failed to fetch guide steps:", e);
      }
    };
    fetchSteps();
  }, []);

  // Auto-show on first login
  useEffect(() => {
    if (!user?.id || autoChecked) return;
    const check = async () => {
      const { data } = await supabase
        .from("user_onboarding_guide" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) {
        setOpen(true);
        await supabase.from("user_onboarding_guide" as any).insert({ user_id: user.id, current_step: 0 });
      }
      setAutoChecked(true);
    };
    check();
  }, [user?.id, autoChecked]);

  // Force show from "Revoir le guide" button
  useEffect(() => {
    if (forceShow) {
      setOpen(true);
      setCurrentStep(0);
    }
  }, [forceShow]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setCurrentStep(0);
    onClose?.();
  }, [onClose]);

  const handleComplete = useCallback(async () => {
    if (user?.id) {
      await supabase
        .from("user_onboarding_guide" as any)
        .update({ completed_at: new Date().toISOString(), dismissed: true, current_step: steps.length } as any)
        .eq("user_id", user.id);
    }
    handleClose();
  }, [user?.id, handleClose, steps.length]);

  const handleDismiss = useCallback(async () => {
    if (user?.id) {
      await supabase
        .from("user_onboarding_guide" as any)
        .update({ dismissed: true, current_step: currentStep } as any)
        .eq("user_id", user.id);
    }
    handleClose();
  }, [user?.id, currentStep, handleClose]);

  const step = steps[currentStep];
  if (!step) return null;

  const StepIcon = ICON_MAP[step.icon] || Sparkles;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground font-medium">
              {currentStep + 1} / {steps.length}
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

          <div className="flex items-center justify-center gap-1.5 mt-6 mb-6">
            {steps.map((_, i) => (
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

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} className="gap-2">
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
              <Button onClick={() => setCurrentStep(s => s + 1)} className="gap-2">
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
