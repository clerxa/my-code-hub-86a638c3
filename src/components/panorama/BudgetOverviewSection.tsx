import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatEuros = (val: number): string =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);

const RULE_COLORS = {
  fixes: "hsl(var(--primary))",
  courantes: "hsl(220 70% 55%)",
  epargne: "hsl(142 60% 45%)",
};

const DETAIL_COLORS = [
  "hsl(var(--primary))",
  "hsl(220 70% 55%)",
  "hsl(262 60% 55%)",
  "hsl(24 80% 55%)",
  "hsl(142 60% 45%)",
  "hsl(340 65% 55%)",
  "hsl(190 70% 45%)",
  "hsl(45 80% 50%)",
  "hsl(0 65% 55%)",
  "hsl(280 50% 60%)",
  "hsl(160 55% 40%)",
  "hsl(30 70% 50%)",
];

interface ChargeItem {
  label: string;
  value: number;
  category: "fixes" | "courantes";
}

interface BudgetOverviewSectionProps {
  totalRevenus: number;
  totalChargesFixesImpots: number; // source of truth from Panorama
  chargesFixesItems: ChargeItem[];
  depensesCourantesItems: ChargeItem[];
  impotMensuel: number;
  epargne: number;
}

export function BudgetOverviewSection({
  totalRevenus,
  totalChargesFixesImpots,
  chargesFixesItems,
  depensesCourantesItems,
  impotMensuel,
  epargne,
}: BudgetOverviewSectionProps) {
  const analysis = useMemo(() => {
    if (totalRevenus <= 0) return null;

    const totalFixes = totalChargesFixesImpots;
    const totalCourantes = depensesCourantesItems.reduce((s, i) => s + i.value, 0);
    const totalEpargne = epargne;

    const pctFixes = Math.round((totalFixes / totalRevenus) * 100);
    const pctCourantes = Math.round((totalCourantes / totalRevenus) * 100);
    const pctEpargne = Math.round((totalEpargne / totalRevenus) * 100);
    const nonAlloue = Math.max(0, totalRevenus - totalFixes - totalCourantes - totalEpargne);
    const pctNonAlloue = Math.max(0, 100 - pctFixes - pctCourantes - pctEpargne);

    // Detailed charges for breakdown pie
    const detailItems: { name: string; value: number }[] = [];
    chargesFixesItems.forEach(i => { if (i.value > 0) detailItems.push({ name: i.label, value: i.value }); });
    if (impotMensuel > 0) detailItems.push({ name: "Impôts", value: impotMensuel });
    // Add "Autres" if items + impot don't cover totalFixes
    const itemsFixesSum = chargesFixesItems.reduce((s, i) => s + i.value, 0) + impotMensuel;
    const ecartFixes = totalFixes - itemsFixesSum;
    if (ecartFixes > 50) detailItems.push({ name: "Autres charges fixes", value: ecartFixes });
    depensesCourantesItems.forEach(i => { if (i.value > 0) detailItems.push({ name: i.label, value: i.value }); });
    if (totalEpargne > 0) detailItems.push({ name: "Épargne", value: totalEpargne });
    if (nonAlloue > 0) detailItems.push({ name: "Reste à vivre", value: nonAlloue });

    const ruleData: { name: string; value: number; color: string; pct: number; ideal: number }[] = [
      { name: "Charges fixes & impôts", value: totalFixes, color: RULE_COLORS.fixes, pct: pctFixes, ideal: 50 },
      { name: "Dépenses courantes", value: totalCourantes, color: RULE_COLORS.courantes, pct: pctCourantes, ideal: 30 },
      { name: "Épargne", value: totalEpargne, color: RULE_COLORS.epargne, pct: pctEpargne, ideal: 20 },
    ];
    if (pctNonAlloue > 0) {
      ruleData.push({ name: "Reste à vivre", value: nonAlloue, color: "hsl(var(--muted-foreground) / 0.3)", pct: pctNonAlloue, ideal: 0 });
    }

    return {
      totalFixes, totalCourantes, totalEpargne,
      pctFixes, pctCourantes, pctEpargne, pctNonAlloue,
      ruleData,
      detailItems,
    };
  }, [totalRevenus, totalChargesFixesImpots, chargesFixesItems, depensesCourantesItems, impotMensuel, epargne]);

  if (!analysis || totalRevenus <= 0) return null;

  const { ruleData, detailItems } = analysis;

  // Custom tooltip for recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium">{d.name}</p>
        <p className="text-muted-foreground">{formatEuros(d.value)}</p>
      </div>
    );
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Répartition budgétaire</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">La règle 50/30/20 recommande d'allouer 50% de vos revenus aux charges fixes, 30% aux dépenses courantes et 20% à l'épargne.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: 50/30/20 Pie */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Règle 50 / 30 / 20</p>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ruleData}
                    cx="50%" cy="50%"
                    innerRadius={30} outerRadius={55}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {ruleData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              {ruleData.map((item, i) => {
                const isNonAlloue = item.ideal === 0 && item.name === "Reste à vivre";
                const diff = item.pct - item.ideal;
                const status = isNonAlloue ? "neutral" : Math.abs(diff) <= 5 ? "ok" : diff > 0 ? "over" : "under";
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold">{item.pct}%</span>
                        {!isNonAlloue && (
                          <>
                            <span className="text-[10px] text-muted-foreground">/ {item.ideal}%</span>
                            {status === "ok" ? (
                              <Minus className="h-3 w-3 text-emerald-500" />
                            ) : status === "over" ? (
                              <TrendingUp className="h-3 w-3 text-red-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-amber-500" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {!isNonAlloue && (
                      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, item.pct)}%`,
                            backgroundColor: item.color,
                            opacity: 0.8,
                          }}
                        />
                        <div
                          className="absolute top-0 h-full w-px bg-foreground/40"
                          style={{ left: `${item.ideal}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Score / verdict */}
          <div className="mt-3 rounded-md bg-muted/40 px-3 py-2">
            <BudgetVerdict ruleData={ruleData} />
          </div>
        </div>

        {/* RIGHT: Detail breakdown */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Détail par catégorie</p>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={detailItems}
                    cx="50%" cy="50%"
                    innerRadius={30} outerRadius={55}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={1}
                  >
                    {detailItems.map((_, i) => (
                      <Cell key={i} fill={DETAIL_COLORS[i % DETAIL_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 flex-1 min-w-0 max-h-32 overflow-y-auto">
              {detailItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DETAIL_COLORS[i % DETAIL_COLORS.length] }} />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium shrink-0">{formatEuros(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BudgetVerdict({ ruleData }: { ruleData: { pct: number; ideal: number; name: string }[] }) {
  const deviations = ruleData.map(r => Math.abs(r.pct - r.ideal));
  const maxDev = Math.max(...deviations);
  
  let verdict: string;
  let color: string;
  
  if (maxDev <= 5) {
    verdict = "✅ Votre budget est très bien équilibré selon la règle 50/30/20";
    color = "text-emerald-600 dark:text-emerald-400";
  } else if (maxDev <= 15) {
    verdict = "⚠️ Votre budget est globalement correct, quelques ajustements possibles";
    color = "text-amber-600 dark:text-amber-400";
  } else {
    const worst = ruleData[deviations.indexOf(maxDev)];
    const direction = worst.pct > worst.ideal ? "élevé" : "faible";
    verdict = `🔴 ${worst.name} : ${worst.pct}% — trop ${direction} (idéal : ${worst.ideal}%)`;
    color = "text-red-600 dark:text-red-400";
  }

  return <p className={cn("text-xs font-medium", color)}>{verdict}</p>;
}
