import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  key: string;
}

interface OnboardingStepBarProps {
  steps: Step[];
  currentStep: number;
}

export function OnboardingStepBar({ steps, currentStep }: OnboardingStepBarProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-2">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-semibold transition-all duration-300",
                  step.id < currentStep
                    ? "bg-[image:var(--gradient-hero)] text-white shadow-md"
                    : step.id === currentStep
                    ? "bg-[image:var(--gradient-hero)] text-white ring-4 ring-primary/20 shadow-lg"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "hidden lg:block mt-1.5 text-[9px] md:text-[10px] text-center whitespace-nowrap leading-tight",
                  step.id <= currentStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 mx-0.5 md:mx-1.5">
                <div
                  className={cn(
                    "h-0.5 w-full rounded-full transition-all duration-500",
                    step.id < currentStep
                      ? "bg-[image:var(--gradient-hero)]"
                      : "bg-muted"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
