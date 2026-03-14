import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { TaxNoticeAnalysisOverlay } from "./ocr/TaxNoticeAnalysisOverlay";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  ChevronDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  Info,
  Loader2,
  Lock,
  Zap,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { PerSimulatorSlider } from "./ocr/PerSimulatorSlider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvisData {
  contribuable: {
    nom: string;
    prenom: string;
    adresse_complete: string;
    numero_fiscal: string;
    reference_avis: string;
    situation_familiale: string;
    nombre_parts: number | null;
  };
  annees: { annee_revenus: number | null; annee_imposition: number | null };
  revenus: Record<string, number | null>;
  impot: Record<string, number | null> & {
    impot_sans_dispositifs?: number | null;
  };
  prelevement_source: {
    taux_pas_pct: number | null;
    montant_preleve_annee_n: number | null;
    solde_a_payer_ou_rembourser: number | null;
  };
  plafonds_per: {
    plafond_declarant_1: number | null;
    plafond_declarant_2: number | null;
    montant_verse_per: number | null;
    plafond_restant: number | null;
    analyse_personnalisee: string;
  };
  explications_pedagogiques: {
    introduction: string;
    revenu_fiscal_reference_explication: string;
    taux_marginal_explication: string;
    taux_moyen_explication: string;
    quotient_familial_explication: string;
    abattement_10_pct_explication: string;
    prelevement_source_explication: string;
    lignes_inhabituelles: (string | Record<string, unknown>)[];
    conseils_optimisation: (string | Record<string, unknown>)[];
    points_attention: (string | Record<string, unknown>)[];
  };
  niches_fiscales?: {
    total_niches: number | null;
    plafond_atteint: boolean;
    girardin_detecte: boolean;
    plafond_applicable: number;
    marge_restante: number | null;
    cas_detecte: string;
  };
  meta: {
    type_document: string;
    confidence: string;
    champs_manquants: string[];
    annee_detectee: number | null;
  };
}

