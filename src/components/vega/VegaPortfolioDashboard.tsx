/**
 * VEGA Portfolio Dashboard — Shows a synthetic view of all equity plans
 * with live stock price, total value, and +/- latent gains.
 */
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Layers, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { PortfolioSummary, PortfolioPlan } from '@/hooks/useVegaPortfolio';

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

function StockTicker({ portfolio }: { portfolio: PortfolioSummary }) {
  const s = portfolio.stockSummary;
  if (!s) return null;

  const change = s.changePercent ?? 0;
  const isUp = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cours de l'action</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold font-mono text-foreground">
                    {fmtCurrencyPrecise(s.currentPrice || 0)}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">{s.ticker}</Badge>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </div>
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

function PlanCard({ plan, currentPriceEur }: { plan: PortfolioPlan; currentPriceEur: number | null }) {
  const navigate = useNavigate();
  const currentValue = currentPriceEur !== null && plan.type !== 'bspce'
    ? plan.nbActions * currentPriceEur
    : null;
  const pv = currentValue !== null ? currentValue - plan.prixAcquisitionEur : null;

  const routeMap: Record<string, string> = {
    rsu: '/simulateur-rsu',
    espp: '/simulateur-espp',
    bspce: '/simulateur-bspce',
  };

  return (
    <Card className="bg-card/60 border-border/40 backdrop-blur-sm hover:shadow-md transition-shadow group">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge className={`${TYPE_COLORS[plan.type]} text-[10px] font-semibold`}>
                {TYPE_LABELS[plan.type]}
              </Badge>
              {plan.ticker && (
                <Badge variant="outline" className="font-mono text-[10px]">{plan.ticker}</Badge>
              )}
            </div>
            <CardTitle className="text-sm font-medium truncate">{plan.label}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-0">
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
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-xs text-muted-foreground hover:text-primary"
          onClick={() => navigate(routeMap[plan.type])}
        >
          Ouvrir le simulateur →
        </Button>
      </CardContent>
    </Card>
  );
}

export function VegaPortfolioDashboard({ portfolio }: VegaPortfolioDashboardProps) {
  const navigate = useNavigate();

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
      {/* Stock ticker */}
      {portfolio.stockSummary && <StockTicker portfolio={portfolio} />}

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
              <PlanCard key={plan.id} plan={plan} currentPriceEur={portfolio.currentPriceEur} />
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
        Valeurs indicatives basées sur le cours de bourse actuel. Ne constitue pas un conseil fiscal.
      </motion.p>
    </div>
  );
}
