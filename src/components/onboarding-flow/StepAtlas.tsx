import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import OcrAvisImposition from "@/components/OcrAvisImposition";

interface StepAtlasProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepAtlas({ onNext, onSkip }: StepAtlasProps) {
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanContinue(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Importez votre avis d'imposition</CardTitle>
          <CardDescription>
            MyFinCare analyse automatiquement votre situation fiscale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OcrAvisImposition />
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 pt-2">
            💡 Vos résultats seront disponibles une fois votre profil complété.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={onNext} disabled={!canContinue} className="gap-2">
          Continuer <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Passer cette étape — je le ferai plus tard
        </button>
      </div>
    </div>
  );
}
