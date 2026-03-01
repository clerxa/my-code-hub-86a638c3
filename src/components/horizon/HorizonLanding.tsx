import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass,
  Target,
  Sparkles,
  ArrowRight,
  Shield,
  BarChart3,
  Scale,
  Home,
  Landmark,
  ShieldCheck,
  Rocket,
  HeartHandshake,
} from "lucide-react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface HorizonLandingProps {
  onStart: () => void;
  profileComplete: boolean;
}

const complexityPoints = [
  {
    icon: Target,
    title: "Chaque objectif a son propre horizon de temps",
    description: "Retraite dans 25 ans, achat immo dans 5 ans… les stratégies diffèrent radicalement.",
  },
  {
    icon: BarChart3,
    title: "Les solutions d'épargne ne sont pas toutes adaptées à votre profil",
    description: "PEA, assurance-vie, PER, SCPI… chaque enveloppe a ses règles et avantages fiscaux propres.",
  },
  {
    icon: Scale,
    title: "Arbitrer entre rendement et risque demande une vision globale",
    description: "Sans vue d'ensemble, il est impossible d'optimiser la répartition de votre épargne.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choisissez votre objectif",
    description: "Achat immobilier, retraite, épargne de précaution, projet de vie…",
  },
  {
    number: "02",
    title: "Définissez votre horizon",
    description: "Dans combien de temps souhaitez-vous l'atteindre ?",
  },
  {
    number: "03",
    title: "Découvrez les solutions",
    description: "Horizon vous propose les enveloppes et placements adaptés.",
  },
];

const objectifs = [
  {
    id: "immo",
    title: "Achat immobilier – Constituez votre apport au meilleur rythme",
    content: "Horizon calcule l'effort d'épargne mensuel nécessaire pour atteindre votre objectif d'apport, en tenant compte de votre horizon de temps et de votre profil de risque. L'outil propose les enveloppes les plus adaptées pour faire fructifier votre capital.",
    icon: Home,
  },
  {
    id: "retraite",
    title: "Retraite – Estimez le capital nécessaire et les solutions pour y arriver",
    content: "Simulez le montant à épargner chaque mois pour compléter vos revenus à la retraite. Horizon intègre les avantages fiscaux du PER et de l'assurance-vie pour optimiser votre stratégie long terme.",
    icon: Landmark,
  },
  {
    id: "precaution",
    title: "Épargne de précaution – Définissez votre matelas de sécurité idéal",
    content: "En fonction de vos charges fixes et de votre situation professionnelle, Horizon recommande le montant idéal à conserver en épargne disponible et le temps nécessaire pour l'atteindre.",
    icon: ShieldCheck,
  },
  {
    id: "projet",
    title: "Projet de vie – Financement d'études, voyage, création d'entreprise",
    content: "Quel que soit votre projet personnel, Horizon vous aide à structurer l'épargne nécessaire en définissant un plan réaliste adapté à vos moyens et à votre calendrier.",
    icon: Rocket,
  },
  {
    id: "transmission",
    title: "Transmission – Anticipez et optimisez la transmission de votre patrimoine",
    content: "Préparez la transmission de votre patrimoine en identifiant les meilleures enveloppes fiscales et en planifiant les donations au bon moment pour minimiser la fiscalité successorale.",
    icon: HeartHandshake,
  },
];

export function HorizonLanding({ onStart, profileComplete }: HorizonLandingProps) {
  const progressPercent = 76;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mx-auto">
          <Sparkles className="h-4 w-4" />
          Exclusif FinCare
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="hero-gradient">HORIZON</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Planifiez et suivez vos projets financiers
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
              <Compass className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm md:text-base text-foreground">
              <strong className="text-accent">85% des Français</strong> n'ont pas de plan d'épargne structuré pour atteindre leurs objectifs financiers
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pourquoi c'est difficile */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="space-y-6"
      >
        <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground">
          Pourquoi piloter son patrimoine est si difficile seul
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {complexityPoints.map((point, i) => (
            <Card key={i} className="bg-card/60 border-border/40 backdrop-blur-sm">
              <CardContent className="pt-6 pb-5 px-5 space-y-3 text-center">
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <point.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{point.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Simulated result preview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="max-w-lg mx-auto"
      >
        <Card className="overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardContent className="pt-5 pb-5 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Exemple de simulation — Achat immobilier dans 10 ans
            </p>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Objectif</p>
                <p className="text-2xl font-bold text-foreground">50 000 €</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">Effort mensuel recommandé</p>
                <p className="text-2xl font-bold text-primary">380 €/mois</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Aujourd'hui</span>
                <span className="text-primary font-medium">Projection à 10 ans</span>
                <span>50 000 €</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/70 italic text-center">
              Résultat indicatif selon un profil équilibré
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Comment ça marche — 3 étapes */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="space-y-6"
      >
        <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground">
          Comment fonctionne Horizon
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden sm:block absolute top-[2.75rem] left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 z-0" />

          {steps.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{step.number}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">{step.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA central */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="text-center space-y-3"
      >
        {profileComplete ? (
          <Button size="lg" onClick={onStart} className="gap-2 px-8 btn-hero-gradient text-base">
            Lancer ma simulation
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="space-y-3">
            <Button size="lg" disabled className="gap-2 px-8 opacity-60">
              Lancer ma simulation
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-accent flex items-center justify-center gap-1.5">
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

      {/* Objectifs accordion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="space-y-4 max-w-2xl mx-auto"
      >
        <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground">
          Quels objectifs puis-je simuler ?
        </h2>
        <Accordion type="multiple" className="space-y-2">
          {objectifs.map((o) => (
            <AccordionItem key={o.id} value={o.id} className="border border-border/40 rounded-lg bg-card/60 backdrop-blur-sm px-4 overflow-hidden">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary hover:no-underline py-4">
                <span className="flex items-center gap-2">
                  <o.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  {o.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                {o.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="bg-muted/30 border border-border/50 rounded-xl p-6 text-center space-y-2"
      >
        <p className="text-sm text-muted-foreground">
          <strong>HORIZON</strong> est un outil pédagogique de simulation patrimoniale.
          Il ne constitue ni un conseil en investissement, ni une recommandation personnalisée.
        </p>
      </motion.div>
    </div>
  );
}
