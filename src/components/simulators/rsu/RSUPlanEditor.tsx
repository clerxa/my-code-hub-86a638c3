/**
 * Écran 2 — Création / Modification d'un plan RSU
 * Avec : année dropdown, R3 encadré, pré-remplissage vestings, disclaimer
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, HelpCircle, ExternalLink, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { RSUPlan, RSURegime, RSUDevise, VestingLine } from '@/types/rsu';
import { REGIME_LABELS } from '@/types/rsu';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

function generateId() {
  return crypto.randomUUID();
}

function createEmptyVesting(): VestingLine {
  return { id: generateId(), date: '', nb_rsu: 0, cours: 0, taux_change: 1, gain_eur: 0 };
}

// Génère les années de 2010 à l'année courante (décroissant)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => currentYear - i);

type VestingFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';

const FREQUENCY_LABELS: Record<VestingFrequency, string> = {
  monthly: 'Mensuel (12x/an)',
  quarterly: 'Trimestriel (4x/an)',
  semiannual: 'Semestriel (2x/an)',
  annual: 'Annuel (1x/an)',
  custom: 'Custom (saisie manuelle)',
};

const FREQUENCY_PER_YEAR: Record<Exclude<VestingFrequency, 'custom'>, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};

const FREQUENCY_MONTHS: Record<Exclude<VestingFrequency, 'custom'>, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6];

interface RSUPlanEditorProps {
  plan?: RSUPlan;
  onSave: (plan: RSUPlan) => void;
  onCancel: () => void;
}

export function RSUPlanEditor({ plan, onSave, onCancel }: RSUPlanEditorProps) {
  const isEditing = !!plan;

  const [nom, setNom] = useState(plan?.nom ?? '');
  const [annee, setAnnee] = useState(plan?.annee_attribution ?? currentYear - 1);
  const [regime, setRegime] = useState<RSURegime>(plan?.regime ?? 'R1');
  const [devise, setDevise] = useState<RSUDevise>(plan?.devise ?? 'EUR');
  const [vestings, setVestings] = useState<VestingLine[]>(
    plan?.vestings?.length ? plan.vestings : [createEmptyVesting()]
  );

  // Paramètres de pré-remplissage
  const [startDate, setStartDate] = useState('');
  const [frequency, setFrequency] = useState<VestingFrequency>('quarterly');
  const [duration, setDuration] = useState(4);
  const [totalActions, setTotalActions] = useState<number>(0);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const isCustom = frequency === 'custom';

  // Recalcul gains
  const computedVestings = useMemo(() => {
    return vestings.map(v => ({
      ...v,
      gain_eur: v.nb_rsu * v.cours * (devise === 'USD' ? v.taux_change : 1),
    }));
  }, [vestings, devise]);

  const totalGain = useMemo(
    () => computedVestings.reduce((s, v) => s + v.gain_eur, 0),
    [computedVestings]
  );

  const totalActionsComputed = useMemo(
    () => computedVestings.reduce((s, v) => s + v.nb_rsu, 0),
    [computedVestings]
  );

  const updateVesting = useCallback((id: string, field: keyof VestingLine, value: string | number) => {
    setVestings(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }, []);

  const addVesting = useCallback(() => {
    setVestings(prev => [...prev, createEmptyVesting()]);
  }, []);

  const removeVesting = useCallback((id: string) => {
    setVestings(prev => prev.length > 1 ? prev.filter(v => v.id !== id) : prev);
  }, []);

  // Génération des vestings
  const canGenerate = !isCustom && startDate && totalActions > 0;

  const generateVestings = useCallback(() => {
    if (!canGenerate || isCustom) return;

    const freqPerYear = FREQUENCY_PER_YEAR[frequency as Exclude<VestingFrequency, 'custom'>];
    const monthsInterval = FREQUENCY_MONTHS[frequency as Exclude<VestingFrequency, 'custom'>];
    const nbPeriodes = duration * freqPerYear;
    const actionsPerPeriod = Math.round((totalActions / nbPeriodes) * 10000) / 10000;

    const [year, month] = startDate.split('-').map(Number);
    const newVestings: VestingLine[] = [];

    for (let i = 0; i < nbPeriodes; i++) {
      const d = new Date(year, month - 1 + i * monthsInterval, 1);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      newVestings.push({
        id: generateId(),
        date: dateStr,
        nb_rsu: actionsPerPeriod,
        cours: 0,
        taux_change: 1,
        gain_eur: 0,
      });
    }

    setVestings(newVestings);
    setHasGenerated(true);
  }, [canGenerate, isCustom, frequency, duration, totalActions, startDate]);

  const handleGenerateClick = () => {
    if (hasGenerated && vestings.some(v => v.cours > 0)) {
      setShowRegenerateConfirm(true);
    } else {
      generateVestings();
    }
  };

  // Vérification arrondi
  const showRoundingNote = useMemo(() => {
    if (isCustom || totalActions <= 0) return false;
    const freqPerYear = FREQUENCY_PER_YEAR[frequency as Exclude<VestingFrequency, 'custom'>];
    const nbPeriodes = duration * freqPerYear;
    return totalActions % nbPeriodes !== 0;
  }, [isCustom, frequency, duration, totalActions]);

  const handleSubmit = () => {
    if (!nom.trim()) return;
    onSave({
      id: plan?.id ?? generateId(),
      nom: nom.trim(),
      annee_attribution: annee,
      regime,
      devise,
      vestings: computedVestings,
      gain_acquisition_total: totalGain,
    });
  };

  const isValid = nom.trim().length > 0 && computedVestings.some(v => v.nb_rsu > 0 && v.cours > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Infos du plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isEditing ? 'Modifier le plan' : 'Nouveau plan RSU'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-nom">Nom du plan</Label>
              <Input
                id="plan-nom"
                placeholder="Ex: Google RSU 2023"
                value={nom}
                onChange={e => setNom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Année d'attribution du plan</Label>
              <Select value={String(annee)} onValueChange={v => setAnnee(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Régime fiscal</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-sm space-y-2">
                      <p><strong>R1</strong> — Plan qualifié (AGA) attribué après le 30/12/2016</p>
                      <p><strong>R2</strong> — Plan qualifié (AGA) attribué entre le 08/08/2015 et le 30/12/2016</p>
                      <p><strong>R3</strong> — Plan non qualifié (ex: Nvidia, Meta…). Le gain est imposé comme un salaire.</p>
                      <a
                        href="https://www.perlib.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline mt-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Un doute ? Consultez un expert Perlib
                      </a>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={regime} onValueChange={v => setRegime(v as RSURegime)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="R1">{REGIME_LABELS.R1}</SelectItem>
                  <SelectItem value="R2">{REGIME_LABELS.R2}</SelectItem>
                  <SelectItem value="R3">{REGIME_LABELS.R3}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={devise} onValueChange={v => setDevise(v as RSUDevise)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Encadré R3 */}
          {regime === 'R3' && (
            <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>Plan non qualifié</strong> — Votre gain d'acquisition sera imposé comme un salaire à chaque vesting, au barème progressif de l'impôt sur le revenu + prélèvements sociaux (9,7%) + contribution salariale (10%). Aucun abattement ni régime de faveur ne s'applique. Le simulateur calcule l'imposition théorique cumulée sur l'ensemble de vos vestings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Paramètres du plan — Pré-remplissage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres du plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date du premier vesting</Label>
              <Input
                type="month"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre total de RSU attribuées sur ce plan</Label>
              <Input
                type="number"
                min={1}
                placeholder="ex. 400"
                value={totalActions || ''}
                onChange={e => setTotalActions(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fréquence de vesting</Label>
            <RadioGroup
              value={frequency}
              onValueChange={v => setFrequency(v as VestingFrequency)}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {(Object.keys(FREQUENCY_LABELS) as VestingFrequency[]).map(f => (
                <div key={f} className="flex items-center space-x-2">
                  <RadioGroupItem value={f} id={`freq-${f}`} />
                  <Label htmlFor={`freq-${f}`} className="text-sm font-normal cursor-pointer">
                    {FREQUENCY_LABELS[f]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {!isCustom && (
            <div className="space-y-2">
              <Label>Durée totale du plan</Label>
              <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => (
                    <SelectItem key={d} value={String(d)}>{d} an{d > 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isCustom && (
            <p className="text-sm text-muted-foreground italic">
              Saisissez vos périodes de vesting manuellement dans le tableau ci-dessous.
            </p>
          )}

          {!isCustom && canGenerate && (
            <Button variant="outline" onClick={handleGenerateClick} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Générer les périodes de vesting
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Vesting table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Périodes de vesting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead className="w-[100px]">Nb RSU</TableHead>
                  <TableHead className="w-[120px]">Cours ({devise === 'USD' ? '$' : '€'})</TableHead>
                  {devise === 'USD' && (
                    <TableHead className="w-[120px]">Taux €/$</TableHead>
                  )}
                  <TableHead className="w-[120px] text-right">Gain (€)</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {computedVestings.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Input
                        type="date"
                        value={v.date}
                        onChange={e => updateVesting(v.id, 'date', e.target.value)}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={v.nb_rsu || ''}
                        onChange={e => updateVesting(v.id, 'nb_rsu', Number(e.target.value))}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={v.cours || ''}
                        onChange={e => updateVesting(v.id, 'cours', Number(e.target.value))}
                        className="h-9"
                      />
                    </TableCell>
                    {devise === 'USD' && (
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.0001}
                          value={v.taux_change || ''}
                          onChange={e => updateVesting(v.id, 'taux_change', Number(e.target.value))}
                          className="h-9"
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-right font-medium">
                      {fmt(v.gain_eur)}
                    </TableCell>
                    <TableCell>
                      {computedVestings.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeVesting(v.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="font-semibold">{totalActionsComputed}</TableCell>
                  <TableCell />
                  {devise === 'USD' && <TableCell />}
                  <TableCell className="text-right font-bold text-lg">
                    {fmt(totalGain)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {showRoundingNote && hasGenerated && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Le nombre d'actions par période a été arrondi. Vérifiez avec votre contrat d'attribution.
            </p>
          )}

          <Button variant="outline" onClick={addVesting} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une ligne de vesting
          </Button>

          {/* Disclaimer vestings */}
          <p className="text-xs text-muted-foreground italic mt-4">
            Les périodes de vesting pré-remplies sont calculées sur la base des paramètres saisis. Vérifiez chaque date et nombre d'actions avec votre contrat d'attribution RSU.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
          {isEditing ? 'Enregistrer les modifications' : 'Créer le plan'}
        </Button>
      </div>

      {/* Confirmation régénération */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regénérer les périodes ?</AlertDialogTitle>
            <AlertDialogDescription>
              Regénérer les périodes effacera les données déjà saisies dans le tableau. Confirmer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { generateVestings(); setShowRegenerateConfirm(false); }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
