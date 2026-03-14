/**
 * VEGA Portfolio Dashboard — Shows a synthetic view of all equity plans
 * with live stock price, total value, and +/- latent gains.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Layers, BarChart3, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, Clock, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { PortfolioSummary, PortfolioPlan } from '@/hooks/useVegaPortfolio';
import { differenceInDays, differenceInMonths, format, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUserFinancialProfile } from '@/hooks/useUserFinancialProfile';

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtCurrencyPrecise = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const fmtPercent = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v / 100);

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
  tmi: number, // e.g. 30
  fxRate: number, // USD/EUR rate
): QuickCessionResult | null {
  if (!priceEur || priceEur <= 0) return null;

  const tmiRate = tmi / 100;
  const today = new Date().toISOString().split('T')[0];

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
      // Abattement based on holding duration from last vesting
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
      // R3 — Non qualifié
      irGa = gainAcq * tmiRate;
      psGa = gainAcq * 0.097;
      contribSal = gainAcq * 0.10;
    }

    // PV cession — PFU 30%
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

    // Rabais
    const taux = plan.devise === 'USD' ? (p.taux_change_achat || 1) : 1;
    const coursRef = Math.min(p.cours_debut_offre_devise || Infinity, p.cours_achat_devise || Infinity);
    const safeRef = isFinite(coursRef) ? coursRef : 0;
    const prixAchatEffectif = safeRef * (1 - (p.taux_rabais || 15) / 100);
    const rabaisEur = Math.max(0, plan.nbActions * ((p.cours_achat_devise || 0) - prixAchatEffectif) * taux);

    // PV cession
    const coursAchatEur = (p.cours_achat_devise || 0) / fxRate;
    const pvBrute = Math.max(0, plan.nbActions * (priceEur - coursAchatEur));

    // Fiscal
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

    // Regime based on seniority
    const dateEntree = d.date_entree_societe ? new Date(d.date_entree_societe) : new Date();
    const diffMs = new Date().getTime() - dateEntree.getTime();
    const ancienneteMois = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    const isPfu = ancienneteMois >= 36;

    let totalImpots: number;
    if (isPfu) {
      totalImpots = gainBrut * 0.30; // PFU
    } else {
      totalImpots = gainBrut * (tmiRate + 0.172); // Barème + PS
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
              const change = t.summary.changePercent ?? 0;
              const isUp = change >= 0;
              return (
                <div key={t.ticker} className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {fmtCurrencyPrecise(t.priceEur)}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">{t.ticker}</Badge>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ml-auto ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {change > 0 ? '+' : ''}{change.toFixed(2)}%
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
      {/* Total value */}
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

      {/* +/- Value latente */}
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

      {/* Coût d'acquisition */}
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
  const isComplete = isPast(endDate);

  if (isComplete) {
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
        {/* Gradient background */}
        <div className={`absolute inset-0 ${isPositive
          ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 dark:from-green-500/20 dark:via-emerald-500/10 dark:to-teal-500/20'
          : 'bg-gradient-to-br from-red-500/10 via-orange-500/5 to-red-500/10 dark:from-red-500/20 dark:via-orange-500/10 dark:to-red-500/20'
        }`} />

        {/* Sparkle particles */}
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
          {/* Gain net — hero number */}
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

          {/* Detail row */}
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

          {/* Regime badge */}
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

function PlanCard({ plan, getPriceEur, tmi, fxRate }: { plan: PortfolioPlan; getPriceEur: (ticker: string) => number | null; tmi: number; fxRate: number }) {
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

  // Vesting duration
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
            </div>
            <CardTitle className="text-sm font-medium truncate">{plan.label}</CardTitle>
            {/* Vesting status */}
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
            <p className="font-semibold font-mono text-foreground">{plan.nbActions}</p>
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

  // Get user TMI from financial profile, default 30%
  const tmi = profile?.tmi || 30;
  // Get FX rate from portfolio tickers
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

  // Group plans by type
  const grouped = portfolio.plans.reduce<Record<string, PortfolioPlan[]>>((acc, p) => {
    acc[p.type] = acc[p.type] || [];
    acc[p.type].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Stock tickers */}
      {portfolio.tickers.length > 0 && <StockTickers portfolio={portfolio} />}

      {/* Summary */}
      <SummaryCards portfolio={portfolio} />

      {/* Plans by type */}
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
              <PlanCard key={plan.id} plan={plan} getPriceEur={portfolio.getPriceEur} tmi={tmi} fxRate={fxRate} />
            ))}
          </div>
        </motion.div>
      ))}

      {/* Note */}
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
