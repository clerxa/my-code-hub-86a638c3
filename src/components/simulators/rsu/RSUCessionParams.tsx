/**
 * Écran 3 — Paramètres de cession
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RSUPlan, RSUCessionParams as CessionParamsType } from '@/types/rsu';
import { REGIME_COLORS, TMI_OPTIONS } from '@/types/rsu';
import { fetchStockPricesBatch, fetchFxRate } from '@/hooks/useStockData';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const today = () => new Date().toISOString().split('T')[0];

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

  // Get the ticker from plans (use first plan with a ticker)
  const ticker = plans.find(p => p.ticker)?.ticker || '';

  const [dateCession, setDateCession] = useState(today());
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingFx, setLoadingFx] = useState(false);
  const [priceNote, setPriceNote] = useState('');
  const [fxNote, setFxNote] = useState('');

  const handleFetchPrice = async () => {
    if (!ticker || !dateCession) return;
    setLoadingPrice(true);
    setPriceNote('');
    try {
      const results = await fetchStockPricesBatch(ticker, [dateCession]);
      const result = results?.[dateCession];
      if (result?.price) {
        onChange({ ...params, prix_vente: Math.round(result.price * 100) / 100 });
        if (!result.isBusinessDay && result.closestDate) {
          setPriceNote(`Cours du ${new Date(result.closestDate).toLocaleDateString('fr-FR')} (dernier jour ouvré)`);
        } else {
          setPriceNote(`Cours de clôture Yahoo Finance`);
        }
      } else {
        setPriceNote(result?.error || 'Cours non disponible');
      }
    } catch {
      setPriceNote('Erreur lors de la récupération');
    }
    setLoadingPrice(false);
  };

  const handleFetchFx = async () => {
    if (!dateCession) return;
    setLoadingFx(true);
    setFxNote('');
    try {
      const result = await fetchFxRate(dateCession);
      if (result?.rate) {
        onChange({ ...params, taux_change_vente: Math.round(result.rate * 10000) / 10000 });
        if (!result.isBusinessDay) {
          setFxNote('Taux BCE du dernier jour ouvré');
        } else {
          setFxNote('Taux BCE');
        }
      } else {
        setFxNote(result?.error || 'Taux non disponible');
      }
    } catch {
      setFxNote('Erreur lors de la récupération');
    }
    setLoadingFx(false);
  };

  const handleFetchAll = async () => {
    const promises: Promise<void>[] = [];
    if (ticker) promises.push(handleFetchPrice());
    if (hasUSD) promises.push(handleFetchFx());
    await Promise.all(promises);
  };

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
          {/* Date de cession + bouton fetch */}
          {ticker && (
            <div className="space-y-2">
              <Label>Date de cession (pour récupérer les cours)</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateCession}
                  onChange={e => setDateCession(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchAll}
                  disabled={loadingPrice || loadingFx}
                  className="gap-2 whitespace-nowrap"
                >
                  {(loadingPrice || loadingFx) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Récupérer les cours
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Récupère le cours de {ticker} et le taux de change à la date choisie
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prix de vente par action ({deviseLabel})</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={params.prix_vente ? params.prix_vente.toFixed(2).replace('.', ',') : ''}
                onChange={e => {
                  const val = e.target.value.replace(',', '.');
                  const num = parseFloat(val);
                  onChange({ ...params, prix_vente: isNaN(num) ? 0 : num });
                }}
                placeholder="Ex: 150,00"
              />
              {priceNote && (
                <p className={`text-[10px] mt-0.5 ${priceNote.includes('Erreur') || priceNote.includes('non disponible') ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {priceNote}
                </p>
              )}
            </div>

            {hasUSD && (
              <div className="space-y-2">
                <Label>Taux de change €/$ à la vente</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={params.taux_change_vente ? params.taux_change_vente.toFixed(4).replace('.', ',') : ''}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    const num = parseFloat(val);
                    onChange({ ...params, taux_change_vente: isNaN(num) ? 0 : num });
                  }}
                  placeholder="Ex: 0,9200"
                />
                {fxNote && (
                  <p className={`text-[10px] mt-0.5 ${fxNote.includes('Erreur') || fxNote.includes('non disponible') ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {fxNote}
                  </p>
                )}
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
