import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import OcrAvisImposition from "@/components/OcrAvisImposition";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Importez votre avis d'imposition</CardTitle>
              <CardDescription>
                MyFinCare analyse automatiquement votre situation fiscale pour personnaliser votre tableau de bord.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <OcrAvisImposition />
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 pt-2">
            🔒 Votre document est analysé de manière sécurisée et n'est jamais stocké.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button onClick={onNext} disabled={!canContinue} size="lg" className="gap-2 px-8 shadow-md">
          Continuer <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Enregistrer et compléter plus tard
        </button>
      </div>
    </motion.div>
  );
}
