/**
 * Écran 3 — Paramètres de cession
 * Date de cession complète, fetch cours/taux avec effet wow, TMI depuis profil
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, HelpCircle, Loader2, Download, CheckCircle2, TrendingUp, UserCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RSUPlan, RSUCessionParams as CessionParamsType } from '@/types/rsu';
import { REGIME_COLORS, TMI_OPTIONS } from '@/types/rsu';
import { fetchStockPricesBatch, fetchFxRate } from '@/hooks/useStockData';
import { useFinancialProfilePrefill } from '@/hooks/useFinancialProfilePrefill';

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
  const ticker = plans.find(p => p.ticker)?.ticker || '';

  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingFx, setLoadingFx] = useState(false);
  const [priceNote, setPriceNote] = useState('');
  const [fxNote, setFxNote] = useState('');
  const [fetchDone, setFetchDone] = useState(false);
  const [showWow, setShowWow] = useState(false);

  // TMI from financial profile
  const { getPrefillData, hasProfile } = useFinancialProfilePrefill();

  useEffect(() => {
    if (hasProfile && !params.tmi_from_profile) {
      const prefill = getPrefillData();
      if (prefill.tmi && prefill.tmi !== 30) {
        onChange({ ...params, tmi: prefill.tmi, tmi_from_profile: true });
      } else if (prefill.tmi) {
        onChange({ ...params, tmi_from_profile: true });
      }
    }
  }, [hasProfile]);

  const handleFetchAll = async () => {
    setFetchDone(false);
    setShowWow(false);
    const promises: Promise<void>[] = [];

    if (ticker && params.date_cession) {
      setLoadingPrice(true);
      setPriceNote('');
      promises.push(
        fetchStockPricesBatch(ticker, [params.date_cession]).then(results => {
          const result = results?.[params.date_cession];
          if (result?.price) {
            onChange({ ...params, prix_vente: Math.round(result.price * 100) / 100 });
            setPriceNote(!result.isBusinessDay && result.closestDate
              ? `Cours du ${new Date(result.closestDate).toLocaleDateString('fr-FR')} (dernier jour ouvré)`
              : 'Cours de clôture Yahoo Finance');
          } else {
            setPriceNote(result?.error || 'Cours non disponible');
          }
        }).catch(() => setPriceNote('Erreur lors de la récupération')).finally(() => setLoadingPrice(false))
      );
    }

    if (hasUSD && params.date_cession) {
      setLoadingFx(true);
      setFxNote('');
      promises.push(
        fetchFxRate(params.date_cession).then(result => {
          if (result?.rate) {
            onChange({ ...params, taux_change_vente: Math.round(result.rate * 10000) / 10000 });
            setFxNote(!result.isBusinessDay ? 'Taux BCE du dernier jour ouvré' : 'Taux BCE');
          } else {
            setFxNote(result?.error || 'Taux non disponible');
          }
        }).catch(() => setFxNote('Erreur lors de la récupération')).finally(() => setLoadingFx(false))
      );
    }

    await Promise.all(promises);
    setFetchDone(true);
    setShowWow(true);
    setTimeout(() => setShowWow(false), 3000);
  };

  const isValid = params.prix_vente > 0 && params.tmi > 0 && params.date_cession
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
          {/* Date de cession */}
          <div className="space-y-2">
            <Label>Date de cession</Label>
            <Input
              type="date"
              value={params.date_cession}
              onChange={e => onChange({ ...params, date_cession: e.target.value })}
            />
          </div>

          {/* Bouton fetch cours/taux */}
          {ticker && params.date_cession && (
            <div className="relative">
              <AnimatePresence>
                {showWow && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -inset-1 rounded-xl bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 blur-sm pointer-events-none z-0"
                  />
                )}
              </AnimatePresence>
              <div className="relative z-10 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">Récupérer les données de marché</p>
                    <p className="text-xs text-muted-foreground">
                      Cours de clôture de <strong>{ticker}</strong>
                      {hasUSD && <> et <strong>taux de change €/$</strong> (BCE)</>} à la date de cession.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleFetchAll}
                  disabled={loadingPrice || loadingFx}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold h-11"
                >
                  {(loadingPrice || loadingFx) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Récupération en cours…
                    </>
                  ) : fetchDone ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Actualiser les cours et taux
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Récupérer le cours{hasUSD ? ' et taux de change' : ''}
                    </>
                  )}
                </Button>
                <AnimatePresence>
                  {fetchDone && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Données récupérées avec succès !
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
              {params.tmi_from_profile && hasProfile && (
                <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30 py-2 px-3">
                  <UserCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                    TMI pré-rempli depuis votre profil financier ({params.tmi}%)
                  </AlertDescription>
                </Alert>
              )}
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
