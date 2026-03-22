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

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  ArrowRight, TrendingUp, FileText, Compass, UserCheck,
  RefreshCw, ChevronRight, Info, Sparkles
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
  const [atlasData, setAtlasData] = useState<{ taux_moyen_pct: number | null; impot_net_total: number | null } | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<{
    atlas_completed: boolean;
    audit_panorama_completed: boolean;
    risk_profile_completed: boolean;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      toast.success("🎉 Bienvenue sur MyFinCare ! Votre tableau de bord est prêt.");
      window.history.replaceState({}, "", "/panorama");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) { setHasAtlasAnalysis(false); return; }
    const check = async () => {
      const [atlasRes, profileRes, atlasDetailRes] = await Promise.all([
        supabase
          .from("ocr_avis_imposition_analyses" as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("atlas_completed, audit_panorama_completed, risk_profile_completed")
          .eq("id", user.id)
          .single(),
        supabase
          .from("ocr_avis_imposition_analyses" as any)
          .select("taux_moyen_pct, impot_net_total")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setHasAtlasAnalysis((atlasRes.count ?? 0) > 0);
      if (atlasDetailRes.data) {
        setAtlasData(atlasDetailRes.data as any);
      }
      if (profileRes.data) {
        setOnboardingStatus(profileRes.data as any);
      }
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

  const isLoading = loading || financialLoading;

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
  const revenuBrutAnnuel = (fp?.revenu_annuel_brut ?? 0) + (fp?.revenu_annuel_brut_conjoint ?? 0);
  const revenuNetMensuel = revenuBrutAnnuel > 0 ? Math.round(revenuBrutAnnuel * 0.77 / 12) : (fp?.revenu_mensuel_net != null ? fp.revenu_mensuel_net / 12 : null);
  const revenusFonciersMensuel = fp?.revenus_locatifs ? Math.round(fp.revenus_locatifs / 12) : 0;
  const autresRevenusMensuel = fp?.autres_revenus_mensuels ?? 0;
  const totalRevenusMensuel = revenuNetMensuel != null ? revenuNetMensuel + revenusFonciersMensuel + autresRevenusMensuel : null;
  const chargesFixes = (fp?.loyer_actuel ?? 0) + (fp?.credits_immobilier ?? 0) + (fp?.credits_consommation ?? 0) + (fp?.credits_auto ?? 0) + (fp?.pensions_alimentaires ?? 0) + (fp?.charges_fixes_mensuelles ?? 0);
  const impotMensuel = atlasData?.impot_net_total != null ? Math.round(atlasData.impot_net_total / 12) : null;
  const tauxMoyenAtlas = atlasData?.taux_moyen_pct ?? null;
  const totalChargesAvecImpots = chargesFixes + (impotMensuel ?? 0);
  const capaciteEpargne = fp?.capacite_epargne_mensuelle ?? null;
  const resteAVivre = totalRevenusMensuel != null ? totalRevenusMensuel - totalChargesAvecImpots - (capaciteEpargne ?? 0) : null;
  const tmi = synthesis?.financialProfile?.tmi ?? fp?.tmi ?? null;

  // Patrimoine breakdown (immo net already in patrimoine_total now)
  const patrimoineFinancier = (synthesis?.financialProfile?.patrimoine_total ?? 0) - ((fp?.patrimoine_immo_valeur ?? 0) - (fp?.patrimoine_immo_credit_restant ?? 0));
  const patrimoineImmo = (fp?.patrimoine_immo_valeur ?? 0) - (fp?.patrimoine_immo_credit_restant ?? 0);
  const patrimoineActions = vegaPortfolio.totalValueEur ?? 0;

  // Vesting imminent
  const imminentVesting = timeline.find(e => e.type === "vesting" && e.daysUntil <= 60);

  // Profile completeness nudge (non-blocking)
  const profileComplete =
    onboardingStatus?.atlas_completed &&
    onboardingStatus?.audit_panorama_completed;

  return (
    <EmployeeLayout activeSection="panorama">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">

        {/* ═══ EDUCATIONAL NUDGE BANNER ═══ */}
        {!profileComplete && onboardingStatus && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Plus vous renseignez votre profil, plus vos analyses seront précises
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complétez votre audit patrimonial pour obtenir des recommandations personnalisées
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/panorama/audit")} className="shrink-0 gap-1.5">
              Compléter mon profil <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

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

        {/* ═══ SECTION 2 — SYNTHÈSE FINANCIÈRE (main area) ═══ */}
        {financialProfile && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Synthèse financière du foyer</h3>
            
            {/* Revenus detail */}
            <div className="space-y-2 mb-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Revenus mensuels</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {revenuNetMensuel != null && revenuNetMensuel > 0 && (
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">Salaires nets</p>
                    <p className="text-sm font-semibold">{formatEuros(revenuNetMensuel)}</p>
                  </div>
                )}
                {revenusFonciersMensuel > 0 && (
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">Revenus fonciers</p>
                    <p className="text-sm font-semibold">{formatEuros(revenusFonciersMensuel)}</p>
                  </div>
                )}
                {autresRevenusMensuel > 0 && (
                  <div className="rounded-md bg-muted/40 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">Autres revenus</p>
                    <p className="text-sm font-semibold">{formatEuros(autresRevenusMensuel)}</p>
                  </div>
                )}
                {totalRevenusMensuel != null && totalRevenusMensuel > 0 && (
                  <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                    <p className="text-[10px] text-primary">Total revenus</p>
                    <p className="text-sm font-bold text-primary">{formatEuros(totalRevenusMensuel)}<span className="text-[10px] font-normal">/mois</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Charges detail */}
            {(chargesFixes > 0 || impotMensuel != null) && (
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Charges mensuelles</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(fp?.loyer_actuel ?? 0) > 0 && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Loyer</p>
                      <p className="text-sm font-semibold">{formatEuros(fp.loyer_actuel)}</p>
                    </div>
                  )}
                  {(fp?.credits_immobilier ?? 0) > 0 && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Crédit immo</p>
                      <p className="text-sm font-semibold">{formatEuros(fp.credits_immobilier)}</p>
                    </div>
                  )}
                  {(fp?.credits_consommation ?? 0) > 0 && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Crédit conso</p>
                      <p className="text-sm font-semibold">{formatEuros(fp.credits_consommation)}</p>
                    </div>
                  )}
                  {(fp?.credits_auto ?? 0) > 0 && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Crédit auto</p>
                      <p className="text-sm font-semibold">{formatEuros(fp.credits_auto)}</p>
                    </div>
                  )}
                  {(fp?.pensions_alimentaires ?? 0) > 0 && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Pensions</p>
                      <p className="text-sm font-semibold">{formatEuros(fp.pensions_alimentaires)}</p>
                    </div>
                  )}
                  {(fp?.charges_fixes_mensuelles ?? 0) > 0 && (
                    <div className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Autres charges</p>
                      <p className="text-sm font-semibold">{formatEuros(fp.charges_fixes_mensuelles)}</p>
                    </div>
                  )}
                  {impotMensuel != null && impotMensuel > 0 && (
                    <div className="rounded-md bg-blue-500/5 border border-blue-500/10 px-3 py-2">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        Impôts <span className="text-[8px] bg-blue-500/10 px-1 rounded">ATLAS</span>
                      </p>
                      <p className="text-sm font-semibold">{formatEuros(impotMensuel)}</p>
                    </div>
                  )}
                  <div className="rounded-md bg-destructive/5 border border-destructive/10 px-3 py-2">
                    <p className="text-[10px] text-destructive">Total charges</p>
                    <p className="text-sm font-bold text-destructive">{formatEuros(totalChargesAvecImpots)}<span className="text-[10px] font-normal">/mois</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary flow */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm pt-3 border-t border-border">
              {totalRevenusMensuel != null && (
                <MetricChip label="Revenus" value={`${formatEuros(totalRevenusMensuel)}/mois`} />
              )}
              {totalChargesAvecImpots > 0 && (
                <>
                  <span className="text-muted-foreground font-medium">−</span>
                  <MetricChip label="Charges + impôts" value={`${formatEuros(totalChargesAvecImpots)}/mois`} />
                </>
              )}
              {capaciteEpargne != null && capaciteEpargne > 0 && (
                <>
                  <span className="text-muted-foreground font-medium">−</span>
                  <MetricChip label="Épargne" value={`${formatEuros(capaciteEpargne)}/mois`} />
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
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
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

        {/* ═══ SECTION 3 — MODULE GRID (4 cols equal) ═══ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* VEGA */}
          <div
            className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate("/employee/vega")}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span className={cn("text-xs font-bold uppercase tracking-wide", moduleTitleColors.vega)}>VEGA</span>
            </div>
            {vegaPortfolio.hasPlans ? (
              <>
                <p className="text-xl font-bold">{formatEuros(vegaPortfolio.totalValueEur)}</p>
                <p className="text-xs text-muted-foreground">{vegaPortfolio.totalShares} actions</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Non configuré</p>
            )}
            {imminentVesting && (
              <Badge variant="outline" className="mt-2 bg-orange-500/10 text-orange-600 border-orange-500/30 text-[10px]">
                Vesting {imminentVesting.daysUntil}j
              </Badge>
            )}
            <div className="mt-2 flex items-center text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Voir <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </div>

          {/* ATLAS */}
          <ModuleCard
            icon={<FileText className="h-4 w-4 text-blue-500" />}
            title="ATLAS"
            subtitle="Fiscalité"
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

