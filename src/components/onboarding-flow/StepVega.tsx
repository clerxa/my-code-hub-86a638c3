import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";

interface StepVegaProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepVega({ onNext, onSkip }: StepVegaProps) {
  const { saveProfile, isSaving } = useUserFinancialProfile();
  const [hasEquity, setHasEquity] = useState<"yes" | "no" | null>(null);
  const [plans, setPlans] = useState({
    has_rsu_aga: false,
    has_espp: false,
    has_stock_options: false,
    has_bspce: false,
  });

  const handleSubmit = () => {
    if (hasEquity === "no") {
      onNext();
      return;
    }
    const data: FinancialProfileInput = {
      has_rsu_aga: plans.has_rsu_aga,
      has_espp: plans.has_espp,
      has_stock_options: plans.has_stock_options,
      has_bspce: plans.has_bspce,
    };
    saveProfile(data, { onSuccess: () => onNext() });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Votre actionnariat salarié</CardTitle>
          <CardDescription>
            Avez-vous des RSU, stock-options, ESPP ou BSPCE ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Bénéficiez-vous d'un plan d'actionnariat salarié ?
            </Label>
            <RadioGroup
              value={hasEquity || ""}
              onValueChange={(v) => setHasEquity(v as "yes" | "no")}
              className="space-y-2"
            >
              {[
                { value: "yes", label: "Oui" },
                { value: "no", label: "Non" },
              ].map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    hasEquity === opt.value
                      ? "bg-primary/5 border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                  onClick={() => setHasEquity(opt.value as "yes" | "no")}
                >
                  <RadioGroupItem value={opt.value} id={`equity-${opt.value}`} />
                  <Label htmlFor={`equity-${opt.value}`} className="cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {hasEquity === "yes" && (
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <Label className="text-sm font-medium">Types de plans</Label>
              {[
                { key: "has_rsu_aga" as const, label: "RSU / AGA (Actions gratuites)" },
                { key: "has_espp" as const, label: "ESPP (Plan d'achat d'actions)" },
                { key: "has_stock_options" as const, label: "Stock-options" },
                { key: "has_bspce" as const, label: "BSPCE" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`plan-${key}`}
                    checked={plans[key]}
                    onCheckedChange={(c) =>
                      setPlans((prev) => ({ ...prev, [key]: !!c }))
                    }
                  />
                  <Label htmlFor={`plan-${key}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            📌 Vous pourrez configurer vos plans en détail dans le module VEGA.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={hasEquity === null || isSaving}
          className="gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Accéder à mon tableau de bord <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}
