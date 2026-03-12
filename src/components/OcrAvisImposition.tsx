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
  Download,
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

const DataRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
      highlight
        ? "bg-accent/10 border border-accent/30"
        : "hover:bg-muted/50"
    }`}
  >
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${highlight ? "text-accent" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

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
        isLast
          ? "bg-primary/10 border-primary/30"
          : "bg-card border-border"
      }`}
    >
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          isPositive === true
            ? "text-success"
            : isPositive === false
            ? "text-destructive"
            : "text-foreground"
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
  variant = "info",
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  variant?: "info" | "tip" | "warning";
}) => {
  const borderColor =
    variant === "warning"
      ? "border-l-destructive"
      : variant === "tip"
      ? "border-l-accent"
      : "border-l-primary";

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
            <span className="font-semibold text-foreground text-sm uppercase tracking-wider">
              {title}
            </span>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1 pl-1 pr-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OcrAvisImposition = () => {
  const [data, setData] = useState<AvisData | null>(null);
  const [rawJson, setRawJson] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

    try {
      const images = await pdfToImages(file, setProgressMsg);

      setProgressMsg("Analyse en cours par l'IA…");

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "ocr-avis-imposition",
        { body: { images } }
      );

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      setData(result);
      setRawJson(JSON.stringify(result, null, 2));
      toast.success("Analyse terminée !");
    } catch (err: any) {
      console.error("OCR error:", err);
      setError(
        err.message || "Une erreur est survenue lors de l'analyse. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
      setProgressMsg("");
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

  const copyJson = useCallback(() => {
    navigator.clipboard.writeText(rawJson);
    toast.success("JSON copié dans le presse-papier");
  }, [rawJson]);

  const downloadPdf = useCallback(() => {
    console.log("PDF download placeholder — raw data:", rawJson);
    toast.info("Fonctionnalité de téléchargement PDF à venir");
  }, [rawJson]);

  // Solde banner
  const solde = data?.prelevement_source?.solde_a_payer_ou_rembourser;
  const isRefund = solde != null && solde < 0;
  const isDue = solde != null && solde > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload zone */}
      {!data && !loading && (
        <Card>
          <CardContent className="p-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => document.getElementById("pdf-input")?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Déposez votre avis d'imposition
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Glissez-déposez votre PDF ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-muted-foreground">
                PDF uniquement • 8 pages max • 20 Mo max
              </p>
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
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-foreground font-medium">{progressMsg}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Cette opération peut prendre quelques secondes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-destructive" />
            <p className="text-foreground font-medium mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                document.getElementById("pdf-input")?.click();
              }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Solde banner */}
          {isRefund && (
            <div className="rounded-xl p-4 bg-success/10 border border-success/30 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
              <p className="text-sm font-semibold text-success">
                Vous avez droit à un remboursement de {fmt(Math.abs(solde!))}
              </p>
            </div>
          )}
          {isDue && (
            <div className="rounded-xl p-4 bg-primary/10 border border-primary/30 flex items-center gap-3">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm font-semibold text-primary">
                Vous avez un solde à régler de {fmt(solde!)}
              </p>
            </div>
          )}

          {/* Confidence badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  data.meta.confidence === "high"
                    ? "bg-success/10 text-success"
                    : data.meta.confidence === "medium"
                    ? "bg-accent/10 text-accent"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                Confiance : {data.meta.confidence}
              </span>
              {data.meta.type_document && (
                <span className="text-xs text-muted-foreground">
                  {data.meta.type_document.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyJson}>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copier JSON
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPdf}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                PDF résumé
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setData(null);
                  setRawJson("");
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Nouveau
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="data">
            <TabsList className="w-full">
              <TabsTrigger value="data" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" />
                Mes données fiscales
              </TabsTrigger>
              <TabsTrigger value="explain" className="flex-1">
                <Lightbulb className="h-4 w-4 mr-2" />
                Comprendre mon avis
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Structured Data */}
            <TabsContent value="data" className="space-y-4 mt-4">
              {/* Identité */}
              <CollapsibleSection
                icon={<User className="h-5 w-5 text-primary" />}
                title="Identité & foyer"
                defaultOpen
              >
                <div className="space-y-1">
                  <DataRow
                    label="Nom"
                    value={`${data.contribuable.prenom} ${data.contribuable.nom}`}
                  />
                  <DataRow label="Adresse" value={data.contribuable.adresse_complete || "—"} />
                  <DataRow label="N° fiscal" value={data.contribuable.numero_fiscal || "—"} />
                  <DataRow label="Réf. avis" value={data.contribuable.reference_avis || "—"} />
                  <DataRow
                    label="Situation familiale"
                    value={data.contribuable.situation_familiale || "—"}
                  />
                  <DataRow
                    label="Nombre de parts"
                    value={data.contribuable.nombre_parts?.toString() || "—"}
                    highlight
                  />
                  {data.annees.annee_revenus && (
                    <DataRow
                      label="Revenus de"
                      value={data.annees.annee_revenus.toString()}
                    />
                  )}
                </div>
              </CollapsibleSection>

              {/* Revenus */}
              <CollapsibleSection
                icon={<Wallet className="h-5 w-5 text-success" />}
                title="Revenus déclarés"
                defaultOpen
              >
                <div className="space-y-1">
                  {Object.entries(REVENUE_LABELS).map(([key, label]) => {
                    const val = data.revenus[key];
                    if (val == null) return null;
                    const isRfr = key === "revenu_fiscal_reference";
                    return (
                      <DataRow key={key} label={label} value={fmt(val)} highlight={isRfr} />
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* Calcul de l'impôt — waterfall */}
              <CollapsibleSection
                icon={<Calculator className="h-5 w-5 text-secondary" />}
                title="Calcul de l'impôt"
                defaultOpen
              >
                <div className="space-y-0">
                  {data.revenus.revenu_net_imposable != null && (
                    <WaterfallStep
                      label="Revenu net imposable"
                      value={fmt(data.revenus.revenu_net_imposable)}
                    />
                  )}
                  {data.impot.impot_brut_progressif != null && (
                    <WaterfallStep
                      label="Impôt brut (barème)"
                      value={fmt(data.impot.impot_brut_progressif)}
                    />
                  )}
                  {data.impot.reductions_impot != null && (
                    <WaterfallStep
                      label="Réductions d'impôt"
                      value={`- ${fmt(data.impot.reductions_impot)}`}
                      isPositive
                    />
                  )}
                  {data.impot.credits_impot != null && (
                    <WaterfallStep
                      label="Crédits d'impôt"
                      value={`- ${fmt(data.impot.credits_impot)}`}
                      isPositive
                    />
                  )}
                  {data.impot.impot_net_total != null && (
                    <WaterfallStep
                      label="Impôt net total"
                      value={fmt(data.impot.impot_net_total)}
                      isLast
                    />
                  )}
                </div>

                {/* TMI vs Taux moyen */}
                {(data.impot.taux_marginal_imposition_pct != null ||
                  data.impot.taux_moyen_imposition_pct != null) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <Card className="border-l-4 border-l-secondary">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Taux marginal (TMI)
                        </p>
                        <p className="text-2xl font-bold text-secondary">
                          {pct(data.impot.taux_marginal_imposition_pct)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          S'applique à la dernière tranche
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Taux moyen réel
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {pct(data.impot.taux_moyen_imposition_pct)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Impôt ÷ revenu imposable
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Other tax lines */}
                <div className="space-y-1 mt-3">
                  {Object.entries(TAX_LABELS).map(([key, label]) => {
                    const val = data.impot[key];
                    if (val == null) return null;
                    return <DataRow key={key} label={label} value={fmt(val)} />;
                  })}
                </div>
              </CollapsibleSection>

              {/* Prélèvement à la source */}
              <CollapsibleSection
                icon={<FileText className="h-5 w-5 text-accent" />}
                title="Prélèvement à la source"
              >
                <div className="space-y-1">
                  <DataRow
                    label="Taux PAS"
                    value={pct(data.prelevement_source.taux_pas_pct)}
                  />
                  <DataRow
                    label="Montant prélevé sur l'année"
                    value={fmt(data.prelevement_source.montant_preleve_annee_n)}
                  />
                  <DataRow
                    label="Solde (à payer / à rembourser)"
                    value={fmt(data.prelevement_source.solde_a_payer_ou_rembourser)}
                    highlight
                  />
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* Tab 2: Pedagogical */}
            <TabsContent value="explain" className="space-y-4 mt-4">
              {data.explications_pedagogiques.introduction && (
                <PedagogicalCard
                  icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  title="Qu'est-ce qu'un avis d'imposition ?"
                  text={data.explications_pedagogiques.introduction}
                />
              )}

              {data.explications_pedagogiques.revenu_fiscal_reference_explication && (
                <PedagogicalCard
                  icon={<BarChart3 className="h-5 w-5 text-accent" />}
                  title="Le revenu fiscal de référence (RFR)"
                  text={data.explications_pedagogiques.revenu_fiscal_reference_explication}
                  variant="tip"
                />
              )}

              {data.explications_pedagogiques.taux_marginal_explication && (
                <PedagogicalCard
                  icon={<BarChart3 className="h-5 w-5 text-secondary" />}
                  title="Le taux marginal d'imposition (TMI)"
                  text={data.explications_pedagogiques.taux_marginal_explication}
                />
              )}

              {data.explications_pedagogiques.taux_moyen_explication && (
                <PedagogicalCard
                  icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  title="Le taux moyen d'imposition"
                  text={data.explications_pedagogiques.taux_moyen_explication}
                />
              )}

              {data.explications_pedagogiques.quotient_familial_explication && (
                <PedagogicalCard
                  icon={<User className="h-5 w-5 text-primary" />}
                  title="Le quotient familial"
                  text={data.explications_pedagogiques.quotient_familial_explication}
                />
              )}

              {data.explications_pedagogiques.abattement_10_pct_explication && (
                <PedagogicalCard
                  icon={<Calculator className="h-5 w-5 text-primary" />}
                  title="L'abattement de 10 % sur les salaires"
                  text={data.explications_pedagogiques.abattement_10_pct_explication}
                />
              )}

              {data.explications_pedagogiques.prelevement_source_explication && (
                <PedagogicalCard
                  icon={<Wallet className="h-5 w-5 text-primary" />}
                  title="Le prélèvement à la source"
                  text={data.explications_pedagogiques.prelevement_source_explication}
                />
              )}

              {/* Lignes inhabituelles */}
              {data.explications_pedagogiques.lignes_inhabituelles?.length > 0 && (
                <Card className="border-accent/30 bg-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-accent">
                      <AlertTriangle className="h-4 w-4" />
                      Ce qui est particulier dans votre avis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.explications_pedagogiques.lignes_inhabituelles.map(
                      (line, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          • {line}
                        </p>
                      )
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Conseils d'optimisation */}
              {data.explications_pedagogiques.conseils_optimisation?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-accent" />
                    Pistes d'optimisation
                  </h3>
                  {data.explications_pedagogiques.conseils_optimisation.map(
                    (conseil, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="text-lg">💡</span>
                            <p className="text-sm text-muted-foreground">{conseil}</p>
                          </div>
                          <Button variant="outline" size="sm" className="shrink-0" disabled>
                            En savoir plus
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              )}

              {/* Points d'attention */}
              {data.explications_pedagogiques.points_attention?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Points d'attention
                  </h3>
                  {data.explications_pedagogiques.points_attention.map((point, i) => (
                    <PedagogicalCard
                      key={i}
                      icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
                      title={`Alerte ${i + 1}`}
                      text={point}
                      variant="warning"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center px-4 py-3 bg-muted/30 rounded-xl">
            Ces informations sont extraites automatiquement de votre document. MyFinCare ne
            fournit pas de conseil fiscal — rapprochez-vous d'un conseiller pour toute décision.
          </p>
        </>
      )}
    </div>
  );
};

export default OcrAvisImposition;
