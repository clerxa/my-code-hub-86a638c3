/**
 * VEGA Portfolio Dashboard — Shows a synthetic view of all equity plans
 * with live stock price, total value, and +/- latent gains.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Layers, BarChart3, Minus, CheckCircle2, Clock, Sparkles, Zap, Banknote, AlertTriangle, Lock, Table2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import type { PortfolioSummary, PortfolioPlan } from '@/hooks/useVegaPortfolio';
import { differenceInDays, differenceInMonths, parseISO, isPast } from 'date-fns';
import { useUserFinancialProfile } from '@/hooks/useUserFinancialProfile';

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtCurrencyPrecise = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const TYPE_LABELS: Record<string, string> = {
  rsu: 'RSU',
  espp: 'ESPP',
  bspce: 'BSPCE',
};

const TYPE_COLORS: Record<string, string> = {
  rsu: 'bg-primary/10 text-primary',
  espp: 'bg-secondary/20 text-secondary-foreground',
  bspce: 'bg-accent/15 text-accent-foreground',
};

interface VegaPortfolioDashboardProps {
  portfolio: PortfolioSummary;
}

// ─── Quick fiscal simulation "sell today" ───
interface QuickCessionResult {
  gainBrut: number;
  totalImpots: number;
  gainNet: number;
  tauxEffectif: number;
  regimeLabel: string;
}

function simulateCessionToday(
  plan: PortfolioPlan,
  priceEur: number | null,
  tmi: number,
  fxRate: number,
): QuickCessionResult | null {
  if (!priceEur || priceEur <= 0) return null;

  const tmiRate = tmi / 100;

  if (plan.type === 'rsu') {
    const regimeCode = plan.regimeCode || 'R1';
    const gainAcq = plan.prixAcquisitionEur;
    const prixCessionEur = priceEur;
    const valeurMoyAcqEur = plan.nbActions > 0 ? gainAcq / plan.nbActions : 0;
    const pvCession = Math.max(0, plan.nbActions * (prixCessionEur - valeurMoyAcqEur));

    let irGa = 0, psGa = 0, contribSal = 0;

    if (regimeCode === 'R1') {
      const trancheA = Math.min(gainAcq, 300000);
      const trancheB = Math.max(0, gainAcq - 300000);
      irGa = (trancheA * 0.5 * tmiRate) + (trancheB * tmiRate);
      psGa = (trancheA * 0.172) + (trancheB * 0.097);
      contribSal = trancheB * 0.10;
    } else if (regimeCode === 'R2') {
      let abattement = 0;
      if (plan.vestingEndDate) {
        const lastVesting = new Date(plan.vestingEndDate);
        const diffMs = new Date().getTime() - lastVesting.getTime();
        const dureeAnnees = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        if (dureeAnnees >= 8) abattement = 0.65;
        else if (dureeAnnees >= 2) abattement = 0.50;
      }
      irGa = gainAcq * (1 - abattement) * tmiRate;
      psGa = gainAcq * 0.172;
    } else {
      irGa = gainAcq * tmiRate;
      psGa = gainAcq * 0.097;
      contribSal = gainAcq * 0.10;
    }

    const irPv = pvCession * 0.128;
    const psPv = pvCession * 0.172;

    const totalImpots = irGa + psGa + contribSal + irPv + psPv;
    const gainBrut = gainAcq + pvCession;
    const gainNet = gainBrut - totalImpots;

    const regimeLabels: Record<string, string> = {
      R1: 'Qualifié · seuil 300k€',
      R2: 'Qualifié · abattement durée',
      R3: 'Non qualifié · barème',
    };

    return {
      gainBrut,
      totalImpots,
      gainNet,
      tauxEffectif: gainBrut > 0 ? (totalImpots / gainBrut) * 100 : 0,
      regimeLabel: regimeLabels[regimeCode] || regimeCode,
    };
  }

  if (plan.type === 'espp') {
    const p = plan.rawEsppPeriod;
    if (!p) return null;

    const taux = plan.devise === 'USD' ? (p.taux_change_achat || 1) : 1;
    const coursRef = Math.min(p.cours_debut_offre_devise || Infinity, p.cours_achat_devise || Infinity);
    const safeRef = isFinite(coursRef) ? coursRef : 0;
    const prixAchatEffectif = safeRef * (1 - (p.taux_rabais || 15) / 100);
    const rabaisEur = Math.max(0, plan.nbActions * ((p.cours_achat_devise || 0) - prixAchatEffectif) * taux);

    const coursAchatEur = (p.cours_achat_devise || 0) / fxRate;
    const pvBrute = Math.max(0, plan.nbActions * (priceEur - coursAchatEur));

    const irRabais = rabaisEur * tmiRate;
    const psRabais = rabaisEur * 0.097;
    const pfuPv = pvBrute * 0.30;

    const totalImpots = irRabais + psRabais + pfuPv;
    const gainBrut = rabaisEur + pvBrute;
    const gainNet = gainBrut - totalImpots;

    return {
      gainBrut,
      totalImpots,
      gainNet,
      tauxEffectif: gainBrut > 0 ? (totalImpots / gainBrut) * 100 : 0,
      regimeLabel: 'ESPP §423 · Rabais + PFU',
    };
  }

  if (plan.type === 'bspce') {
    const d = plan.rawBspceData;
    if (!d) return null;

    const prixExercice = d.prix_exercice || 0;
    const gainBrut = Math.max(0, (priceEur - prixExercice) * plan.nbActions);

    const dateEntree = d.date_entree_societe ? new Date(d.date_entree_societe) : new Date();
    const diffMs = new Date().getTime() - dateEntree.getTime();
    const ancienneteMois = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    const isPfu = ancienneteMois >= 36;

    let totalImpots: number;
    if (isPfu) {
      totalImpots = gainBrut * 0.30;
    } else {
      totalImpots = gainBrut * (tmiRate + 0.172);
    }

    const gainNet = gainBrut - totalImpots;

    return {
      gainBrut,
      totalImpots,
      gainNet,
      tauxEffectif: gainBrut > 0 ? (totalImpots / gainBrut) * 100 : 0,
      regimeLabel: isPfu ? 'PFU 30% (> 3 ans)' : `Barème ${tmi}% + PS (< 3 ans)`,
    };
  }

  return null;
}

// ─── FIFO helper: compute which vestings are affected ───
function computeFifoDetail(plan: PortfolioPlan, nbToSell: number): { date: string; nb: number }[] {
  if (plan.type === 'rsu' && plan.rawVestings) {
    const sorted = [...plan.rawVestings]
      .filter((v: any) => v.date)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Account for already sold shares
    let alreadySold = plan.nbActionsCedees;
    const available: { date: string; nb: number }[] = [];
    for (const v of sorted) {
      const nb = v.nb_rsu || 0;
      if (alreadySold >= nb) {
        alreadySold -= nb;
        continue;
      }
      available.push({ date: v.date, nb: nb - alreadySold });
      alreadySold = 0;
    }

    // Now consume from available for the new sale
    let remaining = nbToSell;
    const result: { date: string; nb: number }[] = [];
    for (const a of available) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, a.nb);
      result.push({ date: a.date, nb: take });
      remaining -= take;
    }
    return result;
  }
  return [{ date: plan.vestingStartDate || plan.createdAt, nb: nbToSell }];
}

function StockTickers({ portfolio }: { portfolio: PortfolioSummary }) {
  if (portfolio.tickers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />
        <CardContent className="py-4 px-5">
          <p className="text-xs text-muted-foreground mb-3">Cours de l'action</p>
          <div className="flex flex-wrap gap-4">
            {portfolio.tickers.map((t) => {
              const currencySymbol = t.summary.currency === 'USD' ? '$' : '€';
              const nativePrice = t.summary.currentPrice ?? 0;
              const fmtNative = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(nativePrice);
              return (
                <div key={t.ticker} className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-foreground">
                        {fmtNative} {currencySymbol}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px]">{t.ticker}</Badge>
                    </div>
                    {t.summary.currency !== 'EUR' && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        ≈ {fmtCurrencyPrecise(t.priceEur)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryCards({ portfolio }: { portfolio: PortfolioSummary }) {
  const pv = portfolio.plusValueLatente;
  const pvPercent = portfolio.totalCostBasisEur > 0 && pv !== null
    ? (pv / portfolio.totalCostBasisEur) * 100
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid gap-4 sm:grid-cols-3"
    >
      <Card className="bg-card/80 border-border/40 backdrop-blur-sm">
        <CardContent className="pt-5 pb-4 px-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Valeur totale</p>
          {portfolio.totalValueEur !== null ? (
            <p className="text-2xl font-bold text-foreground">{fmtCurrency(portfolio.totalValueEur)}</p>
          ) : (
            <Skeleton className="h-8 w-32" />
          )}
          <p className="text-xs text-muted-foreground">{portfolio.totalShares} actions</p>
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border/40 backdrop-blur-sm">
        <CardContent className="pt-5 pb-4 px-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">+/- Value latente</p>
          {pv !== null ? (
            <>
              <div className="flex items-center gap-2">
                {pv > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : pv < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground" />
                )}
                <p className={`text-2xl font-bold ${pv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {pv > 0 ? '+' : ''}{fmtCurrency(pv)}
                </p>
              </div>
              {pvPercent !== null && (
                <p className={`text-xs font-medium ${pv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {pv > 0 ? '+' : ''}{pvPercent.toFixed(1)}%
                </p>
              )}
            </>
          ) : (
            <Skeleton className="h-8 w-28" />
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border/40 backdrop-blur-sm">
        <CardContent className="pt-5 pb-4 px-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Coût d'acquisition</p>
          <p className="text-2xl font-bold text-foreground">{fmtCurrency(portfolio.totalCostBasisEur)}</p>
          <p className="text-xs text-muted-foreground">Base fiscale</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VestingStatus({ plan }: { plan: PortfolioPlan }) {
  if (!plan.vestingEndDate) return null;

  const now = new Date();
  const endDate = parseISO(plan.vestingEndDate);

  if (plan.isVestingComplete) {
    const daysSince = differenceInDays(now, endDate);
    const monthsSince = differenceInMonths(now, endDate);
    const timeAgo = monthsSince >= 1
      ? `${monthsSince} mois`
      : `${daysSince} jour${daysSince > 1 ? 's' : ''}`;

    return (
      <div className="flex items-center gap-1.5 text-[11px]">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        <span className="text-green-600 dark:text-green-400 font-medium">
          Vesting terminé
        </span>
        <span className="text-muted-foreground">
          · depuis {timeAgo}
        </span>
      </div>
    );
  }

  const daysLeft = differenceInDays(endDate, now);
  const monthsLeft = differenceInMonths(endDate, now);
  const timeLeft = monthsLeft >= 1
    ? `${monthsLeft} mois`
    : `${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;

  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <Clock className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-amber-600 dark:text-amber-400 font-medium">
        Vesting en cours
      </span>
      <span className="text-muted-foreground">
        · {timeLeft} restant{monthsLeft >= 1 ? 's' : ''}
      </span>
    </div>
  );
}

function CessionReveal({ plan, getPriceEur, tmi, fxRate }: { plan: PortfolioPlan; getPriceEur: (ticker: string) => number | null; tmi: number; fxRate: number }) {
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<QuickCessionResult | null>(null);

  const handleReveal = () => {
    const priceEur = plan.ticker ? getPriceEur(plan.ticker) : null;
    const res = simulateCessionToday(plan, priceEur, tmi, fxRate);
    setResult(res);
    setRevealed(true);
  };

  // Block if vesting not complete
  if (!plan.isVestingComplete) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="w-full text-xs gap-1.5 border-border/50 text-muted-foreground cursor-not-allowed opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                Simuler la cession ce jour
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Le vesting doit être terminé pour simuler une cession</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!revealed) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
        onClick={handleReveal}
      >
        <Zap className="h-3.5 w-3.5" />
        Simuler la cession ce jour
      </Button>
    );
  }

  if (!result) {
    return (
      <div className="text-[11px] text-muted-foreground italic text-center py-2">
        Données insuffisantes pour simuler
      </div>
    );
  }

  const isPositive = result.gainNet >= 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative overflow-hidden rounded-xl"
      >
        <div className={`absolute inset-0 ${isPositive
          ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 dark:from-green-500/20 dark:via-emerald-500/10 dark:to-teal-500/20'
          : 'bg-gradient-to-br from-red-500/10 via-orange-500/5 to-red-500/10 dark:from-red-500/20 dark:via-orange-500/10 dark:to-red-500/20'
        }`} />

        {isPositive && (
          <>
            <motion.div
              className="absolute top-1 right-3 text-yellow-400/60"
              animate={{ rotate: [0, 180, 360], scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-3 w-3" />
            </motion.div>
            <motion.div
              className="absolute bottom-2 left-4 text-yellow-400/40"
              animate={{ rotate: [360, 180, 0], scale: [1, 0.7, 1], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <Sparkles className="h-2.5 w-2.5" />
            </motion.div>
          </>
        )}

        <div className="relative p-3 space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Gain net estimé
            </p>
            <motion.p
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              className={`text-xl font-black font-mono tracking-tight ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
            >
              {isPositive ? '+' : ''}{fmtCurrency(result.gainNet)}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-3 gap-1 text-center"
          >
            <div>
              <p className="text-[9px] text-muted-foreground">Brut</p>
              <p className="text-[11px] font-semibold font-mono text-foreground">{fmtCurrency(result.gainBrut)}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Impôts</p>
              <p className="text-[11px] font-semibold font-mono text-red-500 dark:text-red-400">-{fmtCurrency(result.totalImpots)}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">Taux eff.</p>
              <p className="text-[11px] font-semibold font-mono text-foreground">{result.tauxEffectif.toFixed(1)}%</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-center"
          >
            <Badge variant="outline" className="text-[9px] font-normal text-muted-foreground">
              {result.regimeLabel}
            </Badge>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Declare Cession Dialog ───
function DeclareCessionDialog({ plan, portfolio }: { plan: PortfolioPlan; portfolio: PortfolioSummary }) {
  const [open, setOpen] = useState(false);
  const [nbActions, setNbActions] = useState<string>('');
  const nbParsed = parseInt(nbActions) || 0;

  const fifoDetail = nbParsed > 0 ? computeFifoDetail(plan, nbParsed) : [];
  const isValid = nbParsed > 0 && nbParsed <= plan.nbActions;

  const handleSubmit = async () => {
    if (!isValid) return;
    const priceEur = plan.ticker ? portfolio.getPriceEur(plan.ticker) : null;
    await portfolio.declareCession(plan.id, plan.simulationId, nbParsed, priceEur || undefined);
    setOpen(false);
    setNbActions('');
  };

  if (!plan.isVestingComplete || plan.nbActions <= 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs gap-1.5 border-primary/30 text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
        >
          <Banknote className="h-3.5 w-3.5" />
          Déclarer une cession
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Déclarer une cession
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{plan.label}</span>
            {' · '}{plan.nbActions} action{plan.nbActions > 1 ? 's' : ''} restante{plan.nbActions > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nb-actions">Nombre d'actions cédées</Label>
            <Input
              id="nb-actions"
              type="number"
              min={1}
              max={plan.nbActions}
              value={nbActions}
              onChange={(e) => setNbActions(e.target.value)}
              placeholder={`Max ${plan.nbActions}`}
              className="font-mono"
            />
            {nbParsed > plan.nbActions && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Maximum {plan.nbActions} actions disponibles
              </p>
            )}
          </div>

          {/* FIFO preview */}
          {fifoDetail.length > 0 && isValid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2"
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Détail FIFO (First In, First Out)
              </p>
              <p className="text-[10px] text-muted-foreground">
                Les actions les plus anciennes sont cédées en priorité
              </p>
              <div className="space-y-1">
                {fifoDetail.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Vesting du {new Date(d.date).toLocaleDateString('fr-FR')}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {d.nb} action{d.nb > 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {plan.nbActionsCedees > 0 && (
            <p className="text-[10px] text-muted-foreground italic">
              {plan.nbActionsCedees} action{plan.nbActionsCedees > 1 ? 's' : ''} déjà cédée{plan.nbActionsCedees > 1 ? 's' : ''} sur ce plan
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            size="sm"
            disabled={!isValid || portfolio.isDeclaring}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            {portfolio.isDeclaring ? 'Enregistrement…' : 'Confirmer la cession'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({ plan, getPriceEur, tmi, fxRate, portfolio }: { plan: PortfolioPlan; getPriceEur: (ticker: string) => number | null; tmi: number; fxRate: number; portfolio: PortfolioSummary }) {
  const navigate = useNavigate();
  const priceEur = plan.ticker ? getPriceEur(plan.ticker) : null;
  const currentValue = priceEur !== null && plan.type !== 'bspce'
    ? plan.nbActions * priceEur
    : null;
  const pv = currentValue !== null ? currentValue - plan.prixAcquisitionEur : null;

  const routeMap: Record<string, string> = {
    rsu: '/simulateur-rsu',
    espp: '/simulateur-espp',
    bspce: '/simulateur-bspce',
  };

  const handleOpen = () => {
    const base = routeMap[plan.type];
    navigate(`${base}?load=${plan.simulationId}`);
  };

  let vestingDuration: string | null = null;
  if (plan.vestingStartDate && plan.vestingEndDate) {
    const months = differenceInMonths(parseISO(plan.vestingEndDate), parseISO(plan.vestingStartDate));
    vestingDuration = months >= 12
      ? `${Math.round(months / 12)} an${Math.round(months / 12) > 1 ? 's' : ''}`
      : `${months} mois`;
  }

  return (
    <Card className="bg-card/60 border-border/40 backdrop-blur-sm hover:shadow-md transition-shadow group">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${TYPE_COLORS[plan.type]} text-[10px] font-semibold`}>
                {TYPE_LABELS[plan.type]}
              </Badge>
              {plan.ticker && (
                <Badge variant="outline" className="font-mono text-[10px]">{plan.ticker}</Badge>
              )}
              {plan.regime && (
                <Badge variant="secondary" className="text-[10px]">{plan.regime}</Badge>
              )}
              {plan.nbActionsCedees > 0 && (
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">
                  {plan.nbActionsCedees} cédée{plan.nbActionsCedees > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <CardTitle className="text-sm font-medium truncate">{plan.label}</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <VestingStatus plan={plan} />
              {vestingDuration && (
                <span className="text-[10px] text-muted-foreground">
                  Durée : {vestingDuration}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Actions</p>
            <p className="font-semibold font-mono text-foreground">
              {plan.nbActions}
              {plan.nbActionsCedees > 0 && (
                <span className="text-muted-foreground font-normal text-[10px] ml-1">
                  / {plan.nbActionsOriginal}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Coût acquisition</p>
            <p className="font-semibold font-mono text-foreground">{fmtCurrency(plan.prixAcquisitionEur)}</p>
          </div>
          {currentValue !== null && (
            <>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Valeur actuelle</p>
                <p className="font-semibold font-mono text-foreground">{fmtCurrency(currentValue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">+/- Value</p>
                <p className={`font-semibold font-mono ${pv! >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {pv! > 0 ? '+' : ''}{fmtCurrency(pv!)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Simulate sale today */}
        <CessionReveal plan={plan} getPriceEur={getPriceEur} tmi={tmi} fxRate={fxRate} />

        {/* Declare cession */}
        <DeclareCessionDialog plan={plan} portfolio={portfolio} />

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-primary"
          onClick={handleOpen}
        >
          Ouvrir le plan →
        </Button>
      </CardContent>
    </Card>
  );
}

export function VegaPortfolioDashboard({ portfolio }: VegaPortfolioDashboardProps) {
  const navigate = useNavigate();
  const { profile } = useUserFinancialProfile();

  const tmi = profile?.tmi || 30;
  const fxRate = portfolio.tickers.find(t => t.fxRate !== 1)?.fxRate || 1;

  if (portfolio.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const grouped = portfolio.plans.reduce<Record<string, PortfolioPlan[]>>((acc, p) => {
    acc[p.type] = acc[p.type] || [];
    acc[p.type].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {portfolio.tickers.length > 0 && <StockTickers portfolio={portfolio} />}

      <SummaryCards portfolio={portfolio} />

      {/* Recap link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => navigate('/employee/vega/recap')}
        >
          <Table2 className="h-3.5 w-3.5" />
          Voir le récapitulatif complet des vestings
        </Button>
      </motion.div>

      {Object.entries(grouped).map(([type, plans], idx) => (
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + idx * 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {TYPE_LABELS[type]} · {plans.length} plan{plans.length > 1 ? 's' : ''}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                const routes: Record<string, string> = { rsu: '/simulateur-rsu', espp: '/simulateur-espp', bspce: '/simulateur-bspce' };
                navigate(routes[type]);
              }}
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              Simuler
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} getPriceEur={portfolio.getPriceEur} tmi={tmi} fxRate={fxRate} portfolio={portfolio} />
            ))}
          </div>
        </motion.div>
      ))}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-[11px] text-muted-foreground/70 italic text-center"
      >
        Valeurs indicatives basées sur le cours de bourse actuel et votre TMI ({tmi}%). Ne constitue pas un conseil fiscal.
      </motion.p>
    </div>
  );
}
