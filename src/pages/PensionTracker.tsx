import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Lock, FolderOpen, ClipboardList, Phone, AlertTriangle, Coins, Shield, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    id: 1,
    emoji: "🔐",
    icon: Lock,
    title: "Connexion à votre compte retraite",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Rendez-vous sur <strong>www.info-retraite.fr</strong> et cliquez sur « J'accède à mon compte retraite ».
          La connexion se fait via FranceConnect — utilisez votre compte impôts.gouv.fr, Ameli, La Poste ou autre.
          Aucune création de compte spécifique n'est nécessaire.
        </p>
        <div className="mt-4">
          <Button
            className="gap-2"
            onClick={() => window.open("https://www.info-retraite.fr", "_blank")}
          >
            Accéder à info-retraite.fr <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground italic">
          Disponible aussi sur l'application mobile « Mon compte retraite » — iOS et Android.
        </p>
      </>
    ),
  },
  {
    id: 2,
    emoji: "📂",
    icon: FolderOpen,
    title: "Accéder à la rubrique épargne",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        Une fois connecté, rendez-vous dans la rubrique <strong>« Mon épargne retraite »</strong> puis cliquez sur <strong>« Voir mes contrats »</strong>.
      </p>
    ),
  },
  {
    id: 3,
    emoji: "📋",
    icon: ClipboardList,
    title: "Consulter vos contrats",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Le service affiche la liste de tous vos produits d'épargne retraite — individuels ou collectifs — pour lesquels vous êtes identifié comme titulaire, avec une estimation du montant disponible et les coordonnées de l'organisme gestionnaire.
        </p>
        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm font-medium text-primary">
            Contrats couverts : PER, PERCO, PERP, Madelin, Article 39, Article 83 — soit l'ensemble des véhicules de retraite supplémentaire individuelle et collective.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 4,
    emoji: "📞",
    icon: Phone,
    title: "Contacter l'organisme",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Pour faire valoir vos droits ou obtenir plus d'informations, contactez directement l'organisme gestionnaire dont les coordonnées s'affichent pour chaque contrat.
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open("/rdv-expert", "_blank")}
          >
            Besoin d'aide pour analyser vos contrats retrouvés ? Consultez un expert Perlib <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </>
    ),
  },
];

const BENEFIT_CARDS = [
  {
    icon: Coins,
    title: "Des sommes parfois significatives",
    description: "Un PERCO alimenté pendant 3 ans chez un ancien employeur peut représenter plusieurs milliers d'euros. Ces sommes continuent de fructifier — même si vous avez oublié le contrat.",
  },
  {
    icon: Shield,
    title: "Des droits qui vous appartiennent",
    description: "Ces contrats sont à votre nom. Changer d'entreprise ne fait pas disparaître vos droits — ils restent disponibles jusqu'à votre retraite, voire avant dans certains cas (achat résidence principale, invalidité...).",
  },
  {
    icon: TrendingUp,
    title: "Une opportunité d'optimisation",
    description: "Une fois vos contrats identifiés, un expert Perlib peut vous aider à décider s'il est pertinent de les regrouper, de les transférer vers un PER plus avantageux, ou de les laisser tels quels.",
  },
];

export default function PensionTracker() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Back button */}
        <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => navigate("/employee")}>
          <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
        </Button>

        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">PensionTracker</h1>
            <Badge className="bg-accent text-accent-foreground">Nouveau</Badge>
          </div>
          <p className="text-muted-foreground text-lg">
            Retrouvez vos contrats retraite oubliés en 5 minutes.
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <Card>
            <CardContent className="p-6 md:p-8 space-y-5">
              <h2 className="text-xl md:text-2xl font-semibold">
                Vous avez peut-être des contrats retraite que vous avez oubliés.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                À chaque changement d'entreprise, vous avez pu cotiser à un PERCO, un PER collectif, un article 83 ou un Madelin.
                Ces contrats vous appartiennent — mais ils sont souvent perdus de vue.
                Le service public <strong>info-retraite.fr</strong> vous permet de les retrouver en quelques clics, gratuitement.
              </p>

              {/* Golden stat callout */}
              <div className="rounded-lg p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    En France, on estime à <strong>plusieurs milliards d'euros</strong> le montant des droits à la retraite supplémentaire non réclamés.
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="gap-2 w-full sm:w-auto"
                onClick={() => setShowGuide(true)}
              >
                Retrouver mes contrats <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* Guided steps */}
        <AnimatePresence>
          {showGuide && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 overflow-hidden"
            >
              <h2 className="text-xl font-semibold">Parcours guidé — 4 étapes</h2>

              {/* Stepper */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {STEPS.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                    className={`flex-1 min-w-[100px] flex flex-col items-center gap-2 p-3 rounded-lg transition-all border ${
                      activeStep === step.id
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-2xl">{step.emoji}</span>
                    <span className="text-xs font-medium text-center leading-tight">
                      Étape {step.id}
                    </span>
                  </button>
                ))}
              </div>

              {/* Step detail */}
              <AnimatePresence mode="wait">
                {activeStep !== null && (
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card>
                      <CardContent className="p-6 space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <span className="text-xl">{STEPS[activeStep - 1].emoji}</span>
                          {STEPS[activeStep - 1].title}
                        </h3>
                        {STEPS[activeStep - 1].content}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Warning callout */}
              <div className="rounded-lg p-5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-orange-900 dark:text-orange-200">
                    La base de données est en cours d'alimentation. Si aucun contrat n'apparaît, il est possible que l'information n'ait pas encore été transmise. Revenez vérifier ultérieurement ou contactez directement votre ancien employeur ou organisme gestionnaire.
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Benefits section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold">Qu'est-ce que ça peut changer pour vous ?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {BENEFIT_CARDS.map((card, idx) => (
              <Card key={idx} className="h-full">
                <CardContent className="p-6 space-y-3 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center space-y-3 py-8"
        >
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all"
            onClick={() => window.open("/rdv-expert", "_blank")}
          >
            Prendre rendez-vous avec un expert Perlib pour analyser mes contrats <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Gratuit, sans engagement. Nos experts analysent vos contrats retrouvés et vous conseillent sur la meilleure stratégie.
          </p>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
}
