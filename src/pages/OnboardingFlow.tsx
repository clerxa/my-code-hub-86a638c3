import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Shield } from "lucide-react";
import { OnboardingStepBar } from "@/components/onboarding-flow/OnboardingStepBar";
import { StepBienvenue } from "@/components/onboarding-flow/StepBienvenue";
import { StepAtlas } from "@/components/onboarding-flow/StepAtlas";
import { StepSituationPersonnelle } from "@/components/onboarding-flow/StepSituationPersonnelle";
import { StepSituationPro } from "@/components/onboarding-flow/StepSituationPro";
import { StepRevenus } from "@/components/onboarding-flow/StepRevenus";
import { StepCharges } from "@/components/onboarding-flow/StepCharges";
import { StepEpargne } from "@/components/onboarding-flow/StepEpargne";
import { StepRiskProfile } from "@/components/onboarding-flow/StepRiskProfile";

const STEPS = [
  { id: 1, label: "Bienvenue", key: "bienvenue" },
  { id: 2, label: "Fiscalité", key: "atlas" },
  { id: 3, label: "Situation", key: "situation" },
  { id: 4, label: "Emploi", key: "professionnel" },
  { id: 5, label: "Revenus", key: "revenus" },
  { id: 6, label: "Charges", key: "charges" },
  { id: 7, label: "Épargne", key: "epargne" },
  { id: 8, label: "Profil de risque", key: "risk" },
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
      {/* Logo with gradient */}
      <div className="mb-6">
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          MyFinCare
        </span>
      </div>

      {/* Stepper */}
      <OnboardingStepBar steps={STEPS} currentStep={currentStep} />

      {/* Trust badge */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>Vos données sont chiffrées et confidentielles</span>
      </div>

      {/* Step content */}
      <div className="w-full max-w-2xl mt-6 pb-16">
        {currentStep === 1 && (
          <StepBienvenue
            onNext={() => advanceStep(2)}
            onSkip={() => advanceStep(2)}
          />
        )}
        {currentStep === 2 && (
          <StepAtlas
            onNext={() => advanceStep(3, "atlas_completed")}
            onSkip={() => advanceStep(3)}
            onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <StepSituationPersonnelle
            onNext={() => advanceStep(4)}
            onSkip={() => advanceStep(4)}
            onBack={goBack}
          />
        )}
        {currentStep === 4 && (
          <StepSituationPro
            onNext={() => advanceStep(5)}
            onSkip={() => advanceStep(5)}
            onBack={goBack}
          />
        )}
        {currentStep === 5 && (
          <StepRevenus
            onNext={() => advanceStep(6)}
            onSkip={() => advanceStep(6)}
            onBack={goBack}
          />
        )}
        {currentStep === 6 && (
          <StepCharges
            onNext={() => advanceStep(7)}
            onSkip={() => advanceStep(7)}
            onBack={goBack}
          />
        )}
        {currentStep === 7 && (
          <StepEpargne
            onNext={() => advanceStep(8, "audit_panorama_completed")}
            onSkip={() => advanceStep(8)}
            onBack={goBack}
          />
        )}
        {currentStep === 8 && (
          <StepRiskProfile
            onNext={() => advanceStep(9, "risk_profile_completed")}
            onSkip={() => advanceStep(9)}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
