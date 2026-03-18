import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePanorama } from "@/hooks/usePanorama";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { FinancialDashboard } from "@/components/employee/FinancialDashboard";
import { useUserFinancialProfile } from "@/hooks/useUserFinancialProfile";
import { useLatestEpargnePrecaution } from "@/hooks/useLatestEpargnePrecaution";
import { AUDIT_FIELD_TO_TAB } from "@/pages/PanoramaAuditPage";
import { AlertTriangle, ArrowRight, TrendingUp, FileText, Compass, UserCheck, Calendar, RefreshCw } from "lucide-react";

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

const timelineColors: Record<string, string> = {
  vesting: "bg-violet-500",
  fiscal: "bg-blue-500",
  epargne: "bg-amber-500",
};

export default function PanoramaPage() {
  const navigate = useNavigate();
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

  // Financial profile data for the synthesis cards
  const {
    profile: financialProfile,
    isLoading: financialLoading,
    completeness: financialCompleteness,
    missingFields,
    missingFieldsDetailed,
  } = useUserFinancialProfile();

  const { data: epargnePrecautionData } = useLatestEpargnePrecaution();

  // Build formData from financialProfile for FinancialDashboard
  const formData = financialProfile ?? {};

  const handleNavigateToTab = (tab: string) => {
    navigate(`/panorama/audit?tab=${tab}`);
  };

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
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </EmployeeLayout>
    );
  }

  const optiFisc = synthesis?.simulations?.find(s => s.type === "optimisation_fiscale");
  const hasOptiFiscEconomie = optiFisc && (parseFloat(String(optiFisc.key_values["Économie totale"] ?? 0)) > 0);

  // Vesting imminent (within 60 days)
  const imminentVesting = timeline.find(e => e.type === "vesting" && e.daysUntil <= 60);

  return (
    <EmployeeLayout activeSection="panorama">
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      {/* Section 1 — Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">PANORAMA</h1>
          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/30">BETA</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Patrimoine estimé</p>
          <p className="text-4xl font-bold">{formatEuros(patrimoine_panorama_total)}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profil complété à {completeness_score}%</span>
            <span className="font-medium">{completeness_score}/100</span>
          </div>
          <Progress value={completeness_score} className="h-2" />
          {completeness_score < 100 && (
            <Button size="sm" variant="outline" className="gap-1 mt-2" onClick={() => navigate("/panorama/audit")}>
              Compléter mon audit patrimonial <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        {documents_manquants.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Ajoutez : <strong>{documents_manquants.join(", ")}</strong> pour affiner votre tableau de bord
            </p>
          </div>
        )}

        {delta_laisse_table > 0 && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Vous laissez potentiellement <strong>{formatEuros(delta_laisse_table)}</strong> sur la table cette année
              </p>
              <Button size="sm" variant="destructive" className="gap-1 shrink-0" onClick={() => navigate("/employee/simulations")}>
                Voir les optimisations <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section 2 — Module grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VEGA */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                VEGA — Actionnariat salarié
              </CardTitle>
              {imminentVesting && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
                  Vesting imminent
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {vegaPortfolio.hasPlans ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold">{formatEuros(vegaPortfolio.totalValueEur)}</p>
                <p className="text-xs text-muted-foreground">{vegaPortfolio.totalShares} actions</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Non configuré</p>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/employee/vega")}>
                  Configurer <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ATLAS */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                ATLAS — Situation fiscale
              </CardTitle>
              {hasOptiFiscEconomie && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                  Optimisation disponible
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {synthesis?.financialProfile?.tmi != null ? `${synthesis.financialProfile.tmi}%` : "Non renseigné"}
              </p>
              {synthesis?.financialProfile?.revenu_fiscal_annuel != null && (
                <p className="text-xs text-muted-foreground">
                  Revenu fiscal : {formatEuros(synthesis.financialProfile.revenu_fiscal_annuel)}
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" className="gap-1 mt-3" onClick={() => navigate("/employee/atlas")}>
              Analyser <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* HORIZON */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              HORIZON — Épargne & Projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {synthesis?.horizon?.total_initial_capital != null
                  ? formatEuros(synthesis.horizon.total_initial_capital)
                  : synthesis?.financialProfile?.epargne_actuelle != null
                    ? formatEuros(synthesis.financialProfile.epargne_actuelle)
                    : "Non renseigné"}
              </p>
              {synthesis?.horizon?.projects_count != null && synthesis.horizon.projects_count > 0 && (
                <p className="text-xs text-muted-foreground">{synthesis.horizon.projects_count} projets en cours</p>
              )}
            </div>
            <Button size="sm" variant="outline" className="gap-1 mt-3" onClick={() => navigate("/employee/horizon")}>
              Voir <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* PROFIL DE RISQUE */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Profil de risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {synthesis?.riskProfile ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold">{synthesis.riskProfile.profile_type ?? "Évalué"}</p>
                {synthesis.riskProfile.total_weighted_score != null && (
                  <p className="text-xs text-muted-foreground">Score {synthesis.riskProfile.total_weighted_score}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Non évalué</p>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/risk-profile")}>
                  Évaluer <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section 3 — Synthèse financière (from FinancialDashboard) */}
      {financialProfile && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Ma synthèse financière</h2>
          <FinancialDashboard
            formData={formData}
            completeness={financialCompleteness}
            missingFields={missingFields}
            missingFieldsDetailed={missingFieldsDetailed}
            fieldToTabMapping={AUDIT_FIELD_TO_TAB}
            onNavigateToTab={handleNavigateToTab}
            epargnePrecautionData={epargnePrecautionData}
          />
        </section>
      )}

      {/* Section 4 — Timeline */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vos prochains événements patrimoniaux</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complétez votre profil VEGA pour voir vos prochaines échéances
          </p>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            {timeline.map((event, i) => (
              <Card key={i} className="flex-1 min-w-0">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${timelineColors[event.type] || "bg-muted"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    <p className="text-xs text-muted-foreground">dans {event.daysUntil} jours</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 5 — Simulations récentes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vos dernières simulations</h2>
        {!synthesis?.simulations || synthesis.simulations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Aucune simulation pour le moment</p>
              <Button variant="outline" className="gap-1" onClick={() => navigate("/employee/simulations")}>
                Lancer une simulation <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {synthesis.simulations.slice(0, 3).map(sim => {
              const kvEntries = Object.entries(sim.key_values).filter(([, v]) => v != null).slice(0, 2);
              return (
                <Card key={sim.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs shrink-0">{sim.label}</Badge>
                        <span className="text-sm font-medium truncate">{sim.nom_simulation}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(sim.created_at)}</span>
                        {kvEntries.map(([k, v]) => (
                          <span key={k}>{k}: <strong>{String(v)}</strong></span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/employee/simulations")}>
              Voir toutes <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </section>
    </div>
    </EmployeeLayout>
  );
}
