import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, Target, TrendingUp, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STEPS = [
  {
    step: 1,
    icon: PiggyBank,
    title: 'La règle 50 / 30 / 20',
    subtitle: 'Le cadre de référence',
    description:
      "Popularisée par la sénatrice américaine Elizabeth Warren, cette règle propose de répartir vos revenus nets en trois grandes catégories : 50 % pour les besoins essentiels (logement, transport, assurances…), 30 % pour les envies (loisirs, shopping, sorties…), et 20 % pour l'épargne et le remboursement de dettes.",
    tip: "Ce n'est pas une règle absolue — c'est un point de départ pour prendre conscience de la structure de vos dépenses.",
    visual: (
      <div className="flex items-end gap-2 justify-center h-24">
        {[
          { pct: 50, label: '50%', sublabel: 'Besoins', color: 'bg-primary' },
          { pct: 30, label: '30%', sublabel: 'Envies', color: 'bg-secondary' },
          { pct: 20, label: '20%', sublabel: 'Épargne', color: 'bg-accent' },
        ].map((bar) => (
          <div key={bar.label} className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-foreground">{bar.label}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${bar.pct * 1.5}px` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`w-16 rounded-t-lg ${bar.color}`}
            />
            <span className="text-[10px] text-muted-foreground">{bar.sublabel}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: 2,
    icon: Target,
    title: 'Comment ça marche ?',
    subtitle: 'Un parcours simple en 2 temps',
    description:
      "Vous renseignez d'abord vos revenus mensuels nets. Ensuite, vous détaillez l'ensemble de vos dépenses — charges fixes, crédits, impôts, loisirs — en un seul écran. Le simulateur calcule alors automatiquement votre capacité d'épargne réelle.",
    tip: "Si vous avez renseigné votre profil financier, vos données seront pré-remplies automatiquement.",
    visual: (
      <div className="flex items-center justify-center gap-3">
        {['Revenus', 'Dépenses'].map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2, type: 'spring' }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary">
                {i + 1}
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </motion.div>
            {i < 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/50 mt-[-16px]" />}
          </div>
        ))}
        <div className="flex items-center gap-3">
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 mt-[-16px]" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-lg font-bold text-emerald-600">
              =
            </div>
            <span className="text-xs text-muted-foreground">Épargne</span>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    step: 3,
    icon: TrendingUp,
    title: 'Votre bilan personnalisé',
    subtitle: 'Des résultats actionnables',
    description:
      "À l'issue de la simulation, vous obtenez un bilan complet : la répartition réelle de votre budget comparée à la cible 50/30/20, votre solde disponible, et des recommandations personnalisées. Vous pourrez enregistrer le résultat directement dans votre profil financier.",
    tip: 'Ce simulateur est 100% confidentiel — vous pouvez l\'utiliser librement et recommencer autant de fois que nécessaire.',
    visual: (
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Score budget', value: '85%', color: 'text-accent' },
            { label: 'Solde', value: '+320 €', color: 'text-emerald-500' },
            { label: 'Épargne', value: '18%', color: 'text-primary' },
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

interface CapaciteEpargneIntroScreenProps {
  onStart: () => void;
}

export function CapaciteEpargneIntroScreen({ onStart }: CapaciteEpargneIntroScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mx-auto">
          <PiggyBank className="h-4 w-4" />
          Simulateur
        </div>
        <h1 className="text-4xl font-bold hero-gradient">Capacité d'Épargne</h1>
        <p className="text-sm text-muted-foreground">Découvrez votre potentiel de liberté financière</p>
      </motion.div>

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
              <p className="text-sm font-medium text-primary/80">{step.subtitle}</p>
              <div className="py-2">{step.visual}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
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
            Lancer ma simulation
          </Button>
        ) : (
          <Button onClick={() => setCurrentStep((p) => p + 1)} className="gap-2">
            Suivant <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={onStart}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Passer l'introduction
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center italic leading-relaxed max-w-2xl mx-auto">
        Ce simulateur est pédagogique. Les résultats sont indicatifs et ne constituent pas un conseil financier personnalisé.
      </p>
    </div>
  );
}
