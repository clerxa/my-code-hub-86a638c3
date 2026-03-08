import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateBSPCEFiscal, type BSPCEFiscalResult } from '@/utils/bspceCalculations';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useExpertBookingUrl } from '@/hooks/useExpertBookingUrl';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const TMI_OPTIONS = [
  { value: '11', label: '11%' },
  { value: '30', label: '30%' },
  { value: '41', label: '41%' },
  { value: '45', label: '45%' },
];

const formatEur = (v: number) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted-foreground))'];

export function BSPCEFiscalMode() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { bookingUrl } = useExpertBookingUrl(companyId);

  const [nbBspce, setNbBspce] = useState<number>(0);
  const [prixExercice, setPrixExercice] = useState<number>(0);
  const [prixCession, setPrixCession] = useState<number>(0);
  const [dateEntree, setDateEntree] = useState('');
  const [dateCession, setDateCession] = useState('');
  const [tmi, setTmi] = useState('30');

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
        .then(({ data }) => setCompanyId(data?.company_id || null));
    }
  }, [user]);

  const canCalculate = nbBspce > 0 && prixExercice > 0 && prixCession > 0 && dateEntree && dateCession && prixCession > prixExercice;

  const result: BSPCEFiscalResult | null = useMemo(() => {
    if (!canCalculate) return null;
    return calculateBSPCEFiscal(nbBspce, prixExercice, prixCession, dateEntree, dateCession, parseInt(tmi));
  }, [nbBspce, prixExercice, prixCession, dateEntree, dateCession, tmi, canCalculate]);

  const ancienneteYears = result ? Math.floor(result.anciennete_mois / 12) : 0;
  const ancienneteMoisReste = result ? result.anciennete_mois % 12 : 0;
  const isProche3ans = result && result.anciennete_mois >= 30 && result.anciennete_mois < 36;

  const donutData = result ? [
    { name: 'Gain net', value: Math.max(0, result.regime_applicable === 'pfu' ? result.gain_net_final_pfu : result.gain_net_final_bareme) },
    { name: 'IR', value: result.regime_applicable === 'pfu' ? result.ir_pfu : result.ir_bareme },
    { name: 'PS', value: result.regime_applicable === 'pfu' ? result.ps_pfu : result.ps_bareme },
    { name: "Coût d'exercice", value: result.cout_exercice },
  ] : [];

  const openBooking = () => { if (bookingUrl) window.open(bookingUrl, '_blank'); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Paramètres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Paramètres du plan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre de BSPCE exercés</Label>
            <Input type="number" placeholder="ex. 10 000" value={nbBspce || ''} onChange={e => setNbBspce(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Prix d'exercice unitaire (€)</Label>
            <Input type="number" step="0.01" placeholder="ex. 0,50 €" value={prixExercice || ''} onChange={e => setPrixExercice(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Prix de cession unitaire (€)</Label>
            <Input type="number" step="0.01" placeholder="ex. 5,00 €" value={prixCession || ''} onChange={e => setPrixCession(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>TMI (Tranche Marginale d'Imposition)</Label>
            <Select value={tmi} onValueChange={setTmi}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TMI_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date d'entrée dans la société</Label>
            <Input type="month" value={dateEntree} onChange={e => setDateEntree(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Date de cession prévue</Label>
            <Input type="month" value={dateCession} onChange={e => setDateCession(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {result && (
        <>
          {/* Ancienneté */}
          <Card>
            <CardContent className="pt-5">
              {result.regime_applicable === 'pfu' ? (
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    ✅ Ancienneté de {ancienneteYears} an{ancienneteYears > 1 ? 's' : ''} et {ancienneteMoisReste} mois — régime favorable applicable (PFU 30%)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    ⚠️ Ancienneté de {ancienneteYears} an{ancienneteYears > 1 ? 's' : ''} et {ancienneteMoisReste} mois — régime moins favorable applicable (barème + PS)
                  </span>
                </div>
              )}
              {isProche3ans && (
                <Alert className="mt-3 border-accent/30 bg-accent/5">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <AlertDescription className="text-xs">
                    Attention — votre ancienneté sera de {result.anciennete_mois} mois à la date de cession prévue. Attendre {result.mois_restants_3ans} mois supplémentaires pour dépasser le seuil des 3 ans pourrait vous faire économiser environ {formatEur(result.economie_potentielle)}.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Tableau comparatif */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparaison des régimes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground" />
                      <th className={`text-right py-3 px-3 font-medium ${result.regime_applicable === 'pfu' ? 'bg-primary/10 text-primary rounded-t-lg' : 'text-muted-foreground'}`}>
                        Régime +3 ans (PFU 30%)
                      </th>
                      <th className={`text-right py-3 px-3 font-medium ${result.regime_applicable === 'bareme' ? 'bg-accent/10 text-accent rounded-t-lg' : 'text-muted-foreground'}`}>
                        Régime -3 ans (Barème + PS)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Gain brut', formatEur(result.gain_brut), formatEur(result.gain_brut)],
                      ['Impôt sur le revenu', formatEur(result.ir_pfu), formatEur(result.ir_bareme)],
                      ['Prélèvements sociaux', formatEur(result.ps_pfu), formatEur(result.ps_bareme)],
                      ['Total impôts', formatEur(result.total_impots_pfu), formatEur(result.total_impots_bareme)],
                      ["Coût d'exercice", `-${formatEur(result.cout_exercice)}`, `-${formatEur(result.cout_exercice)}`],
                      ['GAIN NET ESTIMÉ', formatEur(result.gain_net_final_pfu), formatEur(result.gain_net_final_bareme)],
                      ['Taux effectif', `${result.taux_effectif_pfu.toFixed(1)}%`, `${result.taux_effectif_bareme.toFixed(1)}%`],
                    ].map(([label, pfu, bareme], i) => (
                      <tr key={label as string} className={`border-b border-border/30 ${i === 5 ? 'font-bold text-base' : ''}`}>
                        <td className="py-3 px-3 font-medium">{label}</td>
                        <td className={`py-3 px-3 text-right ${result.regime_applicable === 'pfu' ? 'bg-primary/5' : ''}`}>{pfu}</td>
                        <td className={`py-3 px-3 text-right ${result.regime_applicable === 'bareme' ? 'bg-accent/5' : ''}`}>{bareme}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Économie potentielle */}
              {result.regime_applicable === 'bareme' && result.economie_potentielle > 0 && (
                <Alert className="mt-4 border-accent/40 bg-accent/5">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <AlertDescription className="text-sm">
                    En attendant {result.mois_restants_3ans} mois, vous pourriez économiser environ <strong>{formatEur(result.economie_potentielle)}</strong>. Consultez un expert Perlib pour valider cette stratégie.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Donut chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition — régime {result.regime_applicable === 'pfu' ? '+3 ans' : '-3 ans'}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatEur(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-3 py-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-accent to-amber-500 text-accent-foreground hover:opacity-90 gap-2"
              onClick={openBooking}
            >
              Optimiser ma stratégie BSPCE avec un expert Perlib →
              <ExternalLink className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Nos experts analysent votre plan d'attribution, calculent le timing optimal d'exercice et vous accompagnent dans les démarches. Gratuit, sans engagement.
            </p>
          </div>
        </>
      )}

      {/* Disclaimer fiscal */}
      <Alert variant="default" className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
          Ce calcul est une estimation basée sur les données saisies et la réglementation fiscale en vigueur. Il ne tient pas compte de votre situation fiscale globale (autres revenus, parts fiscales, situation matrimoniale). En particulier, l'intégration du gain au barème progressif (régime -3 ans) peut modifier votre TMI effectif si le gain est important. Source : article 163 bis G du CGI. Consultez un expert Perlib pour une analyse personnalisée.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
