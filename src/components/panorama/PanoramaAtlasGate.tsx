/**
 * Gate screen shown in PANORAMA when no ATLAS analysis exists yet.
 * Guides the user to upload their tax notice first.
 */

import { motion } from "framer-motion";
import { FileText, ArrowRight, Shield, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const BENEFITS = [
  {
    icon: Zap,
    title: "Pré-remplissage automatique",
    description: "80% de votre profil financier est complété automatiquement à partir de votre avis d'imposition.",
  },
  {
    icon: Eye,
    title: "Données fiables",
    description: "Les revenus, le TMI et les parts fiscales sont extraits directement du document officiel — zéro erreur de saisie.",
  },
  {
    icon: Shield,
    title: "Analyse sécurisée",
    description: "Votre document est analysé de manière confidentielle et n'est jamais partagé avec des tiers.",
  },
];

export function PanoramaAtlasGate() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <FileText className="h-4 w-4" />
          Première étape
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Commençons par analyser votre avis d'imposition
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Pour construire votre tableau de bord patrimonial, nous avons besoin de vos données fiscales de l'année N-1. 
          Importez votre avis d'imposition et ATLAS s'occupe du reste.
        </p>
      </motion.div>

      {/* Info banner about N-1 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 text-center">
          <p className="text-sm text-primary font-medium">
            📋 L'avis d'imposition reflète vos revenus de l'année précédente (N-1). 
            Vous pourrez ensuite compléter votre situation actuelle dans « Ma situation financière ».
          </p>
        </div>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid gap-4"
      >
        {BENEFITS.map((benefit, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-3"
      >
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate("/employee/atlas?from=panorama")}
        >
          <FileText className="h-4 w-4" />
          Importer mon avis d'imposition
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Formats acceptés : PDF · Analyse en moins de 30 secondes
        </p>
      </motion.div>
    </div>
  );
}
