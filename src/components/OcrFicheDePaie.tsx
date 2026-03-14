import React, { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, FileText, Lock, Info } from "lucide-react";
import PayslipSimpleView from "./payslip/PayslipSimpleView";
import PayslipAdvancedView from "./payslip/PayslipAdvancedView";
import { PayslipAnalysisOverlay } from "./payslip/PayslipAnalysisOverlay";
import { usePayslipAnalysis } from "@/hooks/usePayslipAnalysis";

export default function OcrFicheDePaie() {
  // ─── State ─────────────────────────────────
  const [step, setStep] = useState<"upload" | "analyzing" | "simple" | "advanced">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Overlay state ─────────────────────────
  const [showOverlay, setShowOverlay] = useState(false);
  const [apiDone, setApiDone] = useState(false);

  // ─── Hook ──────────────────────────────────
  const {
    analysisData,
    loading,
    error,
    analyze,
    reset: resetHook,
  } = usePayslipAnalysis();

  // ─── Analyze ───────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setStep("analyzing");
    setApiDone(false);
    setShowOverlay(true);

    try {
      await analyze(file);
      setApiDone(true);
    } catch {
      setShowOverlay(false);
      setStep("upload");
    }
  }, [file, analyze]);

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
    setStep("simple"); // Always start with Simple view
  }, []);

  // ─── Upgrade to Advanced ───────────────────
  const handleUpgradeClick = useCallback(() => {
    // TODO: Check premium status. For now, directly show advanced.
    // In production: if (!isPremium) setShowPaywall(true); else setStep("advanced");
    setStep("advanced");
  }, []);

  // ─── Reset ─────────────────────────────────
  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setShowOverlay(false);
    setApiDone(false);
    resetHook();
  }, [resetHook]);

  // ─── Drop handlers ─────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ═══════════ HEADER ═══════════ */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
            📄 Analyseur de bulletin de paie
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez votre fiche de paie et obtenez une analyse claire en quelques secondes
          </p>
        </div>

        {/* ═══════════ UPLOAD STEP ═══════════ */}
        {step === "upload" && (
          <>
            {/* Upload Zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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
                onClick={handleAnalyze}
                className="w-full py-5 text-base font-bold"
                size="lg"
                disabled={loading}
              >
                🔍 Analyser mon bulletin de paie
              </Button>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                L'analyse extrait automatiquement toutes les données de votre bulletin en un seul passage. 
                Coût moyen : ~0,025 $ par analyse (-69% vs l'ancienne architecture).
              </span>
            </div>

            {/* Error */}
            {error && (
              <Card className="p-4 border-destructive bg-destructive/5">
                <div className="text-sm font-semibold text-destructive">❌ Erreur</div>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                <Button variant="destructive" size="sm" className="mt-2" onClick={handleReset}>
                  Réessayer
                </Button>
              </Card>
            )}
          </>
        )}

        {/* ═══════════ OVERLAY ═══════════ */}
        <PayslipAnalysisOverlay
          isAnalyzing={showOverlay}
          apiDone={apiDone}
          onComplete={handleOverlayComplete}
          mode="simple"
          hasEquity={false}
        />

        {/* ═══════════ SIMPLE VIEW ═══════════ */}
        {step === "simple" && analysisData && (
          <PayslipSimpleView
            data={analysisData}
            onUpgradeClick={handleUpgradeClick}
            onReset={handleReset}
          />
        )}

        {/* ═══════════ ADVANCED VIEW ═══════════ */}
        {step === "advanced" && analysisData && (
          <>
            <PayslipAdvancedView
              data={analysisData}
              onReset={handleReset}
            />

            {/* Raw data */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowRawData(true)}>
                🗂️ Données brutes
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(analysisData, null, 2))}>
                📋 Copier JSON
              </Button>
            </div>
          </>
        )}

        {/* ═══════════ PAYWALL MODAL ═══════════ */}
        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Analyse avancée — Réservée Premium
              </DialogTitle>
              <DialogDescription>
                L'analyse simple vous a montré l'essentiel. Avec Premium, vous obtenez beaucoup plus.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {[
                "Décomposition détaillée brut → net",
                "Explications de chaque cotisation",
                "Optimisation fiscale personnalisée",
                "Stratégie RSU/actions gratuites",
                "Conseils patrimoniaux sur-mesure",
                "Analyse illimitée de toutes vos fiches",
              ].map((item, i) => (
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
            <Button className="w-full" size="lg" onClick={() => { setShowPaywall(false); setStep("advanced"); }}>
              🚀 Passer à Premium
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowPaywall(false)}>
              ← Retour
            </Button>
          </DialogContent>
        </Dialog>

        {/* ═══════════ RAW DATA MODAL ═══════════ */}
        <Dialog open={showRawData} onOpenChange={setShowRawData}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🗂️ Données brutes</DialogTitle>
              <DialogDescription>JSON complet de l'analyse</DialogDescription>
            </DialogHeader>
            <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
