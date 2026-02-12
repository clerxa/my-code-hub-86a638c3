/**
 * Génération d'un rapport PDF financier élégant et structuré
 * Design aligné sur la charte graphique FinCare (bleu/violet/ambre)
 * Utilise jsPDF pour un rendu multi-pages propre
 */
import { jsPDF } from "jspdf";
import type { FinancialProfileInput } from "@/hooks/useUserFinancialProfile";

interface ReportData {
  formData: FinancialProfileInput;
  objectives?: string[];
  intentionNote?: string;
  userName?: string;
  realEstateTotals?: { mensualitesTotal: number; chargesTotal: number };
}

// ─── Brand palette (HSL→RGB) matching index.css ───
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


const PW = 210;   // page width
const PH = 297;   // page height
const MX = 22;    // horizontal margin
const CW = PW - 2 * MX; // content width

// French currency formatting safe for jsPDF (regular spaces, not non-breaking)
const fmtCur = (v: number | null | undefined): string => {
  if (!v) return "0 €";
  const s = Math.round(v).toString();
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  return parts.join(" ") + " €";
};

const OBJECTIVES_MAP: Record<string, string> = {
  reduce_taxes: "Reduire mes impots",
  prepare_retirement: "Preparer ma retraite",
  protect_family: "Proteger ma famille (prevoyance)",
  real_estate: "Anticiper un achat immobilier",
  wealth_transfer: "Optimiser la transmission de mon patrimoine",
};

// ─── PDF Builder ───
class Pdf {
  d: jsPDF;
  y = 0;
  page = 1;

  constructor() {
    this.d = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.y = MX;
  }

  // ── Page management ──
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
    // Gradient-like top bar: primary → secondary
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

  // ── Cover ──
  cover(name: string, date: string) {
    this.topBar();
    this.y = 35;

    // Big brand block
    const blockH = 48;
    // Background gradient block
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
    // Rounded corners mask (approximate with rounded rect overlay)
    this.d.setFillColor(...C.primary);
    this.d.roundedRect(MX, this.y, CW, blockH, 5, 5, "S");
    this.d.setDrawColor(...C.primary);

    // Title text
    this.d.setTextColor(255, 255, 255);
    this.d.setFontSize(26);
    this.d.setFont("helvetica", "bold");
    this.d.text("Rapport Financier", MX + 14, this.y + 20);

    this.d.setFontSize(12);
    this.d.setFont("helvetica", "normal");
    this.d.text("Synthese personnalisee", MX + 14, this.y + 30);

    // Name + date row
    this.d.setFontSize(10);
    if (name) this.d.text(name, MX + 14, this.y + 40);
    this.d.text(date, PW - MX - 14, this.y + 40, { align: "right" });

    this.y += blockH + 14;
  }

  // ── Section header ──
  section(title: string) {
    this.need(20);
    this.y += 8;

    // Section header bar
    this.d.setFillColor(...C.primary);
    this.d.roundedRect(MX, this.y, CW, 11, 2.5, 2.5, "F");

    // Small accent dot
    this.d.setFillColor(...C.accent);
    this.d.circle(MX + 7, this.y + 5.5, 2, "F");

    this.d.setTextColor(255, 255, 255);
    this.d.setFontSize(11);
    this.d.setFont("helvetica", "bold");
    this.d.text(title.toUpperCase(), MX + 13, this.y + 7.5);

    this.y += 17;
  }

  // ── Sub-section label ──
  sub(title: string) {
    this.need(12);
    this.y += 3;

    this.d.setTextColor(...C.primaryDark);
    this.d.setFontSize(10);
    this.d.setFont("helvetica", "bold");
    this.d.text(title, MX + 3, this.y);

    // Thin underline
    const tw = this.d.getTextWidth(title);
    this.d.setDrawColor(...C.primary);
    this.d.setLineWidth(0.4);
    this.d.line(MX + 3, this.y + 1.5, MX + 3 + tw, this.y + 1.5);

    this.y += 7;
  }

  // ── Key/Value row ──
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

    // Label
    this.d.setFont("helvetica", "normal");
    this.d.setTextColor(...C.textSoft);
    this.d.text(label, MX + 5 + indent, this.y);

    // Value
    this.d.setFont("helvetica", opts?.bold ? "bold" : "normal");
    this.d.setTextColor(...(opts?.color || C.text));
    const display = opts?.suffix ? `${value} ${opts.suffix}` : value;
    this.d.text(display, PW - MX - 5, this.y, { align: "right" });

