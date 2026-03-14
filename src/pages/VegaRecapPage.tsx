/**
 * VEGA Recap — Table view of all vesting lines across plans
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, ArrowUpDown, CheckCircle2, Clock, Table2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { EmployeeLayout } from '@/components/employee/EmployeeLayout';
import { useVegaPortfolio, type PortfolioPlan } from '@/hooks/useVegaPortfolio';
import { Skeleton } from '@/components/ui/skeleton';
import { parseISO, isPast, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtCurrencyUSD = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

interface VestingLine {
  planId: string;
  planLabel: string;
  planType: string;
  ticker: string;
  entreprise: string;
  regime: string;
  dateAttribution: string;
  dateAcquisition: string;
  dateLivraison: string;
  nbActions: number;
  nbActionsCedees: number;
  nbActionsRestantes: number;
  coursAcquisition: number;
  devise: string;
  valorisationEur: number | null;
  isVested: boolean;
}

function extractVestingLines(plans: PortfolioPlan[], getPriceEur: (ticker: string) => number | null): VestingLine[] {
  const lines: VestingLine[] = [];

  for (const plan of plans) {
    if (plan.type === 'rsu' && plan.rawVestings) {
      // Sort vestings chronologically
      const sorted = [...plan.rawVestings]
        .filter((v: any) => v.date)
        .sort((a: any, b: any) => a.date.localeCompare(b.date));

      // Compute FIFO cessions consumed per vesting
      let remaining = plan.nbActionsCedees;

      for (const v of sorted) {
        const nbOrig = v.nb_rsu || 0;
        const consumed = Math.min(remaining, nbOrig);
        remaining = Math.max(0, remaining - consumed);
        const nbRestantes = nbOrig - consumed;

        const priceEur = plan.ticker ? getPriceEur(plan.ticker) : null;
        const isVested = v.date ? isPast(parseISO(v.date)) : false;

        lines.push({
          planId: plan.id,
          planLabel: plan.label,
          planType: 'RSU',
          ticker: plan.ticker,
          entreprise: plan.simulationName || plan.label,
          regime: plan.regime || '-',
          dateAttribution: plan.vestingStartDate || plan.createdAt,
          dateAcquisition: v.date,
          dateLivraison: v.date,
          nbActions: nbOrig,
          nbActionsCedees: consumed,
          nbActionsRestantes: nbRestantes,
          coursAcquisition: v.cours || 0,
          devise: plan.devise,
          valorisationEur: priceEur && nbRestantes > 0 ? nbRestantes * priceEur : null,
          isVested,
        });
      }
    }

    if (plan.type === 'espp' && plan.rawEsppPeriod) {
      const p = plan.rawEsppPeriod;
      const priceEur = plan.ticker ? getPriceEur(plan.ticker) : null;
      const isVested = plan.vestingEndDate ? isPast(parseISO(plan.vestingEndDate)) : false;

      lines.push({
        planId: plan.id,
        planLabel: plan.label,
        planType: 'ESPP',
        ticker: plan.ticker,
        entreprise: p.entreprise_nom || plan.simulationName,
        regime: 'ESPP §423',
        dateAttribution: plan.vestingStartDate || plan.createdAt,
        dateAcquisition: plan.vestingEndDate || plan.createdAt,
        dateLivraison: plan.vestingEndDate || plan.createdAt,
        nbActions: plan.nbActionsOriginal,
        nbActionsCedees: plan.nbActionsCedees,
        nbActionsRestantes: plan.nbActions,
        coursAcquisition: p.cours_achat_devise || 0,
        devise: plan.devise,
        valorisationEur: priceEur && plan.nbActions > 0 ? plan.nbActions * priceEur : null,
        isVested,
      });
    }

    if (plan.type === 'bspce' && plan.rawBspceData) {
      const d = plan.rawBspceData;
      const isVested = plan.isVestingComplete;

      lines.push({
        planId: plan.id,
        planLabel: plan.label,
        planType: 'BSPCE',
        ticker: '-',
        entreprise: d.nom_simulation || plan.simulationName,
        regime: d.regime_applicable || '-',
        dateAttribution: plan.createdAt,
        dateAcquisition: plan.vestingEndDate || plan.createdAt,
        dateLivraison: plan.vestingEndDate || plan.createdAt,
        nbActions: plan.nbActionsOriginal,
        nbActionsCedees: plan.nbActionsCedees,
        nbActionsRestantes: plan.nbActions,
        coursAcquisition: d.prix_exercice || 0,
        devise: 'EUR',
        valorisationEur: null,
        isVested,
      });
    }
  }

  return lines;
}

type SortField = 'dateAcquisition' | 'nbActions' | 'entreprise';

export default function VegaRecapPage() {
  const navigate = useNavigate();
  const portfolio = useVegaPortfolio();
  const [filterEntreprise, setFilterEntreprise] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('dateAcquisition');
  const [sortAsc, setSortAsc] = useState(true);

  const allLines = useMemo(
    () => extractVestingLines(portfolio.plans, portfolio.getPriceEur),
    [portfolio.plans, portfolio.getPriceEur],
  );

  // Unique entreprises for filter
  const entreprises = useMemo(() => {
    const set = new Set(allLines.map(l => l.entreprise));
    return Array.from(set).sort();
  }, [allLines]);

  const filteredLines = useMemo(() => {
    let lines = filterEntreprise === 'all'
      ? allLines
      : allLines.filter(l => l.entreprise === filterEntreprise);

    lines.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'dateAcquisition') cmp = a.dateAcquisition.localeCompare(b.dateAcquisition);
      else if (sortField === 'nbActions') cmp = a.nbActions - b.nbActions;
      else if (sortField === 'entreprise') cmp = a.entreprise.localeCompare(b.entreprise);
      return sortAsc ? cmp : -cmp;
    });

    return lines;
  }, [allLines, filterEntreprise, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const totalActions = filteredLines.reduce((s, l) => s + l.nbActionsRestantes, 0);
  const totalValo = filteredLines.reduce((s, l) => s + (l.valorisationEur || 0), 0);

  const formatDate = (d: string) => {
    try {
      return format(parseISO(d), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return d;
    }
  };

  return (
    <EmployeeLayout activeSection="vega">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/employee/vega')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Table2 className="h-6 w-6 text-primary" />
              Récapitulatif des vestings
            </h1>
            <p className="text-sm text-muted-foreground">Vue détaillée de toutes vos lignes d'actions</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterEntreprise} onValueChange={setFilterEntreprise}>
              <SelectTrigger className="w-[220px] h-9 text-sm">
                <SelectValue placeholder="Toutes les entreprises" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entreprises</SelectItem>
                {entreprises.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{filteredLines.length}</span> ligne{filteredLines.length > 1 ? 's' : ''}
            {' · '}
            <span className="font-mono font-semibold text-foreground">{totalActions}</span> actions restantes
            {totalValo > 0 && (
              <>
                {' · '}
                <span className="font-mono font-semibold text-primary">{fmtCurrency(totalValo)}</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Table */}
        {portfolio.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : filteredLines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucune ligne de vesting trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Attribution
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        <button onClick={() => toggleSort('entreprise')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                          Entreprise
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Type</th>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Régime</th>
                      <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        <button onClick={() => toggleSort('dateAcquisition')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                          Date d'acquisition
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Statut</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        <button onClick={() => toggleSort('nbActions')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto">
                          Actions attribuées
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cédées</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Restantes</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cours acquisition</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Valorisation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredLines.map((line, idx) => (
                      <motion.tr
                        key={`${line.planId}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * idx }}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-foreground font-medium max-w-[180px] truncate">
                          {line.planLabel}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          <div className="flex items-center gap-1.5">
                            {line.ticker && line.ticker !== '-' && (
                              <Badge variant="outline" className="font-mono text-[9px] px-1.5">{line.ticker}</Badge>
                            )}
                            <span className="truncate">{line.entreprise}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[9px] font-semibold ${
                            line.planType === 'RSU' ? 'bg-primary/10 text-primary' :
                            line.planType === 'ESPP' ? 'bg-secondary/20 text-secondary-foreground' :
                            'bg-accent/15 text-accent-foreground'
                          }`}>
                            {line.planType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-[140px] truncate">
                          {line.regime}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-mono text-foreground">
                          {formatDate(line.dateAcquisition)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {line.isVested ? (
                            <div className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Acquis
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" />
                              En cours
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          {line.nbActions}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {line.nbActionsCedees > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">{line.nbActionsCedees}</span>
                          ) : '0'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          {line.nbActionsRestantes}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                          {line.devise === 'USD' ? fmtCurrencyUSD(line.coursAcquisition) : fmtCurrency(line.coursAcquisition)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-primary">
                          {line.valorisationEur !== null ? fmtCurrency(line.valorisationEur) : '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr className="border-t-2 border-border/60 bg-muted/20">
                      <td colSpan={6} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        {filteredLines.reduce((s, l) => s + l.nbActions, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {filteredLines.reduce((s, l) => s + l.nbActionsCedees, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        {totalActions}
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                        {totalValo > 0 ? fmtCurrency(totalValo) : '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] text-muted-foreground/70 italic text-center"
        >
          Valorisation basée sur le cours de bourse actuel. Les cessions sont retirées en FIFO (First In, First Out).
        </motion.p>
      </div>
    </EmployeeLayout>
  );
}
