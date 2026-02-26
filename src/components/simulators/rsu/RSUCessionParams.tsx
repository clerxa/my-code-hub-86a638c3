/**
 * Écran 3 — Paramètres de cession
 */

import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RSUPlan, RSUCessionParams as CessionParamsType } from '@/types/rsu';
import { REGIME_COLORS, TMI_OPTIONS } from '@/types/rsu';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface RSUCessionParamsProps {
  plans: RSUPlan[];
  params: CessionParamsType;
  onChange: (params: CessionParamsType) => void;
  onSimulate: () => void;
  onBack: () => void;
}

export function RSUCessionParams({ plans, params, onChange, onSimulate, onBack }: RSUCessionParamsProps) {
  const hasUSD = plans.some(p => p.devise === 'USD');
  const allUSD = plans.every(p => p.devise === 'USD');
  const deviseLabel = allUSD ? '$' : hasUSD ? '€ ou $' : '€';

  const isValid = params.prix_vente > 0 && params.tmi > 0 && params.annee_cession > 0
    && (!hasUSD || params.taux_change_vente > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres de cession</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prix de vente par action ({deviseLabel})</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={params.prix_vente || ''}
                onChange={e => onChange({ ...params, prix_vente: Number(e.target.value) })}
                placeholder="Ex: 150.00"
              />
            </div>

            {hasUSD && (
              <div className="space-y-2">
                <Label>Taux de change €/$ à la vente</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.0001}
                  value={params.taux_change_vente || ''}
                  onChange={e => onChange({ ...params, taux_change_vente: Number(e.target.value) })}
                  placeholder="Ex: 0.92"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>TMI (Tranche marginale)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Votre tranche la plus élevée sur vos revenus annuels. En cas de doute, utilisez le simulateur d'impôts Perlib.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={String(params.tmi)}
                onValueChange={v => onChange({ ...params, tmi: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre TMI" />
                </SelectTrigger>
                <SelectContent>
                  {TMI_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Année de cession</Label>
              <Input
                type="number"
                min={2020}
                max={2035}
                value={params.annee_cession || ''}
                onChange={e => onChange({ ...params, annee_cession: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Récap plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plans simulés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Badge className={REGIME_COLORS[plan.regime]}>{plan.regime}</Badge>
                  <div>
                    <p className="font-medium text-sm">{plan.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.vestings.reduce((s, v) => s + v.nb_rsu, 0)} actions · {plan.devise}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-sm">{fmt(plan.gain_acquisition_total)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <Button onClick={onSimulate} disabled={!isValid} className="flex-1 gap-2">
          Calculer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
