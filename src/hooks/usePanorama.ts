import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useUserSynthesis, type UserSynthesisData } from "@/hooks/useUserSynthesis";
import { useVegaPortfolio, type PortfolioSummary } from "@/hooks/useVegaPortfolio";

export interface PanoramaTimelineEvent {
  date: string;
  label: string;
  type: "vesting" | "fiscal" | "epargne";
  daysUntil: number;
}

export interface PanoramaData {
  patrimoine_panorama_total: number;
  completeness_score: number;
  delta_laisse_table: number;
  documents_manquants: string[];
  timeline: PanoramaTimelineEvent[];
  synthesis: UserSynthesisData | null;
  vegaPortfolio: PortfolioSummary;
  loading: boolean;
  error: string | null;
}

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === "string" ? parseFloat(val.replace(/[^\d.-]/g, "")) : val;
  return isNaN(n) ? 0 : n;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function usePanorama(): PanoramaData {
  const { user } = useAuth();
  const { data: synthesis, loading: synthLoading, error: synthError } = useUserSynthesis(user?.id ?? null);
  const vegaPortfolio = useVegaPortfolio();

  return useMemo(() => {
    const loading = synthLoading || vegaPortfolio.isLoading;
    const error = synthError;

    // 1. PATRIMOINE PANORAMA TOTAL
    const patrimoine_financier = synthesis?.financialProfile?.patrimoine_total ?? 0;
    const valeur_rsu = vegaPortfolio.totalValueEur ?? 0;
    const patrimoine_panorama_total = patrimoine_financier + valeur_rsu;

    // 2. SCORE DE COMPLÉTUDE
    let completeness_score = 0;
    if (synthesis?.financialProfile?.is_complete === true) completeness_score += 20;
    if (synthesis?.riskProfile !== null && synthesis?.riskProfile !== undefined) completeness_score += 20;
    if (synthesis?.simulations && synthesis.simulations.length > 0) completeness_score += 20;
    if (vegaPortfolio.hasPlans) completeness_score += 20;
    if (synthesis?.diagnostic !== null && synthesis?.diagnostic !== undefined) completeness_score += 20;

    // 3. DELTA "LAISSÉ SUR LA TABLE"
    let delta_laisse_table = 0;
    if (synthesis?.simulations) {
      const optiFisc = synthesis.simulations.find(s => s.type === "optimisation_fiscale");
      if (optiFisc) {
        delta_laisse_table += toNumber(optiFisc.key_values["Économie totale"]);
      }
      const perSim = synthesis.simulations.find(s => s.type === "per");
      if (perSim) {
        delta_laisse_table += toNumber(perSim.key_values["Économie impôts"]);
      }
    }

    // 4. DOCUMENTS MANQUANTS
    const documents_manquants: string[] = [];
    if (!synthesis?.simulations?.find(s => s.type === "optimisation_fiscale")) {
      documents_manquants.push("Avis d'imposition");
    }
    if (!vegaPortfolio.hasPlans) {
      documents_manquants.push("Plan RSU/VEGA");
    }
    if (!synthesis?.financialProfile?.is_complete) {
      documents_manquants.push("Profil financier complet");
    }
    if (!synthesis?.riskProfile) {
      documents_manquants.push("Profil de risque");
    }

    // 5. TIMELINE
    const timeline: PanoramaTimelineEvent[] = [];
    const now = new Date();

    // Future vestings from VEGA
    if (vegaPortfolio.plans) {
      for (const plan of vegaPortfolio.plans) {
        if (plan.rawVestings) {
          for (const v of plan.rawVestings) {
            if (v.date && new Date(v.date) > now) {
              timeline.push({
                date: v.date,
                label: `Vesting RSU — ${v.nb_rsu || 0} actions`,
                type: "vesting",
                daysUntil: daysUntil(v.date),
              });
            }
          }
        }
      }
    }

    // PER horizon retraite
    if (synthesis?.simulations) {
      const perSim = synthesis.simulations.find(s => s.type === "per");
      if (perSim) {
        const horizonAns = toNumber(perSim.key_values["Horizon (ans)"]);
        if (horizonAns > 0) {
          const retraiteDate = new Date();
          retraiteDate.setFullYear(retraiteDate.getFullYear() + horizonAns);
          const dateStr = retraiteDate.toISOString().split("T")[0];
          timeline.push({
            date: dateStr,
            label: "Horizon retraite PER",
            type: "fiscal",
            daysUntil: daysUntil(dateStr),
          });
        }
      }
    }

    // Deadline PER fin d'année
    if (delta_laisse_table > 0) {
      const endOfYear = `${now.getFullYear()}-12-31`;
      timeline.push({
        date: endOfYear,
        label: "Deadline versement PER",
        type: "fiscal",
        daysUntil: daysUntil(endOfYear),
      });
    }

    // Sort by date, max 4
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const timelineCapped = timeline.slice(0, 4);

    return {
      patrimoine_panorama_total,
      completeness_score,
      delta_laisse_table,
      documents_manquants,
      timeline: timelineCapped,
      synthesis,
      vegaPortfolio,
      loading,
      error,
    };
  }, [synthesis, synthLoading, synthError, vegaPortfolio]);
}
