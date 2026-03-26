import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ScoreSignal {
  signal_key: string;
  signal_label: string;
  signal_category: string;
  raw_count: number;
  points_per_unit: number;
  max_points: number | null;
  earned_points: number;
}

interface IntentionScoreResult {
  total_score: number;
  max_possible: number;
  percentage: number;
  level: "froid" | "tiède" | "chaud" | "brûlant";
  signals: ScoreSignal[];
  by_category: Record<string, { earned: number; max: number }>;
  loading: boolean;
}

/**
 * Calcule le score d'intention RDV expert pour un utilisateur donné
 */
export function useIntentionScore(userId: string | null): IntentionScoreResult {
  const [result, setResult] = useState<IntentionScoreResult>({
    total_score: 0,
    max_possible: 0,
    percentage: 0,
    level: "froid",
    signals: [],
    by_category: {},
    loading: true,
  });

  useEffect(() => {
    if (!userId) return;
    computeScore(userId);
  }, [userId]);

  async function computeScore(uid: string) {
    try {
      // Fetch config and all data sources in parallel
      const [configRes, loginsRes, simLogsRes, modulesRes, diagnosticRes, horizonRes, eventsRes, appointmentsRes, fpRes, riskRes, realEstateRes, prepRes] =
        await Promise.all([
          supabase.from("intention_score_config").select("*").eq("is_active", true).order("display_order"),
          supabase.from("daily_logins").select("id").eq("user_id", uid),
          supabase.from("simulation_logs").select("id, appointment_cta_clicked, cta_clicked").eq("user_id", uid),
          supabase.from("module_validations").select("id").eq("user_id", uid),
          supabase.from("diagnostic_results").select("status").eq("user_id", uid).eq("status", "completed").maybeSingle(),
          supabase.from("horizon_projects").select("id").eq("user_id", uid).limit(1),
          supabase.from("user_events").select("event_type, event_name").eq("user_id", uid),
          supabase.from("appointments").select("id").eq("user_id", uid).limit(1),
          supabase.from("user_financial_profiles").select("is_complete").eq("user_id", uid).maybeSingle(),
          (supabase as any).from("risk_profile").select("id").eq("user_id", uid).limit(1),
          (supabase as any).from("user_real_estate_properties").select("id").eq("user_id", uid),
          supabase.from("appointment_preparation").select("id").eq("user_id", uid).limit(1),
        ]);

      const configs = configRes.data || [];
      const rawCounts: Record<string, number> = {};

      // Compute raw counts for each signal
      rawCounts["daily_login"] = loginsRes.data?.length || 0;
      rawCounts["simulation_completed"] = simLogsRes.data?.length || 0;
      rawCounts["module_completed"] = modulesRes.data?.length || 0;

      // Profile maturity: boolean signals (0 or 1)
      rawCounts["horizon_completed"] = (horizonRes.data?.length || 0) > 0 ? 1 : 0;
      rawCounts["diagnostic_completed"] = diagnosticRes.data ? 1 : 0;

      // Event-based signals
      const events = eventsRes.data || [];
      rawCounts["expert_booking_page_view"] = events.filter(
        (e) => e.event_type === "page_view" && e.event_name === "expert_booking_page"
      ).length;
      rawCounts["offers_page_view"] = events.filter(
        (e) => e.event_type === "page_view" && e.event_name === "offers_page"
      ).length;
      rawCounts["rdv_cta_click_no_conversion"] = events.filter(
        (e) => e.event_type === "cta_click" && e.event_name === "rdv_cta_no_conversion"
      ).length;

      // CTA RDV from simulators
      const simCtaClicks = simLogsRes.data?.filter((s) => s.appointment_cta_clicked === true).length || 0;
      rawCounts["rdv_cta_click_from_simulator"] = simCtaClicks;

      // New signals
      rawCounts["appointment_booked"] = (appointmentsRes.data?.length || 0) > 0 ? 1 : 0;
      rawCounts["financial_profile_complete"] = fpRes.data?.is_complete ? 1 : 0;
      rawCounts["risk_profile_completed"] = (riskRes.data?.length || 0) > 0 ? 1 : 0;
      rawCounts["real_estate_added"] = realEstateRes.data?.length || 0;
      rawCounts["appointment_preparation_done"] = (prepRes.data?.length || 0) > 0 ? 1 : 0;

      // Calculate scores
      const signals: ScoreSignal[] = [];
      let totalScore = 0;
      let maxPossible = 0;
      const byCategory: Record<string, { earned: number; max: number }> = {};

      for (const config of configs) {
        const raw = rawCounts[config.signal_key] || 0;
        const rawPoints = raw * Number(config.points_per_unit);
        const maxPts = config.max_points ? Number(config.max_points) : rawPoints;
        const earned = Math.min(rawPoints, maxPts);

        signals.push({
          signal_key: config.signal_key,
          signal_label: config.signal_label,
          signal_category: config.signal_category,
          raw_count: raw,
          points_per_unit: Number(config.points_per_unit),
          max_points: config.max_points ? Number(config.max_points) : null,
          earned_points: earned,
        });

        totalScore += earned;
        maxPossible += maxPts;

        if (!byCategory[config.signal_category]) {
          byCategory[config.signal_category] = { earned: 0, max: 0 };
        }
        byCategory[config.signal_category].earned += earned;
        byCategory[config.signal_category].max += maxPts;
      }

      const pct = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
      const level: IntentionScoreResult["level"] =
        pct >= 75 ? "brûlant" : pct >= 50 ? "chaud" : pct >= 25 ? "tiède" : "froid";

      setResult({
        total_score: totalScore,
        max_possible: maxPossible,
        percentage: pct,
        level,
        signals,
        by_category: byCategory,
        loading: false,
      });
    } catch (err) {
      console.error("Intention score error:", err);
      setResult((prev) => ({ ...prev, loading: false }));
    }
  }

  return result;
}