interface UsageData {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_input_usd: number;
  cost_output_usd: number;
  cost_total_usd: number;
  model: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
  v != null
    ? v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €"
    : "—";

const fmtCompact = (v: number | null | undefined) =>
  v != null
    ? v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €"
    : "—";

const pct = (v: number | null | undefined) =>
  v != null
    ? v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %"
    : "—";

const REVENUE_LABELS: Record<string, string> = {
  salaires_traitements_bruts: "Salaires et traitements bruts",
  abattement_10_pct: "Abattement de 10 %",
  salaires_nets_imposables: "Salaires nets imposables",
  revenus_fonciers_nets: "Revenus fonciers nets",
  revenus_capitaux_mobiliers: "Revenus de capitaux mobiliers",
  plus_values_mobilières: "Plus-values mobilières",
  bic_bnc_ba: "BIC / BNC / BA",
  pensions_retraites: "Pensions et retraites",
  autres_revenus: "Autres revenus",
  revenu_brut_global: "Revenu brut global",
  charges_deductibles: "Charges déductibles",
  revenu_net_global: "Revenu net global",
  abattements_speciaux: "Abattements spéciaux",
  revenu_net_imposable: "Revenu net imposable",
  revenu_fiscal_reference: "Revenu fiscal de référence (RFR)",
};

const TAX_LABELS: Record<string, string> = {
  impot_brut_progressif: "Impôt brut (barème progressif)",
  plafonnement_quotient_familial: "Plafonnement du quotient familial",
  reductions_impot: "Réductions d'impôt",
  credits_impot: "Crédits d'impôt",
  impot_net_avant_contributions: "Impôt net avant contributions",
  prelevement_forfaitaire_unique: "Prélèvement forfaitaire unique (PFU)",
  contributions_sociales_revenus_capital: "Contributions sociales (revenus du capital)",
  taxe_habitation: "Taxe d'habitation",
  impot_net_total: "Impôt net total",
  total_a_payer: "Total à payer",
  mensualisation_ou_prelevement: "Mensualisation / Prélèvement",
};

// Tax brackets 2024 (per part)
const TRANCHES_2024 = [
  { seuil: 0, taux: 0, couleur: "hsl(var(--muted))", label: "0 %" },
  { seuil: 11294, taux: 11, couleur: "hsl(var(--success))", label: "11 %" },
  { seuil: 28797, taux: 30, couleur: "hsl(38 92% 50%)", label: "30 %" },
  { seuil: 82341, taux: 41, couleur: "hsl(25 95% 53%)", label: "41 %" },
  { seuil: 177106, taux: 45, couleur: "hsl(var(--destructive))", label: "45 %" },
];

// ─── PDF to Images conversion ─────────────────────────────────────────────────

const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const pdfToImages = async (
  file: File,
  onProgress: (msg: string) => void
): Promise<string[]> => {
  onProgress("Chargement de la librairie PDF…");
  const pdfjsLib = await loadPdfJs();
  onProgress("Lecture du fichier…");
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = Math.min(pdf.numPages, 8);
  const images: string[] = [];
  for (let i = 1; i <= totalPages; i++) {
    onProgress(`Conversion de la page ${i}/${totalPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    images.push(dataUrl.split(",")[1]);
  }
  return images;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Counter animation hook
function useCountUp(target: number | null | undefined, duration = 1000) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || target == null) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started]);

  useEffect(() => {
    if (!started || target == null) return;
    const startTime = performance.now();
    const absTarget = Math.abs(target);
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(absTarget * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else setValue(absTarget);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return { ref, displayValue: target != null && target < 0 ? -value : value };
}

// Intersection observer hook for fade-in
function useInView(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return { ref, visible };
}

// Fiscal tooltip inline
const FiscalTooltip = ({ term, explanation }: { term: string; explanation: string }) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 cursor-help">
          {term}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm" side="top">
        <p>{explanation}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Metric card with counter
const MetricCard = ({
  label,
  value,
  tooltip,
  variant = "default",
  suffix,
  icon,
}: {
  label: string;
  value: number | null | undefined;
  tooltip?: string;
  variant?: "default" | "success" | "primary";
  suffix?: string;
  icon?: React.ReactNode;
}) => {
  const { ref, displayValue } = useCountUp(value);
  const colorClass =
    variant === "success"
      ? "text-success"
      : variant === "primary"
      ? "text-primary"
      : "text-foreground";

  return (
    <div
      ref={ref}
      className="bg-card border border-[hsl(var(--card-border))] rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[100px]"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-xs text-muted-foreground font-medium">
          {tooltip ? (
            <FiscalTooltip term={label} explanation={tooltip} />
          ) : (
            label
          )}
        </p>
      </div>
      <div className="flex items-baseline gap-1 mt-auto">
        {icon}
        <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>
          {value != null
            ? suffix
              ? `${Math.abs(displayValue).toLocaleString("fr-FR")}${suffix}`
              : fmtCompact(displayValue)
            : "—"}
        </p>
      </div>
    </div>
  );
};

// Stepper step
const StepperStep = ({
  index,
  title,
  amount,
  amountColor,
  children,
  isLast,
  delay,
}: {
  index: number;
  title: string;
  amount: string;
  amountColor?: string;
  children: React.ReactNode;
  isLast?: boolean;
  delay: number;
}) => {
  const { ref, visible } = useInView(delay);

  return (
    <div ref={ref} className="relative flex gap-4">
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-500 ${
            visible
              ? "bg-primary text-primary-foreground scale-100"
              : "bg-muted text-muted-foreground scale-75"
          }`}
        >
          {index}
        </div>
        {!isLast && (
          <div className="w-px flex-1 border-l-2 border-dashed border-border my-1" />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 pb-8 transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-card border border-[hsl(var(--card-border))] rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <span className={`text-lg font-bold tabular-nums ${amountColor || "text-foreground"}`}>
              {amount}
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// SVG Gauge
const GaugeChart = ({
  value,
  maxValue = 40,
}: {
  value: number;
  maxValue?: number;
}) => {
  const { ref, visible } = useInView(200);
  const clampedValue = Math.min(Math.max(value, 0), maxValue);
  const angle = (clampedValue / maxValue) * 180;

  // Gauge labels
  const getLabel = (v: number) => {
    if (v <= 5) return "Très faible";
    if (v <= 15) return "Dans la moyenne";
    if (v <= 25) return "Élevé";
    return "Très élevé";
  };

  return (
    <div ref={ref} className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-48 h-auto">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Colored segments */}
        <path d="M 20 100 A 80 80 0 0 1 55 35" fill="none" stroke="hsl(var(--success))" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
        <path d="M 55 35 A 80 80 0 0 1 100 20" fill="none" stroke="hsl(38 92% 50%)" strokeWidth="12" opacity="0.4" />
        <path d="M 100 20 A 80 80 0 0 1 145 35" fill="none" stroke="hsl(25 95% 53%)" strokeWidth="12" opacity="0.4" />
        <path d="M 145 35 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--destructive))" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={100 + 65 * Math.cos(((180 - (visible ? angle : 0)) * Math.PI) / 180)}
          y2={100 - 65 * Math.sin(((180 - (visible ? angle : 0)) * Math.PI) / 180)}
          stroke="hsl(var(--foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        {/* Center dot */}
        <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
        {/* Value */}
        <text x="100" y="90" textAnchor="middle" className="text-lg font-bold" fill="hsl(var(--foreground))" fontSize="18">
          {visible ? value.toFixed(1) : "0.0"}%
        </text>
      </svg>
      <p className="text-sm font-medium text-muted-foreground mt-1">{getLabel(value)}</p>
      {/* Legend */}
      <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />0-5%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(38 92% 50%)" }} />5-15%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(25 95% 53%)" }} />15-25%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />25%+</span>
      </div>
    </div>
  );
};

// Tax bracket bar
const TranchesBar = ({
  revenuImposable,
  nombreParts,
}: {
  revenuImposable: number;
  nombreParts: number;
}) => {
  const quotient = revenuImposable / (nombreParts || 1);
  const maxDisplay = Math.max(quotient * 1.15, TRANCHES_2024[3].seuil);

  // Determine which tranches are hit
  const activeTranches = TRANCHES_2024.filter((t) => quotient > t.seuil);
  const tmi = activeTranches.length > 0 ? activeTranches[activeTranches.length - 1].taux : 0;

  // Calculate segment boundaries for label positioning
  const segments = TRANCHES_2024.filter((t) => t.seuil < maxDisplay).map((tranche, i) => {
    const nextSeuil = TRANCHES_2024[i + 1]?.seuil || maxDisplay;
    const start = tranche.seuil;
    const end = Math.min(nextSeuil, maxDisplay);
    const startPct = (start / maxDisplay) * 100;
    const width = ((end - start) / maxDisplay) * 100;
    return { ...tranche, startPct, width, isActive: quotient > start };
  });

  return (
    <div className="space-y-1">
      <div className="relative h-8 rounded-full overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="relative h-full"
            style={{ width: `${seg.width}%` }}
          >
            <div
              className="absolute inset-0 transition-all duration-700"
              style={{
                background: seg.couleur,
                opacity: seg.isActive ? 0.8 : 0.15,
                width: seg.isActive
                  ? `${Math.min(((Math.min(quotient, TRANCHES_2024[i + 1]?.seuil || maxDisplay) - seg.seuil) / ((Math.min(TRANCHES_2024[i + 1]?.seuil || maxDisplay, maxDisplay)) - seg.seuil)) * 100, 100)}%`
                  : "100%",
              }}
            />
          </div>
        ))}
      </div>
      {/* Labels positioned at segment start boundaries */}
      <div className="relative h-5">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={`absolute text-[10px] ${seg.isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            style={{ left: `${seg.startPct}%`, transform: i > 0 ? "translateX(-50%)" : "none" }}
          >
            {seg.label}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Votre{" "}
        <FiscalTooltip
          term="taux marginal d'imposition (TMI)"
          explanation="C'est le taux qui s'applique à la dernière tranche de vos revenus. Ce n'est pas le taux appliqué à l'ensemble de vos revenus."
        />{" "}
        est de <strong className="text-foreground">{tmi} %</strong>.
      </p>
    </div>
  );
};

// Loading stepper
const LoadingStepper = ({ progressMsg }: { progressMsg: string }) => {
  const steps = [
    { label: "Lecture de votre document…", key: "pdf" },
    { label: "Identification des données fiscales…", key: "api" },
    { label: "Rédaction de vos explications personnalisées…", key: "explain" },
    { label: "Finalisation…", key: "final" },
  ];

  const getStepIndex = (msg: string) => {
    if (msg.includes("librairie") || msg.includes("fichier") || msg.includes("page")) return 0;
    if (msg.includes("Analyse") || msg.includes("Haiku")) return 1;
    if (msg.includes("Rédaction")) return 2;
    return msg ? 1 : 0;
  };

  const currentStep = getStepIndex(progressMsg);

  return (
    <Card>
      <CardContent className="p-10">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center mb-6">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < currentStep ? (
                <CheckCircle className="h-5 w-5 text-success shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
              )}
              <span
                className={`text-sm ${
                  i < currentStep
                    ? "text-success line-through"
                    : i === currentStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Simple data row for raw data accordion
const SimpleDataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-2 px-3 rounded-lg hover:bg-muted/50">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold tabular-nums text-foreground text-right">{value}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const OcrAvisImposition = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AvisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rawDataOpen, setRawDataOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [apiDone, setApiDone] = useState(false);
  const pendingDataRef = useRef<AvisData | null>(null);

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const toDbNumber = useCallback((value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;

    const normalized = value.replace(/\u00A0/g, " ").trim();
    const match = normalized.match(/-?\d[\d\s.,]*/);
    if (!match) return null;

    const numeric = match[0].replace(/\s/g, "").replace(/,/g, ".");
    const parsed = Number.parseFloat(numeric);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  // Load history on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadHistory = async () => {
      setLoadingHistory(true);
      const { data: rows, error: histErr } = await supabase
        .from("ocr_avis_imposition_analyses" as any)
        .select("id, annee_revenus, annee_imposition, prenom, nom, revenu_fiscal_reference, impot_net_total, taux_moyen_pct, solde, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (histErr) console.error("Load history error:", histErr);
      setHistory(rows || []);
      setLoadingHistory(false);
    };
    loadHistory();
  }, [user?.id, data]); // reload after new analysis

  // Save analysis to DB
  const saveAnalysis = useCallback(async (analysisData: AvisData) => {
    if (!user?.id) return;
    try {
      const { error: insertError } = await supabase.from("ocr_avis_imposition_analyses" as any).insert({
        user_id: user.id,
        analysis_data: analysisData as any,
        // Contribuable
        prenom: analysisData.contribuable?.prenom,
        nom: analysisData.contribuable?.nom,
        adresse_complete: analysisData.contribuable?.adresse_complete,
        numero_fiscal: analysisData.contribuable?.numero_fiscal,
        reference_avis: analysisData.contribuable?.reference_avis,
        situation_familiale: analysisData.contribuable?.situation_familiale,
        nombre_parts: analysisData.contribuable?.nombre_parts,
        // Années
        annee_revenus: analysisData.annees?.annee_revenus,
        annee_imposition: analysisData.annees?.annee_imposition,
        // Revenus
        salaires_traitements_bruts: analysisData.revenus?.salaires_traitements_bruts,
        abattement_10_pct: analysisData.revenus?.abattement_10_pct,
        salaires_nets_imposables: analysisData.revenus?.salaires_nets_imposables,
        revenus_fonciers_nets: analysisData.revenus?.revenus_fonciers_nets,
        revenus_capitaux_mobiliers: analysisData.revenus?.revenus_capitaux_mobiliers,
        plus_values_mobilieres: analysisData.revenus?.plus_values_mobilières,
        bic_bnc_ba: analysisData.revenus?.bic_bnc_ba,
        pensions_retraites: analysisData.revenus?.pensions_retraites,
        autres_revenus: analysisData.revenus?.autres_revenus,
        revenu_brut_global: analysisData.revenus?.revenu_brut_global,
        charges_deductibles: analysisData.revenus?.charges_deductibles,
        revenu_net_global: analysisData.revenus?.revenu_net_global,
        abattements_speciaux: analysisData.revenus?.abattements_speciaux,
        revenu_net_imposable: analysisData.revenus?.revenu_net_imposable,
        revenu_fiscal_reference: analysisData.revenus?.revenu_fiscal_reference,
        // Impôt
        impot_brut_progressif: analysisData.impot?.impot_brut_progressif,
        taux_marginal_imposition_pct: analysisData.impot?.taux_marginal_imposition_pct,
        taux_moyen_pct: analysisData.impot?.taux_moyen_imposition_pct,
        plafonnement_quotient_familial: analysisData.impot?.plafonnement_quotient_familial,
        reductions_impot: analysisData.impot?.reductions_impot,
        credits_impot: analysisData.impot?.credits_impot,
        impot_net_avant_contributions: analysisData.impot?.impot_net_avant_contributions,
        prelevement_forfaitaire_unique: analysisData.impot?.prelevement_forfaitaire_unique,
        contributions_sociales_revenus_capital: analysisData.impot?.contributions_sociales_revenus_capital,
        taxe_habitation: analysisData.impot?.taxe_habitation,
        impot_net_total: analysisData.impot?.impot_net_total,
        total_a_payer: analysisData.impot?.total_a_payer,
        mensualisation_ou_prelevement: analysisData.impot?.mensualisation_ou_prelevement,
        // Prélèvement à la source
        taux_pas_pct: analysisData.prelevement_source?.taux_pas_pct,
        montant_preleve_annee_n: analysisData.prelevement_source?.montant_preleve_annee_n,
        solde: analysisData.prelevement_source?.solde_a_payer_ou_rembourser,
        // Meta
        type_document: analysisData.meta?.type_document,
        confidence: analysisData.meta?.confidence,
        champs_manquants: analysisData.meta?.champs_manquants,
        // PER
        plafond_per_declarant_1: analysisData.plafonds_per?.plafond_declarant_1,
        plafond_per_declarant_2: analysisData.plafonds_per?.plafond_declarant_2,
        plafond_per_verse: analysisData.plafonds_per?.montant_verse_per,
        plafond_per_restant: analysisData.plafonds_per?.plafond_restant,
        per_analyse_personnalisee: analysisData.plafonds_per?.analyse_personnalisee,
      } as any);
      if (insertError) {
        console.error("Save analysis DB error:", insertError);
        toast.error("Erreur lors de la sauvegarde de l'analyse");
        return;
      }
      toast.success("Analyse sauvegardée dans votre espace");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Erreur lors de la sauvegarde");
    }
  }, [user?.id]);

  // Load a saved analysis
  const loadSavedAnalysis = useCallback(async (id: string) => {
    const { data: row } = await supabase
      .from("ocr_avis_imposition_analyses" as any)
      .select("analysis_data")
      .eq("id", id)
      .single();
    if ((row as any)?.analysis_data) {
      setData((row as any).analysis_data as unknown as AvisData);
      setShowHistory(false);
    }
  }, []);

  // Delete a saved analysis
  const deleteSavedAnalysis = useCallback(async (id: string) => {
    await supabase.from("ocr_avis_imposition_analyses" as any).delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success("Analyse supprimée");
  }, []);

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
    setLoading(false);
    if (pendingDataRef.current) {
      const analysisResult = pendingDataRef.current;
      setData(analysisResult);
      pendingDataRef.current = null;
      // Auto-save if logged in
      saveAnalysis(analysisResult);
    }
  }, [saveAnalysis]);

  const analyzeFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Veuillez sélectionner un fichier PDF");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20 Mo");
      return;
    }

    // Check daily upload limit (1 per day) — skip for admins
    if (user?.id) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      const isAdmin = roleData?.role === "admin";

      if (!isAdmin) {
        const today = new Date().toISOString().slice(0, 10);
        const { count } = await supabase
          .from("ocr_avis_imposition_analyses" as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`);
        if (count != null && count >= 1) {
          toast.error("Vous avez déjà effectué une analyse aujourd'hui. Revenez demain !");
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    setData(null);
    setApiDone(false);
    setShowOverlay(true);
    pendingDataRef.current = null;

    try {
      const images = await pdfToImages(file, setProgressMsg);
      setProgressMsg("Analyse par Haiku 4.5…");

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "ocr-avis-imposition",
        { body: { images, model: "haiku-4.5" } }
      );
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      const { _usage, ...ocrData } = result;
      pendingDataRef.current = ocrData as AvisData;
      setApiDone(true);
    } catch (err: any) {
      console.error("OCR error:", err);
      setError(err.message || "Une erreur est survenue lors de l'analyse.");
      setShowOverlay(false);
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) analyzeFile(file);
    },
    [analyzeFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) analyzeFile(file);
    },
    [analyzeFile]
  );

  const reset = () => {
    setData(null);
    setError(null);
    setShowOverlay(false);
    setApiDone(false);
    setLoading(false);
  };

  // ─── Computed values ───
  const prenom = data?.contribuable?.prenom;
  const annee = data?.annees?.annee_revenus;
  const anneeImposition = data?.annees?.annee_imposition;
  const rfr = data?.revenus?.revenu_fiscal_reference;
  const impotNet = data?.impot?.impot_net_total;
  const tauxMoyen = data?.impot?.taux_moyen_imposition_pct as number | null | undefined;
  const solde = data?.prelevement_source?.solde_a_payer_ou_rembourser;
  const montantPreleve = data?.prelevement_source?.montant_preleve_annee_n;
  const tauxPas = data?.prelevement_source?.taux_pas_pct;
  const salaires = data?.revenus?.salaires_traitements_bruts;
  const abattement = data?.revenus?.abattement_10_pct;
  const revenuImposable = data?.revenus?.revenu_net_imposable;
  const impotBrut = data?.impot?.impot_brut_progressif;
  const reductions = data?.impot?.reductions_impot;
  const credits = data?.impot?.credits_impot;
  const nombreParts = data?.contribuable?.nombre_parts || 1;

  const totalReductionsCredits =
    (reductions || 0) + (credits || 0) > 0 ? (reductions || 0) + (credits || 0) : null;

  const impotSansDispositifs = data?.impot?.impot_sans_dispositifs ?? (impotBrut != null ? impotBrut : null);
  const economieDispositifs = impotSansDispositifs != null && impotNet != null ? impotSansDispositifs - impotNet : null;
  const chargesDeductibles = data?.revenus?.charges_deductibles;

  const conseils = data?.explications_pedagogiques?.conseils_optimisation || [];
  const pointsAttention = data?.explications_pedagogiques?.points_attention || [];

  // Compute TMI at parent level for PER simulator
  const computedTmi = useMemo(() => {
    if (!revenuImposable || !nombreParts) return 0;
    const quotient = revenuImposable / nombreParts;
    const active = TRANCHES_2024.filter((t) => quotient > t.seuil);
    return active.length > 0 ? active[active.length - 1].taux : 0;
  }, [revenuImposable, nombreParts]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 pb-20">
      {/* ─── Upload State ─── */}
      {!data && !loading && !error && (
        <div className="space-y-8 pt-8">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Votre avis d'imposition, enfin expliqué
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Déposez votre document et comprenez chaque ligne en 3 minutes, sans jargon fiscal.
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onClick={() => document.getElementById("pdf-input")?.click()}
                style={dragOver ? {} : { animation: "pulse 3s ease-in-out infinite" }}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-primary/60" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Déposez votre avis d'imposition
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Glissez-déposez votre PDF ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-muted-foreground">PDF uniquement • 8 pages max • 20 Mo max</p>
                <input
                  id="pdf-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reassurance pills */}
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" /> Document traité en toute confidentialité
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" /> Analyse en moins de 30 secondes
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> Explications adaptées à tous
            </div>
          </div>

          {/* ─── History ─── */}
          {user && history.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                📂 Mes analyses précédentes ({history.length})
                <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </button>
              {showHistory && (
                <div className="space-y-2">
                  {history.map((h) => (
                    <Card key={h.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <button
                          onClick={() => loadSavedAnalysis(h.id)}
                          className="flex-1 text-left space-y-1"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">
                              {h.prenom ? `${h.prenom} ${h.nom || ""}` : "Avis d'imposition"}
                            </span>
                            {h.annee_revenus && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/15 text-secondary">
                                {h.annee_revenus}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {h.revenu_fiscal_reference && (
                              <span>RFR : {Number(h.revenu_fiscal_reference).toLocaleString("fr-FR")} €</span>
                            )}
                            {h.impot_net_total && (
                              <span>Impôt : {Number(h.impot_net_total).toLocaleString("fr-FR")} €</span>
                            )}
                            <span>{new Date(h.created_at).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={(e) => { e.stopPropagation(); deleteSavedAnalysis(h.id); }}
                        >
                          ✕
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Analysis Overlay ─── */}
      <TaxNoticeAnalysisOverlay
        isAnalyzing={showOverlay}
        apiDone={apiDone}
        onComplete={handleOverlayComplete}
      />

      {/* ─── Error ─── */}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-10 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-foreground font-medium max-w-md mx-auto">
              Une erreur est survenue lors de l'analyse de votre document. Veuillez vérifier que
              votre fichier est bien un avis d'imposition au format PDF et réessayer.
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Results ─── */}
      {data && (
        <>
          {/* Action bar */}
          <div className="flex justify-end pt-4">
            <Button variant="ghost" size="sm" onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Analyser un autre document
            </Button>
          </div>

          {/* ═══════════════ ZONE 1 — Bannière & Métriques ═══════════════ */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--secondary) / 0.08))" }}
          >
            <div className="space-y-2 mb-6">
              <div className="flex flex-wrap gap-2">
                {data.meta.type_document && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                    {data.meta.type_document}
                  </span>
                )}
                {data.meta.annee_detectee && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/15 text-secondary">
                    {data.meta.annee_detectee}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {`Voici ce que nous avons trouvé dans votre avis d'imposition${annee ? ` ${annee}` : ""}.`}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Votre revenu de référence"
                value={rfr}
                tooltip="Le revenu fiscal de référence (RFR) est le chiffre qui sert de base à de nombreux droits et aides sociales."
              />
              <MetricCard
                label="Votre impôt"
                value={impotNet}
              />
              <MetricCard
                label="Votre taux réel"
                value={tauxMoyen != null ? Math.round(tauxMoyen * 10) / 10 : null}
                suffix=" %"
                tooltip="C'est le pourcentage de vos revenus que vous avez réellement payé en impôt, toutes tranches confondues."
              />
              <MetricCard
                label="Votre solde"
                value={solde}
                variant={solde != null && solde < 0 ? "success" : "primary"}
                icon={
                  solde != null ? (
                    solde < 0 ? (
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    ) : solde > 0 ? (
                      <Info className="h-4 w-4 text-primary shrink-0" />
                    ) : null
                  ) : null
                }
              />
            </div>
          </div>

          {/* ═══════════════ ZONE 1.5 — Composition du foyer fiscal ═══════════════ */}
          {(data.contribuable?.situation_familiale || nombreParts) && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">
                Votre foyer fiscal
              </h3>
              <Card className="overflow-hidden">
                <CardContent className="pt-5 pb-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {data.contribuable?.situation_familiale && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Situation familiale</p>
                        <p className="text-sm font-semibold text-foreground">{data.contribuable.situation_familiale}</p>
                      </div>
                    )}
                    {nombreParts != null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Nombre de parts</p>
                        <p className="text-sm font-semibold text-foreground">{nombreParts} {nombreParts > 1 ? "parts" : "part"}</p>
                      </div>
                    )}
                    {revenuImposable != null && nombreParts > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Quotient familial</p>
                        <p className="text-sm font-semibold text-foreground">{fmt(Math.round(revenuImposable / nombreParts))}</p>
                      </div>
                    )}
                  </div>
                  {data.explications_pedagogiques?.quotient_familial_explication && (
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t pt-3">
                      <Info className="h-3.5 w-3.5 inline-block mr-1.5 text-primary" />
                      {data.explications_pedagogiques.quotient_familial_explication}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════ ZONE 2 — Le parcours de votre impôt ═══════════════ */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              Comment votre impôt a-t-il été calculé ?
            </h3>

            <div className="relative">
              {/* Step 1 — Revenus déclarés */}
              <StepperStep
                index={1}
                title="Vos revenus déclarés"
                amount={fmt(salaires)}
                amountColor="text-primary"
                delay={0}
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {annee
                    ? `En ${annee}, vous avez déclaré ${fmt(salaires)} de salaires et traitements bruts.`
                    : `Vous avez déclaré ${fmt(salaires)} de salaires et traitements bruts.`}{" "}
                  C'est le point de départ du calcul de votre impôt.
                </p>
                <div className="mt-3 h-3 rounded-full bg-primary/70 w-full" />
              </StepperStep>

              {/* Step 2 — Abattement */}
              <StepperStep
                index={2}
                title="L'abattement forfaitaire de 10 %"
                amount={abattement != null ? `− ${fmt(Math.abs(abattement))}` : "—"}
                amountColor="text-muted-foreground"
                delay={100}
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  L'administration fiscale vous accorde automatiquement un{" "}
                  <FiscalTooltip
                    term="abattement de 10 %"
                    explanation="Cet abattement forfaitaire est censé couvrir vos frais professionnels courants (transport, repas…). Vous pouvez opter pour les frais réels si vos dépenses sont supérieures."
                  />
                  {" "}de {fmt(Math.abs(abattement || 0))}, censé représenter vos frais professionnels.
                  Vous n'avez rien à faire pour en bénéficier.
                </p>
                <div className="mt-3 flex h-3 rounded-full overflow-hidden">
                  <div className="bg-primary/70 flex-1" />
                  <div className="bg-muted w-[10%]" />
                </div>
              </StepperStep>

              {/* Step 3 — Revenu imposable */}
              <StepperStep
                index={3}
                title="Votre revenu net imposable"
                amount={fmt(revenuImposable)}
                amountColor="text-secondary"
                delay={200}
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Après abattement, votre{" "}
                  <FiscalTooltip
                    term="revenu net imposable"
                    explanation="C'est le montant sur lequel l'impôt est effectivement calculé, après déduction de l'abattement de 10 % et d'éventuelles charges déductibles."
                  />{" "}
                  s'établit à {fmt(revenuImposable)}. C'est cette base — et non votre salaire brut
                  — que l'administration utilise pour calculer votre impôt.
                </p>
                <div className="mt-3 h-3 rounded-full bg-secondary/70 w-[90%]" />
              </StepperStep>

              {/* Step 4 — Barème progressif */}
              <StepperStep
                index={4}
                title="Le calcul par tranches"
                amount={fmt(impotBrut)}
                amountColor="text-foreground"
                delay={300}
              >
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Contrairement à une idée reçue, votre{" "}
                  <FiscalTooltip
                    term="taux marginal"
                    explanation="C'est le taux qui s'applique à la dernière tranche de vos revenus. Seule la part qui dépasse le seuil de cette tranche est taxée à ce taux."
                  />{" "}
                  ne s'applique pas à l'ensemble de vos revenus. Chaque tranche est taxée à un taux
                  différent.
                </p>
                {revenuImposable != null && (
                  <TranchesBar revenuImposable={revenuImposable} nombreParts={nombreParts} />
                )}
              </StepperStep>

              {/* Step 5 — Réductions / crédits (conditionnel) */}
              {totalReductionsCredits != null && totalReductionsCredits > 0 && (
                <StepperStep
                  index={5}
                  title="Vos réductions et crédits d'impôt"
                  amount={`− ${fmt(totalReductionsCredits)}`}
                  amountColor="text-success"
                  delay={400}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vous bénéficiez de {fmt(totalReductionsCredits)} de réductions et/ou crédits
                    d'impôt qui viennent directement diminuer votre impôt calculé.
                  </p>
                  {reductions != null && reductions > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      • Réductions d'impôt : {fmt(reductions)}
                    </p>
                  )}
                  {credits != null && credits > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      • Crédits d'impôt : {fmt(credits)}
                    </p>
                  )}
                </StepperStep>
              )}

              {/* Step 6 — Impôt final */}
              <StepperStep
                index={totalReductionsCredits ? 6 : 5}
                title="Votre impôt sur le revenu"
                amount={fmt(impotNet)}
                amountColor="text-primary"
                isLast
                delay={totalReductionsCredits ? 500 : 400}
              >
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Votre{" "}
                  <FiscalTooltip
                    term="taux moyen réel"
                    explanation="C'est le pourcentage effectif de vos revenus consacré à l'impôt. Il est toujours inférieur au taux marginal car les premières tranches sont taxées à des taux plus faibles."
                  />{" "}
                  est de {pct(tauxMoyen)}. Concrètement, pour 100 € gagnés, vous avez payé{" "}
                  {tauxMoyen != null ? tauxMoyen.toFixed(1).replace(".", ",") : "—"} € d'impôt sur
                  le revenu.
                </p>
                {tauxMoyen != null && <GaugeChart value={tauxMoyen} />}
              </StepperStep>
            </div>
          </div>

          {/* ═══════════════ ZONE 2B — Waterfall : comment se construit votre impôt ═══════════════ */}
          {revenuImposable != null && impotNet != null && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                De vos revenus à votre impôt : vue d'ensemble
              </h3>
              <Card>
                <CardContent className="p-6">
                  {(() => {
                    const rbg = data?.revenus?.revenu_brut_global || 0;
                    const rni = revenuImposable || 0;
                    const ded = rbg > 0 && rni > 0 ? rbg - rni : (Math.abs(chargesDeductibles || 0) + Math.abs(abattement || 0));
                    const baseApresDeductions = rni;
                    const red = (reductions || 0) + (credits || 0);
                    const impFinal = impotNet || 0;
                    const impBrut = impotBrut || 0;

                    // Waterfall steps
                    const steps = [
                      { label: "Revenu brut global", value: data?.revenus?.revenu_brut_global || (salaires || 0), color: "hsl(var(--primary))", type: "total" as const },
                      { label: "Déductions", value: -ded, color: "hsl(var(--muted-foreground))", type: "delta" as const },
                      { label: "Revenu net imposable", value: baseApresDeductions, color: "hsl(var(--secondary))", type: "total" as const },
                      { label: "Impôt brut (barème)", value: impBrut, color: "hsl(25 95% 53%)", type: "total" as const },
                      { label: "Réductions & crédits", value: -red, color: "hsl(var(--success))", type: "delta" as const },
                      { label: "Impôt à payer", value: impFinal, color: "hsl(var(--primary))", type: "total" as const },
                    ];

                    const maxVal = Math.max(...steps.map(s => Math.abs(s.value)));

                    return (
                      <div className="space-y-2">
                        {steps.map((step, i) => {
                          const widthPct = maxVal > 0 ? (Math.abs(step.value) / maxVal) * 100 : 0;
                          const isDelta = step.type === "delta";
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className={`${isDelta ? "text-muted-foreground italic" : "font-medium text-foreground"}`}>
                                  {isDelta ? `↳ ${step.label}` : step.label}
                                </span>
                                <span className={`font-bold tabular-nums ${isDelta ? (step.value < 0 ? "text-success" : "text-destructive") : "text-foreground"}`}>
                                  {step.value < 0 ? "− " : ""}{fmtCompact(Math.abs(step.value))}
                                </span>
                              </div>
                              <div className="h-6 rounded-md overflow-hidden bg-muted/30">
                                <div
                                  className="h-full rounded-md transition-all duration-700"
                                  style={{
                                    width: `${Math.max(widthPct, 1)}%`,
                                    background: step.color,
                                    opacity: isDelta ? 0.5 : 0.8,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════ ZONE 2C — Avant/Après dispositifs ═══════════════ */}
          {impotSansDispositifs != null && impotNet != null && economieDispositifs != null && economieDispositifs > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                L'impact de vos dispositifs fiscaux
              </h3>
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    {/* Sans dispositifs */}
                    <div className="text-center space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sans vos dispositifs</p>
                      <div className="mx-auto w-20 rounded-t-lg bg-destructive/20 border-2 border-destructive/30 flex items-end justify-center"
                        style={{ height: `${Math.min(120, Math.max(40, 120))}px` }}>
                        <div className="bg-destructive/60 w-full rounded-t-lg" style={{ height: `100%` }} />
                      </div>
                      <p className="text-lg font-bold text-destructive tabular-nums">{fmtCompact(impotSansDispositifs)}</p>
                    </div>
                    {/* Arrow + economy */}
                    <div className="text-center space-y-1 flex flex-col items-center justify-center">
                      <div className="px-4 py-2 rounded-full bg-success/15 border border-success/20">
                        <p className="text-xs font-medium text-success">Économie réalisée</p>
                        <p className="text-xl font-bold text-success tabular-nums">− {fmtCompact(economieDispositifs)}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-success rotate-90 sm:rotate-0" />
                    </div>
                    {/* Avec dispositifs */}
                    <div className="text-center space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avec vos dispositifs</p>
                      <div className="mx-auto w-20 rounded-t-lg bg-primary/20 border-2 border-primary/30 flex items-end justify-center"
                        style={{ height: `${Math.min(120, Math.max(40, 120))}px` }}>
                        <div className="bg-primary/60 w-full rounded-t-lg"
                          style={{ height: `${impotSansDispositifs > 0 ? (impotNet / impotSansDispositifs) * 100 : 100}%` }} />
                      </div>
                      <p className="text-lg font-bold text-primary tabular-nums">{fmtCompact(impotNet)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Inclut l'impact de vos déductions (PER, charges déductibles), réductions et crédits d'impôt
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════ ZONE 2D — Pédagogie : Déduction vs Réduction vs Crédit ═══════════════ */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Comprendre : déduction, réduction et crédit d'impôt
            </h3>
            <Card className="bg-gradient-to-br from-muted/30 to-transparent">
              <CardContent className="p-6 space-y-5">
                {/* Déduction */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-secondary">D</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">La déduction fiscale</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                      Elle <strong>réduit votre revenu imposable</strong> (la base de calcul), pas directement votre impôt. 
                      L'économie dépend de votre tranche : avec un TMI à 30 %, une déduction de 1 000 € vous fait économiser 300 € d'impôt.
                      {chargesDeductibles != null && Math.abs(chargesDeductibles) > 0 && (
                        <span className="block mt-1 text-secondary font-medium">
                          → Sur votre avis : {fmtCompact(Math.abs(chargesDeductibles))} de charges déductibles identifiées.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Réduction */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-accent">R</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">La réduction d'impôt</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                      Elle <strong>se soustrait directement de votre impôt</strong>. Mais si elle dépasse le montant d'impôt dû, la différence est perdue — on ne vous la rembourse pas.
                      {reductions != null && reductions > 0 && (
                        <span className="block mt-1 text-accent font-medium">
                          → Sur votre avis : {fmtCompact(reductions)} de réductions d'impôt.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Crédit */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-success">C</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Le crédit d'impôt</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                      Comme la réduction, il <strong>diminue directement votre impôt</strong>. Mais contrairement à elle, si le crédit dépasse votre impôt, <strong>le surplus vous est remboursé</strong>. C'est le mécanisme le plus avantageux.
                      {credits != null && credits > 0 && (
                        <span className="block mt-1 text-success font-medium">
                          → Sur votre avis : {fmtCompact(credits)} de crédits d'impôt.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-background border rounded-xl p-4 mt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">En résumé :</strong> la déduction agit en amont (sur le revenu), 
                    la réduction et le crédit agissent en aval (sur l'impôt). Le crédit d'impôt est le seul mécanisme remboursable si vous ne payez pas d'impôt.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              Votre prélèvement à la source
            </h3>

            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Reconciliation table */}
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Ce qui a été prélevé en {anneeImposition || annee || "—"}
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {fmt(montantPreleve)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ce que vous deviez réellement</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {fmt(impotNet)}
                    </span>
                  </div>
                  <div className="border-t border-border" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Résultat</span>
                    <span
                      className={`font-bold tabular-nums flex items-center gap-2 ${
                        solde != null && solde < 0 ? "text-success" : "text-primary"
                      }`}
                    >
                      {solde != null && solde < 0
                        ? `Remboursement ${fmt(Math.abs(solde))}`
                        : solde != null && solde > 0
                        ? `Reste à payer ${fmt(solde)}`
                        : "Rien à régulariser"}
                      {solde != null && solde < 0 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : solde != null && solde > 0 ? (
                        <Info className="h-4 w-4" />
                      ) : null}
                    </span>
                  </div>
                </div>

                {/* Pedagogical text */}
                {data.explications_pedagogiques?.prelevement_source_explication && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {data.explications_pedagogiques.prelevement_source_explication}
                    </p>
                  </div>
                )}

                {/* PAS rate badge */}
                {tauxPas != null && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent">
                      Votre taux de{" "}
                      <FiscalTooltip
                        term="prélèvement à la source"
                        explanation="Le PAS est une avance sur votre impôt, prélevée chaque mois sur votre salaire. L'avis d'imposition régularise la différence entre ce qui a été prélevé et ce que vous devez réellement."
                      />
                      {" "}: {pct(tauxPas)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════ ZONE 4 — Ce que vous pourriez faire ═══════════════ */}
          <div className="space-y-4">
            {/* ── PER Focus Card (toujours affiché) ── */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                🎯 Focus : votre plafond épargne retraite (PER)
              </h3>
              <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="p-5 space-y-4">
                  {/* Chiffres clés PER */}
                  {(data.plafonds_per?.plafond_declarant_1 != null || data.plafonds_per?.plafond_restant != null) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {data.plafonds_per?.plafond_declarant_1 != null && (
                        <div className="text-center p-3 rounded-lg bg-background border">
                          <p className="text-xs text-muted-foreground">Plafond déclarant 1</p>
                          <p className="text-lg font-bold text-foreground tabular-nums">{fmtCompact(data.plafonds_per.plafond_declarant_1)}</p>
                        </div>
                      )}
                      {data.plafonds_per?.plafond_declarant_2 != null && (
                        <div className="text-center p-3 rounded-lg bg-background border">
                          <p className="text-xs text-muted-foreground">Plafond déclarant 2</p>
                          <p className="text-lg font-bold text-foreground tabular-nums">{fmtCompact(data.plafonds_per.plafond_declarant_2)}</p>
                        </div>
                      )}
                      {data.plafonds_per?.montant_verse_per != null && (
                        <div className="text-center p-3 rounded-lg bg-background border">
                          <p className="text-xs text-muted-foreground">Déjà versé</p>
                          <p className="text-lg font-bold text-muted-foreground tabular-nums">{fmtCompact(data.plafonds_per.montant_verse_per)}</p>
                        </div>
                      )}
                      {data.plafonds_per?.plafond_restant != null && (
                        <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-xs text-success font-medium">Plafond restant</p>
                          <p className="text-lg font-bold text-success tabular-nums">{fmtCompact(data.plafonds_per.plafond_restant)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Analyse personnalisée */}
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {data.plafonds_per?.analyse_personnalisee || "Les plafonds de déduction épargne retraite ne sont pas visibles sur ce document. Ils figurent généralement en page 2 de votre avis d'imposition. Nous vous recommandons de vérifier ce point avec un conseiller."}
                  </p>
                  <a
                    href="/expert-booking"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    En parler à un conseiller patrimonial <ArrowRight className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* ── Mini-simulateur PER interactif ── */}
            {revenuImposable != null && impotNet != null && computedTmi >= 30 && (() => {
              const plafondRestant = data.plafonds_per?.plafond_restant
                ?? (data.plafonds_per?.plafond_declarant_1 != null
                  ? (data.plafonds_per.plafond_declarant_1 + (data.plafonds_per.plafond_declarant_2 || 0)) - (data.plafonds_per.montant_verse_per || 0)
                  : null);
              return plafondRestant != null && plafondRestant > 0 ? (
                <PerSimulatorSlider
                  revenuImposable={revenuImposable}
                  nombreParts={nombreParts}
                  impotNetActuel={impotNet}
                  plafondRestant={plafondRestant}
                  tmi={computedTmi}
                  reductionsCredits={(reductions || 0) + (credits || 0)}
                />
              ) : null;
            })()}

            {/* ── Autres conseils d'optimisation ── */}
            {conseils.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">
                  Autres pistes pour optimiser votre situation
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {conseils.slice(0, 3).map((conseil, i) => (
                    <Card key={i} className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {typeof conseil === 'string' ? conseil : (conseil as any)?.conseil || (conseil as any)?.detail || JSON.stringify(conseil)}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/15 text-success">
                          Économie potentielle
                        </span>
                        <a
                          href="/expert-booking"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          En parler à un conseiller <ArrowRight className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Bloc optimisation fiscale globale (TMI >= 30%) ── */}
            {(data.impot?.taux_marginal_imposition_pct ?? 0) >= 30 && (
              <Card className="border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏆</span>
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground">
                        Votre taux marginal est de {pct(data.impot?.taux_marginal_imposition_pct)} — vous avez un vrai levier d'optimisation
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Avec un taux marginal d'imposition à {pct(data.impot?.taux_marginal_imposition_pct)}, chaque euro déduit de votre revenu imposable vous fait économiser {(data.impot?.taux_marginal_imposition_pct ?? 30) >= 41 ? "41" : "30"} centimes d'impôt. Un bilan d'optimisation fiscale complet pourrait vous permettre d'identifier des dispositifs adaptés à votre situation : PER, investissement immobilier, dons, emploi à domicile, et bien d'autres.
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        À valider avec un conseiller patrimonial agréé.
                      </p>
                      <a
                        href="/expert-booking"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-1"
                      >
                        Réserver un bilan d'optimisation fiscale <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Bloc réductions / crédits d'impôt significatifs ── */}
            {(() => {
              const reductions = data.impot?.reductions_impot ?? 0;
              const credits = data.impot?.credits_impot ?? 0;
              const totalAvantages = reductions + credits;
              if (totalAvantages < 500) return null;
              return (
                <Card className="border-l-4 border-l-secondary bg-gradient-to-r from-secondary/5 to-transparent">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔍</span>
                      <div className="space-y-2">
                        <h4 className="font-bold text-foreground">
                          Nous avons identifié {fmtCompact(totalAvantages)} de réductions et crédits d'impôt
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Vous bénéficiez actuellement de{" "}
                          {reductions > 0 && <>{fmtCompact(reductions)} de réductions d'impôt</>}
                          {reductions > 0 && credits > 0 && " et de "}
                          {credits > 0 && <>{fmtCompact(credits)} de crédits d'impôt</>}.
                          {" "}C'est un montant significatif. Un conseiller peut vous aider à vérifier que vous exploitez pleinement ces dispositifs et qu'ils restent les plus adaptés à votre situation actuelle.
                        </p>
                        <a
                          href="/expert-booking"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-1"
                        >
                          Faire le point sur vos dispositifs fiscaux <ArrowRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Points d'attention */}
            {pointsAttention.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">
                  Points importants à vérifier
                </h3>
                {pointsAttention.map((point, i) => (
                  <Card key={i} className="border-l-4 border-l-destructive">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{typeof point === 'string' ? point : (point as any)?.detail || (point as any)?.point || JSON.stringify(point)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════ ZONE 5 — Données complètes (accordéon) ═══════════════ */}
          <Collapsible open={rawDataOpen} onOpenChange={setRawDataOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-[hsl(var(--card-border))] hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium text-muted-foreground">
                  Voir toutes les données extraites de votre document
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    rawDataOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-4">
              {/* Revenus */}
              <Card>
                <CardContent className="p-4 space-y-1">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                    Revenus
                  </h4>
                  {Object.entries(REVENUE_LABELS).map(([key, label]) => {
                    const val = data.revenus[key];
                    if (val == null) return null;
                    return <SimpleDataRow key={key} label={label} value={fmt(val)} />;
                  })}
                </CardContent>
              </Card>

              {/* Impôt */}
              <Card>
                <CardContent className="p-4 space-y-1">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                    Impôt
                  </h4>
                  {Object.entries(TAX_LABELS).map(([key, label]) => {
                    const val = data.impot[key];
                    if (val == null) return null;
                    return <SimpleDataRow key={key} label={label} value={fmt(val)} />;
                  })}
                  {data.impot.taux_marginal_imposition_pct != null && (
                    <SimpleDataRow
                      label="Taux marginal (TMI)"
                      value={pct(data.impot.taux_marginal_imposition_pct)}
                    />
                  )}
                  {data.impot.taux_moyen_imposition_pct != null && (
                    <SimpleDataRow
                      label="Taux moyen réel"
                      value={pct(data.impot.taux_moyen_imposition_pct)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Foyer */}
              <Card>
                <CardContent className="p-4 space-y-1">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                    Informations du foyer
                  </h4>
                  <SimpleDataRow
                    label="Contribuable"
                    value={`${data.contribuable.prenom} ${data.contribuable.nom}`}
                  />
                  {data.contribuable.numero_fiscal && (
                    <SimpleDataRow label="N° fiscal" value={data.contribuable.numero_fiscal} />
                  )}
                  {data.contribuable.situation_familiale && (
                    <SimpleDataRow
                      label="Situation familiale"
                      value={data.contribuable.situation_familiale}
                    />
                  )}
                  {data.contribuable.nombre_parts != null && (
                    <SimpleDataRow
                      label="Nombre de parts"
                      value={data.contribuable.nombre_parts.toString()}
                    />
                  )}
                  {data.annees.annee_revenus != null && (
                    <SimpleDataRow
                      label="Année des revenus"
                      value={data.annees.annee_revenus.toString()}
                    />
                  )}
                  {data.annees.annee_imposition != null && (
                    <SimpleDataRow
                      label="Année d'imposition"
                      value={data.annees.annee_imposition.toString()}
                    />
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* ─── Footer disclaimer ─── */}
          <div className="bg-muted/30 rounded-xl px-4 py-3">
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Ces informations sont extraites automatiquement depuis votre document. MyFinCare ne
              fournit pas de conseil fiscal. Pour toute décision patrimoniale, rapprochez-vous d'un
              conseiller agréé.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default OcrAvisImposition;
