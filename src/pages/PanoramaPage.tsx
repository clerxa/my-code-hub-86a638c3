import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePanorama } from "@/hooks/usePanorama";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { useUserFinancialProfile } from "@/hooks/useUserFinancialProfile";
import { PanoramaAtlasGate } from "@/components/panorama/PanoramaAtlasGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  ArrowRight, TrendingUp, FileText, Compass, UserCheck,
  RefreshCw, ChevronRight, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatEuros = (val: number | null | undefined): string => {
  if (val == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const timelineDotColors: Record<string, string> = {
  vesting: "bg-violet-500",
  fiscal: "bg-blue-500",
  epargne: "bg-amber-500",
};

const moduleTitleColors: Record<string, string> = {
  vega: "text-violet-600 dark:text-violet-400",
  atlas: "text-blue-600 dark:text-blue-400",
  horizon: "text-amber-600 dark:text-amber-400",
  risque: "text-emerald-600 dark:text-emerald-400",
};

const simBadgeColors: Record<string, string> = {
  rsu: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  optimisation_fiscale: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  per: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  budget: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  interets_composes: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  default: "bg-muted text-muted-foreground",
};

export default function PanoramaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [hasAtlasAnalysis, setHasAtlasAnalysis] = useState<boolean | null>(null);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      toast.success("🎉 Bienvenue sur MyFinCare ! Votre tableau de bord est prêt.");
      window.history.replaceState({}, "", "/panorama");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) { setHasAtlasAnalysis(false); return; }
    const check = async () => {
      const { count } = await supabase
        .from("ocr_avis_imposition_analyses" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setHasAtlasAnalysis((count ?? 0) > 0);
    };
    check();
  }, [user?.id]);

  const {
    patrimoine_panorama_total,
    completeness_score,
    delta_laisse_table,
    documents_manquants,
    timeline,
    synthesis,
    vegaPortfolio,
    loading,
    error,
  } = usePanorama();

  const {
    profile: financialProfile,
    isLoading: financialLoading,
    completeness: financialCompleteness,
  } = useUserFinancialProfile();

  if (hasAtlasAnalysis === false) {
    return (
      <EmployeeLayout activeSection="panorama">
        <PanoramaAtlasGate />
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout activeSection="panorama">
        <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
          <p className="text-destructive">Une erreur est survenue lors du chargement de vos données.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Réessayer
          </Button>
        </div>
      </EmployeeLayout>
    );
  }

  const isLoading = loading || financialLoading || hasAtlasAnalysis === null;

  if (isLoading) {
    return (
      <EmployeeLayout activeSection="panorama">
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-40 col-span-2" />
            <div className="space-y-3">
              <Skeleton className="h-[4.25rem]" />
              <Skeleton className="h-[4.25rem]" />
              <Skeleton className="h-[4.25rem]" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </EmployeeLayout>
    );
  }

  // Financial data
  const fp = financialProfile as any;
  const revenuNet = fp?.revenu_mensuel_net != null ? fp.revenu_mensuel_net / 12 : null;
  const chargesFixes = (fp?.charges_loyer_credit ?? 0) + (fp?.charges_transport ?? 0) + (fp?.charges_alimentation ?? 0) + (fp?.charges_abonnements ?? 0) + (fp?.charges_autres ?? 0);
  const pasEstime = fp?.prelevement_source_mensuel ?? null;
  const capaciteEpargne = fp?.capacite_epargne_mensuelle ?? null;
  const resteAVivre = revenuNet != null ? revenuNet - chargesFixes - (pasEstime ?? 0) - (capaciteEpargne ?? 0) : null;
  const tmi = synthesis?.financialProfile?.tmi ?? fp?.tmi ?? null;

  // Patrimoine breakdown
  const patrimoineFinancier = synthesis?.financialProfile?.patrimoine_total ?? 0;
  const patrimoineImmo = (fp?.patrimoine_immo_valeur ?? 0) - (fp?.patrimoine_immo_credit_restant ?? 0);
  const patrimoineActions = vegaPortfolio.totalValueEur ?? 0;

  // Vesting imminent
  const imminentVesting = timeline.find(e => e.type === "vesting" && e.daysUntil <= 60);

  return (
    <EmployeeLayout activeSection="panorama">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">

        {/* ═══ SECTION 1 — HERO BAND ═══ */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-5">
          {/* Top row: title + progress */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">PANORAMA</h1>
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">BETA</Badge>
            </div>
            <TooltipProvider>
              <div className="flex items-center gap-2 min-w-0 md:w-72">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Profil {financialCompleteness}%</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 cursor-help" onClick={() => financialCompleteness < 100 && navigate("/panorama/audit")}>
                      <Progress value={financialCompleteness} className="h-1.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {documents_manquants.length > 0 ? (
                      <p className="text-xs">Manquant : {documents_manquants.join(", ")}</p>
                    ) : (
                      <p className="text-xs">Profil complet ✓</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <button
                  onClick={() => navigate("/panorama/audit")}
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  {financialCompleteness < 100 ? "Compléter" : "Modifier"}
                </button>
              </div>
            </TooltipProvider>
          </div>

          {/* KPI row */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
            {/* Main KPI */}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Patrimoine estimé</p>
              <p className="text-5xl font-bold tracking-tight leading-none">{formatEuros(patrimoine_panorama_total)}</p>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-border" />

            {/* Reste à vivre */}
            {resteAVivre != null && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Reste à vivre</p>
                <p className="text-2xl font-semibold">{formatEuros(resteAVivre)}<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              </div>
            )}

            {/* Divider */}
            {tmi != null && <div className="hidden md:block w-px h-12 bg-border" />}

            {/* TMI */}
            {tmi != null && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">TMI</p>
                <p className="text-2xl font-semibold">{tmi}%</p>
              </div>
            )}

            {/* Delta laissé sur la table */}
            {delta_laisse_table > 0 && (
              <>
                <div className="hidden md:block w-px h-12 bg-border" />
                <div
                  className="cursor-pointer group/delta"
                  onClick={() => navigate("/employee/simulations")}
                >
                  <p className="text-xs text-red-500 mb-0.5">Laissé sur la table</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400 group-hover/delta:underline">
                    {formatEuros(delta_laisse_table)}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ═══ SECTION 2 — MODULE GRID (asymmetric) ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* VEGA — large card spanning 2 cols */}
          <div
            className="md:col-span-2 md:row-span-3 rounded-lg border border-border bg-card p-5 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate("/employee/vega")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                <h3 className={cn("text-sm font-bold uppercase tracking-wide", moduleTitleColors.vega)}>VEGA</h3>
                <span className="text-xs text-muted-foreground">Actionnariat salarié</span>
              </div>
              {imminentVesting && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-[10px]">
                  Vesting dans {imminentVesting.daysUntil}j
                </Badge>
              )}
            </div>
            {vegaPortfolio.hasPlans ? (
              <div className="space-y-2">
                <p className="text-4xl font-bold">{formatEuros(vegaPortfolio.totalValueEur)}</p>
                <p className="text-sm text-muted-foreground">{vegaPortfolio.totalShares} actions vestées</p>
                {vegaPortfolio.plans && vegaPortfolio.plans.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {vegaPortfolio.plans.slice(0, 3).map((plan, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded px-3 py-1.5">
                        <span className="font-medium text-foreground">{plan.label}</span>
                        <span>{plan.nbActions} actions • {formatEuros(plan.prixAcquisitionEur)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Non configuré</p>
                <span className="text-xs text-primary hover:underline">Configurer →</span>
              </div>
            )}
            <div className="mt-4 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Voir le détail <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </div>

          {/* ATLAS */}
          <ModuleCard
            icon={<FileText className="h-4 w-4 text-blue-500" />}
            title="ATLAS"
            subtitle="Situation fiscale"
            colorClass={moduleTitleColors.atlas}
            onClick={() => navigate("/employee/atlas")}
          >
            <p className="text-xl font-bold">
              {tmi != null ? `TMI ${tmi}%` : "Non renseigné"}
            </p>
            {synthesis?.financialProfile?.revenu_fiscal_annuel != null && (
              <p className="text-xs text-muted-foreground">{formatEuros(synthesis.financialProfile.revenu_fiscal_annuel)}</p>
            )}
          </ModuleCard>

          {/* HORIZON */}
          <ModuleCard
            icon={<Compass className="h-4 w-4 text-amber-500" />}
            title="HORIZON"
            subtitle="Épargne & Projets"
            colorClass={moduleTitleColors.horizon}
            onClick={() => navigate("/employee/horizon")}
          >
            <p className="text-xl font-bold">
              {synthesis?.horizon?.total_initial_capital != null
                ? formatEuros(synthesis.horizon.total_initial_capital)
                : synthesis?.financialProfile?.epargne_actuelle != null
                  ? formatEuros(synthesis.financialProfile.epargne_actuelle)
                  : "Non renseigné"}
            </p>
            {synthesis?.horizon?.projects_count != null && synthesis.horizon.projects_count > 0 && (
              <p className="text-xs text-muted-foreground">{synthesis.horizon.projects_count} projets</p>
            )}
          </ModuleCard>

          {/* PROFIL RISQUE */}
          <ModuleCard
            icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
            title="Risque"
            subtitle="Profil investisseur"
            colorClass={moduleTitleColors.risque}
            onClick={() => navigate("/risk-profile")}
          >
            {synthesis?.riskProfile ? (
              <>
                <p className="text-xl font-bold">{synthesis.riskProfile.profile_type ?? "Évalué"}</p>
                {synthesis.riskProfile.total_weighted_score != null && (
                  <p className="text-xs text-muted-foreground">Score {synthesis.riskProfile.total_weighted_score}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Non évalué</p>
            )}
          </ModuleCard>
        </section>

        {/* ═══ SECTION 3 — SYNTHÈSE FINANCIÈRE (compact line) ═══ */}
        {financialProfile && (
          <section className="rounded-lg border border-border bg-card p-4">
            {/* Flow line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {revenuNet != null && (
                <MetricChip label="Revenus nets" value={`${formatEuros(revenuNet)}/mois`} />
              )}
              {chargesFixes > 0 && (
                <>
                  <span className="text-muted-foreground">−</span>
                  <MetricChip label="Charges fixes" value={`${formatEuros(chargesFixes)}/mois`} />
                </>
              )}
              {pasEstime != null && pasEstime > 0 && (
                <>
                  <span className="text-muted-foreground">−</span>
                  <MetricChip label="PAS estimé" value={`${formatEuros(pasEstime)}/mois`} />
                </>
              )}
              {capaciteEpargne != null && capaciteEpargne > 0 && (
                <>
                  <span className="text-muted-foreground">−</span>
                  <MetricChip label="Capacité d'épargne" value={`${formatEuros(capaciteEpargne)}/mois`} />
                </>
              )}
              {resteAVivre != null && (
                <>
                  <span className="text-muted-foreground font-bold">=</span>
                  <MetricChip label="Reste à vivre" value={`${formatEuros(resteAVivre)}/mois`} highlight />
                </>
              )}
            </div>

            {/* Patrimoine breakdown line */}
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>Financier <strong className="text-foreground">{formatEuros(patrimoineFinancier)}</strong></span>
              <span className="text-border">|</span>
              <span>Immobilier <strong className="text-foreground">{formatEuros(patrimoineImmo)}</strong></span>
              <span className="text-border">|</span>
              <span>Actionnariat <strong className="text-foreground">{formatEuros(patrimoineActions)}</strong></span>
              <span className="text-border">|</span>
              <span>Total net <strong className="text-foreground font-semibold">{formatEuros(patrimoine_panorama_total)}</strong></span>
            </div>
          </section>
        )}

        {/* ═══ SECTION 4 — TIMELINE (badges horizontaux) ═══ */}
        {timeline.length > 0 && (
          <section className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {timeline.map((event, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 whitespace-nowrap text-xs shrink-0"
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", timelineDotColors[event.type] || "bg-muted")} />
                <span className="font-medium">{event.label}</span>
                <span className="text-muted-foreground">— {formatDate(event.date)}</span>
                <span className="text-muted-foreground">(dans {event.daysUntil}j)</span>
              </div>
            ))}
          </section>
        )}

        {/* ═══ SECTION 5 — DERNIÈRES SIMULATIONS (compact list) ═══ */}
        {synthesis?.simulations && synthesis.simulations.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dernières simulations</h2>
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {synthesis.simulations.slice(0, 4).map(sim => {
                const kvEntries = Object.entries(sim.key_values ?? {})
                  .filter(([, v]) => v != null && typeof v !== "object")
                  .slice(0, 3);

                const badgeColor = simBadgeColors[sim.type] || simBadgeColors.default;

                return (
                  <div
                    key={sim.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => navigate("/employee/simulations")}
                  >
                    <Badge className={cn("text-[10px] shrink-0 border-0", badgeColor)}>
                      {sim.label}
                    </Badge>
                    <span className="text-sm font-medium truncate min-w-0">{sim.nom_simulation}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(sim.created_at)}</span>
                    <div className="flex-1" />
                    {kvEntries.map(([k, v]) => (
                      <span key={k} className="text-xs text-muted-foreground hidden sm:inline shrink-0">
                        {k} : <strong className="text-foreground">{String(v)}</strong>
                      </span>
                    ))}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate("/employee/simulations")}
              className="text-xs text-primary hover:underline mt-1.5 ml-1"
            >
              Voir toutes les simulations →
            </button>
          </section>
        )}
      </div>
    </EmployeeLayout>
  );
}

/* ═══ Sub-components ═══ */

function ModuleCard({
  icon,
  title,
  subtitle,
  colorClass,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  colorClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className={cn("text-xs font-bold uppercase tracking-wide", colorClass)}>{title}</span>
        <span className="text-[10px] text-muted-foreground ml-1">{subtitle}</span>
      </div>
      {children}
      <div className="mt-2 flex items-center text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Voir <ChevronRight className="h-3 w-3 ml-0.5" />
      </div>
    </div>
  );
}

function MetricChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("font-semibold", highlight ? "text-primary text-sm" : "text-foreground text-sm")}>{value}</span>
    </div>
  );
}
