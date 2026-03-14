import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PayslipData } from "@/types/payslip";

const SUPABASE_FUNCTION_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ocr-bulletin-paie`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UsePayslipAnalysisReturn {
  /** Full analysis data from the single Claude call */
  analysisData: PayslipData | null;
  /** Analysis ID in DB (if persisted) */
  analysisId: string | null;
  /** Loading state */
  loading: boolean;
  /** Current progress message */
  progress: string;
  /** Error message */
  error: string | null;
  /** PDF page images (base64) for re-display */
  pdfImages: string[];
  /** Run the analysis on a PDF file */
  analyze: (file: File) => Promise<void>;
  /** Reset all state */
  reset: () => void;
}

/**
 * Hook for payslip analysis — 1 single Claude call, persists to DB.
 * Frontend then filters for Simple vs Advanced views.
 */
export function usePayslipAnalysis(): UsePayslipAnalysisReturn {
  const [analysisData, setAnalysisData] = useState<PayslipData | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pdfImages, setPdfImages] = useState<string[]>([]);

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

  const analyze = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    setAnalysisData(null);
    setAnalysisId(null);

    try {
      // 1. Convert PDF to images
      const images = await convertPdfToImages(file);
      setPdfImages(images);

      // 2. Single API call — complete extraction
      setProgress("Analyse complète en cours…");
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          images: images.map(img => img.split(",")[1]),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      const result: PayslipData = await res.json();
      setAnalysisData(result);

      // 3. Persist to DB (best effort — don't block UI)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: inserted } = await supabase
            .from("payslip_analyses" as any)
            .insert({
              user_id: user.id,
              analysis_data: result as any,
              has_equity: result._meta?.has_equity || false,
              periode_mois: result.periode?.mois,
              periode_annee: result.periode?.annee,
              net_paye: result.net?.net_paye,
            })
            .select("id")
            .single();
          if (inserted) {
            setAnalysisId((inserted as any).id);
          }
        }
      } catch (dbErr) {
        console.warn("Could not persist analysis to DB:", dbErr);
      }

      setProgress("");
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [convertPdfToImages]);

  const reset = useCallback(() => {
    setAnalysisData(null);
    setAnalysisId(null);
    setLoading(false);
    setProgress("");
    setError(null);
    setPdfImages([]);
  }, []);

  return {
    analysisData,
    analysisId,
    loading,
    progress,
    error,
    pdfImages,
    analyze,
    reset,
  };
}
