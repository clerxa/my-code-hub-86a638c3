/**
 * Génération d'un rapport PDF Horizon élégant
 * Design aligné sur la charte graphique FinCare (bleu/violet/ambre)
 * Réutilise le même style que generateFinancialReportPdf
 */
import { jsPDF } from "jspdf";
import type { HorizonProject } from "@/hooks/useHorizonProjects";
import type { HorizonBudget } from "@/hooks/useHorizonBudget";

interface HorizonReportData {
  projects: HorizonProject[];
  budget: HorizonBudget;
  allocatedCapital: number;
  allocatedMonthly: number;
  userName?: string;
}

type RGB = [number, number, number];

const C: Record<string, RGB> = {
  primary:     [56, 122, 223],
  primaryDark: [30, 64, 175],
  secondary:   [139, 66, 217],
  accent:      [245, 166, 10],
  success:     [46, 184, 115],
  danger:      [234, 68, 68],
  amber:       [217, 119, 6],
  text:        [30, 30, 40],
  textSoft:    [100, 106, 125],
  textFaint:   [160, 165, 180],
  cardBg:      [245, 247, 252],
  divider:     [220, 225, 235],
  white:       [255, 255, 255],
};

const PW = 210;
const PH = 297;
const MX = 22;
const CW = PW - 2 * MX;

const fmtCur = (v: number | null | undefined): string => {
  if (!v && v !== 0) return "0 €";
  const s = Math.round(v).toString();
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  return parts.join(" ") + " €";
};

const fmtPct = (v: number) => `${Math.round(v)}%`;

function computeProjected(project: HorizonProject) {
  const rate = Number(project.annual_return_rate || 0) / 100;
  const monthlyRate = rate / 12;
  const months = project.duration_months || 120;
  const apport = Number(project.apport);
  const monthly = Number(project.monthly_allocation);

  if (monthlyRate > 0) {
    return apport * Math.pow(1 + monthlyRate, months) +
      monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }
  return apport + monthly * months;
}

class Pdf {
  d: jsPDF;
  y = 0;
  page = 1;

  constructor() {
    this.d = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.y = MX;
  }

  need(h: number) {
    if (this.y + h > PH - 28) this.newPage();
  }

  newPage() {
    this.d.addPage();
    this.page++;
    this.y = MX;
    this.topBar();
  }

