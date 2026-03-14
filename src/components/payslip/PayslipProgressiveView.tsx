import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  fmt,
  fmtPct,
  fmtShort,
  getMonthLabel,
  safe,
  getCotisationsPct,
  getPriorityStyle,
  getPointIcon,
  getCotisationsGrouped,
  normalizePointsAttention,
  normalizeActions,
} from "./payslipUtils";
import PayslipDetailModal from "./PayslipDetailModal";
import { BookOpen, ChevronUp } from "lucide-react";
import type { PayslipData, PointAttention, ActionRecommandee } from "@/types/payslip";

interface PayslipProgressiveViewProps {
  data: PayslipData;
  /** Called when the user clicks on an action with cta_url = null (e.g. paywall trigger) */
  onActionClick?: (action: ActionRecommandee) => void;
}

export default function PayslipProgressiveView({ data, onActionClick }: PayslipProgressiveViewProps) {
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [modalPoint, setModalPoint] = useState<PointAttention | null>(null);

  const d = data;
  const netPaye = safe(d, "net", "net_paye");
  const brut = safe(d, "remuneration_brute", "total_brut");
  const cotSal = safe(d, "cotisations_salariales", "total_cotisations_salariales");
  const netAvantImpot = safe(d, "net", "net_avant_impot");
  const basePas = safe(d, "net", "base_pas");
  const pas = safe(d, "net", "montant_pas");
  const tauxPas = safe(d, "net", "taux_pas_pct");
  const cotPct = getCotisationsPct(d);
  const cotisationsGrouped = useMemo(() => getCotisationsGrouped(d), [d]);

  // Points d'attention & actions from backend (already sorted by priorite)
  const points = useMemo(
    () => [...(d.points_attention || [])].sort((a, b) => a.priorite - b.priorite).slice(0, 5),
    [d.points_attention]
  );
  const actions = useMemo(
    () => [...(d.actions_recommandees || [])].sort((a, b) => a.priorite - b.priorite).slice(0, 3),
    [d.actions_recommandees]
  );

  const hasEquityData = !!(d.remuneration_equity && (
    d.remuneration_equity.rsu_detected ||
    d.remuneration_equity.actions_gratuites_detected ||
    d.remuneration_equity.espp_detected ||
    d.remuneration_equity.avantages_nature_detected
  ));

  const openPointModal = (point: PointAttention) => {
    setModalPoint(point);
    setModalOpen(`point_${point.id}`);
  };

  return (
    <div className="space-y-4">
      {/* ═══════════ BLOC 1 : HERO — Brut → Net ═══════════ */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="text-sm opacity-90 mb-3 text-center">
            📊 {getMonthLabel(d.periode?.mois, d.periode?.annee)}
          </div>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Brut</div>
              <div className="text-xl font-bold">{fmtShort(brut)}</div>
            </div>
            <div className="text-2xl opacity-50 font-light">→</div>
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Net payé</div>
              <div className="text-3xl font-extrabold tracking-tight">{fmtShort(netPaye)}</div>
            </div>
          </div>
          {d.periode?.date_paiement && (
            <div className="text-center text-xs opacity-75 mt-3">
              Versés le {d.periode.date_paiement}
            </div>
          )}
        </div>
        <div className="p-2 border-t bg-card">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setModalOpen("brut_net_explication")}
            aria-label="Explication brut vers net"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Comment on passe de brut à net ?
          </Button>
        </div>
      </Card>

      {/* ═══════════ BLOC 2 : DÉCOMPOSITION — Toujours affiché ═══════════ */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <span>💡</span>
          Comment j'arrive à ce net payé
        </h3>
        <div className="space-y-2 bg-muted/30 rounded-lg p-4">
          <SalaryLine label="Salaire brut" amount={fmtShort(brut)} />
          <SalaryLine
            label={`− Cotisations${cotPct ? ` (${cotPct}%)` : ""}`}
            amount={`− ${fmtShort(cotSal)}`}
            dimmed
          />
          <SalaryLine
            label={`− Impôt (PAS ${fmtPct(tauxPas)})`}
            amount={`− ${fmtShort(Math.abs(pas || 0))}`}
            dimmed
          />
          <div className="border-t-2 border-green-500/50 my-2" />
          <div className="flex justify-between items-center bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
            <span className="text-base font-bold text-green-700 dark:text-green-400">= Net payé</span>
            <span className="text-2xl font-extrabold text-green-700 dark:text-green-400">{fmtShort(netPaye)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground mt-2"
          onClick={() => setShowAllDetails(true)}
        >
          Voir le détail complet →
        </Button>
      </Card>

      {/* ═══════════ BLOC 3 : POINTS D'ATTENTION — Conditionnel ═══════════ */}
      {points.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <span>⚠️</span>
            {points.length} point{points.length > 1 ? "s" : ""} d'attention détecté{points.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-2.5">
            {points.map((point) => {
              const style = getPriorityStyle(point.priorite);
              const icon = getPointIcon(point.id);
              return (
                <div
                  key={point.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${style.border} ${style.bg}`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground leading-tight">
                      {point.titre}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{point.resume}</p>
                    {point.a_modal && point.explication_detaillee && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-1 text-xs text-primary"
                        onClick={() => openPointModal(point)}
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

      {/* ═══════════ BLOC 4 : ACTIONS RECOMMANDÉES — Conditionnel ═══════════ */}
      {actions.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <span>✅</span>
            {actions.length} action{actions.length > 1 ? "s" : ""} recommandée{actions.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-2.5">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-200/60 dark:border-green-800/40 p-3"
              >
                <span className="text-base flex-shrink-0 mt-0.5">💡</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{action.texte}</p>
                  {action.cta_label && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1 text-xs text-primary"
                      onClick={() => {
                        if (action.cta_url) {
                          window.open(action.cta_url, "_blank", "noopener");
                        } else {
                          onActionClick?.(action);
                        }
                      }}
                    >
                      {action.cta_label} →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════ BOUTON "VOIR LE DÉTAIL COMPLET" ═══════════ */}
      {!showAllDetails ? (
        <Button
          variant="outline"
          className="w-full py-5 text-sm font-medium"
          onClick={() => setShowAllDetails(true)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          📖 Voir le détail complet de ma paie
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Détail complet de ma paie
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowAllDetails(false)}
              >
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Masquer
              </Button>
            </div>

            <Accordion
              type="multiple"
              defaultValue={hasEquityData ? ["equity"] : []}
              className="space-y-1.5"
            >
              {/* Equity section — always first when detected */}
              {hasEquityData && (
                <AccordionItem value="equity" className="border-2 border-primary/30 rounded-lg overflow-hidden bg-primary/[0.02]">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                    <span className="flex items-center gap-2">
                      📈 Rémunération Equity
                      <Badge variant="default" className="text-xs">Actions</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <EquitySummary data={d} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Brut → Net decomposition */}
              <AccordionItem value="brut-net" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                  📊 Décomposition brut → net
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                    <SalaryLine label="Salaire brut" amount={fmt(brut)} />
                    <SalaryLine label="Cotisations salariales" amount={`− ${fmt(cotSal)}`} dimmed />
                    <div className="border-t border-dashed border-primary/30 my-2" />
                    <SalaryLine label="= Net avant impôt" amount={fmt(netAvantImpot)} emphasized />
                    {basePas != null && basePas !== netAvantImpot && (
                      <SalaryLine label="Base PAS (net imposable)" amount={fmt(basePas)} dimmed />
                    )}
                    <SalaryLine
                      label={`Prélèvement à la source (${fmtPct(tauxPas)})`}
                      amount={`− ${fmt(Math.abs(pas || 0))}`}
                      dimmed
                    />
                    <div className="border-t-2 border-green-500/50 my-2" />
                    <div className="flex justify-between items-center bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                      <span className="text-base font-bold text-green-700 dark:text-green-400">= NET PAYÉ</span>
                      <span className="text-2xl font-extrabold text-green-700 dark:text-green-400">{fmt(netPaye)}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Cotisations detail */}
              <AccordionItem value="cotisations" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                  🛡️ Mes cotisations
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(cotisationsGrouped).map(([key, group]) => (
                      <button
                        key={key}
                        className="rounded-lg border bg-card p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setModalOpen(`cotisations_${key}`)}
                        aria-label={`Voir détail ${group.label}`}
                      >
                        <div className="text-2xl mb-1">{group.icon}</div>
                        <div className="text-xs font-semibold text-foreground">{group.label}</div>
                        <div className="text-sm font-bold text-primary mt-1">{fmt(group.total)}</div>
                        <div className="text-xs text-muted-foreground mt-1">Voir détail →</div>
                      </button>
                    ))}
                  </div>
                  <CotisationsDonut data={d} className="mt-4" />
                </AccordionContent>
              </AccordionItem>

              {/* PAS (impôt) */}
              <AccordionItem value="pas" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                  🏛️ Mon impôt (PAS)
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-extrabold text-primary">{fmtPct(tauxPas)}</div>
                    <div className="text-xs text-muted-foreground">Ton taux de prélèvement</div>
                  </div>
                  <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base imposable</span>
                      <span className="font-medium">{fmt(basePas)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">× Taux {fmtPct(tauxPas)}</span>
                      <span className="font-medium">− {fmt(Math.abs(pas || 0))}</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                    💡 Si ta situation change (mariage, enfant, revenus), tu peux moduler ton taux sur impots.gouv.fr
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Éléments variables */}
              <AccordionItem value="variables" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                  💰 Éléments variables & primes
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <VariablesList data={d} />
                </AccordionContent>
              </AccordionItem>

              {/* Cumuls annuels */}
              {d.cumuls_annuels && (
                <AccordionItem value="cumuls" className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                    📊 Cumuls annuels
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      <StatMiniCard label="Brut cumulé" value={fmtShort(d.cumuls_annuels.brut_cumule)} />
                      <StatMiniCard label="Net imposable" value={fmtShort(d.cumuls_annuels.net_imposable_cumule)} />
                      <StatMiniCard label="PAS cumulé" value={fmtShort(d.cumuls_annuels.pas_cumule)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </>
      )}

      {/* ═══════════ DISCLAIMER LÉGAL ═══════════ */}
      <Card className="p-4 border-accent/30 bg-accent/5">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
          ⚠️ Avertissement
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cette analyse est générée automatiquement par intelligence artificielle à titre informatif et pédagogique uniquement.
          Les montants peuvent contenir des imprécisions. Myfincare décline toute responsabilité quant aux décisions prises sur cette base.
          Pour toute question, consultez votre service RH ou un conseiller patrimonial.
        </p>
      </Card>

      {/* ═══════════ MODALS ═══════════ */}
      <PayslipDetailModal
        open={!!modalOpen}
        onClose={() => { setModalOpen(null); setModalPoint(null); }}
        modalType={modalOpen}
        data={d}
        activePoint={modalPoint}
      />
    </div>
  );
}

// ═══════════ SUB-COMPONENTS ═══════════

function SalaryLine({ label, amount, dimmed, emphasized }: {
  label: string; amount: string; dimmed?: boolean; emphasized?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center text-sm py-1 ${dimmed ? "text-muted-foreground" : ""}`}>
      <span className={emphasized ? "font-semibold text-primary" : ""}>{label}</span>
      <span className={`font-medium ${emphasized ? "text-primary font-bold" : ""}`}>{amount}</span>
    </div>
  );
}

function StatMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}

function EquitySummary({ data }: { data: PayslipData }) {
  const eq = data.remuneration_equity;
  if (!eq) return null;

  const items: { icon: string; label: string; value: string }[] = [];

  if (eq.rsu_detected && eq.rsu_montant_brut) {
    items.push({ icon: "📈", label: "RSU", value: fmt(eq.rsu_montant_brut) });
  }
  if (eq.actions_gratuites_detected && eq.actions_gratuites_nb) {
    items.push({
      icon: "🎁",
      label: `${eq.actions_gratuites_nb} actions gratuites`,
      value: eq.actions_gratuites_valeur ? fmt(eq.actions_gratuites_valeur) : "—",
    });
  }
  if (eq.espp_detected && eq.espp_contribution) {
    items.push({ icon: "🏪", label: "ESPP contribution", value: fmt(eq.espp_contribution) });
  }
  if (eq.avantages_nature_detected && eq.avantages_nature_montant) {
    items.push({ icon: "🍽️", label: "Avantages en nature", value: fmt(eq.avantages_nature_montant) });
  }

  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">Aucun dispositif equity détecté.</p>;

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
          <span className="flex items-center gap-2">
            <span>{item.icon}</span>
            <span className="text-foreground font-medium">{item.label}</span>
          </span>
          <span className="font-bold text-primary">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function VariablesList({ data }: { data: PayslipData }) {
  const d = data.remuneration_brute;
  if (!d) return <p className="text-sm text-muted-foreground italic">Aucun élément variable.</p>;

  const items = [
    ["Salaire de base", d.salaire_base],
    ["Heures supplémentaires", d.heures_supplementaires],
    ["Prime ancienneté", d.prime_anciennete],
    ["Prime objectifs", d.prime_objectifs],
    ["Prime exceptionnelle", d.prime_exceptionnelle],
    ["Avantages en nature", d.avantages_en_nature],
  ].filter(([, v]) => v != null && v !== 0) as [string, number][];

  const extras = d.autres_elements_bruts || [];

  if (items.length === 0 && extras.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Aucun élément variable ce mois-ci.</p>;
  }

  return (
    <div className="space-y-1">
      {items.map(([label, val], i) => (
        <div key={i} className="flex justify-between text-sm py-1.5 border-b">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold text-accent">{fmt(val)}</span>
        </div>
      ))}
      {extras.map((item: any, i: number) => (
        <div key={`e-${i}`} className="flex justify-between text-sm py-1.5 border-b">
          <span className="text-muted-foreground">{typeof item === "string" ? item : item.label || "Autre"}</span>
          <span className="font-semibold text-accent">
            {typeof item === "object" && item.montant ? fmt(item.montant) : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function CotisationsDonut({ data, className }: { data: PayslipData; className?: string }) {
  const netPaye = data.net?.net_paye || 0;
  const cotSal = data.cotisations_salariales?.total_cotisations_salariales || 0;
  const pas = Math.abs(data.net?.montant_pas || 0);
  const total = cotSal + pas + netPaye;

  if (total === 0) return null;

  const segments = [
    { label: "Net payé", value: netPaye, color: "hsl(var(--success))" },
    { label: "Cotisations", value: cotSal, color: "hsl(var(--accent))" },
    { label: "PAS", value: pas, color: "hsl(var(--primary))" },
  ];

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50;
  const strokeWidth = 25;
  let cumulative = 0;

  return (
    <div className={`flex items-center justify-center gap-6 flex-wrap ${className || ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Répartition brut">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const circumference = 2 * Math.PI * r;
          const dashLength = pct * circumference;
          const dashOffset = -cumulative * circumference;
          cumulative += pct;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-semibold ml-auto">{fmtShort(seg.value)}</span>
            <span className="text-muted-foreground">({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
