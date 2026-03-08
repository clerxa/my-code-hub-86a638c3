import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateBSPCEScenarios } from '@/utils/bspceCalculations';

const TMI_OPTIONS = [
  { value: '11', label: '11%' },
  { value: '30', label: '30%' },
  { value: '41', label: '41%' },
  { value: '45', label: '45%' },
];

const formatEur = (v: number | null) => {
  if (v === null || isNaN(v)) return '—';
  return v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
};

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BSPCESimulationMode() {
  const [nbBspce, setNbBspce] = useState<number>(0);
  const [prixExercice, setPrixExercice] = useState<number>(0);
  const [valorisation, setValorisation] = useState<number | null>(null);
  const [nbActions, setNbActions] = useState<number | null>(null);
  const [tmi, setTmi] = useState('30');
  const [customMult, setCustomMult] = useState<number>(50);

  const scenarios = useMemo(() => {
    if (!nbBspce || !prixExercice) return [];
    return calculateBSPCEScenarios(nbBspce, prixExercice, valorisation, nbActions, parseInt(tmi));
  }, [nbBspce, prixExercice, valorisation, nbActions, tmi]);

  const canCalc = valorisation && nbActions && nbActions > 0;

  // Update custom scenario multiplier
  const scenariosWithCustom = useMemo(() => {
    return scenarios.map(s => {
      if (!s.isCustom) return s;
      if (!canCalc) return s;
      const valorisation_cible = valorisation! * customMult;
      const prix_cession_estime = valorisation_cible / nbActions!;
      const gain_brut = prix_cession_estime > prixExercice ? (prix_cession_estime - prixExercice) * nbBspce : 0;
      return {
        ...s,
        multiplicateur: customMult,
        valorisation_cible,
        prix_cession_estime,
        gain_brut,
        gain_net_pfu: gain_brut * 0.7,
        gain_net_bareme: gain_brut * (1 - (parseInt(tmi) / 100 + 0.172)),
      };
    });
  }, [scenarios, customMult, canCalc, valorisation, nbActions, prixExercice, nbBspce, tmi]);

  const bestScenarioIndex = canCalc ? 1 : -1; // "Modéré" highlighted

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Section A — Paramètres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Paramètres de base
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre de BSPCE attribués</Label>
            <Input type="number" placeholder="ex. 10 000" value={nbBspce || ''} onChange={e => setNbBspce(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>
              Prix d'exercice unitaire (€)
              <InfoTip text="Le prix auquel vous pouvez acheter chaque action. Indiqué dans votre contrat d'attribution." />
            </Label>
            <Input type="number" step="0.01" placeholder="ex. 0,50 €" value={prixExercice || ''} onChange={e => setPrixExercice(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>
              Valorisation actuelle de la société (€)
              <InfoTip text="Dernière valorisation connue (dernier tour de table). Non obligatoire." />
            </Label>
            <Input type="number" placeholder="ex. 10 000 000 €" value={valorisation ?? ''} onChange={e => setValorisation(e.target.value ? parseInt(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>
              Nombre total d'actions (fully diluted)
              <InfoTip text="Nombre total d'actions existantes + toutes les actions potentielles (BSPCE, BSA, options). Indiqué dans vos documents d'actionnaire." />
            </Label>
            <Input type="number" placeholder="ex. 1 000 000" value={nbActions ?? ''} onChange={e => setNbActions(e.target.value ? parseInt(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>TMI (pour régime -3 ans)</Label>
            <Select value={tmi} onValueChange={setTmi}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TMI_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section B/C — Résultats par scénario */}
      {nbBspce > 0 && prixExercice > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scénarios de valorisation</CardTitle>
          </CardHeader>
          <CardContent>
            {!canCalc ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Renseignez la valorisation actuelle et le nombre total d'actions pour voir les projections par scénario.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="text-left py-3 px-2 font-medium">Scénario</th>
                      <th className="text-right py-3 px-2 font-medium">×</th>
                      <th className="text-right py-3 px-2 font-medium">Prix cession</th>
                      <th className="text-right py-3 px-2 font-medium">Gain brut</th>
                      <th className="text-right py-3 px-2 font-medium">Net +3 ans (PFU)</th>
                      <th className="text-right py-3 px-2 font-medium">Net -3 ans (TMI {tmi}%)</th>
                      <th className="text-right py-3 px-2 font-medium">Coût exercice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenariosWithCustom.map((s, i) => (
                      <tr
                        key={s.label}
                        className={`border-b border-border/30 ${i === bestScenarioIndex ? 'ring-1 ring-accent bg-accent/5' : ''}`}
                      >
                        <td className="py-3 px-2 font-medium">{s.label}</td>
                        <td className="py-3 px-2 text-right">
                          {s.isCustom ? (
                            <Input
                              type="number"
                              className="w-20 h-7 text-right text-xs"
                              value={customMult}
                              onChange={e => setCustomMult(parseInt(e.target.value) || 1)}
                            />
                          ) : `×${s.multiplicateur}`}
                        </td>
                        <td className="py-3 px-2 text-right">{s.prix_cession_estime !== null ? s.prix_cession_estime.toFixed(2) + ' €' : '—'}</td>
                        <td className="py-3 px-2 text-right font-medium">{formatEur(s.gain_brut)}</td>
                        <td className="py-3 px-2 text-right text-primary font-medium">{formatEur(s.gain_net_pfu)}</td>
                        <td className="py-3 px-2 text-right text-accent font-medium">{formatEur(s.gain_net_bareme)}</td>
                        <td className="py-3 px-2 text-right text-muted-foreground">{formatEur(s.cout_exercice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disclaimer simulation */}
      <Alert variant="default" className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
          Ces projections sont basées sur des scénarios de valorisation hypothétiques. La valeur réelle de vos BSPCE dépendra du prix de cession effectif lors d'un événement de liquidité (acquisition, IPO, levée de fonds secondaire). Aucune liquidité n'est garantie sur des actions non cotées.
        </AlertDescription>
      </Alert>

      <Alert variant="default" className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
          Ces projections ne constituent pas une promesse de gain. Les BSPCE portent sur des actions non cotées dont la liquidité n'est pas garantie. La valeur de cession dépend d'événements futurs incertains (levée de fonds, acquisition, IPO). La fiscalité présentée est celle applicable aux résidents fiscaux français. Consultez un expert Perlib avant toute décision d'exercice.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
