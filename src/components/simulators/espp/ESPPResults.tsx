/**
 * Écran de résultats ESPP — 3 blocs : Rabais, PV, Synthèse + Donut
 */

import { motion } from 'framer-motion';
import { TrendingUp, Landmark, Wallet, ExternalLink, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SimulatorResultCard } from '@/components/simulators/SimulatorResultCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import type { ESPPSimulationResult } from '@/types/esppNew';
import { setBookingReferrer } from '@/hooks/useBookingReferrer';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${v.toFixed(1)}%`;

const DONUT_COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ec4899'];

interface ESPPResultsProps {
  result: ESPPSimulationResult;
  tmi: number;
  onReset: () => void;
  onSave?: () => void;
}

export function ESPPResults({ result, tmi, onReset, onSave }: ESPPResultsProps) {
  const hasSales = result.pv_brute_total > 0 || result.periodes.some(p => p.has_sold);
  const hasMoinsValue = result.periodes.some(p => p.is_moins_value);

  const donutData = [
    { name: 'Rabais net', value: result.gain_net_rabais_total },
    { name: 'PV nette', value: Math.max(0, result.gain_net_pv_total) },
    { name: 'IR', value: result.ir_rabais_total + result.periodes.reduce((s, p) => s + p.ir_pv, 0) },
    { name: 'PS', value: result.ps_rabais_total + result.periodes.reduce((s, p) => s + p.ps_pv, 0) },
  ].filter(d => d.value > 0);

  const expertUrl = 'https://www.perlib.fr/prendre-rdv?utm_source=fincare_app&utm_campaign=simulateur_espp';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SimulatorResultCard
          title="Gain brut total"
          value={result.gain_brut_total}
          isCurrency
          icon={TrendingUp}
          variant="default"
        />
        <SimulatorResultCard
          title="Total impôts & charges"
          value={result.total_impots}
          isCurrency
          icon={Landmark}
          variant="destructive"
        />
        <SimulatorResultCard
          title="Gain net estimé"
          value={result.gain_net_total}
          isCurrency
          icon={Wallet}
          variant="success"
          badge={pct(result.taux_effectif) + ' taux effectif'}
        />
      </div>

      {/* Bloc 1 — Gain à l'achat (le rabais) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gain à l'achat — Le rabais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Rabais brut</span>
              <span className="font-medium">{fmt(result.rabais_brut_total)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Impôt sur le revenu (TMI {tmi}%)</span>
              <span className="font-medium">– {fmt(result.ir_rabais_total)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Prélèvements sociaux (9,7%)</span>
              <span className="font-medium">– {fmt(result.ps_rabais_total)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold text-green-600">
              <span>Gain net sur le rabais</span>
              <span>{fmt(result.gain_net_rabais_total)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Ce gain est certain dès l'achat de vos actions — vous avez acheté moins cher que le marché. Il est imposé comme un salaire dans l'année de l'achat.
          </p>
        </CardContent>
      </Card>

      {/* Bloc 2 — Gain à la vente (la plus-value) */}
      {hasSales && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gain à la vente — La plus-value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Plus-value brute</span>
                <span className="font-medium">{fmt(result.pv_brute_total)}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>Flat tax (PFU 30%)</span>
                <span className="font-medium">– {fmt(result.pfu_total)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold text-green-600">
                <span>Gain net sur la vente</span>
                <span>{fmt(result.gain_net_pv_total)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Cette plus-value dépend du cours au moment où vous vendez. Plus vous attendez, plus le gain potentiel est élevé — mais le risque aussi.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Moins-value warning */}
      {hasMoinsValue && (
        <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Moins-value de cession détectée — aucun impôt supplémentaire sur la plus-value. Le montant est imputable sur d'autres plus-values mobilières de la même année ou des 10 années suivantes.
          </AlertDescription>
        </Alert>
      )}

      {/* Donut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition fiscale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {donutData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taux effectif */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taux effectif d'imposition global</span>
            <span className="text-2xl font-bold">{pct(result.taux_effectif)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer ESPP */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ce simulateur ESPP est fourni à titre indicatif et pédagogique uniquement. Il ne constitue pas un conseil fiscal. La fiscalité des ESPP en France dépend notamment de la qualification du plan, de votre résidence fiscale, et des éventuelles conventions fiscales applicables. En particulier, la base de calcul de la plus-value peut varier selon l'interprétation retenue par votre employeur et l'administration fiscale. Consultez un expert Perlib avant toute décision de vente. Sources : article 80 bis du CGI, doctrine administrative BOFiP.
          </p>
        </CardContent>
      </Card>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild className="flex-1 gap-2" size="lg">
          <a
            href={expertUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setBookingReferrer('/simulateur-espp')}
          >
            <ExternalLink className="h-4 w-4" />
            Optimiser avec un expert Perlib
          </a>
        </Button>
        {onSave && (
          <Button variant="secondary" onClick={onSave} className="flex-1 gap-2" size="lg">
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        )}
        <Button variant="outline" onClick={onReset} className="flex-1 gap-2" size="lg">
          <RotateCcw className="h-4 w-4" />
          Nouvelle simulation
        </Button>
      </div>
    </motion.div>
  );
}
