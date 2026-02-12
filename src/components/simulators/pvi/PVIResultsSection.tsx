/**
 * Section des résultats du simulateur PVI
 * Affichage des métriques clés et tableau détaillé
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Receipt, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react';
import type { PVICalculationResult } from '@/types/pvi';

interface PVIResultsSectionProps {
  result: PVICalculationResult;
  prixCession: number;
}

export const PVIResultsSection: React.FC<PVIResultsSectionProps> = ({ result, prixCession }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatPct = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  const isExonereIR = result.abattement_ir_pct >= 100;
  const isExonereTotal = result.abattement_ps_pct >= 100;
  
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Métriques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Net Vendeur */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net Vendeur en Poche</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(result.net_vendeur)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      sur {formatCurrency(prixCession)} de vente
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Impôt Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Impôt Total à Payer</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(result.impot_total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.plus_value_brute > 0 
                        ? `${((result.impot_total / result.plus_value_brute) * 100).toFixed(1)}% de la plus-value`
                        : 'Aucune plus-value'
                      }
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-500/10">
                    <Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Durée et Exonérations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Impact de la Durée de Détention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-sm">
                  {result.duree_detention_annees} ans de détention
                </Badge>
                {isExonereIR && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Exonéré IR (22+ ans)
                  </Badge>
                )}
                {isExonereTotal && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Exonéré Total (30+ ans)
                  </Badge>
                )}
              </div>
              
              {result.plus_value_brute > 0 && !isExonereTotal && (
                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="text-sm">
                    <TrendingDown className="h-4 w-4 inline mr-1 text-primary" />
                    Grâce à vos <strong>{result.duree_detention_annees} ans</strong> de détention, vous économisez{' '}
                    <strong className="text-green-600">{formatCurrency(result.abattement_ir_montant)}</strong> d'impôt
                    (abattement de {formatPct(result.abattement_ir_pct)} sur l'IR).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Surtaxe si applicable */}
        {result.surtaxe_applicable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-400">
                      Taxe sur les Hautes Plus-Values
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Votre plus-value imposable dépasse 50 000 €. Une surtaxe de{' '}
                      <strong>{result.surtaxe_taux}%</strong> s'applique, soit{' '}
                      <strong>{formatCurrency(result.surtaxe_montant)}</strong>.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      Art. 1609 nonies G du CGI
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Tableau détaillé des calculs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Détail des Calculs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Élément</th>
                      <th className="text-right py-2 font-medium text-blue-600">Assiette IR</th>
                      <th className="text-right py-2 font-medium text-purple-600">Assiette PS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2">Plus-value brute</td>
                      <td className="text-right py-2" colSpan={2}>
                        {formatCurrency(result.plus_value_brute)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Taux d'abattement</td>
                      <td className="text-right py-2 text-blue-600">{formatPct(result.abattement_ir_pct)}</td>
                      <td className="text-right py-2 text-purple-600">{formatPct(result.abattement_ps_pct)}</td>
                    </tr>
                    <tr>
                      <td className="py-2">Abattement</td>
                      <td className="text-right py-2 text-blue-600">- {formatCurrency(result.abattement_ir_montant)}</td>
                      <td className="text-right py-2 text-purple-600">- {formatCurrency(result.abattement_ps_montant)}</td>
                    </tr>
                    <tr className="font-medium">
                      <td className="py-2">Assiette nette</td>
                      <td className="text-right py-2 text-blue-600">{formatCurrency(result.assiette_ir_nette)}</td>
                      <td className="text-right py-2 text-purple-600">{formatCurrency(result.assiette_ps_nette)}</td>
                    </tr>
                    <tr>
                      <td className="py-2">Taux applicable</td>
                      <td className="text-right py-2 text-blue-600">19%</td>
                      <td className="text-right py-2 text-purple-600">17.2%</td>
                    </tr>
                    <tr className="border-t-2 font-semibold">
                      <td className="py-2">Impôt</td>
                      <td className="text-right py-2 text-blue-600">{formatCurrency(result.impot_revenu)}</td>
                      <td className="text-right py-2 text-purple-600">{formatCurrency(result.prelevements_sociaux)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <Separator className="my-4" />
              
              {/* Récapitulatif final */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Impôt sur le revenu (19%)</span>
                  <span>{formatCurrency(result.impot_revenu)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Prélèvements sociaux (17.2%)</span>
                  <span>{formatCurrency(result.prelevements_sociaux)}</span>
                </div>
                {result.surtaxe_applicable && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Surtaxe hautes PV ({result.surtaxe_taux}%)</span>
                    <span>{formatCurrency(result.surtaxe_montant)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total à payer</span>
                  <span className="text-red-600">{formatCurrency(result.impot_total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
};
