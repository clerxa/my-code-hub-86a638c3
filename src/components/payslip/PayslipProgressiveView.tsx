import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  fmt,
  fmtPct,
  getMonthLabel,
  safe,
  prioritizeAlerts,
  prioritizeActions,
  getCotisationsGrouped,
  CAS_PARTICULIERS_CONFIG,
} from "./payslipUtils";
import PayslipDetailModal from "./PayslipDetailModal";

interface PayslipProgressiveViewProps {
  data: any;
}

export default function PayslipProgressiveView({ data }: PayslipProgressiveViewProps) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [modalOpen, setModalOpen] = useState<string | null>(null);

  const d = data;
  const netPaye = safe(d, "net", "net_paye");
  const brut = safe(d, "remuneration_brute", "total_brut");
  const cotSal = safe(d, "cotisations_salariales", "total_cotisations_salariales");
  const netAvantImpot = safe(d, "net", "net_avant_impot");
  const basePas = safe(d, "net", "base_pas");
  const pas = safe(d, "net", "montant_pas");
  const tauxPas = safe(d, "net", "taux_pas_pct");

  const alerts = useMemo(() => prioritizeAlerts(data), [data]);
  const actions = useMemo(() => prioritizeActions(data), [data]);
  const cotisationsGrouped = useMemo(() => getCotisationsGrouped(data), [data]);

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);
  const visibleActions = showAllActions ? actions : actions.slice(0, 2);

  const hasEquity = d.remuneration_equity && (
    (Array.isArray(d.remuneration_equity.actions_gratuites_acquises) && d.remuneration_equity.actions_gratuites_acquises.length > 0) ||
    d.remuneration_equity.rsu_restricted_stock_units?.gain_brut_total ||
    d.remuneration_equity.espp_employee_stock_purchase_plan?.contribution_mensuelle ||
    d.remuneration_equity.avantages_nature_compenses?.total_brut
  );

  const hasEpargne = d.epargne_salariale && (
    d.epargne_salariale.interessement || d.epargne_salariale.participation ||
    d.epargne_salariale.pee_versement || d.epargne_salariale.perco_versement
  );

  const hasCasParticuliers = d.cas_particuliers_mois &&
    Object.values(d.cas_particuliers_mois).some((cas: any) => cas?.detecte);

  return (
    <div className="space-y-4">
      {/* ═══════════ SECTION 1: SUMMARY HEADER ═══════════ */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground">
          <div className="text-sm opacity-90 mb-1">
            {getMonthLabel(d.periode?.mois, d.periode?.annee)}
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="text-center">
              <div className="text-xs opacity-80">Brut</div>
              <div className="text-xl font-bold">{fmt(brut)}</div>
            </div>
            <div className="text-2xl opacity-60">→</div>
            <div className="text-center">
              <div className="text-xs opacity-80">Net payé</div>
              <div className="text-3xl font-extrabold">{fmt(netPaye)}</div>
            </div>
          </div>
          {d.periode?.date_paiement && (
            <div className="text-center text-xs opacity-75 mt-2">
              Versés le {d.periode.date_paiement}
            </div>
          )}
        </div>
      </Card>

      {/* ═══════════ SECTION 2: ESSENTIAL ALERTS ═══════════ */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>⚡</span> Ce qui est particulier ce mois-ci
          </h3>
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onShowDetails={alert.hasDetails ? () => setModalOpen(alert.id) : undefined}
            />
          ))}
          {!showAllAlerts && alerts.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowAllAlerts(true)}
            >
              Voir tous les points d'attention ({alerts.length - 3} autres)
            </Button>
          )}
        </div>
      )}

      {/* ═══════════ SECTION 2B: RECOMMENDED ACTIONS ═══════════ */}
      {actions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>💡</span> Actions recommandées
          </h3>
          {visibleActions.map((action) => (
            <div
              key={action.id}
              className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3 flex items-start gap-3"
            >
              <span className="text-lg flex-shrink-0">{action.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-green-900 dark:text-green-200">{action.text}</p>
                {action.ctaUrl && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto mt-1 text-green-700 dark:text-green-400"
                    onClick={() => window.open(action.ctaUrl, "_blank")}
                  >
                    {action.ctaLabel || "En savoir plus"} →
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!showAllActions && actions.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowAllActions(true)}
            >
              Voir tous les conseils ({actions.length - 2} autres)
            </Button>
          )}
        </div>
      )}

      {/* ═══════════ SECTION 3: ACCORDION DETAILS ═══════════ */}
      <Accordion type="multiple" className="space-y-2">
        {/* ── Décomposition brut → net ── */}
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
            {d.explications_pedagogiques?.brut_explication && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {d.explications_pedagogiques.brut_explication}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ── Cotisations ── */}
        <AccordionItem value="cotisations" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
            🛡️ À quoi servent vos cotisations ?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(cotisationsGrouped).map(([key, group]) => (
                <div
                  key={key}
                  className="rounded-lg border bg-card p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setModalOpen(`cotisations_${key}`)}
                >
                  <div className="text-2xl mb-1">{group.icon}</div>
                  <div className="text-xs font-semibold text-foreground">{group.label}</div>
                  <div className="text-sm font-bold text-primary mt-1">{fmt(group.total)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Voir détail →</div>
                </div>
              ))}
            </div>
            {/* Mini donut */}
            <CotisationsDonut data={data} className="mt-4" />
            {d.explications_pedagogiques?.cotisations_explication && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {d.explications_pedagogiques.cotisations_explication}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ── PAS ── */}
        <AccordionItem value="pas" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
            🏛️ Le prélèvement à la source
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
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 text-sm text-blue-900 dark:text-blue-200">
              💡 Si ta situation change (mariage, enfant, revenus), tu peux moduler ton taux sur impots.gouv.fr
            </div>
            {d.explications_pedagogiques?.pas_explication && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {d.explications_pedagogiques.pas_explication}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ── Éléments variables ── */}
        <AccordionItem value="variables" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
            💰 Éléments variables & primes
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <VariablesList data={data} />
          </AccordionContent>
        </AccordionItem>

        {/* ── Equity (conditional) ── */}
        {hasEquity && (
          <AccordionItem value="equity" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
              <span className="flex items-center gap-2">
                📈 Rémunération Equity
                <Badge variant="secondary" className="text-xs">Actions</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <EquitySection data={data} onOpenModal={setModalOpen} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* ── Congés & RTT ── */}
        <AccordionItem value="conges" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
            🏖️ Congés & RTT
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <CongesSection data={data} />
          </AccordionContent>
        </AccordionItem>

        {/* ── Épargne salariale ── */}
        <AccordionItem value="epargne" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
            🏦 Épargne salariale
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <EpargneSalarialeSection data={data} />
          </AccordionContent>
        </AccordionItem>

        {/* ── Cas particuliers ── */}
        {hasCasParticuliers && (
          <AccordionItem value="cas-particuliers" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
              ⚡ Cas particuliers du mois
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <CasParticuliersSection data={data} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* ── Cumuls annuels ── */}
        <AccordionItem value="cumuls" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
            📊 Cumuls annuels
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <StatMiniCard label="Brut cumulé" value={fmt(d.cumuls_annuels?.brut_cumule)} />
              <StatMiniCard label="Net imposable" value={fmt(d.cumuls_annuels?.net_imposable_cumule)} />
              <StatMiniCard label="PAS cumulé" value={fmt(d.cumuls_annuels?.pas_cumule)} />
            </div>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 text-xs text-blue-900 dark:text-blue-200">
              📈 Ces cumuls sont importants pour ta déclaration d'impôts en mai prochain.
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Infos complémentaires ── */}
        {d.informations_complementaires && (
          <AccordionItem value="infos" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-semibold">
              ℹ️ Informations complémentaires
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-1">
                {d.informations_complementaires.cout_total_employeur && (
                  <InfoLine label="Coût total employeur" value={fmt(d.informations_complementaires.cout_total_employeur)} />
                )}
                {d.informations_complementaires.plafond_securite_sociale_mensuel && (
                  <InfoLine label="Plafond SS mensuel" value={fmt(d.informations_complementaires.plafond_securite_sociale_mensuel)} />
                )}
                {d.informations_complementaires.allegements_cotisations > 0 && (
                  <InfoLine label="Allègements cotisations" value={fmt(d.informations_complementaires.allegements_cotisations)} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center italic py-2">
        Ces informations sont extraites automatiquement. En cas de doute, contactez votre service RH.
      </p>

      {/* Detail Modals */}
      <PayslipDetailModal
        open={!!modalOpen}
        onClose={() => setModalOpen(null)}
        modalType={modalOpen}
        data={data}
      />
    </div>
  );
}

// ═══════════ SUB-COMPONENTS ═══════════

function AlertCard({ alert, onShowDetails }: { alert: any; onShowDetails?: () => void }) {
  const priorityStyles: Record<number, string> = {
    1: "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800",
    2: "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800",
    3: "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
  };

  return (
    <div className={`rounded-lg border p-3 ${priorityStyles[alert.priority] || priorityStyles[3]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{alert.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{alert.title}</div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.summary}</p>
          {onShowDetails && (
            <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" onClick={onShowDetails}>
              En savoir plus →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SalaryLine({ label, amount, dimmed, emphasized }: { label: string; amount: string; dimmed?: boolean; emphasized?: boolean }) {
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CotisationsDonut({ data, className }: { data: any; className?: string }) {
  const brut = data.remuneration_brute?.total_brut || 0;
  const netPaye = data.net?.net_paye || 0;
  const cotSal = data.cotisations_salariales?.total_cotisations_salariales || 0;
  const pas = Math.abs(data.net?.montant_pas || 0);
  const total = cotSal + pas + netPaye;

  if (total === 0) return null;

  const segments = [
    { label: "Net payé", value: netPaye, color: "hsl(var(--chart-2, 142 71% 45%))" },
    { label: "Cotisations", value: cotSal, color: "hsl(var(--chart-4, 24 95% 53%))" },
    { label: "PAS", value: pas, color: "hsl(var(--chart-1, 221 83% 53%))" },
  ];

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 50;
  const strokeWidth = 25;
  let cumulative = 0;

  return (
    <div className={`flex items-center justify-center gap-6 flex-wrap ${className || ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const circumference = 2 * Math.PI * r;
          const dashLength = pct * circumference;
          const dashOffset = -cumulative * circumference;
          cumulative += pct;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
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
            <span className="font-semibold ml-auto">{fmt(seg.value)}</span>
            <span className="text-muted-foreground">({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariablesList({ data }: { data: any }) {
  const d = data.remuneration_brute;
  const items = [
    ["Salaire de base", d?.salaire_base],
    ["Heures supplémentaires", d?.heures_supplementaires],
    ["Prime ancienneté", d?.prime_anciennete],
    ["Prime objectifs", d?.prime_objectifs],
    ["Prime exceptionnelle", d?.prime_exceptionnelle],
    ["Avantages en nature", d?.avantages_en_nature],
    ["Tickets restaurant", d?.tickets_restaurant_part_patronale],
  ].filter(([, v]) => v != null && v !== 0) as [string, number][];

  const extras = d?.autres_elements_bruts || [];

  if (items.length === 0 && extras.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Aucun élément variable ce mois-ci.</p>;
  }

  return (
    <div className="space-y-1">
      {items.map(([label, val], i) => (
        <div key={i} className="flex justify-between text-sm py-1.5 border-b">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(val)}</span>
        </div>
      ))}
      {extras.map((item: any, i: number) => (
        <div key={`e-${i}`} className="flex justify-between text-sm py-1.5 border-b">
          <span className="text-muted-foreground">{typeof item === "string" ? item : item.label || "Autre"}</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {typeof item === "object" && item.montant ? fmt(item.montant) : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function EquitySection({ data, onOpenModal }: { data: any; onOpenModal: (id: string) => void }) {
  const eq = data.remuneration_equity;
  if (!eq) return null;

  return (
    <div className="space-y-3">
      {/* Actions gratuites */}
      {Array.isArray(eq.actions_gratuites_acquises) && eq.actions_gratuites_acquises.length > 0 && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎁</span>
            <span className="font-semibold text-sm">Actions gratuites</span>
          </div>
          {(() => {
            const totalActions = eq.actions_gratuites_acquises.reduce((acc: number, a: any) => acc + (a.nb_actions || 0), 0);
            const totalVal = eq.actions_gratuites_acquises.reduce((acc: number, a: any) => acc + (a.valeur_fiscale_totale || 0), 0);
            const typePlan = eq.actions_gratuites_acquises[0]?.type_plan;

            return (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={typePlan === "qualifie" ? "default" : "destructive"} className="text-xs">
                    {typePlan === "qualifie" ? "✅ Plan qualifié" : typePlan === "non_qualifie" ? "⚠️ Plan non qualifié" : "ℹ️ Type incertain"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {totalActions} actions acquises ({fmt(totalVal)})
                </p>
                {typePlan === "qualifie" ? (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2 text-xs text-green-800 dark:text-green-300">
                    ✅ AUCUN IMPÔT ce mois-ci ! Imposition uniquement à la vente.
                  </div>
                ) : typePlan === "non_qualifie" ? (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-2 text-xs text-amber-800 dark:text-amber-300">
                    ⚠️ Impôt supplémentaire payé ce mois-ci via le PAS.
                  </div>
                ) : null}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => onOpenModal(typePlan === "qualifie" ? "actions_gratuites_qualifie" : "actions_gratuites_non_qualifie")}
                >
                  Comment ça marche ? →
                </Button>
              </>
            );
          })()}
        </div>
      )}

      {/* RSU */}
      {eq.rsu_restricted_stock_units?.gain_brut_total && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-semibold text-sm">RSU</span>
            <Badge variant="secondary" className="text-xs">
              {eq.rsu_restricted_stock_units.variante === "sell_to_cover_45pct" ? "Sell-To-Cover" : "Simple"}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <InfoLine label="Gain brut total" value={fmt(eq.rsu_restricted_stock_units.gain_brut_total)} />
            {eq.rsu_restricted_stock_units.nb_actions_conservees && (
              <InfoLine label="Actions conservées" value={`${eq.rsu_restricted_stock_units.nb_actions_conservees} actions (${fmt(eq.rsu_restricted_stock_units.valeur_actions_conservees)})`} />
            )}
            {eq.rsu_restricted_stock_units.remboursement_stc_ou_broker && (
              <InfoLine label="Cash reçu" value={fmt(eq.rsu_restricted_stock_units.remboursement_stc_ou_broker)} />
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs"
            onClick={() => onOpenModal(eq.rsu_restricted_stock_units.variante === "sell_to_cover_45pct" ? "rsu_sell_to_cover" : "rsu_simple")}
          >
            Mécanisme détaillé →
          </Button>
        </div>
      )}

      {/* ESPP */}
      {eq.espp_employee_stock_purchase_plan?.contribution_mensuelle && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <span className="font-semibold text-sm">ESPP</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Contribution ce mois-ci : {fmt(eq.espp_employee_stock_purchase_plan.contribution_mensuelle)}
          </p>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-2 text-xs text-blue-800 dark:text-blue-300">
            💡 Plan d'achat avec décote 15%.
          </div>
          <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onOpenModal("espp")}>
            Comment ça marche ? →
          </Button>
        </div>
      )}

      {/* Avantages en nature */}
      {eq.avantages_nature_compenses?.total_brut && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍽️</span>
            <span className="font-semibold text-sm">Avantages en nature</span>
          </div>
          <div className="space-y-1 text-sm">
            <InfoLine label="BIK" value={fmt(eq.avantages_nature_compenses.food_bik_benefit_in_kind)} />
            <InfoLine label="Gross-Up" value={fmt(eq.avantages_nature_compenses.gross_up_compensation)} />
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2 text-xs text-green-800 dark:text-green-300">
            ✅ Impact net ≈ 0 € — L'employeur compense intégralement.
          </div>
          <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onOpenModal("avantages_nature")}>
            Explication détaillée →
          </Button>
        </div>
      )}
    </div>
  );
}

function CongesSection({ data }: { data: any }) {
  const c = data.conges_rtt;
  if (!c) return <p className="text-sm text-muted-foreground italic">Aucune donnée de congés détectée.</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <CongesCard title="CP N-1" solde={c.conges_n_moins_1?.solde} acquis={c.conges_n_moins_1?.acquis} pris={c.conges_n_moins_1?.pris} max={25} urgent={c.conges_n_moins_1?.solde > 0} />
        <CongesCard title="CP N" solde={c.conges_n?.solde} acquis={c.conges_n?.acquis} pris={c.conges_n?.pris} max={25} />
        <CongesCard title="RTT" solde={c.rtt?.solde} acquis={c.rtt?.acquis} pris={c.rtt?.pris} max={10} />
      </div>
      {(c.conges_pris_mois > 0 || c.rtt_pris_mois > 0) && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-2 text-xs text-blue-800 dark:text-blue-300">
          📅 Ce mois-ci : {c.conges_pris_mois > 0 ? `${c.conges_pris_mois} jour(s) de congés` : ""}
          {c.conges_pris_mois > 0 && c.rtt_pris_mois > 0 ? " + " : ""}
          {c.rtt_pris_mois > 0 ? `${c.rtt_pris_mois} jour(s) de RTT` : ""}
        </div>
      )}
    </div>
  );
}

function CongesCard({ title, solde, acquis, pris, max, urgent }: { title: string; solde: number | null; acquis: number | null; pris: number | null; max: number; urgent?: boolean }) {
  if (solde == null) return null;
  return (
    <div className={`rounded-lg border p-3 text-center ${urgent ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "bg-card"}`}>
      <div className="text-xs font-semibold text-muted-foreground">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${urgent ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{solde}</div>
      <div className="text-xs text-muted-foreground">jours</div>
      {acquis != null && (
        <Progress value={(acquis / max) * 100} className="h-1.5 mt-2" />
      )}
      <div className="text-xs text-muted-foreground mt-1">
        {acquis != null ? `${acquis} acq.` : ""} {pris != null ? `/ ${pris} pris` : ""}
      </div>
      {urgent && (
        <div className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">⏰ À prendre !</div>
      )}
    </div>
  );
}

function EpargneSalarialeSection({ data }: { data: any }) {
  const ep = data.epargne_salariale;
  const items = [
    ["Intéressement", ep?.interessement, "💰"],
    ["Participation", ep?.participation, "🎁"],
    ["PEE", ep?.pee_versement, "📊"],
    ["PERCO", ep?.perco_versement, "🏦"],
    ["Abondement employeur", ep?.abondement_employeur, "🎯"],
  ].filter(([, v]) => v != null && v !== 0) as [string, number, string][];

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          💡 Aucun élément d'épargne salariale ce mois-ci. Renseigne-toi auprès des RH.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([label, val, icon], i) => (
        <div key={i} className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl mb-1">{icon}</div>
          <div className="text-xs font-semibold">{label}</div>
          <div className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">{fmt(val)}</div>
        </div>
      ))}
    </div>
  );
}

function CasParticuliersSection({ data }: { data: any }) {
  const cas = data.cas_particuliers_mois || {};

  return (
    <div className="space-y-2">
      {Object.entries(cas).map(([key, val]: [string, any]) => {
        if (!val?.detecte) return null;
        const config = CAS_PARTICULIERS_CONFIG[key];
        return (
          <div key={key} className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span>{config?.icon || "⚡"}</span>
              {config?.title || key}
            </div>
            {val.explication && (
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">{val.explication}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
