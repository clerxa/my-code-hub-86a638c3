/**
 * Écran d'introduction pédagogique ATLAS — parcours en 3 étapes
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ScanSearch, Lightbulb, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';

const STEPS = [
  {
    step: 1,
    icon: FileText,
    title: "Votre avis d'imposition décrypté",
    subtitle: 'Comprendre chaque ligne de votre fiscalité',
    description:
      "Votre avis d'imposition contient une mine d'informations, mais il est souvent difficile à lire. ATLAS analyse automatiquement votre document et en extrait les données clés : revenus imposables, nombre de parts, tranches marginales, crédits et réductions d'impôts.",
    tip: "L'analyse est sécurisée et vos données sont protégées conformément à notre politique de confidentialité.",
    visual: (
      <div className="flex items-center justify-center gap-4">
        {[
          { label: 'Upload', icon: '📄' },
          { label: 'Analyse', icon: '🔍' },
          { label: 'Résultats', icon: '✅' },
        ].map((item, i) => (
          <div key={item.label} className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2, type: 'spring' }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-xl">
                {item.icon}
              </div>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </motion.div>
            {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground/50 mt-[-16px]" />}
          </div>
        ))}
      </div>
    ),
  },
  {
    step: 2,
    icon: ScanSearch,
    title: 'Un bilan fiscal complet',
    subtitle: "Visualisez votre situation en un coup d'oeil",
    description:
      "ATLAS génère un tableau de bord visuel de votre fiscalité : votre taux marginal d'imposition (TMI), la décomposition par tranche, les dispositifs de défiscalisation déjà utilisés, et votre plafond PER disponible. Chaque information est accompagnée d'explications claires et pédagogiques.",
    tip: "Le TMI est un indicateur essentiel pour prendre les bonnes décisions d'épargne et d'investissement — ATLAS le calcule automatiquement pour vous.",
    visual: (
      <div className="flex items-end gap-2 justify-center h-24">
        {[
          { pct: 11, label: '11%', color: 'bg-green-400' },
          { pct: 30, label: '30%', color: 'bg-primary' },
          { pct: 41, label: '41%', color: 'bg-orange-400' },
          { pct: 45, label: '45%', color: 'bg-destructive' },
        ].map((bar) => (
          <div key={bar.label} className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-foreground">{bar.label}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${bar.pct * 1.8}px` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`w-12 rounded-t-lg ${bar.color}`}
            />
            <span className="text-[10px] text-muted-foreground">Tranche</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: 3,
    icon: Lightbulb,
    title: "Des pistes d'optimisation concrètes",
    subtitle: "Passez de l'analyse à l'action",
    description:
      "Au-delà du diagnostic, ATLAS identifie les leviers d'optimisation adaptés à votre profil : versements PER pour réduire votre impôt, utilisation optimale de vos plafonds, et simulation en temps réel de l'impact fiscal de vos décisions. Un véritable copilote pour votre stratégie patrimoniale.",
    tip: "Si votre TMI est de 30% ou plus, ATLAS active automatiquement un simulateur PER pour visualiser les économies potentielles.",
    visual: (
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'TMI', value: '30%', color: 'text-primary' },
            { label: 'Plafond PER', value: '4 114 €', color: 'text-accent' },
            { label: 'Économie', value: '-1 234 €', color: 'text-green-400' },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-lg bg-muted/30">
              <p className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    ),
  },
];

interface AtlasIntroScreenProps {
  onStart: () => void;
}

export function AtlasIntroScreen({ onStart }: AtlasIntroScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mx-auto">
          <FileText className="h-4 w-4" />
          Module Atlas
        </div>
        <h1 className="text-4xl font-bold hero-gradient">ATLAS</h1>
        <p className="text-sm text-muted-foreground">by FinCare · Décryptez votre fiscalité, optimisez votre avenir</p>
      </motion.div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="pt-6 space-y-5">
              {/* Step badge + icon */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Partie {step.step} sur {STEPS.length}
                  </p>
                  <h2 className="text-lg font-bold text-foreground">{step.title}</h2>
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-sm font-medium text-primary/80">{step.subtitle}</p>

              {/* Visual */}
              <div className="py-2">{step.visual}</div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

              {/* Tip */}
              <div className="rounded-lg bg-accent/5 border border-accent/15 px-4 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <Sparkles className="h-3.5 w-3.5 inline-block mr-1.5 text-accent" />
                  {step.tip}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep((p) => p - 1)}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Précédent
        </Button>

        {isLast ? (
          <Button onClick={onStart} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Analyser mon avis d'imposition
          </Button>
        ) : (
          <Button onClick={() => setCurrentStep((p) => p + 1)} className="gap-2">
            Suivant <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Skip link */}
      <div className="text-center">
        <button
          onClick={onStart}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Passer l'introduction
        </button>
      </div>

      {/* Disclaimer */}
      <SimulatorDisclaimer />
    </div>
  );
}