    this.y += opts?.large ? 7.5 : 5.5;
  }

  // ── Divider ──
  div(light = false) {
    this.d.setDrawColor(...(light ? C.divider : C.textFaint));
    this.d.setLineWidth(light ? 0.15 : 0.3);
    this.d.line(MX + 5, this.y, PW - MX - 5, this.y);
    this.y += 3;
  }

  // ── Highlight box (featured metric) ──
  highlight(label: string, value: string, color: RGB) {
    this.need(22);

    // Tinted background
    this.d.setFillColor(
      Math.min(255, color[0] + Math.round((255 - color[0]) * 0.88)),
      Math.min(255, color[1] + Math.round((255 - color[1]) * 0.88)),
      Math.min(255, color[2] + Math.round((255 - color[2]) * 0.88)),
    );
    this.d.roundedRect(MX, this.y, CW, 18, 3, 3, "F");

    // Left accent bar
    this.d.setFillColor(...color);
    this.d.roundedRect(MX, this.y, 3, 18, 1.5, 1.5, "F");

    // Label
    this.d.setFontSize(9);
    this.d.setFont("helvetica", "normal");
    this.d.setTextColor(...C.textSoft);
    this.d.text(label, MX + 10, this.y + 7);

    // Value
    this.d.setFontSize(16);
    this.d.setFont("helvetica", "bold");
    this.d.setTextColor(...color);
    this.d.text(value, MX + 10, this.y + 14.5);

    this.y += 22;
  }

  // ── Metric card (side by side in a row) ──
  metricCard(x: number, w: number, label: string, value: string, color: RGB) {
    this.d.setFillColor(
      Math.min(255, color[0] + Math.round((255 - color[0]) * 0.92)),
      Math.min(255, color[1] + Math.round((255 - color[1]) * 0.92)),
      Math.min(255, color[2] + Math.round((255 - color[2]) * 0.92)),
    );
    this.d.roundedRect(x, this.y, w, 22, 3, 3, "F");

    // Top border accent
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

  // ── Bullet point ──
  bullet(text: string) {
    this.need(7);
    this.d.setFontSize(9);
    this.d.setFont("helvetica", "normal");
    this.d.setTextColor(...C.text);

    // Accent dot bullet
    this.d.setFillColor(...C.accent);
    this.d.circle(MX + 8, this.y - 1, 1.2, "F");

    const lines = this.d.splitTextToSize(text, CW - 20);
    this.d.text(lines, MX + 13, this.y);
    this.y += lines.length * 4.5 + 1;
  }

  // ── Footer on all pages ──
  footers() {
    const total = this.d.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.d.setPage(i);

      // Footer line
      this.d.setDrawColor(...C.divider);
      this.d.setLineWidth(0.3);
      this.d.line(MX, PH - 16, PW - MX, PH - 16);

      this.d.setFontSize(7);
      this.d.setFont("helvetica", "normal");
      this.d.setTextColor(...C.textFaint);

      const dateStr = new Date().toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
      this.d.text(`Document confidentiel  -  Genere le ${dateStr}`, MX, PH - 11);
      this.d.text(`Page ${i} / ${total}`, PW - MX, PH - 11, { align: "right" });
    }
  }
}

// ─── TMI & tax helpers ───
function calcTMI(rev: number, parts: number): number {
  if (!rev || !parts) return 0;
  const q = rev / parts;
  if (q <= 11294) return 0;
  if (q <= 28797) return 11;
  if (q <= 82341) return 30;
  if (q <= 177106) return 41;
  return 45;
}

function calcImpotAnnuel(rev: number, parts: number): number {
  if (!rev || !parts) return 0;
  const q = rev / parts;
  const tranches = [
    { s: 11294, t: 0 }, { s: 28797, t: 0.11 }, { s: 82341, t: 0.30 },
    { s: 177106, t: 0.41 }, { s: Infinity, t: 0.45 },
  ];
  let imp = 0, prev = 0;
  for (const tr of tranches) {
    if (q <= prev) break;
    const taxable = Math.min(q, tr.s) - prev;
    if (taxable > 0) imp += taxable * tr.t;
    prev = tr.s;
  }
  return Math.round(imp * parts);
}

