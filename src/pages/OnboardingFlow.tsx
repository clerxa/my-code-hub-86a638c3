import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";
import { OnboardingStepBar } from "@/components/onboarding-flow/OnboardingStepBar";
import { StepBienvenue } from "@/components/onboarding-flow/StepBienvenue";
import { StepSituationPersonnelle } from "@/components/onboarding-flow/StepSituationPersonnelle";
import { StepSituationPro } from "@/components/onboarding-flow/StepSituationPro";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: 1, label: "Bienvenue", key: "bienvenue", emoji: "👋" },
  { id: 2, label: "Situation", key: "situation", emoji: "👤" },
  { id: 3, label: "Emploi", key: "professionnel", emoji: "💼" },
];

export default function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed, onboarding_step")
        .eq("id", user.id)
        .single();

      if ((data as any)?.onboarding_completed) {
        navigate("/employee", { replace: true });
        return;
      }
      const savedStep = (data as any)?.onboarding_step || 1;
      setCurrentStep(savedStep > STEPS.length ? 1 : savedStep);
      setLoading(false);
    };
    loadProgress();
  }, [user]);

  const advanceStep = async (nextStep: number, completionKey?: string) => {
    const updates: Record<string, any> = { onboarding_step: nextStep };
    if (completionKey) updates[completionKey] = true;
    if (nextStep > STEPS.length) updates.onboarding_completed = true;

    await supabase.from("profiles").update(updates).eq("id", user!.id);

    if (nextStep > STEPS.length) {
      // Send verification email then redirect to verify page
      try {
        await supabase.functions.invoke("send-verification-email");
      } catch (e) {
        console.error("Failed to send verification email:", e);
      }
      navigate("/verify-email");
    } else {
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220,25%,10%)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStepData = STEPS.find(s => s.id === currentStep);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(220 25% 8%) 0%, hsl(230 30% 14%) 50%, hsl(250 25% 12%) 100%)" }}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glowing orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsl(217 91% 60%) 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, hsl(271 81% 56%) 0%, transparent 70%)" }} />
        <div className="absolute top-[40%] right-[25%] w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, hsl(38 92% 50%) 0%, transparent 70%)" }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(hsl(217 91% 60%) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        
        {/* Decorative sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-16 left-[15%] text-primary/20 text-4xl"
        >✦</motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-32 right-[20%] text-secondary/20 text-3xl"
        >✦</motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-[30%] left-[8%] text-accent/20 text-2xl"
        >✧</motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center p-4 pt-8 md:pt-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            MyFinCare
          </span>
        </motion.div>

        {/* Step bar */}
        <OnboardingStepBar steps={STEPS} currentStep={currentStep} />

        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 mt-5 px-4 py-2 rounded-full border border-primary/10 bg-primary/5 backdrop-blur-sm"
        >
          <span className="text-xs text-primary/70">🔒 Vos données sont chiffrées et confidentielles</span>
        </motion.div>

        {/* Step content */}
        <div className="w-full max-w-2xl mt-8 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {currentStep === 1 && (
                <StepBienvenue onNext={() => advanceStep(2)} onSkip={() => advanceStep(2)} />
              )}
              {currentStep === 2 && (
                <StepSituationPersonnelle onNext={() => advanceStep(3)} onSkip={() => advanceStep(3)} onBack={goBack} />
              )}
              {currentStep === 3 && (
                <StepSituationPro onNext={() => advanceStep(4)} onSkip={() => advanceStep(4)} onBack={goBack} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
