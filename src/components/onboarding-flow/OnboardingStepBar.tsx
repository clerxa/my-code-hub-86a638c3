import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Step {
  id: number;
  label: string;
  key: string;
  emoji?: string;
}

interface OnboardingStepBarProps {
  steps: Step[];
  currentStep: number;
}

export function OnboardingStepBar({ steps, currentStep }: OnboardingStepBarProps) {
  return (
    <div className="w-full max-w-xl mx-auto px-2">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: step.id === currentStep ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "relative w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300",
                  step.id < currentStep
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : step.id === currentStep
                    ? "text-white shadow-lg shadow-primary/30 border-0"
                    : "bg-white/5 text-white/30 border border-white/10"
                )}
                style={step.id === currentStep ? { background: "var(--gradient-hero)" } : undefined}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : step.id === currentStep ? (
                  <span className="text-base">{step.emoji || step.id}</span>
                ) : (
                  <span className="text-sm">{step.id}</span>
                )}
                {step.id === currentStep && (
                  <motion.div
                    layoutId="step-glow"
                    className="absolute -inset-1 rounded-xl border-2 border-primary/30"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  "mt-2 text-[10px] md:text-xs text-center whitespace-nowrap leading-tight font-medium",
                  step.id < currentStep
                    ? "text-primary/60"
                    : step.id === currentStep
                    ? "text-white"
                    : "text-white/25"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 mx-2 md:mx-3 relative">
                <div className="h-[2px] w-full rounded-full bg-white/5" />
                <motion.div
                  initial={false}
                  animate={{ width: step.id < currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute top-0 left-0 h-[2px] rounded-full"
                  style={{ background: "var(--gradient-hero)" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