  topBar() {
    const barH = 3;
    const steps = 20;
    const stepW = PW / steps;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      this.d.setFillColor(
        Math.round(C.primary[0] + (C.secondary[0] - C.primary[0]) * t),
        Math.round(C.primary[1] + (C.secondary[1] - C.primary[1]) * t),
        Math.round(C.primary[2] + (C.secondary[2] - C.primary[2]) * t),
      );
      this.d.rect(i * stepW, 0, stepW + 0.5, barH, "F");
    }
  }

  cover(name: string, date: string) {
    this.topBar();
    this.y = 35;

    const blockH = 48;
    const steps = 20;
    const stepH = blockH / steps;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      this.d.setFillColor(
        Math.round(C.primary[0] + (C.secondary[0] - C.primary[0]) * t * 0.4),
        Math.round(C.primary[1] + (C.secondary[1] - C.primary[1]) * t * 0.4),
        Math.round(C.primary[2] + (C.secondary[2] - C.primary[2]) * t * 0.4),
      );
      this.d.rect(MX, this.y + i * stepH, CW, stepH + 0.3, "F");
    }
    this.d.setFillColor(...C.primary);
    this.d.roundedRect(MX, this.y, CW, blockH, 5, 5, "S");
    this.d.setDrawColor(...C.primary);

    this.d.setTextColor(255, 255, 255);
    this.d.setFontSize(26);
    this.d.setFont("helvetica", "bold");
    this.d.text("Horizon - Strategie", MX + 14, this.y + 20);

    this.d.setFontSize(12);
    this.d.setFont("helvetica", "normal");
    this.d.text("Projets patrimoniaux & projections", MX + 14, this.y + 30);

    this.d.setFontSize(10);
    if (name) this.d.text(name, MX + 14, this.y + 40);
    this.d.text(date, PW - MX - 14, this.y + 40, { align: "right" });

    this.y += blockH + 14;
  }

  section(title: string) {
    this.need(20);
    this.y += 8;

    this.d.setFillColor(...C.primary);
    this.d.roundedRect(MX, this.y, CW, 11, 2.5, 2.5, "F");

    this.d.setFillColor(...C.accent);
    this.d.circle(MX + 7, this.y + 5.5, 2, "F");

    this.d.setTextColor(255, 255, 255);
    this.d.setFontSize(11);
    this.d.setFont("helvetica", "bold");
    this.d.text(title.toUpperCase(), MX + 13, this.y + 7.5);

    this.y += 17;
  }

  sub(title: string) {
    this.need(12);
    this.y += 3;

    this.d.setTextColor(...C.primaryDark);
    this.d.setFontSize(10);
    this.d.setFont("helvetica", "bold");
    this.d.text(title, MX + 3, this.y);

    const tw = this.d.getTextWidth(title);
    this.d.setDrawColor(...C.primary);
    this.d.setLineWidth(0.4);
    this.d.line(MX + 3, this.y + 1.5, MX + 3 + tw, this.y + 1.5);

    this.y += 7;
  }

  kv(label: string, value: string, opts?: {
    bold?: boolean;
    color?: RGB;
    indent?: number;
    large?: boolean;
    suffix?: string;
  }) {
    const indent = opts?.indent || 0;
    this.need(7);

    const fs = opts?.large ? 11 : 9;
    this.d.setFontSize(fs);

    this.d.setFont("helvetica", "normal");
    this.d.setTextColor(...C.textSoft);
    this.d.text(label, MX + 5 + indent, this.y);

    this.d.setFont("helvetica", opts?.bold ? "bold" : "normal");
    this.d.setTextColor(...(opts?.color || C.text));
    const display = opts?.suffix ? `${value} ${opts.suffix}` : value;
    this.d.text(display, PW - MX - 5, this.y, { align: "right" });

    this.y += opts?.large ? 7.5 : 5.5;
  }

  div(light = false) {
    this.d.setDrawColor(...(light ? C.divider : C.textFaint));
    this.d.setLineWidth(light ? 0.15 : 0.3);
    this.d.line(MX + 5, this.y, PW - MX - 5, this.y);
    this.y += 3;
  }

  highlight(label: string, value: string, color: RGB) {
    this.need(22);

    this.d.setFillColor(
      Math.min(255, color[0] + Math.round((255 - color[0]) * 0.88)),
      Math.min(255, color[1] + Math.round((255 - color[1]) * 0.88)),
      Math.min(255, color[2] + Math.round((255 - color[2]) * 0.88)),
    );
    this.d.roundedRect(MX, this.y, CW, 18, 3, 3, "F");

    this.d.setFillColor(...color);
    this.d.roundedRect(MX, this.y, 3, 18, 1.5, 1.5, "F");

    this.d.setFontSize(9);
    this.d.setFont("helvetica", "normal");
    this.d.setTextColor(...C.textSoft);
    this.d.text(label, MX + 10, this.y + 7);

    this.d.setFontSize(16);
    this.d.setFont("helvetica", "bold");
    this.d.setTextColor(...color);
    this.d.text(value, MX + 10, this.y + 14.5);

    this.y += 22;
  }

  metricCard(x: number, w: number, label: string, value: string, color: RGB) {
    this.d.setFillColor(
      Math.min(255, color[0] + Math.round((255 - color[0]) * 0.92)),
      Math.min(255, color[1] + Math.round((255 - color[1]) * 0.92)),
      Math.min(255, color[2] + Math.round((255 - color[2]) * 0.92)),
    );
    this.d.roundedRect(x, this.y, w, 22, 3, 3, "F");

    this.d.setFillColor(...color);
    this.d.rect(x + 4, this.y, w - 8, 1.5, "F");

    this.d.setFontSize(8);
    this.d.setFont("helvetica", "normal");
    this.d.setTextColor(...C.textSoft);
    this.d.text(label, x + w / 2, this.y + 9, { align: "center" });

    this.d.setFontSize(13);
    this.d.setFont("helvetica", "bold");
    this.d.setTextColor(...color);
    this.d.text(value, x + w / 2, this.y + 17, { align: "center" });
  }

  bullet(text: string) {
    this.need(7);
    this.d.setFontSize(9);
    this.d.setFont("helvetica", "normal");
    this.d.setTextColor(...C.text);

    this.d.setFillColor(...C.accent);
    this.d.circle(MX + 8, this.y - 1, 1.2, "F");

    const lines = this.d.splitTextToSize(text, CW - 20);
    this.d.text(lines, MX + 13, this.y);
    this.y += lines.length * 4.5 + 1;
  }

  // Progress bar
  progressBar(x: number, w: number, pct: number, color: RGB) {
    this.d.setFillColor(...C.divider);
    this.d.roundedRect(x, this.y, w, 3, 1.5, 1.5, "F");
    if (pct > 0) {
      this.d.setFillColor(...color);
      this.d.roundedRect(x, this.y, Math.max(3, w * Math.min(pct, 100) / 100), 3, 1.5, 1.5, "F");
    }
  }

  footers() {
    const total = this.d.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.d.setPage(i);

      this.d.setDrawColor(...C.divider);
      this.d.setLineWidth(0.3);
      this.d.line(MX, PH - 16, PW - MX, PH - 16);

      this.d.setFontSize(7);
      this.d.setFont("helvetica", "normal");
      this.d.setTextColor(...C.textFaint);

      const dateStr = new Date().toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
      this.d.text(`Document confidentiel  -  Genere le ${dateStr}  -  Outil pedagogique uniquement`, MX, PH - 11);
      this.d.text(`Page ${i} / ${total}`, PW - MX, PH - 11, { align: "right" });
    }
  }
}

