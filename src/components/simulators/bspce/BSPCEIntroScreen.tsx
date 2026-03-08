import { motion } from 'framer-motion';
import { BookOpen, Zap, Scale, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BLOCKS = [
  {
    icon: BookOpen,
    title: "Qu'est-ce qu'un BSPCE ?",
    text: "Un BSPCE (Bon de Souscription de Parts de Créateur d'Entreprise) est un dispositif réservé aux startups françaises qui permet aux salariés et dirigeants d'acheter des actions de leur entreprise à un prix fixé à l'avance — généralement très inférieur à la valeur future espérée. Contrairement aux RSU, vous ne recevez pas d'actions gratuitement : vous avez le droit d'en acheter à un prix avantageux.",
  },
  {
    icon: Zap,
    title: 'Comment ça fonctionne ?',
    text: "À l'attribution, on vous fixe un prix d'exercice (ex. 1€ par action) correspondant à la valeur de la société au moment de l'émission. Lorsque vous décidez d'exercer vos BSPCE, vous achetez les actions à ce prix. Vous les revendez ensuite lors d'un événement de liquidité (levée de fonds, acquisition, introduction en bourse). Votre gain est la différence entre le prix de cession et le prix d'exercice.",
  },
  {
    icon: Scale,
    title: 'La règle des 3 ans — fondamentale',
    text: "La fiscalité de vos BSPCE dépend d'un critère unique : votre ancienneté dans la société à la date de cession. Plus de 3 ans → taux forfaitaire de 30% (12,8% IR + 17,2% prélèvements sociaux). Moins de 3 ans → barème progressif de l'impôt sur le revenu + 17,2% de prélèvements sociaux. L'écart peut représenter plusieurs dizaines de milliers d'euros sur un même gain.",
  },
  {
    icon: Calculator,
    title: 'Ce que fait ce simulateur',
    text: "Ce simulateur vous permet soit de projeter votre gain selon différents scénarios de valorisation future, soit de calculer précisément votre imposition si vous avez déjà décidé d'exercer vos BSPCE.",
  },
];

interface BSPCEIntroScreenProps {
  onStart: () => void;
}

export function BSPCEIntroScreen({ onStart }: BSPCEIntroScreenProps) {
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
          Simulateur BSPCE
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Projetez vos gains et calculez l'imposition de vos BSPCE
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
