import React, { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen, ChevronRight, Lock, Upload, FileText, Sparkles, Info } from "lucide-react";
import PayslipProgressiveView from "./payslip/PayslipProgressiveView";
import PayslipDetailModal from "./payslip/PayslipDetailModal";
import { PayslipAnalysisOverlay } from "./payslip/PayslipAnalysisOverlay";
import { fmt, fmtShort, safe, getMonthLabel, getPointIcon, getPriorityStyle } from "./payslip/payslipUtils";

const SUPABASE_FUNCTION_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ocr-bulletin-paie`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// fmtShort is now imported from payslipUtils

export default function OcrFicheDePaie() {
  // ─── Step management ─────────────────────────────────
  const [step, setStep] = useState<"question" | "uploading" | "simple_result" | "advanced_loading" | "advanced_result">("question");
  const [hasEquity, setHasEquity] = useState<string>("no");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Data ────────────────────────────────────────────
  const [simpleData, setSimpleData] = useState<any>(null);
  const [advancedData, setAdvancedData] = useState<any>(null);
  const [pdfImages, setPdfImages] = useState<string[]>([]);

  // ─── Modals ──────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  // ─── PDF → Images ───────────────────────────────────
  const convertPdfToImages = useCallback(async (pdfFile: File): Promise<string[]> => {
    setProgress("Chargement de pdf.js…");
    if (!(window as any).__pdfjsLib3) {
      const existing = (window as any).pdfjsLib;
      delete (window as any).pdfjsLib;
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
          (window as any).__pdfjsLib3 = (window as any).pdfjsLib;
          if (existing) (window as any).pdfjsLib = existing;
          resolve();
        };
        script.onerror = () => reject(new Error("Failed to load pdf.js"));
        document.head.appendChild(script);
      });
    }
    const pdfjsLib = (window as any).__pdfjsLib3;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    setProgress("Lecture du PDF…");
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = Math.min(pdf.numPages, 6);
    const images: string[] = [];
    for (let i = 1; i <= pageCount; i++) {
      setProgress(`Conversion page ${i}/${pageCount}…`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      images.push(canvas.toDataURL("image/jpeg", 0.85));
    }
    return images;
  }, []);

  // ─── API Call ───────────────────────────────────────
  const callAnalysis = useCallback(async (images: string[], mode: "simple" | "advanced") => {
    const res = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        images: images.map(img => img.split(",")[1]),
        mode,
        has_equity: hasEquity === "yes",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erreur ${res.status}`);
    }
    return res.json();
  }, [hasEquity]);

  // ─── Step 1: Simple analysis ────────────────────────
  const [showSimpleOverlay, setShowSimpleOverlay] = useState(false);
  const [showAdvancedOverlay, setShowAdvancedOverlay] = useState(false);
  const [apiDone, setApiDone] = useState<"simple" | "advanced" | null>(null);
  const simpleResultRef = useRef<any>(null);
  const advancedResultRef = useRef<any>(null);

  const analyzeSimple = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStep("uploading");
    setApiDone(null);
    setShowSimpleOverlay(true);
    try {
      const images = await convertPdfToImages(file);
      setPdfImages(images);
      const result = await callAnalysis(images, "simple");
      simpleResultRef.current = result;
      setApiDone("simple");
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
      setStep("question");
      setShowSimpleOverlay(false);
    }
  }, [file, convertPdfToImages, callAnalysis]);

  const handleSimpleOverlayComplete = useCallback(() => {
    setShowSimpleOverlay(false);
    if (simpleResultRef.current) {
      setSimpleData(simpleResultRef.current);
      setStep("simple_result");
    }
  }, []);

  // ─── Step 2: Advanced analysis ──────────────────────
  const analyzeAdvanced = useCallback(async () => {
    if (pdfImages.length === 0) return;
    setError(null);
    setStep("advanced_loading");
    setApiDone(null);
    setShowAdvancedOverlay(true);
    try {
      const result = await callAnalysis(pdfImages, "advanced");
      advancedResultRef.current = result;
      setApiDone("advanced");
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
      setStep("simple_result");
      setShowAdvancedOverlay(false);
    }
  }, [pdfImages, callAnalysis]);

  const handleAdvancedOverlayComplete = useCallback(() => {
    setShowAdvancedOverlay(false);
    if (advancedResultRef.current) {
      setAdvancedData(advancedResultRef.current);
      setStep("advanced_result");
    }
  }, []);

  // ─── Handle CTA click ──────────────────────────────
  const handleAdvancedClick = useCallback(() => {
    // TODO: Check if user is premium
    // For now, directly launch advanced analysis (no paywall)
    // In production: if (user.plan === 'free') setShowPaywall(true); else analyzeAdvanced();
    analyzeAdvanced();
  }, [analyzeAdvanced]);

  // ─── Reset ──────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("question");
    setFile(null);
    setSimpleData(null);
    setAdvancedData(null);
    setPdfImages([]);
    setError(null);
    setHasEquity("no");
  }, []);

  // ─── Drop handlers ─────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // ─── Get active data ───────────────────────────────
  const activeData = advancedData || simpleData;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ═══════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ═══════════════════════════════════════════ */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
            📄 Analyseur de bulletin de paie
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez votre fiche de paie et obtenez une analyse claire en quelques secondes
          </p>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ÉTAPE 1: QUESTION + UPLOAD */}
        {/* ═══════════════════════════════════════════ */}
        {step === "question" && (
          <>
            {/* Equity Question */}
            <Card className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-xl">💼</span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Recevez-vous des actions ou stock-options ?
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    RSU, actions gratuites, ESPP, BSPCE — proposés par certaines entreprises tech et multinationales
                  </p>
                </div>
              </div>

              <RadioGroup
                value={hasEquity}
                onValueChange={setHasEquity}
                className="flex gap-4"
              >
                <label
                  className={`flex-1 flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    hasEquity === "no"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <RadioGroupItem value="no" />
                  <span className="text-sm font-medium">Non</span>
                </label>
                <label
                  className={`flex-1 flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    hasEquity === "yes"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <RadioGroupItem value="yes" />
                  <div>
                    <span className="text-sm font-medium">Oui</span>
                    <span className="text-xs text-muted-foreground ml-1">(RSU, AGA, ESPP…)</span>
                  </div>
                </label>
              </RadioGroup>

              <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Les RSU, actions gratuites et ESPP sont des rémunérations en actions. Si vous n'êtes pas sûr, sélectionnez "Non".
                </span>
              </div>
            </Card>

            {/* Upload Zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                  : "border-border hover:border-muted-foreground/50 bg-card"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
              />
              {file ? (
                <div className="space-y-1">
                  <FileText className="h-8 w-8 mx-auto text-green-600 dark:text-green-400" />
                  <div className="text-sm font-semibold text-foreground">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} Ko</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="text-sm font-semibold text-foreground">Glissez votre bulletin de paie ici</div>
                  <div className="text-xs text-muted-foreground">ou cliquez pour sélectionner un PDF</div>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            {file && (
              <Button
                onClick={analyzeSimple}
                className="w-full py-5 text-base font-bold"
                size="lg"
              >
                🔍 Analyser mon bulletin de paie
              </Button>
            )}

            {/* Error */}
            {error && (
              <Card className="p-4 border-destructive bg-destructive/5">
                <div className="text-sm font-semibold text-destructive">❌ Erreur</div>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                <Button variant="destructive" size="sm" className="mt-2" onClick={() => setError(null)}>
                  Réessayer
                </Button>
              </Card>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ANALYSIS OVERLAYS */}
        {/* ═══════════════════════════════════════════ */}
        <PayslipAnalysisOverlay
          isAnalyzing={showSimpleOverlay}
          apiDone={apiDone === "simple"}
          onComplete={handleSimpleOverlayComplete}
          mode="simple"
          hasEquity={hasEquity === "yes"}
        />
        <PayslipAnalysisOverlay
          isAnalyzing={showAdvancedOverlay}
          apiDone={apiDone === "advanced"}
          onComplete={handleAdvancedOverlayComplete}
          mode="advanced"
          hasEquity={hasEquity === "yes"}
        />

        {/* ═══════════════════════════════════════════ */}
        {/* RÉSULTAT SIMPLE (1.5 écrans max) */}
        {/* ═══════════════════════════════════════════ */}
        {step === "simple_result" && simpleData && (
          <SimpleResultView
            data={simpleData}
            onAdvancedClick={handleAdvancedClick}
            onReset={reset}
          />
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* RÉSULTAT AVANCÉ (accordéons) */}
        {/* ═══════════════════════════════════════════ */}
        {step === "advanced_result" && advancedData && (
          <>
            {/* Full detailed view using the new PayslipProgressiveView */}
            <PayslipProgressiveView
              data={advancedData}
              onActionClick={(action) => {
                if (!action.cta_url) setShowPaywall(true);
              }}
            />

            {/* Raw data button */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowRawData(true)}>
                🗂️ Données brutes
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(advancedData, null, 2))}>
                📋 Copier JSON
              </Button>
              <Button variant="outline" size="sm" onClick={reset}>
                🔄 Nouvelle analyse
              </Button>
            </div>

            {/* Usage */}
            {advancedData._usage && (
              <div className="flex gap-3 flex-wrap text-xs text-muted-foreground bg-card rounded-lg border p-3">
                <span>🤖 {advancedData._usage.model}</span>
                <span>📥 {advancedData._usage.input_tokens?.toLocaleString()} in</span>
                <span>📤 {advancedData._usage.output_tokens?.toLocaleString()} out</span>
                <span>💰 ${advancedData._usage.cost_total_usd}</span>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* PAYWALL MODAL */}
        {/* ═══════════════════════════════════════════ */}
        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Analyse avancée — Réservée Premium
              </DialogTitle>
              <DialogDescription>
                L'analyse simple t'a montré l'essentiel. Avec Premium, tu obtiens beaucoup plus.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {[
                "Décomposition détaillée brut → net",
                "Explications de chaque cotisation",
                "Optimisation fiscale personnalisée",
                hasEquity === "yes" && "Stratégie RSU/actions gratuites",
                "Conseils patrimoniaux sur-mesure",
                "Analyse illimitée de toutes tes fiches",
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✅</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="text-center py-4">
              <div className="text-3xl font-extrabold text-foreground">9,90€<span className="text-base font-normal text-muted-foreground">/mois</span></div>
              <p className="text-xs text-muted-foreground mt-1">Satisfait ou remboursé 30 jours</p>
            </div>
            <Button className="w-full" size="lg" onClick={() => { setShowPaywall(false); /* TODO: navigate to upgrade */ }}>
              🚀 Passer à Premium
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowPaywall(false)}>
              ← Retour
            </Button>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════ */}
        {/* RAW DATA MODAL */}
        {/* ═══════════════════════════════════════════ */}
        <Dialog open={showRawData} onOpenChange={setShowRawData}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🗂️ Données brutes</DialogTitle>
              <DialogDescription>JSON complet de l'analyse</DialogDescription>
            </DialogHeader>
            <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
              {JSON.stringify(activeData, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>

        {/* Detail Modals — only used by SimpleResultView now */}
        {modalOpen && (
          <PayslipDetailModal
            open={!!modalOpen}
            onClose={() => setModalOpen(null)}
            modalType={modalOpen}
            data={activeData}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SIMPLE RESULT VIEW — The ultra-simplified 1.5-screen view
// ═══════════════════════════════════════════════════════════
function SimpleResultView({
  data,
  onAdvancedClick,
  onReset,
}: {
  data: any;
  onAdvancedClick: (() => void) | null;
  onReset: () => void;
}) {
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [activePoint, setActivePoint] = useState<any>(null);

  const netPaye = safe(data, "net", "net_paye");
  const brut = safe(data, "remuneration_brute", "total_brut");
  const cotSal = safe(data, "cotisations_salariales", "total_cotisations_salariales");
  const pas = safe(data, "net", "montant_pas");
  const tauxPas = safe(data, "net", "taux_pas_pct");
  const monthLabel = getMonthLabel(data?.periode?.mois, data?.periode?.annee);
  const cotPct = brut && cotSal ? Math.round((cotSal / brut) * 100) : null;

  const points = (data.points_attention || []).sort((a: any, b: any) => a.priorite - b.priorite).slice(0, 3);
  const actions = (data.actions_recommandees || []).sort((a: any, b: any) => a.priorite - b.priorite).slice(0, 2);

  return (
    <div className="space-y-4">
      {/* ─── BLOC 1: HERO ─── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground text-center">
          <div className="text-xs opacity-80 mb-1">{monthLabel}</div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-xs opacity-70">Brut</div>
              <div className="text-lg font-bold">{fmtShort(brut)}</div>
            </div>
            <div className="text-xl opacity-50">→</div>
            <div className="text-center">
              <div className="text-xs opacity-70">Net payé</div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">{fmtShort(netPaye)}</div>
            </div>
          </div>
          {data.periode?.date_paiement && (
            <div className="text-xs opacity-60 mt-2">Versés le {data.periode.date_paiement}</div>
          )}
        </div>
      </Card>

      {/* ─── BLOC 2: DÉCOMPOSITION ─── */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <span>💡</span> Comment j'arrive à ce net payé
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salaire brut</span>
            <span className="font-medium">{fmtShort(brut)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">− Cotisations{cotPct ? ` (${cotPct}%)` : ""}</span>
            <span className="font-medium text-muted-foreground">− {fmtShort(cotSal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">− Impôt (PAS {tauxPas ? `${Math.abs(tauxPas).toFixed(1)}%` : ""})</span>
            <span className="font-medium text-muted-foreground">− {fmtShort(Math.abs(pas || 0))}</span>
          </div>
          <div className="border-t pt-1.5 mt-1.5 flex justify-between items-center">
            <span className="font-bold text-green-700 dark:text-green-400">= Net payé</span>
            <span className="text-xl font-extrabold text-green-700 dark:text-green-400">{fmtShort(netPaye)}</span>
          </div>
        </div>
      </Card>

      {/* ─── BLOC 3: POINTS D'ATTENTION ─── */}
      {points.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <span>⚠️</span>
            {points.length} point{points.length > 1 ? "s" : ""} d'attention
          </h3>
          <div className="space-y-2.5">
            {points.map((point: any) => {
              const style = getPriorityStyle(point.priorite);
              const icon = getPointIcon(point.id);
              return (
                <div key={point.id} className={`flex items-start gap-3 rounded-lg border p-3 ${style.border} ${style.bg}`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground leading-tight">{point.titre}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{point.resume}</p>
                    {point.a_modal && point.explication_detaillee && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-1 text-xs text-primary"
                        onClick={() => { setActivePoint(point); setModalOpen(`point_${point.id}`); }}
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

      {/* ─── BLOC 4: ACTIONS RECOMMANDÉES ─── */}
      {actions.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <span>✅</span> Action{actions.length > 1 ? "s" : ""} recommandée{actions.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-2">
            {actions.map((action: any) => (
              <div key={action.id} className="flex items-start gap-3 rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-200/60 dark:border-green-800/40 p-3">
                <span className="text-base flex-shrink-0 mt-0.5">💡</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{action.texte}</p>
                  {action.cta_label && action.cta_url && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs text-primary"
                      onClick={() => window.open(action.cta_url, "_blank", "noopener")}>
                      {action.cta_label} →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── CTA: ANALYSE AVANCÉE ─── */}
      {onAdvancedClick && (
        <Button onClick={onAdvancedClick} className="w-full py-5 text-sm font-bold" variant="default" size="lg">
          <Sparkles className="h-4 w-4 mr-2" />
          Analyse avancée
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}

      {/* ─── FOOTER ─── */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={onReset}>🔄 Nouvelle analyse</Button>
        {data._usage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <span>💰 ${data._usage.cost_total_usd}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center italic">
        Données extraites automatiquement. En cas de doute, contactez votre service RH.
      </p>

      {/* Modal for point d'attention details */}
      <PayslipDetailModal
        open={!!modalOpen}
        onClose={() => { setModalOpen(null); setActivePoint(null); }}
        modalType={modalOpen}
        data={data}
        activePoint={activePoint}
      />
    </div>
  );
}
