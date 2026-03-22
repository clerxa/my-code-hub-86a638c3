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
                  "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all",
                  step.id < currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "hidden lg:block mt-2 text-[10px] md:text-xs text-center whitespace-nowrap",
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
              <div className="flex-1 mx-1 md:mx-2">
                <div
                  className={cn(
                    "h-0.5 w-full rounded transition-colors",
                    step.id < currentStep ? "bg-primary" : "bg-muted"
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
