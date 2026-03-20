/**
 * Écran d'introduction pédagogique ESPP — affiché une fois par session
 */

import { motion } from 'framer-motion';
import { ShoppingCart, Percent, Scale, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BLOCKS = [
  {
    icon: ShoppingCart,
    title: "Qu'est-ce qu'un ESPP ?",
    text: "Un ESPP (Employee Stock Purchase Plan) est un plan d'épargne salariale qui vous permet d'acheter des actions de votre entreprise à prix réduit. Vous cotisez une partie de votre salaire sur une période définie, et à la fin de cette période votre entreprise utilise cette épargne pour acheter des actions en votre nom avec une décote.",
  },
  {
    icon: Percent,
    title: 'La décote — votre avantage immédiat',
    text: "La décote (ou rabais) est le pourcentage de réduction appliqué sur le prix d'achat. La plupart des plans Section 423 offrent jusqu'à 15% de décote sur le cours le plus bas entre le début et la fin de la période d'offre — ce qui signifie que vous achetez vos actions moins cher que le marché, avec un gain garanti dès l'achat.",
  },
  {
    icon: Scale,
    title: 'Comment ça se passe fiscalement en France ?',
    text: "En France, le gain ESPP se décompose en deux parties imposées séparément. Le rabais (la décote) est imposé comme un salaire au moment de l'achat — c'est le gain immédiat et certain. La plus-value de cession (si vous vendez vos actions plus cher que le prix d'achat) est imposée au moment de la vente, en principe au PFU de 30%.",
  },
  {
    icon: Calculator,
    title: 'Ce que fait ce simulateur',
    text: "Ce simulateur calcule votre imposition estimée sur vos ESPP en tenant compte du rabais, du cours de l'action aux dates clés, et du taux de change si votre entreprise est cotée en dollars.",
  },
];

interface ESPPIntroScreenProps {
  onStart: () => void;
}

export function ESPPIntroScreen({ onStart }: ESPPIntroScreenProps) {
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
          Mes plans ESPP
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Estimez la fiscalité de vos plans d'achat d'actions salariés
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
          Commencer ma simulation ESPP →
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
