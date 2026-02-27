/**
 * Écran d'introduction pédagogique RSU — affiché une fois par session
 */

import { motion } from 'framer-motion';
import { BookOpen, Calendar, Scale, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BLOCKS = [
  {
    icon: BookOpen,
    title: "Qu'est-ce qu'une RSU ?",
    text: "Une RSU (Restricted Stock Unit) est une promesse de votre employeur de vous remettre gratuitement des actions de l'entreprise à une date future. Vous ne possédez rien au moment de l'attribution — les actions vous sont remises progressivement selon un calendrier appelé vesting.",
  },
  {
    icon: Calendar,
    title: 'Le vesting, c\'est quoi ?',
    text: "Le vesting est le processus par lequel vous acquérez définitivement vos actions au fil du temps. Par exemple, sur un plan de 4 ans trimestriel, vous recevez 1/16e de vos actions tous les 3 mois. C'est à chaque date de vesting que la valeur des actions reçues constitue un gain imposable.",
  },
  {
    icon: Scale,
    title: "Pourquoi c'est important fiscalement ?",
    text: "En France, la fiscalité des RSU dépend du type de plan (qualifié ou non qualifié) et de la date d'autorisation par l'assemblée générale. Un plan qualifié bénéficie d'un régime de faveur — notamment un abattement de 50 % sur les premiers 300 000 € de gain. Un plan non qualifié est imposé comme un salaire dès le vesting, sans avantage fiscal.",
  },
  {
    icon: Calculator,
    title: 'Ce que fait ce simulateur',
    text: "Ce simulateur calcule votre imposition estimée au moment où vous vendez vos actions, en tenant compte de tous vos plans, de l'historique de vos vestings, et des taux de change si vos actions sont cotées en dollars. Il pré-remplit automatiquement les cours via des données de marché officielles.",
  },
];

interface RSUIntroScreenProps {
  onStart: () => void;
}

export function RSUIntroScreen({ onStart }: RSUIntroScreenProps) {
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
          Simulateur RSU
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Estimez l'impact fiscal de la cession de vos actions gratuites
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

      <p className="text-xs text-muted-foreground text-center italic leading-relaxed max-w-2xl mx-auto">
        Ce simulateur est fourni à titre indicatif uniquement. Il ne remplace pas l'avis d'un expert fiscal. Les résultats sont des estimations basées sur les données saisies.
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
