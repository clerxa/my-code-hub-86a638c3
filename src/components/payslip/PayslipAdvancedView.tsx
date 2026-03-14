/**
 * PayslipAdvancedView — Vue Premium (affiche 100% des données)
 * Mêmes données que Simple, mais sans filtre + accordéons détaillés.
 */
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
import { BookOpen, ChevronUp } from "lucide-react";
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
  getRemboursementsDeductionsLines,
} from "./payslipUtils";
import PayslipDetailModal from "./PayslipDetailModal";
import type { PayslipData, PointAttention, ActionRecommandee } from "@/types/payslip";

interface PayslipAdvancedViewProps {
  data: PayslipData;
  onReset?: () => void;
}

export default function PayslipAdvancedView({ data, onReset }: PayslipAdvancedViewProps) {
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
  const rembLines = useMemo(() => getRemboursementsDeductionsLines(d), [d]);

  // TOUS les points d'attention (pas de limite)
  const points = useMemo(
    () => normalizePointsAttention(d.points_attention).sort((a, b) => a.priorite - b.priorite),
    [d.points_attention]
  );
  const actions = useMemo(
    () => normalizeActions(d.actions_recommandees).sort((a, b) => a.priorite - b.priorite),
    [d.actions_recommandees]
  );

  const hasEquityData = !!(d.remuneration_equity && (
    d.remuneration_equity.rsu_restricted_stock_units?.gain_brut_total ||
    (d.remuneration_equity.actions_gratuites_acquises && d.remuneration_equity.actions_gratuites_acquises.length > 0 && d.remuneration_equity.actions_gratuites_acquises[0]?.nb_actions) ||
    d.remuneration_equity.espp_employee_stock_purchase_plan?.contribution_mensuelle ||
    d.remuneration_equity.avantages_nature_compenses?.total_brut ||
    d.remuneration_equity.rsu_detected ||
    d.remuneration_equity.actions_gratuites_detected ||
    d.remuneration_equity.espp_detected
  ));

  const openPointModal = (point: PointAttention) => {
    setModalPoint(point);
    setModalOpen(`point_${point.id}`);
  };

  return (
    <div className="space-y-4">
      {/* ═══════════ BLOC 1 : HERO ═══════════ */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="text-sm opacity-90 mb-3 text-center">
            📊 {getMonthLabel(d.periode?.mois, d.periode?.annee)}
            <Badge variant="secondary" className="ml-2 text-xs">Analyse complète</Badge>
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

      {/* ═══════════ BLOC 2 : DÉCOMPOSITION ═══════════ */}
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
          {rembLines.map((line, i) => (
            <SalaryLine
              key={i}
              label={`${line.sign === "+" ? "+" : "−"} ${line.label}`}
              amount={`${line.sign === "+" ? "+" : "−"} ${fmtShort(Math.abs(line.montant))}`}
              dimmed={line.sign === "-"}
            />
          ))}
          {rembLines.length > 0 && netAvantImpot && (
            <>
              <div className="border-t border-dashed border-primary/30 my-2" />
              <SalaryLine label="= Net avant impôt" amount={fmtShort(netAvantImpot)} emphasized />
            </>
          )}
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
      </Card>

      {/* ═══════════ BLOC 3 : TOUS LES POINTS D'ATTENTION ═══════════ */}
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

      {/* ═══════════ BLOC 4 : TOUTES LES ACTIONS ═══════════ */}
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
                          if (action.cta_url.startsWith("http")) {
                            window.open(action.cta_url, "_blank", "noopener");
                          } else {
                            window.location.href = action.cta_url;
                          }
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

      {/* ═══════════ DÉTAILS COMPLETS (Accordéons) ═══════════ */}
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
            {/* Equity section */}
            {hasEquityData && (
              <AccordionItem value="equity" className="border-2 border-primary/30 rounded-lg overflow-hidden bg-primary/[0.02]">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    📈 Rémunération Equity
                    <Badge variant="default" className="text-xs">Actions</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <EquityDetail data={d} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Brut → Net */}
            <AccordionItem value="brut-net" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                📊 Décomposition brut → net
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                  <SalaryLine label="Salaire brut" amount={fmt(brut)} />
                  <SalaryLine label="Cotisations salariales" amount={`− ${fmt(cotSal)}`} dimmed />
                  {rembLines.map((line, i) => (
                    <SalaryLine
                      key={i}
                      label={`${line.sign === "+" ? "+" : "−"} ${line.label}`}
                      amount={`${line.sign === "+" ? "+" : "−"} ${fmt(Math.abs(line.montant))}`}
                      dimmed={line.sign === "-"}
                    />
                  ))}
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

            {/* Cotisations */}
            <AccordionItem value="cotisations" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                🛡️ Mes cotisations détaillées
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(cotisationsGrouped).map(([key, group]) => (
                    <button
                      key={key}
                      className="rounded-lg border bg-card p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setModalOpen(`cotisations_${key}`)}
                    >
                      <div className="text-2xl mb-1">{group.icon}</div>
                      <div className="text-xs font-semibold text-foreground">{group.label}</div>
                      <div className="text-sm font-bold text-primary mt-1">{fmt(group.total)}</div>
                      <div className="text-xs text-muted-foreground mt-1">Voir détail →</div>
                    </button>
                  ))}
                </div>
                {d.explications_pedagogiques?.cotisations_explication && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                    {d.explications_pedagogiques.cotisations_explication}
                  </div>
                )}
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
                  <div className="text-xs text-muted-foreground">Votre taux de prélèvement</div>
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
                {d.explications_pedagogiques?.pas_explication && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                    {d.explications_pedagogiques.pas_explication}
                  </div>
                )}
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                  💡 Si votre situation change (mariage, enfant, revenus), vous pouvez moduler votre taux sur impots.gouv.fr
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

            {/* Conseils d'optimisation */}
            {d.conseils_optimisation && d.conseils_optimisation.length > 0 && (
              <AccordionItem value="conseils" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
                  💡 Conseils d'optimisation
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {d.conseils_optimisation.map((conseil, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <p className="text-muted-foreground">{conseil}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

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
      )}

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <Card className="p-4 border-accent/30 bg-accent/5">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
          ⚠️ Avertissement
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cette analyse est générée automatiquement par intelligence artificielle à titre informatif et pédagogique uniquement.
          Les montants peuvent contenir des imprécisions. MyFinCare décline toute responsabilité quant aux décisions prises sur cette base.
          Pour toute question, consultez votre service RH ou un conseiller patrimonial.
        </p>
      </Card>

      {/* ─── FOOTER ─── */}
      <div className="flex gap-2 flex-wrap">
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>🔄 Nouvelle analyse</Button>
        )}
        {data._usage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <span>🤖 {data._usage.model}</span>
            <span>💰 ${data._usage.cost_total_usd}</span>
          </div>
        )}
      </div>

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

function EquityDetail({ data }: { data: PayslipData }) {
  const eq = data.remuneration_equity;
  if (!eq) return null;

  const items: { icon: string; label: string; value: string; detail?: string }[] = [];

  // Simple format detection
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

  // Advanced format
  if (eq.rsu_restricted_stock_units?.gain_brut_total) {
    const rsu = eq.rsu_restricted_stock_units;
    items.push({
      icon: "📈",
      label: `RSU (${rsu.variante || "—"})`,
      value: fmt(rsu.gain_brut_total),
      detail: rsu.mecanisme_description || undefined,
    });
    if (rsu.nb_actions_conservees) {
      items.push({
        icon: "📦",
        label: "Actions conservées",
        value: `${rsu.nb_actions_conservees} (${fmt(rsu.valeur_actions_conservees)})`,
      });
    }
    if (rsu.remboursement_stc_ou_broker) {
      items.push({
        icon: "💶",
        label: "Cash reçu (STC/Broker)",
        value: fmt(rsu.remboursement_stc_ou_broker),
      });
    }
  }

  if (eq.actions_gratuites_acquises && eq.actions_gratuites_acquises.length > 0) {
    eq.actions_gratuites_acquises.forEach((ag, i) => {
      if (!ag.nb_actions) return;
      items.push({
        icon: "🎁",
        label: `${ag.nb_actions} actions gratuites${ag.type_plan ? ` (${ag.type_plan})` : ""}`,
        value: ag.valeur_fiscale_totale ? fmt(ag.valeur_fiscale_totale) : "—",
        detail: ag.impact_pas_immediat ? "Impact PAS immédiat" : "Pas d'impact PAS ce mois",
      });
    });
  }

  if (eq.espp_detected && eq.espp_contribution) {
    items.push({ icon: "🏪", label: "ESPP contribution", value: fmt(eq.espp_contribution) });
  }
  if (eq.espp_employee_stock_purchase_plan?.contribution_mensuelle) {
    items.push({
      icon: "🏪",
      label: `ESPP${eq.espp_employee_stock_purchase_plan.periode ? ` (${eq.espp_employee_stock_purchase_plan.periode})` : ""}`,
      value: fmt(eq.espp_employee_stock_purchase_plan.contribution_mensuelle),
    });
  }

  if (eq.avantages_nature_detected && eq.avantages_nature_montant) {
    items.push({ icon: "🍽️", label: "Avantages en nature", value: fmt(eq.avantages_nature_montant) });
  }
  if (eq.avantages_nature_compenses?.total_brut) {
    items.push({
      icon: "🍽️",
      label: "Avantages compensés (gross-up)",
      value: fmt(eq.avantages_nature_compenses.total_brut),
    });
  }

  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">Aucun dispositif equity détecté.</p>;

  // Pedagogical explanation
  const equityExpl = data.explications_pedagogiques?.equity_explication;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border-b last:border-0 pb-2 last:pb-0">
          <div className="flex justify-between items-center text-sm py-1">
            <span className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-foreground font-medium">{item.label}</span>
            </span>
            <span className="font-bold text-primary">{item.value}</span>
          </div>
          {item.detail && (
            <p className="text-xs text-muted-foreground ml-7">{item.detail}</p>
          )}
        </div>
      ))}

      {equityExpl && typeof equityExpl === "object" && (
        <div className="mt-3 space-y-2">
          {Object.entries(equityExpl).map(([key, expl]) => {
            if (!expl || typeof expl !== "string") return null;
            return (
              <div key={key} className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
                {expl}
              </div>
            );
          })}
        </div>
      )}
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
    ["Tickets restaurant (part patronale)", d.tickets_restaurant_part_patronale],
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
