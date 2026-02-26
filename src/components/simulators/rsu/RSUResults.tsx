/**
 * Écran 4 — Résultats de la simulation RSU
 */

import { motion } from 'framer-motion';
import { TrendingUp, Landmark, Wallet, AlertTriangle, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SimulatorResultCard } from '@/components/simulators/SimulatorResultCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import type { RSUSimulationResult } from '@/types/rsu';
import { REGIME_COLORS } from '@/types/rsu';
import { setBookingReferrer } from '@/hooks/useBookingReferrer';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const pct = (v: number) => `${v.toFixed(1)}%`;

const DONUT_COLORS = ['#f59e0b', '#6366f1', '#ec4899', '#22c55e'];

interface RSUResultsProps {
  result: RSUSimulationResult;
  onReset: () => void;
}

export function RSUResults({ result, onReset }: RSUResultsProps) {
  const donutData = [
    { name: 'Impôt sur le revenu', value: result.total_ir },
    { name: 'Prélèvements sociaux', value: result.total_ps + result.total_csg_crds },
    { name: 'Contribution salariale', value: result.total_contribution_salariale },
    { name: 'Gain net', value: result.gain_net_total },
  ].filter(d => d.value > 0);

  const expertUrl = 'https://www.perlib.fr/prendre-rdv?utm_source=fincare_app&utm_campaign=simulateur_rsu';

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
                  <Pie
                    data={donutData}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
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
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail plan par plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail par plan</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Régime</TableHead>
                <TableHead className="text-right">Gain acq.</TableHead>
                <TableHead className="text-right">PV cession</TableHead>
                <TableHead className="text-right">IR</TableHead>
                <TableHead className="text-right">PS/CSG</TableHead>
                <TableHead className="text-right">Contrib. sal.</TableHead>
                <TableHead className="text-right font-bold">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.plans.map(p => (
                <TableRow key={p.plan_id}>
                  <TableCell className="font-medium">{p.plan_nom}</TableCell>
                  <TableCell>
                    <Badge className={REGIME_COLORS[p.regime]}>{p.regime}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{fmt(p.gain_acquisition_eur)}</TableCell>
                  <TableCell className="text-right">{fmt(p.pv_cession_eur)}</TableCell>
                  <TableCell className="text-right">{fmt(p.ir_gain_acquisition + p.ir_pv_cession)}</TableCell>
                  <TableCell className="text-right">{fmt(p.ps_gain_acquisition + p.csg_crds + p.ps_pv_cession)}</TableCell>
                  <TableCell className="text-right">{fmt(p.contribution_salariale)}</TableCell>
                  <TableCell className="text-right font-bold">{fmt(p.gain_net)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-bold">Total consolidé</TableCell>
                <TableCell className="text-right font-bold">
                  {fmt(result.plans.reduce((s, p) => s + p.gain_acquisition_eur, 0))}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {fmt(result.plans.reduce((s, p) => s + p.pv_cession_eur, 0))}
                </TableCell>
                <TableCell className="text-right font-bold">{fmt(result.total_ir)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(result.total_ps + result.total_csg_crds)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(result.total_contribution_salariale)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(result.gain_net_total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Avertissement seuil 300k */}
      {result.seuil_300k_applique && (
        <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            Le seuil de 300 000 € est appliqué sur l'ensemble de vos plans. Cette interprétation est la plus prudente — consultez un expert Perlib pour valider votre situation spécifique.
          </AlertDescription>
        </Alert>
      )}

      {/* Taux effectif */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taux effectif d'imposition global</span>
            <span className="text-2xl font-bold">{pct(result.taux_effectif)}</span>
          </div>
        </CardContent>
      </Card>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild className="flex-1 gap-2" size="lg">
          <a href={expertUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Optimiser avec un expert Perlib
          </a>
        </Button>
        <Button variant="outline" onClick={onReset} className="flex-1 gap-2" size="lg">
          <RotateCcw className="h-4 w-4" />
          Nouvelle simulation
        </Button>
      </div>
    </motion.div>
  );
}