// ─── Main Generator ───
export function generateFinancialReportPdf(data: ReportData) {
  const { formData, objectives, intentionNote, userName, realEstateTotals } = data;
  const p = new Pdf();

  const dateFormatted = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ═══ COVER ═══
  p.cover(userName || "", dateFormatted);

  // ═══ PAGE 1 — REVENUS ═══
  const revAnnuel = formData.revenu_mensuel_net || 0;
  const revMensuel = revAnnuel / 12;
  const revConjAnnuel = formData.revenu_annuel_conjoint || 0;
  const revConjMensuel = revConjAnnuel / 12;
  const divid = formData.revenus_dividendes || 0;
  const ventesAct = formData.revenus_ventes_actions || 0;
  const capAutres = formData.revenus_capital_autres || 0;
  const totalCapAnnuel = divid + ventesAct + capAutres;
  const totalCapMensuel = Math.round(totalCapAnnuel / 12);
  const revLocatifs = formData.revenus_locatifs || 0;
  const revLocMensuel = Math.round(revLocatifs / 12);
  const autresRev = formData.autres_revenus_mensuels || 0;
  const totalRevFoyer = revMensuel + revConjMensuel + totalCapMensuel + revLocMensuel + autresRev;

  p.section("Revenus mensuels du foyer");

  if (revMensuel > 0 || revConjMensuel > 0 || autresRev > 0) {
    p.sub("Revenus professionnels");
    if (revMensuel > 0)     p.kv("Revenu net individuel", fmtCur(Math.round(revMensuel)), { suffix: "/mois" });
    if (revConjMensuel > 0) p.kv("Revenu net conjoint(e)", fmtCur(Math.round(revConjMensuel)), { suffix: "/mois" });
    if (autresRev > 0)      p.kv("Autres revenus", fmtCur(autresRev), { suffix: "/mois" });
  }

  if (totalCapMensuel > 0) {
    p.sub("Revenus du capital");
    if (divid > 0)     p.kv("Dividendes", fmtCur(Math.round(divid / 12)), { suffix: "/mois" });
    if (ventesAct > 0) p.kv("Ventes d'actions", fmtCur(Math.round(ventesAct / 12)), { suffix: "/mois" });
    if (capAutres > 0) p.kv("Autres revenus du capital", fmtCur(Math.round(capAutres / 12)), { suffix: "/mois" });
  }

  if (revLocMensuel > 0) {
    p.sub("Revenus immobiliers");
    p.kv("Revenus locatifs", fmtCur(revLocMensuel), { suffix: "/mois" });
  }

  p.div();
  p.highlight("Total revenus du foyer", fmtCur(Math.round(totalRevFoyer)) + " /mois", [...C.success]);

  // TMI
  const revFiscal = formData.revenu_fiscal_annuel || 0;
  const parts = formData.parts_fiscales || 1;
  const tmi = calcTMI(revFiscal, parts);
  if (tmi > 0) {
    p.y += 2;
    // TMI cards row
    p.need(28);
    const cardW = (CW - 6) / 3;
    p.metricCard(MX, cardW, "TMI estimee", `${tmi}%`, [...C.primary]);
    p.metricCard(MX + cardW + 3, cardW, "Revenu fiscal ref.", fmtCur(revFiscal), [...C.secondary]);
    p.metricCard(MX + 2 * (cardW + 3), cardW, "Parts fiscales", `${parts}`, [...C.accent]);
    p.y += 26;
  }

  // ═══ PAGE 2 — CHARGES & ENDETTEMENT ═══
  p.newPage();

  const reTotals = realEstateTotals || { mensualitesTotal: 0, chargesTotal: 0 };

  const chargesCats = [
    { cat: "Logement & Energie", items: [
      { l: "Loyer", v: formData.loyer_actuel || 0 },
      { l: "Credit immobilier (RP)", v: formData.credits_immobilier || 0 },
      { l: "Copropriete & taxes", v: formData.charges_copropriete_taxes || 0 },
      { l: "Energie", v: formData.charges_energie || 0 },
      { l: "Assurance habitation", v: formData.charges_assurance_habitation || 0 },
      { l: "Mensualites credits fonciers", v: reTotals.mensualitesTotal || 0 },
      { l: "Charges biens fonciers", v: reTotals.chargesTotal || 0 },
    ]},
    { cat: "Transport & Mobilite", items: [
      { l: "Transport en commun", v: formData.charges_transport_commun || 0 },
      { l: "Assurance auto", v: formData.charges_assurance_auto || 0 },
      { l: "LLD / LOA / Credit auto", v: formData.charges_lld_loa_auto || formData.credits_auto || 0 },
    ]},
    { cat: "Communication & Services", items: [
      { l: "Internet", v: formData.charges_internet || 0 },
      { l: "Mobile", v: formData.charges_mobile || 0 },
      { l: "Abonnements", v: formData.charges_abonnements || 0 },
    ]},
    { cat: "Famille", items: [
      { l: "Frais de scolarite", v: formData.charges_frais_scolarite || 0 },
      { l: "Pension alimentaire", v: formData.pensions_alimentaires || 0 },
    ]},
    { cat: "Credits & Autres", items: [
      { l: "Credit consommation", v: formData.credits_consommation || 0 },
      { l: "Autres charges", v: formData.charges_autres || 0 },
    ]},
  ];

  const totalCharges = chargesCats.reduce((s, c) => s + c.items.reduce((s2, i) => s2 + i.v, 0), 0);
  const mensCredits = (formData.credits_immobilier || 0) +
    (formData.credits_consommation || 0) +
    (formData.charges_lld_loa_auto || formData.credits_auto || 0) +
    (reTotals.mensualitesTotal || 0);

  const revImmo70 = Math.round(revLocMensuel * 0.7);
  const baseEndettement = revMensuel + revConjMensuel + revImmo70;
  const tauxEnd = baseEndettement > 0 ? Math.round((mensCredits / baseEndettement) * 100) : 0;

  p.section("Charges mensuelles & Endettement");

  for (const cat of chargesCats) {
    const catTotal = cat.items.reduce((s, i) => s + i.v, 0);
    if (catTotal <= 0) continue;
    p.sub(cat.cat);
    for (const item of cat.items) {
      if (item.v > 0) p.kv(item.l, fmtCur(item.v), { indent: 4 });
    }
    p.kv(`Sous-total ${cat.cat}`, fmtCur(catTotal), { bold: true, indent: 2 });
    p.y += 1;
  }

  p.div();
  p.highlight("Total charges mensuelles", fmtCur(totalCharges), [...C.danger]);

  p.y += 2;
  p.need(28);
  const endCol: RGB = tauxEnd > 35 ? [...C.danger] : tauxEnd > 25 ? [...C.amber] : [...C.success];
  const halfW = (CW - 4) / 2;
  p.metricCard(MX, halfW, "Mensualites de credits", fmtCur(mensCredits), [...C.primaryDark]);
  p.metricCard(MX + halfW + 4, halfW, "Taux d'endettement", `${tauxEnd}%`, endCol);
  p.y += 26;

  // ═══ RESTE A VIVRE ═══
  const pasMensuel = Math.round(calcImpotAnnuel(revFiscal, parts) / 12);
  const capEpargne = formData.capacite_epargne_mensuelle || 0;
  const rav = totalRevFoyer - totalCharges - pasMensuel - capEpargne;

  p.section("Reste a vivre");

  p.kv("+ Revenus nets du foyer", fmtCur(Math.round(totalRevFoyer)), { color: [...C.success], bold: true });
  p.kv("- Charges mensuelles", "-" + fmtCur(totalCharges), { color: [...C.danger] });
  p.kv("- PAS estime (mensuel)", "-" + fmtCur(pasMensuel), { color: [...C.danger] });
  p.kv("- Epargne mensuelle", "-" + fmtCur(capEpargne), { color: [...C.danger] });
  p.div();

  const ravCol: RGB = rav >= 0 ? [...C.primary] : [...C.danger];
  p.highlight("Reste a vivre mensuel", fmtCur(Math.round(rav)), ravCol);

  // ═══ PAGE 3 — PATRIMOINE ═══
  p.newPage();

  const valDispPro = (formData.valeur_rsu_aga || 0) + (formData.valeur_espp || 0) +
    (formData.valeur_stock_options || 0) + (formData.valeur_bspce || 0) +
    (formData.valeur_pee || 0) + (formData.valeur_perco || 0);

  const patrimItems = [
    { l: "Livrets", v: formData.epargne_livrets || 0 },
    { l: "Assurance vie", v: formData.patrimoine_assurance_vie || 0 },
    { l: "PER", v: formData.patrimoine_per || 0 },
    { l: "PEA", v: formData.patrimoine_pea || 0 },
    { l: "SCPI", v: formData.patrimoine_scpi || 0 },
    { l: "Crypto", v: formData.patrimoine_crypto || 0 },
    { l: "Private Equity", v: formData.patrimoine_private_equity || 0 },
    { l: "Autres placements", v: formData.patrimoine_autres || 0 },
    { l: "Dispositifs professionnels", v: valDispPro },
  ].filter(d => d.v > 0);

  const patFin = patrimItems.reduce((s, d) => s + d.v, 0);
  const patImmoBrut = formData.patrimoine_immo_valeur || 0;
  const patImmoCred = formData.patrimoine_immo_credit_restant || 0;
  const patImmoNet = patImmoBrut - patImmoCred;
  const patTotal = patFin + Math.max(0, patImmoNet);

  p.section("Patrimoine");

  if (patrimItems.length > 0) {
    p.sub("Patrimoine financier");
    for (const it of patrimItems) {
      p.kv(it.l, fmtCur(it.v), { indent: 4 });
    }
    p.div(true);
    p.kv("Total patrimoine financier", fmtCur(patFin), { bold: true, color: [...C.secondary] });
    p.y += 3;
  }

  if (patImmoBrut > 0 || patImmoCred > 0) {
    p.sub("Patrimoine immobilier");
    p.kv("Valeur brute des biens", fmtCur(patImmoBrut), { indent: 4 });
    if (patImmoCred > 0) {
      p.kv("Credits a rembourser", "-" + fmtCur(patImmoCred), { indent: 4, color: [...C.danger] });
    }
    p.div(true);
    p.kv("Patrimoine immobilier net", fmtCur(patImmoNet), { bold: true, color: [...C.accent] });
    p.y += 3;
  }

  p.highlight("Patrimoine net total", fmtCur(patTotal), [...C.primary]);

  // ═══ PROJETS IMMOBILIERS ═══
  const projets = [
    formData.projet_residence_principale && { l: "Residence principale", b: formData.budget_residence_principale },
    formData.projet_residence_secondaire && { l: "Residence secondaire", b: formData.budget_residence_secondaire },
    formData.projet_investissement_locatif && { l: "Investissement locatif", b: formData.budget_investissement_locatif },
  ].filter(Boolean) as { l: string; b: number | null }[];

  if (projets.length > 0) {
    p.section("Projets immobiliers");
    for (const pr of projets) {
      p.kv(pr.l, pr.b ? fmtCur(pr.b) : "Budget a definir", { indent: 2 });
    }
    if (formData.apport_disponible) {
      p.y += 2;
      p.kv("Apport disponible", fmtCur(formData.apport_disponible), { bold: true, color: [...C.success] });
    }
    if (formData.duree_emprunt_souhaitee && formData.duree_emprunt_souhaitee > 0) {
      p.kv("Duree d'emprunt souhaitee", `${formData.duree_emprunt_souhaitee} ans`);
    }
  }

  // ═══ SITUATION PERSONNELLE ═══
  const sitItems = [
    formData.situation_familiale && { l: "Situation familiale", v: formData.situation_familiale },
    formData.nb_enfants !== undefined && formData.nb_enfants > 0 && { l: "Enfants", v: `${formData.nb_enfants}` },
    formData.nb_personnes_foyer !== undefined && formData.nb_personnes_foyer > 0 && { l: "Personnes au foyer", v: `${formData.nb_personnes_foyer}` },
    formData.type_contrat && { l: "Type de contrat", v: formData.type_contrat },
    formData.anciennete_annees !== undefined && formData.anciennete_annees > 0 && { l: "Anciennete", v: `${formData.anciennete_annees} ans` },
    formData.statut_residence && { l: "Statut residence", v: formData.statut_residence },
  ].filter(Boolean) as { l: string; v: string }[];

  if (sitItems.length > 0) {
    p.section("Situation personnelle");
    for (const it of sitItems) {
      p.kv(it.l, it.v);
    }
  }

  // ═══ OBJECTIFS & PREPARATION RDV ═══
  if ((objectives && objectives.length > 0) || (intentionNote && intentionNote.trim())) {
    p.section("Preparation du rendez-vous");

    if (objectives && objectives.length > 0) {
      p.sub("Objectifs prioritaires");
      for (const objId of objectives) {
        const label = OBJECTIVES_MAP[objId];
        if (label) p.bullet(label);
      }
      p.y += 2;
    }

    if (intentionNote && intentionNote.trim()) {
      p.sub("Note d'intention");
      p.d.setFontSize(9);
      p.d.setFont("helvetica", "normal");
      p.d.setTextColor(...C.text);
      const lines = p.d.splitTextToSize(intentionNote, CW - 14);
      for (const line of lines) {
        p.need(5);
        p.d.text(line, MX + 7, p.y);
        p.y += 4.5;
      }
    }
  }

  // ── Footers ──
  p.footers();

  // ── Save ──
  const ds = new Date().toISOString().slice(0, 10);
  p.d.save(`rapport-financier-${ds}.pdf`);
}
