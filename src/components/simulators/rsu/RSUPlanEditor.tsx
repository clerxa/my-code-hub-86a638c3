/**
 * Écran 2 — Création / Modification d'un plan RSU
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
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

interface RSUPlanEditorProps {
  plan?: RSUPlan; // undefined = création
  onSave: (plan: RSUPlan) => void;
  onCancel: () => void;
}

export function RSUPlanEditor({ plan, onSave, onCancel }: RSUPlanEditorProps) {
  const isEditing = !!plan;

  const [nom, setNom] = useState(plan?.nom ?? '');
  const [annee, setAnnee] = useState(plan?.annee_attribution ?? new Date().getFullYear());
  const [regime, setRegime] = useState<RSURegime>(plan?.regime ?? 'R1');
  const [devise, setDevise] = useState<RSUDevise>(plan?.devise ?? 'EUR');
  const [vestings, setVestings] = useState<VestingLine[]>(
    plan?.vestings?.length ? plan.vestings : [createEmptyVesting()]
  );

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

  const totalActions = useMemo(
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
              <Label htmlFor="plan-annee">Année d'attribution</Label>
              <Input
                id="plan-annee"
                type="number"
                min={2000}
                max={2030}
                value={annee}
                onChange={e => setAnnee(Number(e.target.value))}
              />
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
                  <TableCell className="font-semibold">{totalActions}</TableCell>
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

          <Button variant="outline" onClick={addVesting} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une ligne de vesting
          </Button>
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
    </motion.div>
  );
}
