/**
 * Éditeur de période ESPP — Formulaire complet
 * Recherche entreprise + dates/cours + calculs intermédiaires temps réel
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, CheckCircle2, HelpCircle, RefreshCw, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { searchSymbols, fetchStockPricesBatch, fetchFxRate, type SymbolSearchResult } from '@/hooks/useStockData';
import type { ESPPPeriod } from '@/types/esppNew';
import { computeIntermediaire } from '@/utils/esppCalculations';

const fmtEur = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
const fmtDevise = (v: number, d: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: d, maximumFractionDigits: 2 }).format(v);

function generateId() {
  return crypto.randomUUID();
}

function createEmptyPeriod(): ESPPPeriod {
  return {
    id: generateId(),
    entreprise_nom: '',
    entreprise_ticker: '',
    entreprise_devise: 'USD',
    taux_rabais: 15,
    date_debut_offre: '',
    date_achat: '',
    cours_debut_offre_devise: 0,
    cours_achat_devise: 0,
    taux_change_achat: 1,
    nb_actions_achetees: 0,
    has_sold: false,
    date_cession: '',
    prix_cession_devise: 0,
    taux_change_cession: 1,
  };
}

interface ESPPPeriodEditorProps {
  period?: ESPPPeriod;
  onSave: (period: ESPPPeriod) => void;
  onCancel: () => void;
}

export function ESPPPeriodEditor({ period, onSave, onCancel }: ESPPPeriodEditorProps) {
  const [data, setData] = useState<ESPPPeriod>(period || createEmptyPeriod());
  const isUSD = data.entreprise_devise === 'USD';

  // ─── Recherche entreprise ───
  const [searchQuery, setSearchQuery] = useState(period?.entreprise_nom || '');
  const [searchResults, setSearchResults] = useState<SymbolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmed, setConfirmed] = useState(!!period?.entreprise_ticker);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || confirmed) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchSymbols(searchQuery);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
      setSearching(false);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, confirmed]);

  const selectSymbol = useCallback((sym: SymbolSearchResult) => {
    setData(prev => ({
      ...prev,
      entreprise_nom: sym.instrument_name,
      entreprise_ticker: sym.symbol,
      entreprise_devise: sym.currency === 'USD' ? 'USD' : 'EUR',
    }));
    setSearchQuery(sym.instrument_name);
    setConfirmed(true);
    setShowDropdown(false);
  }, []);

  const resetSearch = useCallback(() => {
    setConfirmed(false);
    setSearchQuery('');
    setData(prev => ({ ...prev, entreprise_nom: '', entreprise_ticker: '', entreprise_devise: 'USD' }));
  }, []);

  // ─── Auto-fetch cours et taux ───
  const [loadingPrices, setLoadingPrices] = useState(false);

  const handleFetchAll = useCallback(async () => {
    if (!data.entreprise_ticker) return;
    setLoadingPrices(true);

    const dates: string[] = [];
    if (data.date_debut_offre) dates.push(data.date_debut_offre);
    if (data.date_achat) dates.push(data.date_achat);
    if (data.has_sold && data.date_cession) dates.push(data.date_cession);

    if (dates.length === 0) {
      setLoadingPrices(false);
      return;
    }

    try {
      const [prices, fxAchat, fxCession] = await Promise.all([
        fetchStockPricesBatch(data.entreprise_ticker, dates),
        isUSD && data.date_achat ? fetchFxRate(data.date_achat) : Promise.resolve(null),
        isUSD && data.has_sold && data.date_cession ? fetchFxRate(data.date_cession) : Promise.resolve(null),
      ]);

      setData(prev => {
        const updated = { ...prev };
        if (data.date_debut_offre && prices[data.date_debut_offre]?.price) {
          updated.cours_debut_offre_devise = Math.round(prices[data.date_debut_offre].price! * 100) / 100;
        }
        if (data.date_achat && prices[data.date_achat]?.price) {
          updated.cours_achat_devise = Math.round(prices[data.date_achat].price! * 100) / 100;
        }
        if (data.has_sold && data.date_cession && prices[data.date_cession]?.price) {
          updated.prix_cession_devise = Math.round(prices[data.date_cession].price! * 100) / 100;
        }
        if (fxAchat?.rate) {
          updated.taux_change_achat = Math.round(fxAchat.rate * 10000) / 10000;
        }
        if (fxCession?.rate) {
          updated.taux_change_cession = Math.round(fxCession.rate * 10000) / 10000;
        }
        return updated;
      });
    } catch {
      // silently fail
    }
    setLoadingPrices(false);
  }, [data.entreprise_ticker, data.date_debut_offre, data.date_achat, data.date_cession, data.has_sold, isUSD]);

  // ─── Calculs intermédiaires ───
  const inter = useMemo(() => {
    if (!data.cours_debut_offre_devise || !data.cours_achat_devise || !data.nb_actions_achetees) return null;
    return computeIntermediaire(data);
  }, [data]);

  // ─── Validation ───
  const isValid = confirmed && data.nb_actions_achetees > 0 && data.taux_rabais > 0
    && data.cours_debut_offre_devise > 0 && data.cours_achat_devise > 0
    && data.date_debut_offre && data.date_achat
    && (!isUSD || data.taux_change_achat > 0);

  const handleSave = () => {
    if (!isValid) return;
    onSave(data);
  };

  const deviseSymbol = data.entreprise_devise === 'USD' ? '$' : '€';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Section A — Entreprise */}
      <Card className="relative z-20 overflow-visible">
        <CardHeader>
          <CardTitle className="text-lg">Entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-visible">
          <div className="relative" ref={dropdownRef}>
            <Label>Rechercher votre entreprise</Label>
            <div className="relative mt-1.5">
              <Input
                placeholder="Ex: Salesforce, Microsoft, Apple…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setConfirmed(false); }}
                className="pr-10"
                disabled={confirmed}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> :
                 confirmed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                 <Search className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
            {confirmed && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{data.entreprise_nom} ({data.entreprise_ticker}) · {data.entreprise_devise}</span>
                <button onClick={resetSearch} className="ml-auto text-xs text-muted-foreground underline">
                  Changer
                </button>
              </div>
            )}
            {showDropdown && !confirmed && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(sym => (
                  <button
                    key={`${sym.symbol}-${sym.exchange}`}
                    onClick={() => selectSymbol(sym)}
                    className="w-full text-left px-4 py-2.5 hover:bg-accent/50 text-sm"
                  >
                    <div className="font-medium">{sym.instrument_name}</div>
                    <div className="text-xs text-muted-foreground">{sym.symbol} · {sym.exchange} · {sym.currency}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section B — Paramètres du plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres du plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Taux de rabais (%)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Le taux de décote appliqué par votre entreprise sur le prix d'achat. Vérifiez dans vos documents de plan.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                min={1}
                max={15}
                value={data.taux_rabais || ''}
                onChange={e => setData(prev => ({ ...prev, taux_rabais: Math.min(15, Math.max(0, Number(e.target.value))) }))}
                placeholder="ex. 15"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre d'actions achetées</Label>
              <Input
                type="number"
                min={1}
                value={data.nb_actions_achetees || ''}
                onChange={e => setData(prev => ({ ...prev, nb_actions_achetees: Math.max(0, parseInt(e.target.value) || 0) }))}
                placeholder="ex. 50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section C — Dates et cours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Dates et cours</CardTitle>
            {data.entreprise_ticker && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFetchAll}
                disabled={loadingPrices}
                title="Récupérer les cours automatiquement"
              >
                {loadingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2 font-medium">Événement</th>
                  <th className="text-left py-2 px-2 font-medium">Date</th>
                  <th className="text-left py-2 px-2 font-medium">Cours ({deviseSymbol})</th>
                  {isUSD && <th className="text-left py-2 pl-2 font-medium">Taux €/$</th>}
                </tr>
              </thead>
              <tbody>
                {/* Début de l'offre */}
                <tr className="border-b">
                  <td className="py-3 pr-2 text-muted-foreground whitespace-nowrap">Début période d'offre</td>
                  <td className="py-3 px-2">
                    <Input
                      type="date"
                      value={data.date_debut_offre}
                      onChange={e => setData(prev => ({ ...prev, date_debut_offre: e.target.value }))}
                      className="w-[160px]"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={data.cours_debut_offre_devise ? data.cours_debut_offre_devise.toFixed(2).replace('.', ',') : ''}
                      onChange={e => {
                        const num = parseFloat(e.target.value.replace(',', '.'));
                        setData(prev => ({ ...prev, cours_debut_offre_devise: isNaN(num) ? 0 : num }));
                      }}
                      placeholder="0,00"
                      className="w-[120px]"
                    />
                  </td>
                  {isUSD && <td className="py-3 pl-2"><span className="text-muted-foreground text-xs">—</span></td>}
                </tr>
                {/* Achat effectif */}
                <tr className="border-b">
                  <td className="py-3 pr-2 text-muted-foreground whitespace-nowrap">Achat effectif</td>
                  <td className="py-3 px-2">
                    <Input
                      type="date"
                      value={data.date_achat}
                      onChange={e => setData(prev => ({ ...prev, date_achat: e.target.value }))}
                      className="w-[160px]"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={data.cours_achat_devise ? data.cours_achat_devise.toFixed(2).replace('.', ',') : ''}
                      onChange={e => {
                        const num = parseFloat(e.target.value.replace(',', '.'));
                        setData(prev => ({ ...prev, cours_achat_devise: isNaN(num) ? 0 : num }));
                      }}
                      placeholder="0,00"
                      className="w-[120px]"
                    />
                  </td>
                  {isUSD && (
                    <td className="py-3 pl-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={data.taux_change_achat ? data.taux_change_achat.toFixed(4).replace('.', ',') : ''}
                        onChange={e => {
                          const num = parseFloat(e.target.value.replace(',', '.'));
                          setData(prev => ({ ...prev, taux_change_achat: isNaN(num) ? 0 : num }));
                        }}
                        placeholder="0,9200"
                        className="w-[110px]"
                      />
                    </td>
                  )}
                </tr>
                {/* Cession */}
                <tr className={!data.has_sold ? 'opacity-50' : ''}>
                  <td className="py-3 pr-2 text-muted-foreground whitespace-nowrap">
                    Cession (vente)
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="date"
                      value={data.date_cession}
                      onChange={e => setData(prev => ({ ...prev, date_cession: e.target.value }))}
                      className="w-[160px]"
                      disabled={!data.has_sold}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={data.prix_cession_devise ? data.prix_cession_devise.toFixed(2).replace('.', ',') : ''}
                      onChange={e => {
                        const num = parseFloat(e.target.value.replace(',', '.'));
                        setData(prev => ({ ...prev, prix_cession_devise: isNaN(num) ? 0 : num }));
                      }}
                      placeholder="0,00"
                      className="w-[120px]"
                      disabled={!data.has_sold}
                    />
                  </td>
                  {isUSD && (
                    <td className="py-3 pl-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={data.taux_change_cession ? data.taux_change_cession.toFixed(4).replace('.', ',') : ''}
                        onChange={e => {
                          const num = parseFloat(e.target.value.replace(',', '.'));
                          setData(prev => ({ ...prev, taux_change_cession: isNaN(num) ? 0 : num }));
                        }}
                        placeholder="0,9200"
                        className="w-[110px]"
                        disabled={!data.has_sold}
                      />
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <Switch
              checked={data.has_sold}
              onCheckedChange={checked => setData(prev => ({ ...prev, has_sold: checked }))}
            />
            <Label className="cursor-pointer text-sm">
              {data.has_sold ? 'J\'ai vendu mes actions' : 'Je n\'ai pas encore vendu'}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Section D — Résumé calculs intermédiaires */}
      {inter && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Résumé des calculs intermédiaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cours de référence retenu</span>
              <span className="font-medium">{fmtDevise(inter.cours_reference_devise, data.entreprise_devise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix d'achat après décote ({data.taux_rabais}%)</span>
              <span className="font-medium">{fmtDevise(inter.prix_achat_effectif_devise, data.entreprise_devise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix d'achat converti en €</span>
              <span className="font-medium">{fmtEur(inter.prix_achat_effectif_eur)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valeur de marché à l'achat</span>
              <span className="font-medium">{fmtEur(inter.valeur_marche_achat_eur)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold text-primary">
              <span>Rabais imposable (salaire)</span>
              <span>{fmtEur(inter.rabais_eur)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={!isValid} className="flex-1 gap-2">
          Enregistrer la période
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
