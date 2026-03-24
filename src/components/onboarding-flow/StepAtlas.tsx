import { useState, useEffect } from "react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-4xl">📊</span>
        <h2 className="text-2xl font-bold text-white">Votre fiscalité</h2>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Importez votre avis d'imposition pour calibrer vos simulations. Vous retrouverez l'analyse détaillée dans le module <strong className="text-primary/70">ATLAS</strong> de l'application.
        </p>
      </div>

      {/* Upload card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-6 space-y-4"
      >
        <OcrAvisImposition importOnly />
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-white/30">🔒 Votre document est analysé de manière sécurisée et n'est jamais stocké.</span>
        </div>
      </motion.div>

      <OnboardingNavButtons
        onNext={onNext}
        onSkip={onSkip}
        onBack={onBack}
        nextLabel="Terminer et découvrir mon panorama"
      />
    </div>
  );
}
