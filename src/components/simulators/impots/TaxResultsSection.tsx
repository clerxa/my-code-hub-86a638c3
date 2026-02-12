import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Percent, Users, PiggyBank } from "lucide-react";

interface TaxResult {
  parts: number;
  quotientFamilial: number;
  impotBrut: number;
  reductionsImpot: number;
  creditsImpot: number;
  impotNet: number;
  tauxMoyen: number;
  tauxMarginal: number;
  economieQuotientFamilial?: number;
}

interface TaxResultsSectionProps {
  resultat: TaxResult;
  revenuImposable: number;
}

export function TaxResultsSection({ resultat, revenuImposable }: TaxResultsSectionProps) {
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Métriques principales */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        {/* Impôt Net */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Impôt sur le revenu
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatEuro(resultat.impotNet)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
            </div>
            {resultat.impotBrut !== resultat.impotNet && (
              <p className="text-xs text-muted-foreground mt-2">
                Avant réductions : {formatEuro(resultat.impotBrut)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Taux Moyen */}
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Taux moyen d'imposition
                </p>
                <p className="text-3xl font-bold">
                  {resultat.tauxMoyen.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-full bg-muted">
                <Percent className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Part réelle de votre revenu versée en impôts
            </p>
          </CardContent>
        </Card>

        {/* TMI */}
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Taux Marginal (TMI)
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">
                    {resultat.tauxMarginal.toFixed(0)}%
                  </p>
                  <Badge variant={
                    resultat.tauxMarginal <= 11 ? "secondary" :
                    resultat.tauxMarginal <= 30 ? "default" :
                    "destructive"
                  }>
                    {resultat.tauxMarginal <= 11 ? "Faible" :
                     resultat.tauxMarginal <= 30 ? "Modéré" :
                     "Élevé"}
                  </Badge>
                </div>
              </div>
              <div className="p-2 rounded-full bg-muted">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Taux appliqué au dernier euro gagné
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Détails du quotient familial */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Quotient Familial</h3>
                <p className="text-sm text-muted-foreground">
                  Votre foyer fiscal compte {resultat.parts} part{resultat.parts > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Revenu imposable</p>
                <p className="text-lg font-semibold">{formatEuro(revenuImposable)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Quotient familial</p>
                <p className="text-lg font-semibold">{formatEuro(resultat.quotientFamilial)}</p>
              </div>
            </div>

            {/* Économie grâce au QF */}
            {resultat.economieQuotientFamilial && resultat.economieQuotientFamilial > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-medium">
                    Économie grâce au quotient familial
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatEuro(resultat.economieQuotientFamilial)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Par rapport à un célibataire sans enfant avec le même revenu
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Détail des réductions/crédits si présents */}
      {(resultat.reductionsImpot > 0 || resultat.creditsImpot > 0) && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Détail des avantages fiscaux</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Impôt brut</span>
                  <span className="font-medium">{formatEuro(resultat.impotBrut)}</span>
                </div>
                {resultat.reductionsImpot > 0 && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                    <span className="text-green-600 dark:text-green-400">
                      Réductions d'impôt
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      - {formatEuro(resultat.reductionsImpot)}
                    </span>
                  </div>
                )}
                {resultat.creditsImpot > 0 && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                    <span className="text-green-600 dark:text-green-400">
                      Crédits d'impôt
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      - {formatEuro(resultat.creditsImpot)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="font-semibold text-primary">Impôt net à payer</span>
                  <span className="font-bold text-primary">{formatEuro(resultat.impotNet)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
