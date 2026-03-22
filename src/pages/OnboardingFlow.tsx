import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Shield } from "lucide-react";
import { OnboardingStepBar } from "@/components/onboarding-flow/OnboardingStepBar";
import { StepBienvenue } from "@/components/onboarding-flow/StepBienvenue";
import { StepSituationPersonnelle } from "@/components/onboarding-flow/StepSituationPersonnelle";
import { StepSituationPro } from "@/components/onboarding-flow/StepSituationPro";
import { StepAtlas } from "@/components/onboarding-flow/StepAtlas";

const STEPS = [
  { id: 1, label: "Bienvenue", key: "bienvenue" },
  { id: 2, label: "Situation", key: "situation" },
  { id: 3, label: "Emploi", key: "professionnel" },
  { id: 4, label: "Fiscalité", key: "atlas" },
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
      setCurrentStep((data as any)?.onboarding_step || 1);
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
      navigate("/panorama?welcome=true");
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-8 md:pt-12">
      <div className="mb-6">
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          MyFinCare
        </span>
      </div>

      <OnboardingStepBar steps={STEPS} currentStep={currentStep} />

      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>Vos données sont chiffrées et confidentielles</span>
      </div>

      <div className="w-full max-w-2xl mt-6 pb-16">
        {currentStep === 1 && (
          <StepBienvenue onNext={() => advanceStep(2)} onSkip={() => advanceStep(2)} />
        )}
        {currentStep === 2 && (
          <StepSituationPersonnelle onNext={() => advanceStep(3)} onSkip={() => advanceStep(3)} onBack={goBack} />
        )}
        {currentStep === 3 && (
          <StepSituationPro onNext={() => advanceStep(4)} onSkip={() => advanceStep(4)} onBack={goBack} />
        )}
        {currentStep === 4 && (
          <StepAtlas onNext={() => advanceStep(5, "atlas_completed")} onSkip={() => advanceStep(5)} onBack={goBack} />
        )}
      </div>
    </div>
  );
}
