/**
 * Écran 2 — Création / Modification d'un plan RSU
 * Avec : recherche entreprise autocomplete, auto-fetch cours/taux, R3 encadré
 * Auto-naming, année d'attribution → régime fiscal, devise auto-notice, wow effect
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, HelpCircle, ExternalLink, RefreshCw, Info, Search, Loader2, AlertCircle, CheckCircle2, TrendingUp, Download, Sparkles } from 'lucide-react';
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
import { REGIME_LABELS, REGIME_SHORT_LABELS, inferRegimeFromYear, regimeNeedsConservationDate, isQualifiedRegime, migrateOldRegime } from '@/types/rsu';
import { searchSymbols, fetchStockPricesBatch, fetchFxRate, fetchStockSummary, type SymbolSearchResult } from '@/hooks/useStockData';
import { useCompanyTicker } from '@/hooks/useCompanyTicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

function generateId() {
  return crypto.randomUUID();
}

function createEmptyVesting(): VestingLine {
  return { id: generateId(), date: '', nb_rsu: 0, cours: 0, taux_change: 1, gain_eur: 0 };
}

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
  monthly: 12, quarterly: 4, semiannual: 2, annual: 1,
};

const FREQUENCY_MONTHS: Record<Exclude<VestingFrequency, 'custom'>, number> = {
  monthly: 1, quarterly: 3, semiannual: 6, annual: 12,
};

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6];

// inferRegimeFromYear is now imported from @/types/rsu

interface RSUPlanEditorProps {
  plan?: RSUPlan;
  onSave: (plan: RSUPlan) => void;
  onCancel: () => void;
}

// --- Company Search Autocomplete with confirmation card ---
interface SelectedCompany {
  name: string;
  ticker: string;
  exchange: string;
  currency: string;
  country: string;
}

function CompanySearch({
  value,
  ticker,
  onSelect,
  onReset,
  selected,
  locked = false,
}: {
  value: string;
  ticker?: string;
  onSelect: (name: string, ticker: string, currency: string, exchange: string, country: string) => void;
  onReset: () => void;
  selected: SelectedCompany | null;
  locked?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchSymbols(text);
      setResults(res);
      setShowDropdown(res.length > 0);
      setIsSearching(false);
    }, 350);
  };

  const handleSelect = (r: SymbolSearchResult) => {
    setQuery(r.instrument_name);
    setShowDropdown(false);
    onSelect(r.instrument_name, r.symbol, r.currency, r.exchange, r.country);
  };

  const handleSearchAgain = () => {
    setQuery('');
    setResults([]);
    onReset();
  };

  if (selected) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-green-800 dark:text-green-300 text-sm">Entreprise identifiée</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div>
              <span className="text-muted-foreground">Nom complet</span>
              <p className="font-medium">{selected.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Ticker</span>
              <p className="font-mono font-semibold">{selected.ticker}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Bourse</span>
              <p className="font-medium">{selected.exchange}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Devise</span>
              <p className="font-medium">{selected.currency}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Pays</span>
              <p className="font-medium">{selected.country}</p>
            </div>
          </div>
        </div>
        {!locked && (
          <button
            type="button"
            onClick={handleSearchAgain}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Ce n'est pas la bonne entreprise ? Recherchez à nouveau
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Rechercher (ex: Salesforce, Google…)"
          className="pl-9 h-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.symbol}-${r.exchange}-${i}`}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between"
              onClick={() => handleSelect(r)}
            >
              <span>
                <span className="font-medium">{r.instrument_name}</span>
                <span className="text-muted-foreground"> — {r.symbol}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {r.exchange} · {r.currency}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Vesting Row ---
function VestingRow({
  v,
  devise,
  showFx,
  onUpdate,
  onRemove,
  canRemove,
  fetchStatus,
}: {
  v: VestingLine & { gain_eur: number };
  devise: RSUDevise;
  showFx: boolean;
  onUpdate: (id: string, field: keyof VestingLine, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  fetchStatus?: { loadingCours?: boolean; loadingFx?: boolean; coursError?: string; fxError?: string; coursNote?: string; fxNote?: string };
}) {
  const status = fetchStatus || {};

  return (
    <TableRow>
      <TableCell>
        <Input
          type="date"
          value={v.date}
          onChange={e => onUpdate(v.id, 'date', e.target.value)}
          className="h-9"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step="any"
          value={v.nb_rsu || ''}
          onChange={e => onUpdate(v.id, 'nb_rsu', Number(e.target.value))}
          className="h-9"
        />
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={v.cours ? v.cours.toFixed(2).replace('.', ',') : ''}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    const num = parseFloat(val);
                    if (!isNaN(num) || val === '' || val === '0') onUpdate(v.id, 'cours', isNaN(num) ? 0 : num);
                  }}
                  placeholder="0,00"
                  className={`h-9 ${status.coursError ? 'border-destructive' : ''} ${status.loadingCours ? 'pr-8' : ''}`}
                />
                {status.loadingCours && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
            </TooltipTrigger>
            {v.cours > 0 && !status.coursError && (
              <TooltipContent side="top" className="text-xs">
                Cours de clôture source Twelve Data
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        {status.coursError && <p className="text-[10px] text-destructive mt-0.5">{status.coursError}</p>}
        {status.coursNote && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{status.coursNote}</p>}
      </TableCell>
      {showFx && (
        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={v.taux_change && v.taux_change !== 1 ? v.taux_change.toFixed(4).replace('.', ',') : v.taux_change === 1 ? '1,0000' : ''}
                    onChange={e => {
                      const val = e.target.value.replace(',', '.');
                      const num = parseFloat(val);
                      if (!isNaN(num) || val === '' || val === '0') onUpdate(v.id, 'taux_change', isNaN(num) ? 0 : num);
                    }}
                    placeholder="0,0000"
                    className={`h-9 ${status.fxError ? 'border-destructive' : ''} ${status.loadingFx ? 'pr-8' : ''}`}
                  />
                  {status.loadingFx && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
              </TooltipTrigger>
              {v.taux_change > 0 && v.taux_change !== 1 && !status.fxError && (
                <TooltipContent side="top" className="text-xs">
                  Taux de change source Banque Centrale Européenne
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {status.fxError && <p className="text-[10px] text-destructive mt-0.5">{status.fxError}</p>}
          {status.fxNote && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{status.fxNote}</p>}
        </TableCell>
      )}
      <TableCell className="text-right font-medium">
        {fmt(v.gain_eur)}
      </TableCell>
      <TableCell>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(v.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

// --- Main Editor ---
export function RSUPlanEditor({ plan, onSave, onCancel }: RSUPlanEditorProps) {
  const isEditing = !!plan;
  const { ticker: companyTicker, companyName: companyNameFromDb, loading: tickerLoading } = useCompanyTicker();
  const isCompanyLocked = !!companyTicker;

  const [ticker, setTicker] = useState(plan?.ticker ?? '');
  const [entrepriseNom, setEntrepriseNom] = useState(plan?.entreprise_nom ?? '');
  const [annee, setAnnee] = useState(plan?.annee_attribution ?? currentYear - 1);
  const [regime, setRegime] = useState<RSURegime>(plan?.regime ? migrateOldRegime(plan.regime) : 'AGA_POST2018');
  const [devise, setDevise] = useState<RSUDevise>(plan?.devise ?? 'EUR');
  const [dateFinConservation, setDateFinConservation] = useState(plan?.date_fin_conservation ?? '');
  const [deviseAutoSet, setDeviseAutoSet] = useState(false);
  const [vestings, setVestings] = useState<VestingLine[]>(
    plan?.vestings?.length ? plan.vestings : [createEmptyVesting()]
  );

  // Paramètres de pré-remplissage
  const [startDate, setStartDate] = useState(plan?.vestings?.[0]?.date || '');
  const [frequency, setFrequency] = useState<VestingFrequency>('quarterly');
  const [duration, setDuration] = useState(4);
  const [totalActions, setTotalActions] = useState<number>(0);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(
    plan?.ticker && plan?.entreprise_nom
      ? { name: plan.entreprise_nom, ticker: plan.ticker, exchange: '', currency: plan.devise, country: '' }
      : null
  );

  // Auto-resolve company from user's company ticker
  useEffect(() => {
    if (!tickerLoading && companyTicker && !selectedCompany && !plan) {
      fetchStockSummary(companyTicker).then(summary => {
        if (summary) {
          const name = companyNameFromDb || summary.shortName || companyTicker;
          const currency = summary.currency || 'USD';
          const exchange = summary.exchangeName || '';
          setEntrepriseNom(name);
          setTicker(companyTicker);
          setSelectedCompany({ name, ticker: companyTicker, exchange, currency, country: '' });
          if (currency === 'USD') { setDevise('USD'); setDeviseAutoSet(true); }
          else if (currency === 'EUR') { setDevise('EUR'); setDeviseAutoSet(true); }
        }
      });
    }
  }, [tickerLoading, companyTicker, companyNameFromDb, selectedCompany, plan]);

  const isCustom = frequency === 'custom';

  // Auto-set regime when year changes
  useEffect(() => {
    if (!isEditing) {
      setRegime(inferRegimeFromYear(annee));
    }
  }, [annee, isEditing]);

  const handleCompanySelect = useCallback((name: string, sym: string, currency: string, exchange: string, country: string) => {
    setEntrepriseNom(name);
    setTicker(sym);
    setSelectedCompany({ name, ticker: sym, exchange, currency, country });
    // Auto-set devise based on detected currency
    if (currency === 'USD') { setDevise('USD'); setDeviseAutoSet(true); }
    else if (currency === 'EUR') { setDevise('EUR'); setDeviseAutoSet(true); }
  }, []);

  const handleCompanyReset = useCallback(() => {
    setSelectedCompany(null);
    setEntrepriseNom('');
    setTicker('');
    setDeviseAutoSet(false);
  }, []);

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

    const startD = new Date(startDate);
    const newVestings: VestingLine[] = [];

    for (let i = 0; i < nbPeriodes; i++) {
      const d = new Date(startD.getFullYear(), startD.getMonth() + i * monthsInterval, startD.getDate());
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  // Bulk fetch status per vesting row
  const [fetchStatuses, setFetchStatuses] = useState<Record<string, { loadingCours?: boolean; loadingFx?: boolean; coursError?: string; fxError?: string; coursNote?: string; fxNote?: string }>>({});
  const [isBulkFetching, setIsBulkFetching] = useState(false);
  const [bulkFetchDone, setBulkFetchDone] = useState(false);
  const [showWow, setShowWow] = useState(false);

  const vestingsWithDates = useMemo(() => vestings.filter(v => v.date), [vestings]);
  const canBulkFetch = ticker && vestingsWithDates.length > 0;

  const handleBulkFetch = useCallback(async () => {
    if (!ticker || vestingsWithDates.length === 0) return;
    setIsBulkFetching(true);
    setBulkFetchDone(false);
    setShowWow(false);

    // Set all rows to loading
    const initialStatuses: typeof fetchStatuses = {};
    for (const v of vestingsWithDates) {
      initialStatuses[v.id] = { loadingCours: true, loadingFx: devise === 'USD' };
    }
    setFetchStatuses(initialStatuses);

    // 1 single API call for all stock prices (batch)
    const dates = vestingsWithDates.map(v => v.date);
    const [priceResults, ...fxResults] = await Promise.all([
      fetchStockPricesBatch(ticker, dates),
      ...(devise === 'USD' ? vestingsWithDates.map(v => fetchFxRate(v.date)) : []),
    ]);

    // Map results back to each row
    const finalStatuses: typeof fetchStatuses = {};
    vestingsWithDates.forEach((v, i) => {
      const status: typeof finalStatuses[string] = {};
      const priceResult = priceResults[v.date];

      if (!priceResult || priceResult.error || priceResult.price === null) {
        status.coursError = priceResult?.error || 'Cours non disponible — saisie manuelle requise';
      } else {
        updateVesting(v.id, 'cours', priceResult.price);
        if (!priceResult.isBusinessDay) {
          status.coursNote = 'Cours du dernier jour ouvré utilisé';
        }
      }

      if (devise === 'USD') {
        const fxResult = fxResults[i] as { rate: number | null; isBusinessDay: boolean; error?: string };
        if (!fxResult || fxResult.error || fxResult.rate === null) {
          status.fxError = fxResult?.error || 'Taux non disponible — saisie manuelle requise';
        } else {
          updateVesting(v.id, 'taux_change', fxResult.rate);
          if (!fxResult.isBusinessDay) {
            status.fxNote = 'Taux BCE du dernier jour ouvré utilisé';
          }
        }
      }

      finalStatuses[v.id] = status;
    });

    setFetchStatuses(finalStatuses);
    setIsBulkFetching(false);
    setBulkFetchDone(true);
    setShowWow(true);
    setTimeout(() => setShowWow(false), 3000);
  }, [ticker, vestingsWithDates, devise, updateVesting]);

  const showRoundingNote = useMemo(() => {
    if (isCustom || totalActions <= 0) return false;
    const freqPerYear = FREQUENCY_PER_YEAR[frequency as Exclude<VestingFrequency, 'custom'>];
    const nbPeriodes = duration * freqPerYear;
    return totalActions % nbPeriodes !== 0;
  }, [isCustom, frequency, duration, totalActions]);

  // Auto-generate plan name
  const autoName = useMemo(() => {
    if (!entrepriseNom) return '';
    const datePart = startDate
      ? format(new Date(startDate), 'MMM yyyy', { locale: fr })
      : '';
    return `${entrepriseNom}${datePart ? ` — ${datePart}` : ''}`;
  }, [entrepriseNom, startDate]);

  const handleSubmit = () => {
    const finalName = autoName || 'Plan RSU';
    onSave({
      id: plan?.id ?? generateId(),
      nom: finalName,
      ticker: ticker || undefined,
      entreprise_nom: entrepriseNom || undefined,
      annee_attribution: annee,
      regime,
      devise,
      date_fin_conservation: regimeNeedsConservationDate(regime) ? dateFinConservation || undefined : undefined,
      vestings: computedVestings,
      gain_acquisition_total: totalGain,
    });
  };

  const isValid = computedVestings.some(v => v.nb_rsu > 0 && v.cours > 0) && entrepriseNom.length > 0
    && (!regimeNeedsConservationDate(regime) || dateFinConservation !== '');

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
          <div className="space-y-2 sm:col-span-2">
            <Label>Entreprise</Label>
            <CompanySearch
              value={entrepriseNom}
              ticker={ticker}
              onSelect={handleCompanySelect}
              onReset={handleCompanyReset}
              selected={selectedCompany}
              locked={isCompanyLocked}
            />
          </div>

          {/* Devise notice */}
          {deviseAutoSet && selectedCompany && (
            <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30 py-2 px-3">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                La devise a été automatiquement définie sur <strong>{devise}</strong> d'après la bourse de cotation de {selectedCompany.name}.
              </AlertDescription>
            </Alert>
          )}

          {/* Devise — juste après l'entreprise */}
          <div className="space-y-2 max-w-xs">
            <Label>Devise</Label>
            <Select value={devise} onValueChange={v => { setDevise(v as RSUDevise); setDeviseAutoSet(false); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Année d'attribution + Date fin conservation côte à côte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Année d'attribution du plan</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-sm space-y-2">
                      <p>La fiscalité de vos RSU dépend de la <strong>date d'autorisation de l'AGE</strong> (Assemblée Générale Extraordinaire) qui a approuvé votre plan.</p>
                      <p>En pratique, c'est l'année figurant sur votre lettre d'attribution.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={String(annee)} onValueChange={v => { setAnnee(Number(v)); setRegime(inferRegimeFromYear(Number(v))); }}>
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

            {/* Date de fin de conservation — à côté de l'année */}
            {regimeNeedsConservationDate(regime) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Date de fin de conservation *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-sm space-y-2">
                        <p>La <strong>période de conservation</strong> est la durée pendant laquelle vous ne pouvez pas vendre vos actions après leur acquisition définitive (vesting).</p>
                        <p>Cette date est indiquée dans votre contrat d'attribution. Elle conditionne l'<strong>abattement fiscal</strong> applicable :</p>
                        {regime === 'AGA_POST2018' ? (
                          <p>Pour les AGA post-2018, l'abattement est de <strong>50% fixe</strong> sous le seuil de 300 000 €.</p>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            <li><strong>Vente {'<'} 2 ans</strong> après fin de conservation → 0% d'abattement</li>
                            <li><strong>Vente entre 2 et 8 ans</strong> → 50% d'abattement</li>
                            <li><strong>Vente {'>'} 8 ans</strong> → 65% d'abattement</li>
                          </ul>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="date"
                  value={dateFinConservation}
                  onChange={e => setDateFinConservation(e.target.value)}
                  className="h-10"
                />
                {!dateFinConservation && (
                  <p className="text-xs text-destructive">
                    Obligatoire pour calculer l'abattement fiscal applicable.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Regime deduced — pedagogical display */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">Régime fiscal déduit : <span className="text-primary">{REGIME_SHORT_LABELS[regime]}</span></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {regime === 'AGA_POST2018' && "Abattement fixe de 50% sur le gain d'acquisition sous 300 000 €. Au-delà, imposition au barème comme salaire."}
                {regime === 'AGA_2017' && "Abattement pour durée de détention (0%, 50% ou 65%) sous 300 000 €. Au-delà, barème salaires."}
                {regime === 'AGA_2015_2016' && "Abattement pour durée de détention (0%, 50% ou 65%). Pas de seuil de 300 000 €."}
                {regime === 'AGA_2012_2015' && "Imposition au barème progressif (catégorie salaires). PS à 9,7%. Contribution salariale de 10%."}
                {regime === 'AGA_PRE2012' && "Taux forfaitaire d'IR de 30%. PS à 17,2%. Contribution salariale de 10%."}
                {regime === 'NON_QUALIFIE' && "RSU étranger : imposé comme salaire au vesting (pas de cash reçu). PV de cession au PFU 30%."}
              </p>
              <button
                type="button"
                onClick={() => {
                  const next = regime === 'NON_QUALIFIE' ? inferRegimeFromYear(annee) : 'NON_QUALIFIE';
                  setRegime(next);
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors pl-6"
              >
                {regime === 'NON_QUALIFIE' ? "← Revenir au régime AGA déduit de l'année" : "Mon plan n'est pas qualifié AGA (RSU étranger)"}
              </button>
            </div>
          </div>

          {/* Encadré Non qualifié */}
          {regime === 'NON_QUALIFIE' && (
            <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>Plan non qualifié</strong> — Votre gain d'acquisition sera imposé comme un salaire à chaque vesting, au barème progressif de l'impôt sur le revenu + prélèvements sociaux (9,7%) + contribution salariale (10%). Aucun abattement ni régime de faveur ne s'applique.
              </AlertDescription>
            </Alert>
          )}

          {/* Encadré AGA pré-2012 */}
          {regime === 'AGA_PRE2012' && (
            <Alert className="border-slate-200 bg-slate-50/50 dark:border-slate-900/50 dark:bg-slate-950/30">
              <Info className="h-4 w-4 text-slate-600" />
              <AlertDescription className="text-slate-800 dark:text-slate-200 text-sm">
                <strong>AGA avant 2012</strong> — Le gain d'acquisition est soumis à un taux forfaitaire de 30% + PS à 17,2% + contribution salariale de 10%.
              </AlertDescription>
            </Alert>
          )}

          {regime === 'AGA_2012_2015' && (
            <Alert className="border-purple-200 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/30">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 dark:text-purple-200 text-sm">
                <strong>AGA 2012-2015</strong> — Le gain d'acquisition est soumis au barème progressif IR + PS à 9,7% (CSG 9,2% + CRDS 0,5%) + contribution salariale de 10%. Aucun abattement.
              </AlertDescription>
            </Alert>
          )}

          {autoName && (
            <div className="rounded-md border bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Nom du plan (généré automatiquement)</p>
              <p className="font-medium text-sm">{autoName}</p>
            </div>
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
                type="date"
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
                  <VestingRow
                    key={v.id}
                    v={v}
                    devise={devise}
                    showFx={devise === 'USD'}
                    onUpdate={updateVesting}
                    onRemove={removeVesting}
                    canRemove={computedVestings.length > 1}
                    fetchStatus={fetchStatuses[v.id]}
                  />
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

          {/* Bouton explicite de récupération des données de marché */}
          {canBulkFetch && (
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
                    <p className="font-semibold text-sm">Récupérer automatiquement les données de marché</p>
                    <p className="text-xs text-muted-foreground">
                      Nous allons chercher le <strong>cours de clôture</strong> de {ticker} 
                      {devise === 'USD' && <> et le <strong>taux de change €/$</strong> (BCE)</>} pour chaque date de vesting renseignée.
                      Vous pourrez modifier les valeurs manuellement si nécessaire.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleBulkFetch}
                  disabled={isBulkFetching}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold h-11"
                >
                  {isBulkFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Récupération en cours…
                    </>
                  ) : bulkFetchDone ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Actualiser les cours et taux
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Récupérer les cours{devise === 'USD' ? ' et taux de change' : ''}
                    </>
                  )}
                </Button>
                <AnimatePresence>
                  {bulkFetchDone && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Données récupérées avec succès ! Vérifiez les valeurs et corrigez si besoin.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {!canBulkFetch && ticker === '' && vestingsWithDates.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                Sélectionnez une entreprise ci-dessus pour pouvoir récupérer automatiquement les cours de bourse.
              </AlertDescription>
            </Alert>
          )}

          {showRoundingNote && hasGenerated && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Le nombre d'actions par période a été arrondi. Vérifiez avec votre contrat d'attribution.
            </p>
          )}

          <Button variant="outline" onClick={addVesting} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une ligne de vesting
          </Button>

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
