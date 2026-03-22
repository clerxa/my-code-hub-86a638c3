import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import OcrAvisImposition from "@/components/OcrAvisImposition";
import { motion } from "framer-motion";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepAtlasProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function StepAtlas({ onNext, onSkip, onBack }: StepAtlasProps) {
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
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-hero)] shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Importez votre avis d'imposition</CardTitle>
              <CardDescription>
                Votre avis d'imposition contient votre revenu fiscal de référence et votre TMI — deux données essentielles pour calibrer toutes vos simulations fiscales et patrimoniales.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <OcrAvisImposition importOnly />
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 pt-2">
            🔒 Votre document est analysé de manière sécurisée et n'est jamais stocké.
          </p>
        </CardContent>
      </Card>

      <OnboardingNavButtons
        onNext={onNext}
        onSkip={onSkip}
        onBack={onBack}
        nextLabel="Terminer et accéder à mon tableau de bord"
      />
    </motion.div>
  );
}
