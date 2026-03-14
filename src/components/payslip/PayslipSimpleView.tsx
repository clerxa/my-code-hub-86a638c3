/**
 * PayslipSimpleView — Vue gratuite (filtre les données à ~30%)
 * V3.0 — Conditional equity, absences in days, primes section, no offsets
 */
import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, ChevronRight } from "lucide-react";
import {
  fmt,
  fmtShort,
  fmtPct,
  getMonthLabel,
  safe,
  getPriorityStyle,
  getPointIcon,
  normalizePointsAttention,
  normalizeActions,
  getRemboursementsDeductionsLines,
  hasEquity,
  getAbsencesDays,
} from "./payslipUtils";
import PayslipDetailModal from "./PayslipDetailModal";
import type { PayslipData, PointAttention } from "@/types/payslip";

interface PayslipSimpleViewProps {
  data: PayslipData;
  onUpgradeClick?: () => void;
  onReset?: () => void;
}

export default function PayslipSimpleView({ data, onUpgradeClick, onReset }: PayslipSimpleViewProps) {
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [activePoint, setActivePoint] = useState<PointAttention | null>(null);

  const brut = safe(data, "remuneration_brute", "total_brut");
  const netPaye = safe(data, "net", "net_paye");
  const cotSal = safe(data, "cotisations_salariales", "total_cotisations_salariales");
  const pas = safe(data, "net", "montant_pas");
  const tauxPas = safe(data, "net", "taux_pas_pct");
  const netAvantImpot = safe(data, "net", "net_avant_impot");
  const monthLabel = getMonthLabel(data?.periode?.mois, data?.periode?.annee);
  const cotPct = brut && cotSal ? Math.round((cotSal / brut) * 100) : null;

  // Remboursements & déductions lines (no offsets in simple view)
  const rembLines = useMemo(() => getRemboursementsDeductionsLines(data), [data]);

  // Absences in days
  const absencesDays = useMemo(() => getAbsencesDays(data), [data]);

  // Vue simple : max 3 points d'attention, max 2 actions
  const allPoints = useMemo(
    () => normalizePointsAttention(data.points_attention).sort((a, b) => a.priorite - b.priorite),
    [data.points_attention]
  );
  const points = allPoints.slice(0, 3);
  const hiddenPointsCount = Math.max(0, allPoints.length - 3);

  const actions = useMemo(
    () => normalizeActions(data.actions_recommandees).sort((a, b) => a.priorite - b.priorite).slice(0, 2),
    [data.actions_recommandees]
  );

  const equityDetected = hasEquity(data);

  return (
    <div className="space-y-4">
      {/* ─── BLOC 1: HERO ─── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground text-center">
          <div className="text-xs opacity-80 mb-1">📊 {monthLabel}</div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-xs opacity-70">Brut</div>
              <div className="text-lg font-bold">{fmtShort(brut)}</div>
            </div>
            <div className="text-xl opacity-50">→</div>
            <div className="text-center">
              <div className="text-xs opacity-70">Net payé</div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">{fmtShort(netPaye)}</div>
            </div>
          </div>
          {data.periode?.date_paiement && (
            <div className="text-xs opacity-60 mt-2">Versés le {data.periode.date_paiement}</div>
          )}
        </div>
      </Card>

      {/* ─── BLOC 2: DÉCOMPOSITION ─── */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <span>💡</span> Comment j'arrive à ce net payé
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salaire brut</span>
            <span className="font-medium">{fmtShort(brut)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">− Cotisations{cotPct ? ` (${cotPct}%)` : ""}</span>
            <span className="font-medium text-muted-foreground">− {fmtShort(cotSal)}</span>
          </div>

          {/* Remboursements & déductions (classiques uniquement, pas d'offsets) */}
          {rembLines.map((line, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-muted-foreground">{line.sign === "+" ? "+" : "−"} {line.label}</span>
              <span className={`font-medium ${line.sign === "+" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                {line.sign === "+" ? "+" : "−"} {fmtShort(Math.abs(line.montant))}
              </span>
            </div>
          ))}

          {/* Net avant impôt (if adjustments exist) */}
          {rembLines.length > 0 && netAvantImpot && (
            <div className="border-t border-dashed pt-1.5 mt-1.5 flex justify-between items-center">
              <span className="font-semibold text-foreground">= Net avant impôt</span>
              <span className="font-bold text-foreground">{fmtShort(netAvantImpot)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">− Impôt (PAS {tauxPas ? `${Math.abs(tauxPas).toFixed(1)}%` : ""})</span>
            <span className="font-medium text-muted-foreground">− {fmtShort(Math.abs(pas || 0))}</span>
          </div>
          <div className="border-t pt-1.5 mt-1.5 flex justify-between items-center">
            <span className="font-bold text-green-700 dark:text-green-400">= Net payé</span>
            <span className="text-xl font-extrabold text-green-700 dark:text-green-400">{fmtShort(netPaye)}</span>
          </div>
        </div>
      </Card>

      {/* ─── BLOC 3: ABSENCES (en jours) ─── */}
      {absencesDays.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <span>📅</span> Absences ce mois
          </h3>
          <div className="space-y-1.5 text-sm">
            {absencesDays.map((abs, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{abs.label}</span>
                <span className="font-medium">{abs.jours} jour{abs.jours > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── BLOC 4: POINTS D'ATTENTION (max 3) ─── */}
      {points.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <span>⚠️</span>
            {points.length} point{points.length > 1 ? "s" : ""} d'attention
            {hiddenPointsCount > 0 && (
              <Badge variant="secondary" className="text-xs ml-auto">
                +{hiddenPointsCount} en Premium
              </Badge>
            )}
          </h3>
          <div className="space-y-2.5">
            {points.map((point) => {
              const style = getPriorityStyle(point.priorite);
              const icon = getPointIcon(point.id);
              return (
                <div key={point.id} className={`flex items-start gap-3 rounded-lg border p-3 ${style.border} ${style.bg}`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground leading-tight">{point.titre}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{point.resume}</p>
                    {point.a_modal && point.explication_detaillee && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-1 text-xs text-primary"
                        onClick={() => { setActivePoint(point); setModalOpen(`point_${point.id}`); }}
                      >
                        En savoir plus →
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─── BLOC 5: ACTIONS (max 2) ─── */}
      {actions.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <span>✅</span> Action{actions.length > 1 ? "s" : ""} recommandée{actions.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-2">
            {actions.map((action) => (
              <div key={action.id} className="flex items-start gap-3 rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-200/60 dark:border-green-800/40 p-3">
                <span className="text-base flex-shrink-0 mt-0.5">💡</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{action.texte}</p>
                  {action.cta_label && action.cta_url && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs text-primary"
                      onClick={() => window.open(action.cta_url!, "_blank", "noopener")}>
                      {action.cta_label} →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── PAYWALL CTA ─── */}
      <Card className="p-5 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">
              🔒 Analyse avancée disponible
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {equityDetected
                ? "Vous avez reçu de l'equity ce mois-ci. L'analyse avancée vous explique les mécanismes fiscaux (Sell-To-Cover, plan qualifié, etc.) et vous propose des conseils d'optimisation personnalisés."
                : "Obtenez la décomposition détaillée de vos cotisations, des explications pédagogiques complètes et des conseils d'optimisation fiscale personnalisés."
              }
            </p>
            <Button className="mt-3 w-full" size="sm" onClick={onUpgradeClick}>
              <Sparkles className="h-4 w-4 mr-2" />
              Débloquer l'analyse avancée
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── FOOTER ─── */}
      <div className="flex gap-2 flex-wrap">
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>🔄 Nouvelle analyse</Button>
        )}
        {data._usage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <span>💰 ${data._usage.cost_total_usd}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center italic">
        Données extraites automatiquement. En cas de doute, contactez votre service RH.
      </p>

      <PayslipDetailModal
        open={!!modalOpen}
        onClose={() => { setModalOpen(null); setActivePoint(null); }}
        modalType={modalOpen}
        data={data}
        activePoint={activePoint}
      />
    </div>
  );
}
