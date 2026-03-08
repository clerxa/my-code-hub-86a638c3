/**
 * Écran d'introduction pédagogique — Optimisation Fiscale
 * 4 blocs : Définition, Mécanismes, Plafond, Ce que fait le simulateur
 */

import { motion } from 'framer-motion';
import { BookOpen, Layers, ShieldAlert, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BLOCKS = [
  {
    icon: BookOpen,
    title: "Qu'est-ce que l'optimisation fiscale ?",
    text: "L'optimisation fiscale consiste à utiliser les dispositifs prévus par la loi pour réduire légalement le montant de votre impôt sur le revenu. Ce n'est ni de la fraude, ni de l'évasion fiscale : ce sont des mécanismes créés par l'État pour encourager certains comportements (épargne retraite, dons, investissement locatif, soutien aux PME…).",
  },
  {
    icon: Layers,
    title: 'Les 3 mécanismes fiscaux',
    text: "Il existe trois types de leviers. La déduction (ex : PER) réduit votre revenu imposable — plus votre TMI est élevé, plus l'avantage est important. La réduction d'impôt (ex : Pinel, dons) diminue directement le montant d'impôt dû. Le crédit d'impôt (ex : emploi à domicile) fonctionne comme une réduction, mais vous est remboursé si son montant dépasse votre impôt.",
  },
  {
    icon: ShieldAlert,
    title: 'Le plafond des niches fiscales',
    text: "La plupart des avantages fiscaux sont soumis à un plafond global de 10 000 € par an (18 000 € pour les investissements Outre-mer). Au-delà, les réductions excédentaires sont perdues. Attention : certains dispositifs comme le PER (déduction) et les dons aux associations à 75 % échappent à ce plafond — un point essentiel pour votre stratégie.",
  },
  {
    icon: Calculator,
    title: 'Ce que fait ce simulateur',
    text: "Ce simulateur calcule l'impact réel de chaque dispositif sur votre impôt, en tenant compte de votre situation familiale, de votre TMI, et du plafonnement des niches fiscales. Il vous permet de tester différentes combinaisons pour trouver la stratégie la plus efficace.",
  },
];

interface OptimisationIntroScreenProps {
  onStart: () => void;
}

export function OptimisationIntroScreen({ onStart }: OptimisationIntroScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold hero-gradient mb-3"
        >
          Optimisation fiscale
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Simulez l'impact des dispositifs légaux sur votre impôt
        </motion.p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {BLOCKS.map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <block.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base">{block.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{block.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mini schéma visuel des 3 mécanismes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-sm mb-4 text-center">Comment les 3 mécanismes réduisent votre impôt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center space-y-2 p-3 rounded-lg bg-background/80">
                <div className="text-2xl">📉</div>
                <p className="font-semibold text-sm">Déduction</p>
                <p className="text-xs text-muted-foreground">Réduit le <strong>revenu imposable</strong></p>
                <p className="text-xs text-muted-foreground italic">Ex : 5 000 € sur PER à TMI 30 % → 1 500 € d'économie</p>
              </div>
              <div className="text-center space-y-2 p-3 rounded-lg bg-background/80">
                <div className="text-2xl">🔻</div>
                <p className="font-semibold text-sm">Réduction</p>
                <p className="text-xs text-muted-foreground">Réduit le <strong>montant d'impôt</strong></p>
                <p className="text-xs text-muted-foreground italic">Ex : 1 000 € de don → 750 € en moins d'impôt</p>
              </div>
              <div className="text-center space-y-2 p-3 rounded-lg bg-background/80">
                <div className="text-2xl">💰</div>
                <p className="font-semibold text-sm">Crédit d'impôt</p>
                <p className="text-xs text-muted-foreground">Comme la réduction, mais <strong>remboursable</strong></p>
                <p className="text-xs text-muted-foreground italic">Ex : 6 000 € d'aide à domicile → 3 000 € récupérés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <p className="text-xs text-muted-foreground text-center italic leading-relaxed max-w-2xl mx-auto">
        Ce simulateur est fourni à titre indicatif uniquement. Il ne remplace pas l'avis d'un conseiller fiscal.
        Les résultats sont des estimations basées sur la réglementation en vigueur et les données saisies.
      </p>

      <div className="flex flex-col items-center gap-2 pt-2">
        <Button onClick={onStart} size="lg" className="gap-2">
          Je comprends, commencer ma simulation →
        </Button>
        <button
          onClick={onStart}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Passer l'introduction
        </button>
      </div>
    </motion.div>
  );
}
