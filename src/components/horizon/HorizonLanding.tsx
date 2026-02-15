import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Target,
  PieChart,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Shield,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { motion } from "framer-motion";

interface HorizonLandingProps {
  onStart: () => void;
  profileComplete: boolean;
}

const steps = [
  {
    icon: Calculator,
    title: "Définissez votre budget",
    description: "Indiquez votre capital disponible et votre capacité d'épargne mensuelle.",
  },
  {
    icon: Target,
    title: "Créez vos projets",
    description: "Immobilier, retraite, études des enfants… Ajoutez vos objectifs de vie.",
  },
  {
    icon: Sparkles,
    title: "Ajustez automatiquement",
    description: "Le bouton magique calcule les versements optimaux pour atteindre chaque objectif.",
  },
  {
    icon: PieChart,
    title: "Visualisez votre stratégie",
    description: "Un dashboard complet agrège vos projets et projette votre patrimoine futur.",
  },
];

export function HorizonLanding({ onStart, profileComplete }: HorizonLandingProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
          <Compass className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          HORIZON, votre outil de simulation patrimoniale
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Planifiez votre avenir financier en quelques minutes. Définissez vos projets, simulez vos placements et
          construisez une stratégie d'épargne sur-mesure.
        </p>
        <Badge variant="secondary" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Simulation non contractuelle · Outil pédagogique
        </Badge>
      </motion.div>

      {/* Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {steps.map((step, i) => (
          <Card key={i} className="border-muted bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">Étape {i + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Highlights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ce que vous obtiendrez
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                "Vue consolidée de votre stratégie",
                "Projections basées sur les intérêts composés",
                "Répartition optimale par produit financier",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-center space-y-3"
      >
        {profileComplete ? (
          <Button size="lg" onClick={onStart} className="gap-2 px-8">
            Accéder à HORIZON
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="space-y-3">
            <Button size="lg" disabled className="gap-2 px-8 opacity-60">
              Accéder à HORIZON
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
              <Shield className="h-4 w-4" />
              Complétez votre profil financier pour accéder à cet outil.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/employee/profile")}
              className="gap-1"
            >
              Compléter mon profil
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
