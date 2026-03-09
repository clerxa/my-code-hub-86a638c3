import { motion } from "framer-motion";
import { PiggyBank, TrendingUp, Home, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { BudgetSimulator } from "@/components/simulators/BudgetSimulator";

const pedagogyCards = [
  {
    icon: Home,
    title: "Les charges fixes en premier",
    description: "Logement, transport, assurances : identifiez ce qui est incompressible.",
  },
  {
    icon: ShoppingCart,
    title: "Réduire sans se priver",
    description: "Les dépenses compressibles sont votre principal levier d'optimisation.",
  },
  {
    icon: PiggyBank,
    title: "Payer son futur d'abord",
    description: "L'épargne n'est pas ce qui reste — c'est ce que vous décidez de mettre de côté.",
  },
];

export default function BudgetPage() {
  return (
    <EmployeeLayout activeSection="budget">
      <div className="space-y-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mx-auto">
            <PiggyBank className="h-4 w-4" />
            Module Zenith
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="hero-gradient">ZENITH</span>
            <span className="block text-lg md:text-xl font-normal text-muted-foreground mt-2">by FinCare</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Prenez de la hauteur sur vos finances
          </p>
        </motion.div>

        {/* Impact stat banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 p-5">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm md:text-base text-foreground">
                La règle 50/30/20 permet d'épargner <strong className="text-accent">20% de ses revenus nets</strong> dès le premier mois
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3 cartes pédagogiques */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {pedagogyCards.map((card, i) => (
              <Card key={i} className="bg-card/60 border-border/40 backdrop-blur-sm">
                <CardContent className="pt-6 pb-5 px-5 space-y-3 text-center">
                  <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{card.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Simulateur */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="space-y-6"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground">
            Lancez votre simulation
          </h2>
          <BudgetSimulator />
        </motion.div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <div className="rounded-xl bg-muted/30 p-5 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Budget</strong> est un simulateur pédagogique. Les résultats sont indicatifs et ne constituent pas un conseil financier personnalisé.
            </p>
          </div>
        </motion.div>
      </div>
    </EmployeeLayout>
  );
}
