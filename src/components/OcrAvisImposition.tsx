import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  impot: Record<string, number | null>;
  prelevement_source: {
    taux_pas_pct: number | null;
    montant_preleve_annee_n: number | null;
    solde_a_payer_ou_rembourser: number | null;
  };
  explications_pedagogiques: {
    introduction: string;
    revenu_fiscal_reference_explication: string;
    taux_marginal_explication: string;
    taux_moyen_explication: string;
    quotient_familial_explication: string;
    abattement_10_pct_explication: string;
    prelevement_source_explication: string;
    lignes_inhabituelles: string[];
    conseils_optimisation: string[];
    points_attention: string[];
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
      className="bg-card border border-[hsl(var(--card-border))] rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
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
      <div className="flex items-baseline gap-1">
        {icon}
        <p className={`text-xl font-bold tabular-nums ${colorClass}`}>
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

  return (
    <div className="space-y-3">
      <div className="relative h-8 rounded-full overflow-hidden flex">
        {TRANCHES_2024.map((tranche, i) => {
          const nextSeuil = TRANCHES_2024[i + 1]?.seuil || maxDisplay;
          const start = tranche.seuil;
          const end = Math.min(nextSeuil, maxDisplay);
          const width = ((end - start) / maxDisplay) * 100;
          const isActive = quotient > start;
          const filledWidth = isActive
            ? Math.min(((Math.min(quotient, nextSeuil) - start) / (end - start)) * 100, 100)
            : 0;

          return (
            <div
              key={i}
              className="relative h-full"
              style={{ width: `${width}%` }}
            >
              <div
                className="absolute inset-0 transition-all duration-700"
                style={{
                  background: tranche.couleur,
                  opacity: isActive ? 0.8 : 0.15,
                  width: isActive ? `${filledWidth}%` : "100%",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {TRANCHES_2024.filter((t) => t.seuil < maxDisplay).map((t, i) => (
          <span key={i} className={quotient > t.seuil ? "font-semibold text-foreground" : ""}>
            {t.label}
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
  const [data, setData] = useState<AvisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rawDataOpen, setRawDataOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [apiDone, setApiDone] = useState(false);
  const pendingDataRef = useRef<AvisData | null>(null);

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
    setLoading(false);
    if (pendingDataRef.current) {
      setData(pendingDataRef.current);
      pendingDataRef.current = null;
    }
  }, []);

  const analyzeFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Veuillez sélectionner un fichier PDF");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20 Mo");
      return;
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

  const conseils = data?.explications_pedagogiques?.conseils_optimisation || [];
  const pointsAttention = data?.explications_pedagogiques?.points_attention || [];

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
                {prenom
                  ? `Bonjour ${prenom}. Voici ce que nous avons trouvé dans votre avis d'imposition${annee ? ` ${annee}` : ""}.`
                  : `Voici ce que nous avons trouvé dans votre avis d'imposition${annee ? ` ${annee}` : ""}.`}
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

          {/* ═══════════════ ZONE 3 — Prélèvement à la source ═══════════════ */}
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
          {(conseils.length > 0 || pointsAttention.length > 0) && (
            <div className="space-y-4">
              {/* Optimization opportunities */}
              {conseils.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">
                    Des pistes pour optimiser votre situation
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {conseils.slice(0, 3).map((conseil, i) => (
                      <Card key={i} className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {conseil}
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
                        <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

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
