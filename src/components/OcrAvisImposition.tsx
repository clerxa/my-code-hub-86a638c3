import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Upload,
  FileText,
  ChevronDown,
  Copy,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  User,
  Wallet,
  Calculator,
  RefreshCw,
  CheckCircle,
  Info,
  ArrowDown,
  Loader2,
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

type ModelKey = "haiku-4.5" | "sonnet-4" | "both";

const MODEL_LABELS: Record<string, string> = {
  "haiku-4.5": "Haiku 4.5",
  "sonnet-4": "Sonnet 4",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €" : "—";

const pct = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " %" : "—";

const REVENUE_LABELS: Record<string, string> = {
  salaires_traitements_bruts: "Salaires et traitements bruts",
  abattement_10_pct: "Abattement de 10 %",
  salaires_nets_imposables: "Salaires nets imposables",
  revenus_fonciers_nets: "Revenus fonciers nets",
  revenus_capitaux_mobiliers: "Revenus de capitaux mobiliers",
  "plus_values_mobilières": "Plus-values mobilières",
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

const DualDataRow = ({
  label,
  value1,
  value2,
  highlight,
  dualMode,
}: {
  label: string;
  value1: string;
  value2?: string;
  highlight?: boolean;
  dualMode: boolean;
}) => (
  <div
    className={`grid items-center py-2.5 px-3 rounded-lg transition-colors ${
      highlight ? "bg-accent/10 border border-accent/30" : "hover:bg-muted/50"
    } ${dualMode ? "grid-cols-[1fr_auto_auto]" : "grid-cols-[1fr_auto]"} gap-4`}
  >
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold tabular-nums text-right ${highlight ? "text-accent" : "text-foreground"}`}>
      {value1}
    </span>
    {dualMode && (
      <span className={`text-sm font-semibold tabular-nums text-right min-w-[100px] ${highlight ? "text-accent" : "text-foreground"}`}>
        {value2 || "—"}
      </span>
    )}
  </div>
);

const ColumnHeaders = ({ dualMode }: { dualMode: boolean }) => {
  if (!dualMode) return null;
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2 mb-1">
      <span />
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary text-right">Haiku 4.5</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary text-right min-w-[100px]">Haiku 3.5</span>
    </div>
  );
};

const WaterfallStep = ({
  label,
  value,
  isPositive,
  isLast,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
  isLast?: boolean;
}) => (
  <div className="relative">
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isLast ? "bg-primary/10 border-primary/30" : "bg-card border-border"
      }`}
    >
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          isPositive === true ? "text-success" : isPositive === false ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
    {!isLast && (
      <div className="flex justify-center py-1">
        <ArrowDown className="h-4 w-4 text-muted-foreground" />
      </div>
    )}
  </div>
);

const PedagogicalCard = ({
  icon,
  title,
  text,
  text2,
  dualMode,
  variant = "info",
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  text2?: string;
  dualMode: boolean;
  variant?: "info" | "tip" | "warning";
}) => {
  const borderColor =
    variant === "warning" ? "border-l-destructive" : variant === "tip" ? "border-l-accent" : "border-l-primary";

  if (dualMode && text2) {
    return (
      <Card className={`border-l-4 ${borderColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <h4 className="font-semibold text-foreground">{title}</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Haiku 4.5</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Haiku 3.5</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{text2}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{icon}</div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CollapsibleSection = ({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-semibold text-foreground text-sm uppercase tracking-wider">{title}</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1 pl-1 pr-1">{children}</CollapsibleContent>
    </Collapsible>
  );
};

const UsageCard = ({ usage, label }: { usage: UsageData; label?: string }) => (
  <div className="flex-1 space-y-2">
    {label && <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>}
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-muted-foreground">Modèle :</span>
      <span className="text-xs font-medium text-foreground">{usage.model}</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Tokens in</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">{usage.input_tokens.toLocaleString("fr-FR")}</p>
        <p className="text-[10px] text-muted-foreground">{usage.cost_input_usd.toFixed(4)} $</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Tokens out</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">{usage.output_tokens.toLocaleString("fr-FR")}</p>
        <p className="text-[10px] text-muted-foreground">{usage.cost_output_usd.toFixed(4)} $</p>
      </div>
      <div className="h-8 w-px bg-border" />
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-sm font-bold tabular-nums text-foreground">{usage.total_tokens.toLocaleString("fr-FR")}</p>
        <p className="text-xs font-semibold text-primary">{usage.cost_total_usd.toFixed(4)} $</p>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const OcrAvisImposition = () => {
  const [selectedModel, setSelectedModel] = useState<ModelKey>("both");
  const [data1, setData1] = useState<AvisData | null>(null);
  const [data2, setData2] = useState<AvisData | null>(null);
  const [usage1, setUsage1] = useState<UsageData | null>(null);
  const [usage2, setUsage2] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasData = data1 || data2;
  const dualMode = selectedModel === "both" && !!data1 && !!data2;
  // For display, use whichever data is available (data1 preferred for single-model)
  const primaryData = data1 || data2;

  const callOcr = async (images: string[], modelKey: string) => {
    const { data: result, error: fnError } = await supabase.functions.invoke(
      "ocr-avis-imposition",
      { body: { images, model: modelKey } }
    );
    if (fnError) throw fnError;
    if (result?.error) throw new Error(result.error);
    const { _usage, ...ocrData } = result;
    return { ocrData, usage: _usage };
  };

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
    setData1(null);
    setData2(null);
    setUsage1(null);
    setUsage2(null);

    try {
      const images = await pdfToImages(file, setProgressMsg);

      if (selectedModel === "both") {
        setProgressMsg("Analyse par Haiku 4.5…");
        const r1 = await callOcr(images, "haiku-4.5");
        setData1(r1.ocrData);
        setUsage1(r1.usage);

        setProgressMsg("Analyse par Sonnet 4…");
        const r2 = await callOcr(images, "sonnet-4");
        setData2(r2.ocrData);
        setUsage2(r2.usage);
      } else if (selectedModel === "haiku-4.5") {
        setProgressMsg("Analyse par Haiku 4.5…");
        const r = await callOcr(images, "haiku-4.5");
        setData1(r.ocrData);
        setUsage1(r.usage);
      } else {
        setProgressMsg("Analyse par Sonnet 4…");
        const r = await callOcr(images, "sonnet-4");
        setData2(r.ocrData);
        setUsage2(r.usage);
      }

      toast.success("Analyse terminée !");
    } catch (err: any) {
      console.error("OCR error:", err);
      setError(err.message || "Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoading(false);
      setProgressMsg("");
    }
  }, [selectedModel]);

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

  const copyJson = useCallback(() => {
    const payload: any = {};
    if (data1) payload["haiku-4.5"] = data1;
    if (data2) payload["sonnet-4"] = data2;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("JSON copié dans le presse-papier");
  }, [data1, data2]);

  const reset = () => {
    setData1(null);
    setData2(null);
    setUsage1(null);
    setUsage2(null);
    setError(null);
  };

  // Helper to get value from either dataset
  const getVal = (accessor: (d: AvisData) => number | null | undefined) => {
    const v1 = data1 ? accessor(data1) : undefined;
    const v2 = data2 ? accessor(data2) : undefined;
    return { v1, v2 };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Model selector */}
      {!hasData && !loading && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Choix du modèle
            </h3>
            <div className="flex gap-3">
              {(["haiku-4.5", "haiku-3.5", "both"] as ModelKey[]).map((key) => (
                <Button
                  key={key}
                  variant={selectedModel === key ? "default" : "outline"}
                  onClick={() => setSelectedModel(key)}
                  className="flex-1"
                >
                  {key === "both" ? "Les deux (comparaison)" : MODEL_LABELS[key]}
                  {key !== "both" && (
                    <span className="ml-2 text-xs opacity-70">
                      {key === "haiku-4.5" ? "$0.80/$4.00" : "$0.25/$1.25"}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload zone */}
      {!hasData && !loading && (
        <Card>
          <CardContent className="p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => document.getElementById("pdf-input")?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Déposez votre avis d'imposition</h3>
              <p className="text-sm text-muted-foreground mb-4">Glissez-déposez votre PDF ici ou cliquez pour parcourir</p>
              <p className="text-xs text-muted-foreground">PDF uniquement • 8 pages max • 20 Mo max</p>
              <input id="pdf-input" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="hidden" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-foreground font-medium">{progressMsg}</p>
            <p className="text-xs text-muted-foreground mt-2">Cette opération peut prendre quelques secondes</p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-destructive" />
            <p className="text-foreground font-medium mb-4">{error}</p>
            <Button onClick={() => { setError(null); }} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {hasData && primaryData && (
        <>
          {/* Action bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {primaryData.meta.confidence && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  primaryData.meta.confidence === "high" ? "bg-success/10 text-success"
                    : primaryData.meta.confidence === "medium" ? "bg-accent/10 text-accent"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  Confiance : {primaryData.meta.confidence}
                </span>
              )}
              {dualMode && <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full font-medium">Mode comparaison</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyJson}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copier JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Nouveau
              </Button>
            </div>
          </div>

          {/* Usage comparison */}
          {(usage1 || usage2) && (
            <Card className="bg-muted/30 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Consommation API</span>
                </div>
                <div className={`flex ${dualMode ? "gap-8" : ""}`}>
                  {usage1 && <UsageCard usage={usage1} label={dualMode ? "Haiku 4.5" : undefined} />}
                  {dualMode && <div className="w-px bg-border" />}
                  {usage2 && <UsageCard usage={usage2} label={dualMode ? "Haiku 3.5" : undefined} />}
                </div>
                {dualMode && usage1 && usage2 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Économie Haiku 3.5 :</span>
                      <span className="font-bold text-success">
                        {((1 - usage2.cost_total_usd / usage1.cost_total_usd) * 100).toFixed(0)}% moins cher
                      </span>
                      <span className="text-muted-foreground">
                        ({usage1.cost_total_usd.toFixed(4)}$ → {usage2.cost_total_usd.toFixed(4)}$)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Solde banner */}
          {(() => {
            const solde = primaryData.prelevement_source?.solde_a_payer_ou_rembourser;
            if (solde != null && solde < 0) {
              return (
                <div className="rounded-xl p-4 bg-success/10 border border-success/30 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  <p className="text-sm font-semibold text-success">Remboursement : {fmt(Math.abs(solde))}</p>
                </div>
              );
            }
            if (solde != null && solde > 0) {
              return (
                <div className="rounded-xl p-4 bg-primary/10 border border-primary/30 flex items-center gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm font-semibold text-primary">Solde à régler : {fmt(solde)}</p>
                </div>
              );
            }
            return null;
          })()}

          {/* Tabs */}
          <Tabs defaultValue="data">
            <TabsList className="w-full">
              <TabsTrigger value="data" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" /> Mes données fiscales
              </TabsTrigger>
              <TabsTrigger value="explain" className="flex-1">
                <Lightbulb className="h-4 w-4 mr-2" /> Comprendre mon avis
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Data */}
            <TabsContent value="data" className="space-y-4 mt-4">
              {/* Identité */}
              <CollapsibleSection icon={<User className="h-5 w-5 text-primary" />} title="Identité & foyer" defaultOpen>
                <ColumnHeaders dualMode={dualMode} />
                <div className="space-y-1">
                  <DualDataRow dualMode={dualMode} label="Nom"
                    value1={data1 ? `${data1.contribuable.prenom} ${data1.contribuable.nom}` : "—"}
                    value2={data2 ? `${data2.contribuable.prenom} ${data2.contribuable.nom}` : undefined}
                  />
                  <DualDataRow dualMode={dualMode} label="N° fiscal"
                    value1={data1?.contribuable.numero_fiscal || "—"}
                    value2={data2?.contribuable.numero_fiscal || undefined}
                  />
                  <DualDataRow dualMode={dualMode} label="Situation familiale"
                    value1={data1?.contribuable.situation_familiale || "—"}
                    value2={data2?.contribuable.situation_familiale || undefined}
                  />
                  <DualDataRow dualMode={dualMode} label="Nombre de parts"
                    value1={data1?.contribuable.nombre_parts?.toString() || "—"}
                    value2={data2?.contribuable.nombre_parts?.toString() || undefined}
                    highlight
                  />
                </div>
              </CollapsibleSection>

              {/* Revenus */}
              <CollapsibleSection icon={<Wallet className="h-5 w-5 text-success" />} title="Revenus déclarés" defaultOpen>
                <ColumnHeaders dualMode={dualMode} />
                <div className="space-y-1">
                  {Object.entries(REVENUE_LABELS).map(([key, label]) => {
                    const { v1, v2 } = getVal(d => d.revenus[key]);
                    if (v1 == null && v2 == null) return null;
                    const isRfr = key === "revenu_fiscal_reference";
                    return (
                      <DualDataRow key={key} dualMode={dualMode} label={label}
                        value1={fmt(v1)} value2={dualMode ? fmt(v2) : undefined} highlight={isRfr}
                      />
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* Calcul impôt */}
              <CollapsibleSection icon={<Calculator className="h-5 w-5 text-secondary" />} title="Calcul de l'impôt" defaultOpen>
                {!dualMode && (
                  <div className="space-y-0">
                    {primaryData.revenus.revenu_net_imposable != null && (
                      <WaterfallStep label="Revenu net imposable" value={fmt(primaryData.revenus.revenu_net_imposable)} />
                    )}
                    {primaryData.impot.impot_brut_progressif != null && (
                      <WaterfallStep label="Impôt brut (barème)" value={fmt(primaryData.impot.impot_brut_progressif)} />
                    )}
                    {primaryData.impot.reductions_impot != null && (
                      <WaterfallStep label="Réductions d'impôt" value={`- ${fmt(primaryData.impot.reductions_impot)}`} isPositive />
                    )}
                    {primaryData.impot.credits_impot != null && (
                      <WaterfallStep label="Crédits d'impôt" value={`- ${fmt(primaryData.impot.credits_impot)}`} isPositive />
                    )}
                    {primaryData.impot.impot_net_total != null && (
                      <WaterfallStep label="Impôt net total" value={fmt(primaryData.impot.impot_net_total)} isLast />
                    )}
                  </div>
                )}

                <ColumnHeaders dualMode={dualMode} />
                <div className="space-y-1 mt-2">
                  {Object.entries(TAX_LABELS).map(([key, label]) => {
                    const { v1, v2 } = getVal(d => d.impot[key]);
                    if (v1 == null && v2 == null) return null;
                    return (
                      <DualDataRow key={key} dualMode={dualMode} label={label}
                        value1={fmt(v1)} value2={dualMode ? fmt(v2) : undefined}
                      />
                    );
                  })}
                </div>

                {/* TMI vs Taux moyen */}
                {(primaryData.impot.taux_marginal_imposition_pct != null || primaryData.impot.taux_moyen_imposition_pct != null) && (
                  <div className="mt-4">
                    <ColumnHeaders dualMode={dualMode} />
                    <DualDataRow dualMode={dualMode} label="Taux marginal (TMI)"
                      value1={pct(data1?.impot.taux_marginal_imposition_pct)}
                      value2={dualMode ? pct(data2?.impot.taux_marginal_imposition_pct) : undefined}
                      highlight
                    />
                    <DualDataRow dualMode={dualMode} label="Taux moyen réel"
                      value1={pct(data1?.impot.taux_moyen_imposition_pct)}
                      value2={dualMode ? pct(data2?.impot.taux_moyen_imposition_pct) : undefined}
                    />
                  </div>
                )}
              </CollapsibleSection>

              {/* PAS */}
              <CollapsibleSection icon={<FileText className="h-5 w-5 text-accent" />} title="Prélèvement à la source">
                <ColumnHeaders dualMode={dualMode} />
                <div className="space-y-1">
                  <DualDataRow dualMode={dualMode} label="Taux PAS"
                    value1={pct(data1?.prelevement_source.taux_pas_pct ?? data2?.prelevement_source.taux_pas_pct)}
                    value2={dualMode ? pct(data2?.prelevement_source.taux_pas_pct) : undefined}
                  />
                  <DualDataRow dualMode={dualMode} label="Montant prélevé"
                    value1={fmt(data1?.prelevement_source.montant_preleve_annee_n ?? data2?.prelevement_source.montant_preleve_annee_n)}
                    value2={dualMode ? fmt(data2?.prelevement_source.montant_preleve_annee_n) : undefined}
                  />
                  <DualDataRow dualMode={dualMode} label="Solde"
                    value1={fmt(data1?.prelevement_source.solde_a_payer_ou_rembourser ?? data2?.prelevement_source.solde_a_payer_ou_rembourser)}
                    value2={dualMode ? fmt(data2?.prelevement_source.solde_a_payer_ou_rembourser) : undefined}
                    highlight
                  />
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* Tab 2: Pédagogique */}
            <TabsContent value="explain" className="space-y-4 mt-4">
              {(data1?.explications_pedagogiques.introduction || data2?.explications_pedagogiques.introduction) && (
                <PedagogicalCard dualMode={dualMode}
                  icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  title="Qu'est-ce qu'un avis d'imposition ?"
                  text={data1?.explications_pedagogiques.introduction || data2?.explications_pedagogiques.introduction || ""}
                  text2={data2?.explications_pedagogiques.introduction}
                />
              )}
              {(data1?.explications_pedagogiques.revenu_fiscal_reference_explication || data2?.explications_pedagogiques.revenu_fiscal_reference_explication) && (
                <PedagogicalCard dualMode={dualMode}
                  icon={<BarChart3 className="h-5 w-5 text-accent" />}
                  title="Le revenu fiscal de référence (RFR)"
                  text={data1?.explications_pedagogiques.revenu_fiscal_reference_explication || data2?.explications_pedagogiques.revenu_fiscal_reference_explication || ""}
                  text2={data2?.explications_pedagogiques.revenu_fiscal_reference_explication}
                  variant="tip"
                />
              )}
              {(data1?.explications_pedagogiques.taux_marginal_explication || data2?.explications_pedagogiques.taux_marginal_explication) && (
                <PedagogicalCard dualMode={dualMode}
                  icon={<BarChart3 className="h-5 w-5 text-secondary" />}
                  title="Le taux marginal d'imposition (TMI)"
                  text={data1?.explications_pedagogiques.taux_marginal_explication || data2?.explications_pedagogiques.taux_marginal_explication || ""}
                  text2={data2?.explications_pedagogiques.taux_marginal_explication}
                />
              )}
              {(data1?.explications_pedagogiques.quotient_familial_explication || data2?.explications_pedagogiques.quotient_familial_explication) && (
                <PedagogicalCard dualMode={dualMode}
                  icon={<User className="h-5 w-5 text-primary" />}
                  title="Le quotient familial"
                  text={data1?.explications_pedagogiques.quotient_familial_explication || data2?.explications_pedagogiques.quotient_familial_explication || ""}
                  text2={data2?.explications_pedagogiques.quotient_familial_explication}
                />
              )}
              {(data1?.explications_pedagogiques.prelevement_source_explication || data2?.explications_pedagogiques.prelevement_source_explication) && (
                <PedagogicalCard dualMode={dualMode}
                  icon={<Wallet className="h-5 w-5 text-primary" />}
                  title="Le prélèvement à la source"
                  text={data1?.explications_pedagogiques.prelevement_source_explication || data2?.explications_pedagogiques.prelevement_source_explication || ""}
                  text2={data2?.explications_pedagogiques.prelevement_source_explication}
                />
              )}

              {/* Conseils d'optimisation - dual */}
              {(() => {
                const c1 = data1?.explications_pedagogiques.conseils_optimisation || [];
                const c2 = data2?.explications_pedagogiques.conseils_optimisation || [];
                if (c1.length === 0 && c2.length === 0) return null;

                if (dualMode) {
                  return (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-accent" /> Pistes d'optimisation
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Haiku 4.5</span>
                          {c1.map((c, i) => (
                            <Card key={i}><CardContent className="p-3"><p className="text-sm text-muted-foreground">💡 {c}</p></CardContent></Card>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Haiku 3.5</span>
                          {c2.map((c, i) => (
                            <Card key={i}><CardContent className="p-3"><p className="text-sm text-muted-foreground">💡 {c}</p></CardContent></Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                const list = c1.length > 0 ? c1 : c2;
                return (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-accent" /> Pistes d'optimisation
                    </h3>
                    {list.map((c, i) => (
                      <Card key={i}><CardContent className="p-4 flex items-start gap-3"><span className="text-lg">💡</span><p className="text-sm text-muted-foreground">{c}</p></CardContent></Card>
                    ))}
                  </div>
                );
              })()}

              {/* Points d'attention - dual */}
              {(() => {
                const p1 = data1?.explications_pedagogiques.points_attention || [];
                const p2 = data2?.explications_pedagogiques.points_attention || [];
                if (p1.length === 0 && p2.length === 0) return null;

                if (dualMode) {
                  return (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Points d'attention
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Haiku 4.5</span>
                          {p1.map((p, i) => (
                            <Card key={i} className="border-l-4 border-l-destructive">
                              <CardContent className="p-3"><p className="text-sm text-muted-foreground">⚠️ {p}</p></CardContent>
                            </Card>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Haiku 3.5</span>
                          {p2.map((p, i) => (
                            <Card key={i} className="border-l-4 border-l-destructive">
                              <CardContent className="p-3"><p className="text-sm text-muted-foreground">⚠️ {p}</p></CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                const list = p1.length > 0 ? p1 : p2;
                return (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Points d'attention
                    </h3>
                    {list.map((p, i) => (
                      <PedagogicalCard key={i} dualMode={false}
                        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
                        title={`Alerte ${i + 1}`} text={p} variant="warning"
                      />
                    ))}
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center px-4 py-3 bg-muted/30 rounded-xl">
            Ces informations sont extraites automatiquement. MyFinCare ne fournit pas de conseil fiscal — rapprochez-vous d'un conseiller.
          </p>
        </>
      )}
    </div>
  );
};

export default OcrAvisImposition;