// ─── Main Generator ───
export function generateHorizonReportPdf(data: HorizonReportData) {
  const { projects, budget, allocatedCapital, allocatedMonthly, userName } = data;
  const p = new Pdf();
  const activeProjects = projects.filter(pr => pr.status === "active");

  const dateFormatted = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ═══ COVER ═══
  p.cover(userName || "", dateFormatted);

  // ═══ BUDGET GLOBAL ═══
  p.section("Budget Global");

  const availableCapital = Math.max(0, budget.total_initial_capital - allocatedCapital);
  const availableMonthly = Math.max(0, budget.total_monthly_savings - allocatedMonthly);
  const capitalPct = budget.total_initial_capital > 0 ? (allocatedCapital / budget.total_initial_capital) * 100 : 0;
  const monthlyPct = budget.total_monthly_savings > 0 ? (allocatedMonthly / budget.total_monthly_savings) * 100 : 0;

  p.need(28);
  const cardW = (CW - 6) / 2;
  p.metricCard(MX, cardW, "Capital initial", fmtCur(budget.total_initial_capital), [...C.primary]);
  p.metricCard(MX + cardW + 6, cardW, "Epargne mensuelle", fmtCur(budget.total_monthly_savings) + " /mois", [...C.secondary]);
  p.y += 26;

  p.kv("Capital alloue", fmtCur(allocatedCapital), { bold: true, color: [...C.primary] });
  p.kv("Capital disponible", fmtCur(availableCapital), { color: availableCapital > 0 ? [...C.success] : [...C.danger] });
  p.kv("Utilisation du capital", fmtPct(capitalPct), { bold: true });
  p.y += 2;
  p.kv("Epargne mensuelle allouee", fmtCur(allocatedMonthly) + " /mois", { bold: true, color: [...C.secondary] });
  p.kv("Epargne mensuelle disponible", fmtCur(availableMonthly) + " /mois", { color: availableMonthly > 0 ? [...C.success] : [...C.danger] });
  p.kv("Utilisation de l'epargne", fmtPct(monthlyPct), { bold: true });

  // ═══ SYNTHESE STRATEGIE ═══
  p.section("Synthese de la Strategie");

  const totalTarget = activeProjects.reduce((s, pr) => s + Number(pr.target_amount), 0);
  const totalProjected = activeProjects.reduce((s, pr) => s + computeProjected(pr), 0);
  const globalPct = totalTarget > 0 ? Math.min(100, (totalProjected / totalTarget) * 100) : 0;
  const maxHorizon = activeProjects.length > 0
    ? Math.max(...activeProjects.map(pr => Math.round((pr.duration_months || 120) / 12)))
    : 0;
  const totalInvested = allocatedCapital + allocatedMonthly * Math.max(...activeProjects.map(pr => pr.duration_months || 120), 0);
  const totalInterests = totalProjected - totalInvested;

  p.need(28);
  const kpiW = (CW - 9) / 4;
  p.metricCard(MX, kpiW, "Objectif total", fmtCur(totalTarget), [...C.primary]);
  p.metricCard(MX + kpiW + 3, kpiW, "Projete total", fmtCur(totalProjected), [...C.success]);
  p.metricCard(MX + 2 * (kpiW + 3), kpiW, "Epargne /mois", fmtCur(allocatedMonthly), [...C.secondary]);
  p.metricCard(MX + 3 * (kpiW + 3), kpiW, `Horizon ${maxHorizon} an${maxHorizon > 1 ? "s" : ""}`, `${maxHorizon} ans`, [...C.accent]);
  p.y += 26;

  p.highlight("Faisabilite globale", fmtPct(globalPct), globalPct >= 80 ? [...C.success] : globalPct >= 50 ? [...C.amber] : [...C.danger]);

  if (totalInterests > 0) {
    p.y += 1;
    p.highlight("Interets composes generes", "+ " + fmtCur(totalInterests), [...C.success]);
  }

  // ═══ DETAIL DES PROJETS ═══
  p.newPage();
  p.section("Detail des Projets");

  activeProjects.forEach((project, idx) => {
    const projected = computeProjected(project);
    const pct = Number(project.target_amount) > 0 ? Math.min(100, (projected / Number(project.target_amount)) * 100) : 0;
    const horizon = project.duration_months ? Math.round(project.duration_months / 12) : 10;

    p.need(52);

    // Project header card
    p.d.setFillColor(...C.cardBg);
    p.d.roundedRect(MX, p.y, CW, 46, 3, 3, "F");

    // Left accent bar with color
    const colors: RGB[] = [
      [...C.primary], [...C.secondary], [...C.accent], [...C.success], [234, 68, 68], [0, 150, 199]
    ];
    const projectColor = colors[idx % colors.length];
    p.d.setFillColor(...projectColor);
    p.d.roundedRect(MX, p.y, 3, 46, 1.5, 1.5, "F");

    // Project name
    p.d.setFontSize(11);
    p.d.setFont("helvetica", "bold");
    p.d.setTextColor(...C.text);
    p.d.text(`${project.icon || "📊"} ${project.name}`, MX + 10, p.y + 7);

    // Category & product badges
    p.d.setFontSize(7.5);
    p.d.setFont("helvetica", "normal");
    p.d.setTextColor(...C.textSoft);
    const badges: string[] = [];
    if (project.category_name) badges.push(project.category_name);
    if (project.product_name) badges.push(project.product_name);
    if (badges.length > 0) {
      p.d.text(badges.join("  |  "), MX + 10, p.y + 12);
    }

    // KPIs inside card
    const innerY = p.y + 17;
    const colW = (CW - 20) / 4;

    const miniKvs = [
      { l: "Apport", v: fmtCur(Number(project.apport)) },
      { l: "Mensuel", v: fmtCur(Number(project.monthly_allocation)) },
      { l: "Objectif", v: fmtCur(Number(project.target_amount)) },
      { l: "Projete", v: fmtCur(projected) },
    ];

    miniKvs.forEach((kv, i) => {
      const x = MX + 10 + i * colW;
      p.d.setFontSize(7);
      p.d.setFont("helvetica", "normal");
      p.d.setTextColor(...C.textSoft);
      p.d.text(kv.l, x, innerY);

      p.d.setFontSize(9);
      p.d.setFont("helvetica", "bold");
      const kvColor = i === 3 ? C.success : C.text;
      p.d.setTextColor(...kvColor);
      p.d.text(kv.v, x, innerY + 5);
    });

    // Bottom row: horizon, rate, feasibility
    const bottomY = innerY + 12;
    p.d.setFontSize(7.5);
    p.d.setFont("helvetica", "normal");
    p.d.setTextColor(...C.textSoft);
    p.d.text(`Horizon : ${horizon} an${horizon > 1 ? "s" : ""}`, MX + 10, bottomY);
    p.d.text(`Rendement : ${project.annual_return_rate}% /an`, MX + 60, bottomY);

    // Mini progress bar
    p.d.setFillColor(...C.divider);
    p.d.roundedRect(MX + 110, bottomY - 2.5, 40, 3, 1.5, 1.5, "F");
    if (pct > 0) {
      p.d.setFillColor(...projectColor);
      p.d.roundedRect(MX + 110, bottomY - 2.5, Math.max(3, 40 * Math.min(pct, 100) / 100), 3, 1.5, 1.5, "F");
    }

    p.d.setFontSize(7.5);
    p.d.setFont("helvetica", "bold");
    p.d.setTextColor(...projectColor);
    p.d.text(`${Math.round(pct)}%`, MX + 153, bottomY);

    // Notes
    if (project.notes) {
      p.d.setFontSize(7);
      p.d.setFont("helvetica", "italic");
      p.d.setTextColor(...C.textFaint);
      const noteLines = p.d.splitTextToSize(`Note : ${project.notes}`, CW - 20);
      p.d.text(noteLines.slice(0, 2), MX + 10, bottomY + 5);
    }

    p.y += 52;
  });

  // ═══ PRODUITS A OUVRIR ═══
  const productMap = new Map<string, { name: string; count: number; totalApport: number; totalMonthly: number; totalTarget: number; totalProjected: number }>();
  activeProjects.forEach(pr => {
    const key = pr.product_name || "Epargne libre";
    const existing = productMap.get(key);
    const projected = computeProjected(pr);
    if (existing) {
      existing.count += 1;
      existing.totalApport += Number(pr.apport);
      existing.totalMonthly += Number(pr.monthly_allocation);
      existing.totalTarget += Number(pr.target_amount);
      existing.totalProjected += projected;
    } else {
      productMap.set(key, {
        name: key, count: 1,
        totalApport: Number(pr.apport),
        totalMonthly: Number(pr.monthly_allocation),
        totalTarget: Number(pr.target_amount),
        totalProjected: projected,
      });
    }
  });

  const productData = Array.from(productMap.values());
  if (productData.length > 0) {
    p.need(20);
    p.section("Produits a Ouvrir");

    productData.forEach(product => {
      p.need(18);
      const pct = product.totalTarget > 0 ? Math.min(100, (product.totalProjected / product.totalTarget) * 100) : 0;

      p.sub(`${product.name}${product.count > 1 ? ` (x${product.count})` : ""}`);
      p.kv("Apport total", fmtCur(product.totalApport), { indent: 4 });
      p.kv("Versement mensuel", fmtCur(product.totalMonthly), { indent: 4, suffix: "/mois" });
      p.kv("Objectif", fmtCur(product.totalTarget), { indent: 4 });
      p.kv("Capital projete", fmtCur(product.totalProjected), { indent: 4, bold: true, color: [...C.success] });
      p.kv("Faisabilite", fmtPct(pct), { indent: 4, bold: true, color: pct >= 80 ? [...C.success] : pct >= 50 ? [...C.amber] : [...C.danger] });
      p.y += 2;
    });
  }

  // ═══ DISCLAIMER ═══
  p.need(30);
  p.y += 6;
  p.d.setFillColor(255, 248, 230);
  p.d.roundedRect(MX, p.y, CW, 20, 3, 3, "F");
  p.d.setFillColor(...C.amber);
  p.d.roundedRect(MX, p.y, 3, 20, 1.5, 1.5, "F");

  p.d.setFontSize(7.5);
  p.d.setFont("helvetica", "bold");
  p.d.setTextColor(...C.amber);
  p.d.text("AVERTISSEMENT", MX + 10, p.y + 6);

  p.d.setFontSize(7);
  p.d.setFont("helvetica", "normal");
  p.d.setTextColor(...C.textSoft);
  const disclaimer = "Outil pedagogique uniquement. Horizon est un simulateur a vocation educative et ne constitue ni un conseil en investissement, ni une recommandation personnalisee. Les projections sont purement indicatives et ne garantissent aucun resultat. Consultez un conseiller certifie avant toute decision financiere.";
  const discLines = p.d.splitTextToSize(disclaimer, CW - 20);
  p.d.text(discLines, MX + 10, p.y + 11);

  // ═══ FOOTERS ═══
  p.footers();

  // ═══ SAVE ═══
  p.d.save(`Horizon_Strategie_${new Date().toISOString().slice(0, 10)}.pdf`);
}
