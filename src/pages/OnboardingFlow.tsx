import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";
import { OnboardingStepBar } from "@/components/onboarding-flow/OnboardingStepBar";
import { StepAtlas } from "@/components/onboarding-flow/StepAtlas";
import { StepAuditPanorama } from "@/components/onboarding-flow/StepAuditPanorama";
import { StepRiskProfile } from "@/components/onboarding-flow/StepRiskProfile";
import { StepHorizon } from "@/components/onboarding-flow/StepHorizon";
import { StepVega } from "@/components/onboarding-flow/StepVega";

const STEPS = [
  { id: 1, label: "Situation fiscale", key: "atlas" },
  { id: 2, label: "Profil patrimonial", key: "audit" },
  { id: 3, label: "Profil de risque", key: "risk" },
  { id: 4, label: "Projets & Épargne", key: "horizon" },
  { id: 5, label: "Actionnariat", key: "vega" },
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
    if (nextStep > 5) updates.onboarding_completed = true;

    await supabase.from("profiles").update(updates).eq("id", user!.id);

    if (nextStep > 5) {
      navigate("/panorama?welcome=true");
    } else {
      setCurrentStep(nextStep);
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
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-12">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          MyFinCare
        </span>
      </div>

      {/* Stepper */}
      <OnboardingStepBar steps={STEPS} currentStep={currentStep} />

      {/* Step content */}
      <div className="w-full max-w-2xl mt-8 pb-16">
        {currentStep === 1 && (
          <StepAtlas
            onNext={() => advanceStep(2, "atlas_completed")}
            onSkip={() => advanceStep(2)}
          />
        )}
        {currentStep === 2 && (
          <StepAuditPanorama
            onNext={() => advanceStep(3, "audit_panorama_completed")}
            onSkip={() => advanceStep(3)}
          />
        )}
        {currentStep === 3 && (
          <StepRiskProfile
            onNext={() => advanceStep(4, "risk_profile_completed")}
            onSkip={() => advanceStep(4)}
          />
        )}
        {currentStep === 4 && (
          <StepHorizon
            onNext={() => advanceStep(5, "horizon_completed")}
            onSkip={() => advanceStep(5)}
          />
        )}
        {currentStep === 5 && (
          <StepVega
            onNext={() => advanceStep(6)}
            onSkip={() => advanceStep(6)}
          />
        )}
      </div>
    </div>
  );
}
