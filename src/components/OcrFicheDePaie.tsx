import React, { useState, useCallback, useEffect, useRef } from "react";

const SUPABASE_FUNCTION_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ocr-bulletin-paie`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
};

const fmtPct = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
};

const MONTHS = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// ─── Styles ───────────────────────────────────────────────────────
const colors = {
  primary: "#1e40af",
  violet: "#7c3aed",
  green: "#065f46",
  gold: "#d97706",
  orange: "#ea580c",
  teal: "#0d9488",
  slate: "#475569",
  red: "#dc2626",
  bg: "#f8fafc",
  cardBg: "#ffffff",
  border: "#e2e8f0",
};

const font = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Default prompt ──────────────────────────────────────────
const DEFAULT_PROMPT = `Tu es un expert en droit du travail français, en paie et en fiscalité des salariés. Tu analyses des bulletins de paie français.

Tu dois faire DEUX choses simultanément :
1. Extraire toutes les données de la fiche de paie de façon structurée
2. Expliquer chaque section en langage clair et pédagogique pour un salarié qui ne comprend pas sa fiche de paie

Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.

IMPORTANT — GESTION MULTI-PAGES :
Si le bulletin contient plusieurs pages, utilise TOUJOURS la page qui contient le tableau détaillé complet des cotisations pour extraire les montants.
Ignore les pages de synthèse avec graphiques circulaires ou camemberts — elles sont jolies mais imprécises.

⚠️ CORRECTION CRITIQUE : DISTINCTION ACTIONS GRATUITES vs ÉPARGNE SALARIALE
- Actions gratuites/RSU/ESPP/BSPCE → remuneration_equity (JAMAIS dans epargne_salariale)
- Intéressement/Participation/PEE/PERCO → epargne_salariale

⚠️ CAS 2 — CRÉDIT D'IMPÔT vs DÉDUCTION NORMALE :
- Seul le SIGNE DU MONTANT détermine s'il y a crédit ou déduction, PAS le signe du taux
- montant_pas > 0 → CRÉDIT D'IMPÔT | montant_pas < 0 → DÉDUCTION normale

Structure JSON : salarie, employeur, periode, remuneration_brute, cotisations_salariales, cotisations_patronales, net, conges_rtt, epargne_salariale, remuneration_equity, explications_pedagogiques, points_attention, conseils_optimisation, cas_particuliers_mois (avec credit_impot au lieu de taux_pas_negatif), cumuls_annuels, informations_complementaires.

(Prompt complet identique côté serveur — modifiez ci-dessous pour personnaliser)`;

// ─── Workflow config ──────────────────────────────────────────
const WORKFLOW_CONFIG = {
  model: "claude-haiku-4-5-20251001",
  max_tokens: 16000,
  api_endpoint: "https://api.anthropic.com/v1/messages",
  anthropic_version: "2023-06-01",
  edge_function: "ocr-bulletin-paie",
  pdf_scale: 2.0,
  image_format: "JPEG 85%",
  max_pages: 6,
  json_recovery: true,
  cost_input_per_mtok: 1.0,
  cost_output_per_mtok: 5.0,
};

export default function OcrFicheDePaie() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"data" | "explain" | "raw">("data");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (data) {
      setOpenSections({
        identity: true, waterfall: true, cotisations: true,
        variables: true, epargne: true, equity: true, conges: true,
        cumuls: true, casParticuliers: true, infos: true,
      });
    }
  }, [data]);

  // ─── PDF → Images ───────────────────────────────────────────
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

  // ─── Analyze ────────────────────────────────────────────────
  const analyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const images = await convertPdfToImages(file);
      setProgress("Analyse en cours…");
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          images: images.map(img => img.split(",")[1]),
          ...(customPrompt.trim() ? { custom_prompt: customPrompt.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }
      setProgress("Extraction des données…");
      const result = await res.json();
      setData(result);
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }, [file, convertPdfToImages, customPrompt]);

  // ─── Drop handlers ─────────────────────────────────────────
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

  const copyJson = () => {
    if (data) navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  // ─── Render helpers ─────────────────────────────────────────
  const AccordionSection = ({ id, title, borderColor, icon, children }: {
    id: string; title: string; borderColor: string; icon: string; children: React.ReactNode;
  }) => {
    const isOpen = openSections[id] ?? false;
    return (
      <div style={{ borderLeft: `4px solid ${borderColor}`, borderRadius: 8, background: colors.cardBg, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <button onClick={() => toggleSection(id)} style={{
          width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer", fontFamily: font, fontSize: 15, fontWeight: 600, color: "#1e293b",
        }}>
          <span>{icon} {title}</span>
          <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", fontSize: 12 }}>▼</span>
        </button>
        {isOpen && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
      </div>
    );
  };

  const InfoTooltip = ({ id, text }: { id: string; text: string }) => (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setActiveTooltip(activeTooltip === id ? null : id)} style={{
        background: "none", border: "1px solid " + colors.border, borderRadius: "50%", width: 22, height: 22,
        cursor: "pointer", fontSize: 11, color: colors.primary, fontWeight: 700, lineHeight: "20px",
      }}>ℹ</button>
      {activeTooltip === id && (
        <div style={{
          position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "#1e293b",
          color: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: 13, lineHeight: 1.5, width: 300,
          zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          {text}
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, background: "#1e293b" }} />
        </div>
      )}
    </span>
  );

  const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div style={{
      background: color + "10", border: `1px solid ${color}30`, borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: colors.slate, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const DataRow = ({ label, value, color = "#1e293b" }: { label: string; value: any; color?: string }) => {
    if (value === null || value === undefined) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
        <span style={{ color: colors.slate }}>{label}</span>
        <span style={{ fontWeight: 500, color }}>{typeof value === "number" ? fmt(value) : String(value)}</span>
      </div>
    );
  };

  // Helper to safely get nested values
  const safe = (obj: any, ...keys: string[]): any => {
    let val = obj;
    for (const k of keys) {
      if (val == null) return null;
      val = val[k];
    }
    return val;
  };

  // ─── Tab 1: Ma fiche de paie ───────────────────────────────
  const renderDataTab = () => {
    if (!data) return null;
    const d = data;
    const netPaye = safe(d, "net", "net_paye");
    const brut = safe(d, "remuneration_brute", "total_brut");
    const cotSal = safe(d, "cotisations_salariales", "total_cotisations_salariales");
    const netAvantImpot = safe(d, "net", "net_avant_impot");
    const basePas = safe(d, "net", "base_pas");
    const pas = safe(d, "net", "montant_pas");
    const tauxPas = safe(d, "net", "taux_pas_pct");

    // Congés N-1 solde (new structure)
    const congesN1Solde = safe(d, "conges_rtt", "conges_n_moins_1", "solde");

    return (
      <div>
        {/* Banner */}
        <div style={{
          background: netPaye && netPaye > 3000 ? `linear-gradient(135deg, ${colors.green}, #059669)` : `linear-gradient(135deg, ${colors.primary}, #3b82f6)`,
          color: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 16, fontFamily: font,
        }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            {d.periode?.mois && d.periode?.annee ? `${MONTHS[d.periode.mois] || ""} ${d.periode.annee}` : "Ce mois-ci"}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(netPaye)} nets</div>
          {d.periode?.date_paiement && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Versés le {d.periode.date_paiement}</div>}
        </div>

        {/* Alerts */}
        {tauxPas === 0 && netAvantImpot > 3000 && (
          <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: "#92400e" }}>
            ⚠️ Votre taux PAS est à 0% — vérifiez que c'est intentionnel
          </div>
        )}

        {congesN1Solde != null && congesN1Solde > 5 && (
          <div style={{ background: "#fef2f2", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: "#991b1b" }}>
            ⚠️ Vous avez {congesN1Solde} jours de congés N-1 à solder avant le 31 mai
          </div>
        )}

        {/* Points d'attention */}
        {Array.isArray(d.points_attention) && d.points_attention.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {d.points_attention.map((pt: any, i: number) => (
              <div key={i} style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "10px 14px", marginBottom: 6, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
                {typeof pt === "string" ? pt : pt?.message || JSON.stringify(pt)}
              </div>
            ))}
          </div>
        )}

        {/* Section 1 — Identité */}
        <AccordionSection id="identity" title="Identité & employeur" borderColor={colors.primary} icon="👤">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Salarié</h4>
              {[
                ["Nom", `${d.salarie?.prenom || ""} ${d.salarie?.nom || ""}`],
                ["Emploi", d.salarie?.emploi],
                ["Statut", d.salarie?.statut],
                ["Classification", d.salarie?.classification],
                ["Convention", d.salarie?.convention_collective],
                ["Entrée", d.salarie?.date_entree],
                ["Ancienneté", d.salarie?.anciennete_annees ? `${d.salarie.anciennete_annees} ans` : null],
                ["N° SS", d.salarie?.numero_securite_sociale],
                ["Matricule", d.salarie?.matricule],
              ].map(([label, val], i) => val ? (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.slate }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ) : null)}
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Employeur</h4>
              {[
                ["Raison sociale", d.employeur?.nom],
                ["SIRET", d.employeur?.siret],
                ["Code NAF", d.employeur?.code_naf],
                ["URSSAF", d.employeur?.urssaf],
                ["Adresse", d.employeur?.adresse],
              ].map(([label, val], i) => val ? (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ color: colors.slate }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: "right", maxWidth: 200 }}>{val}</span>
                </div>
              ) : null)}
            </div>
          </div>
        </AccordionSection>

        {/* Section 2 — Waterfall brut → net */}
        <AccordionSection id="waterfall" title="Décomposition brut → net" borderColor={colors.violet} icon="📊">
          <div style={{ background: "#faf5ff", borderRadius: 10, padding: 20 }}>
            {[
              { label: "SALAIRE BRUT", value: brut, color: colors.primary, sign: "" },
              { label: "Cotisations salariales", value: cotSal, color: colors.orange, sign: "−" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px",
                background: i % 2 === 0 ? "#fff" : "transparent", borderRadius: 6, marginBottom: 2,
              }}>
                <span style={{ fontSize: 14, color: "#64748b" }}>{row.label}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: row.color }}>
                  {row.sign} {fmt(row.value)}
                </span>
              </div>
            ))}

            <div style={{ borderTop: `2px dashed ${colors.violet}`, margin: "8px 0", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.violet }}>= NET AVANT IMPÔT</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.violet }}>{fmt(netAvantImpot)}</span>
            </div>

            {basePas != null && basePas !== netAvantImpot && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", fontSize: 13, color: colors.slate }}>
                <span>Base PAS (net imposable)</span>
                <span style={{ fontWeight: 600, color: colors.violet }}>{fmt(basePas)}</span>
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px",
              background: "#fff", borderRadius: 6, marginBottom: 2,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: "#64748b" }}>Prélèvement à la source</span>
                {tauxPas !== null && tauxPas !== undefined && (
                  <span style={{ background: colors.violet + "20", color: colors.violet, fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                    taux {fmtPct(tauxPas)}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: colors.violet }}>− {fmt(pas)}</span>
            </div>

            <div style={{ borderTop: `2px solid ${colors.green}`, margin: "8px 0" }} />

            <div style={{
              background: `linear-gradient(135deg, ${colors.green}15, ${colors.green}08)`, border: `2px solid ${colors.green}40`,
              borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.green }}>= NET PAYÉ</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: colors.green }}>{fmt(netPaye)}</span>
            </div>
          </div>
        </AccordionSection>

        {/* Section 3 — Cotisations */}
        <AccordionSection id="cotisations" title="Détail des cotisations" borderColor={colors.orange} icon="📋">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.orange, marginBottom: 8 }}>Cotisations salariales</h4>
              {d.cotisations_salariales && Object.entries(d.cotisations_salariales)
                .filter(([k, v]) => k !== "total_cotisations_salariales" && k !== "autres_cotisations_salariales" && v !== null && v !== 0)
                .map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.slate }}>{key.replace(/_/g, " ")}</span>
                    <span style={{ fontWeight: 500 }}>{fmt(val as number)}</span>
                  </div>
                ))}
              {/* Autres cotisations salariales (tableau) */}
              {Array.isArray(d.cotisations_salariales?.autres_cotisations_salariales) && d.cotisations_salariales.autres_cotisations_salariales.length > 0 && (
                <>
                  {d.cotisations_salariales.autres_cotisations_salariales.map((item: any, i: number) => (
                    <div key={`acs-${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                      <span style={{ color: colors.slate }}>{item.label || "Autre"}</span>
                      <span style={{ fontWeight: 500 }}>{fmt(item.montant)}</span>
                    </div>
                  ))}
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 700, color: colors.orange }}>
                <span>Total</span><span>{fmt(d.cotisations_salariales?.total_cotisations_salariales)}</span>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>Cotisations patronales</h4>
              {d.cotisations_patronales && Object.entries(d.cotisations_patronales)
                .filter(([k, v]) => k !== "total_cotisations_patronales" && k !== "autres_contributions_patronales" && v !== null && v !== 0)
                .map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.slate }}>{key.replace(/_/g, " ")}</span>
                    <span style={{ fontWeight: 500 }}>{fmt(val as number)}</span>
                  </div>
                ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 700, color: colors.primary }}>
                <span>Total</span><span>{fmt(d.cotisations_patronales?.total_cotisations_patronales)}</span>
              </div>
            </div>
          </div>
          {/* Coût employeur */}
          {d.informations_complementaires?.cout_total_employeur && (
            <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
              <StatCard label="Coût employeur total" value={fmt(d.informations_complementaires.cout_total_employeur)} color={colors.primary} />
            </div>
          )}
        </AccordionSection>

        {/* Section 4 — Variables & primes */}
        <AccordionSection id="variables" title="Éléments variables & primes" borderColor={colors.gold} icon="💰">
          {(() => {
            const items = [
              ["Salaire de base", d.remuneration_brute?.salaire_base],
              ["Heures supplémentaires", d.remuneration_brute?.heures_supplementaires],
              ["Prime ancienneté", d.remuneration_brute?.prime_anciennete],
              ["Prime objectifs", d.remuneration_brute?.prime_objectifs],
              ["Prime exceptionnelle", d.remuneration_brute?.prime_exceptionnelle],
              ["Avantages en nature", d.remuneration_brute?.avantages_en_nature],
              ["Tickets restaurant (part patronale)", d.remuneration_brute?.tickets_restaurant_part_patronale],
            ].filter(([, v]) => v !== null && v !== undefined && v !== 0);
            const extras = d.remuneration_brute?.autres_elements_bruts || [];
            if (items.length === 0 && extras.length === 0) {
              return <div style={{ color: colors.slate, fontSize: 13, fontStyle: "italic" }}>Aucun élément variable ce mois-ci.</div>;
            }
            return (
              <div>
                {items.map(([label, val], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.slate }}>{label as string}</span>
                    <span style={{ fontWeight: 600, color: colors.gold }}>{fmt(val as number)}</span>
                  </div>
                ))}
                {extras.map((item: any, i: number) => (
                  <div key={`extra-${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.slate }}>{typeof item === "string" ? item : item.label || JSON.stringify(item)}</span>
                    <span style={{ fontWeight: 600, color: colors.gold }}>{typeof item === "object" && item.montant ? fmt(item.montant) : ""}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </AccordionSection>

        {/* Section 5 — Épargne salariale */}
        <AccordionSection id="epargne" title="Épargne salariale" borderColor={colors.green} icon="🏦">
          {(() => {
            const ep = d.epargne_salariale;
            const items = [
              ["Intéressement", ep?.interessement],
              ["Participation", ep?.participation],
              ["Versement PEE", ep?.pee_versement],
              ["Versement PERCO", ep?.perco_versement],
              ["Abondement employeur", ep?.abondement_employeur],
            ].filter(([, v]) => v !== null && v !== undefined && v !== 0);
            if (items.length === 0) {
              return (
                <div style={{ background: `${colors.green}08`, border: `1px dashed ${colors.green}40`, borderRadius: 8, padding: 16, fontSize: 13, color: colors.green }}>
                  💡 Votre entreprise propose peut-être un PEE ou PERCO — renseignez-vous auprès des RH.
                </div>
              );
            }
            return items.map(([label, val], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.slate }}>{label as string}</span>
                <span style={{ fontWeight: 600, color: colors.green }}>{fmt(val as number)}</span>
              </div>
            ));
          })()}
        </AccordionSection>

        {/* Section 6 — Rémunération Equity */}
        {d.remuneration_equity && (
          <AccordionSection id="equity" title="Rémunération Equity (actions / RSU / ESPP)" borderColor={colors.violet} icon="📈">
            {/* Actions gratuites */}
            {Array.isArray(d.remuneration_equity.actions_gratuites_acquises) && d.remuneration_equity.actions_gratuites_acquises.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.violet, marginBottom: 8 }}>🎯 Actions gratuites acquises (vesting)</h4>
                {d.remuneration_equity.actions_gratuites_acquises.map((ag: any, i: number) => (
                  <div key={i} style={{ background: colors.violet + "08", border: `1px solid ${colors.violet}20`, borderRadius: 8, padding: 12, marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{ag.nb_actions} actions {ag.societe || ""}</span>
                      <span style={{ fontWeight: 700, color: colors.violet }}>{fmt(ag.valeur_fiscale_totale)}</span>
                    </div>
                    {ag.prix_unitaire && (
                      <div style={{ fontSize: 12, color: colors.slate }}>Prix unitaire : {fmt(ag.prix_unitaire)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* RSU */}
            {d.remuneration_equity.rsu_restricted_stock_units?.gain_brut_total && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.violet, marginBottom: 8 }}>📊 RSU (Restricted Stock Units)</h4>
                <div style={{ background: colors.violet + "08", border: `1px solid ${colors.violet}20`, borderRadius: 8, padding: 12 }}>
                  {(() => {
                    const rsu = d.remuneration_equity.rsu_restricted_stock_units;
                    return (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.violet, marginBottom: 8 }}>
                          Variante : {rsu.variante || "indéterminée"}
                        </div>
                        <DataRow label="Gain brut total" value={rsu.gain_brut_total} color={colors.violet} />
                        <DataRow label="Actions acquises" value={rsu.nb_actions_acquises} />
                        <DataRow label="Actions vendues" value={rsu.nb_actions_vendues} />
                        <DataRow label="Actions conservées" value={rsu.nb_actions_conservees} />
                        <DataRow label="Valeur actions vendues" value={rsu.valeur_actions_vendues} />
                        <DataRow label="Valeur actions conservées" value={rsu.valeur_actions_conservees} />
                        <DataRow label="Reprise RSU" value={rsu.reprise_rsu_et_taxes} color={colors.red} />
                        <DataRow label="Remboursement STC/broker" value={rsu.remboursement_stc_ou_broker} color={colors.green} />
                        <DataRow label="Cotisations supp. estimées" value={rsu.cotisations_supplementaires_estimees} color={colors.orange} />
                        <DataRow label="Impôt supp. estimé" value={rsu.impot_supplementaire_estime} color={colors.orange} />
                        {rsu.mecanisme_description && (
                          <div style={{ marginTop: 8, fontSize: 12, color: colors.slate, lineHeight: 1.6, fontStyle: "italic" }}>
                            💡 {rsu.mecanisme_description}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ESPP */}
            {d.remuneration_equity.espp_employee_stock_purchase_plan?.contribution_mensuelle && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.teal, marginBottom: 8 }}>💳 ESPP (Plan d'achat d'actions)</h4>
                <div style={{ background: colors.teal + "08", border: `1px solid ${colors.teal}20`, borderRadius: 8, padding: 12 }}>
                  <DataRow label="Contribution mensuelle" value={d.remuneration_equity.espp_employee_stock_purchase_plan.contribution_mensuelle} color={colors.teal} />
                  {d.remuneration_equity.espp_employee_stock_purchase_plan.periode && (
                    <DataRow label="Période" value={d.remuneration_equity.espp_employee_stock_purchase_plan.periode} />
                  )}
                </div>
              </div>
            )}

            {/* Avantages en nature compensés */}
            {d.remuneration_equity.avantages_nature_compenses?.total_brut && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.gold, marginBottom: 8 }}>🍽️ Avantages en nature compensés</h4>
                <div style={{ background: colors.gold + "08", border: `1px solid ${colors.gold}20`, borderRadius: 8, padding: 12 }}>
                  <DataRow label="Avantage en nature (BIK)" value={d.remuneration_equity.avantages_nature_compenses.food_bik_benefit_in_kind} color={colors.gold} />
                  <DataRow label="Compensation gross-up" value={d.remuneration_equity.avantages_nature_compenses.gross_up_compensation} color={colors.gold} />
                  <DataRow label="Total brut" value={d.remuneration_equity.avantages_nature_compenses.total_brut} color={colors.gold} />
                </div>
              </div>
            )}
          </AccordionSection>
        )}

        {/* Section 7 — Congés & RTT */}
        <AccordionSection id="conges" title="Congés & RTT" borderColor={colors.teal} icon="🏖️">
          {(() => {
            const c = d.conges_rtt;
            if (!c) return <div style={{ color: colors.slate, fontSize: 13, fontStyle: "italic" }}>Aucune donnée de congés détectée.</div>;

            const renderCongesBlock = (label: string, block: any, max: number) => {
              if (!block) return null;
              const solde = block.solde;
              if (solde == null) return null;
              return (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: colors.slate }}>{label}</span>
                    <span style={{ fontWeight: 600, color: colors.teal }}>{solde} jours</span>
                  </div>
                  {block.acquis != null && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
                      Acquis : {block.acquis} | Pris : {block.pris ?? 0}
                    </div>
                  )}
                  <div style={{ background: colors.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min((solde / max) * 100, 100)}%`, height: "100%", background: colors.teal, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            };

            return (
              <div>
                {renderCongesBlock("Congés payés N-1", c.conges_n_moins_1, 25)}
                {renderCongesBlock("Congés payés N", c.conges_n, 25)}
                {renderCongesBlock("RTT", c.rtt, 12)}
                {c.conges_pris_mois != null && c.conges_pris_mois > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: colors.teal }}>
                    📅 {c.conges_pris_mois} jour(s) de congés pris ce mois-ci
                  </div>
                )}
                {c.rtt_pris_mois != null && c.rtt_pris_mois > 0 && (
                  <div style={{ fontSize: 13, color: colors.teal }}>
                    📅 {c.rtt_pris_mois} jour(s) de RTT pris ce mois-ci
                  </div>
                )}
              </div>
            );
          })()}
        </AccordionSection>

        {/* Section 8 — Cas particuliers */}
        {d.cas_particuliers_mois && (
          <AccordionSection id="casParticuliers" title="Cas particuliers du mois" borderColor={colors.red} icon="⚡">
            {(() => {
              const cas = d.cas_particuliers_mois;
              const detected: { label: string; expl: string }[] = [];
              
              const checks = [
                { key: "taux_pas_zero", label: "Taux PAS à 0%" },
                { key: "credit_impot", label: "Crédit d'impôt" },
                { key: "conge_paternite", label: "Congé paternité" },
                { key: "absence_longue_duree", label: "Absence longue durée" },
                { key: "conges_pris", label: "Congés pris" },
                { key: "prime_exceptionnelle", label: "Prime exceptionnelle" },
                { key: "entree_ou_sortie_mois", label: "Entrée/Sortie en cours de mois" },
                { key: "changement_taux_pas", label: "Changement taux PAS" },
                { key: "actions_gratuites_vesting", label: "Vesting actions gratuites" },
                { key: "rsu_massif", label: "RSU massif" },
              ];

              for (const check of checks) {
                const val = cas[check.key];
                if (val?.detecte) {
                  detected.push({ label: check.label, expl: val.explication || "" });
                }
              }

              if (detected.length === 0) {
                return <div style={{ color: colors.slate, fontSize: 13, fontStyle: "italic" }}>Aucun cas particulier détecté ce mois-ci. ✅</div>;
              }

              return detected.map((item, i) => (
                <div key={i} style={{ background: colors.red + "08", border: `1px solid ${colors.red}20`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.red, marginBottom: 4 }}>⚡ {item.label}</div>
                  {item.expl && <div style={{ fontSize: 13, color: colors.slate, lineHeight: 1.6 }}>{item.expl}</div>}
                </div>
              ));
            })()}
          </AccordionSection>
        )}

        {/* Section 9 — Cumuls annuels */}
        <AccordionSection id="cumuls" title="Cumuls annuels" borderColor={colors.slate} icon="📅">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <StatCard label="Brut cumulé" value={fmt(d.cumuls_annuels?.brut_cumule)} color={colors.primary} />
            <StatCard label="Net imposable cumulé" value={fmt(d.cumuls_annuels?.net_imposable_cumule)} color={colors.violet} />
            <StatCard label="PAS cumulé" value={fmt(d.cumuls_annuels?.pas_cumule)} color={colors.orange} />
          </div>
        </AccordionSection>

        {/* Section 10 — Informations complémentaires */}
        {d.informations_complementaires && (
          <AccordionSection id="infos" title="Informations complémentaires" borderColor={colors.slate} icon="ℹ️">
            <DataRow label="Plafond SS mensuel" value={d.informations_complementaires.plafond_securite_sociale_mensuel} />
            <DataRow label="Plafond SS annuel" value={d.informations_complementaires.plafond_securite_sociale_annuel} />
            <DataRow label="Coût total employeur" value={d.informations_complementaires.cout_total_employeur} color={colors.primary} />
            <DataRow label="Allègements cotisations" value={d.informations_complementaires.allegements_cotisations} />
          </AccordionSection>
        )}

        {/* Conseils d'optimisation */}
        {Array.isArray(d.conseils_optimisation) && d.conseils_optimisation.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {d.conseils_optimisation.map((conseil: any, i: number) => (
              <div key={i} style={{ background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 8, padding: "10px 14px", marginBottom: 6, fontSize: 13, color: "#065f46", lineHeight: 1.6 }}>
                {typeof conseil === "string" ? conseil : conseil?.message || JSON.stringify(conseil)}
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "16px 0", lineHeight: 1.5, fontStyle: "italic" }}>
          Ces informations sont extraites automatiquement. MyFinCare n'est pas un éditeur de logiciel de paie — en cas de doute, contactez votre service RH.
        </div>
      </div>
    );
  };

  // ─── Tab 2: Comprendre ma paie ─────────────────────────────
  const renderExplainTab = () => {
    if (!data) return null;
    const d = data;
    const expl = d.explications_pedagogiques;
    const brut = d.remuneration_brute?.total_brut || 0;
    const netPaye = d.net?.net_paye || 0;
    const cotSal = d.cotisations_salariales?.total_cotisations_salariales || 0;
    const pas = d.net?.montant_pas || 0;
    const total = cotSal + pas + netPaye;

    // Donut segments
    const segments = [
      { label: "Net payé", value: netPaye, color: colors.green },
      { label: "Cotisations", value: cotSal, color: colors.orange },
      { label: "PAS", value: pas, color: colors.violet },
    ];

    const renderDonut = () => {
      if (total === 0) return null;
      let cumulative = 0;
      const size = 180;
      const cx = size / 2;
      const cy = size / 2;
      const r = 70;
      const strokeWidth = 35;

      return (
        <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((seg, i) => {
              const pct = seg.value / total;
              const circumference = 2 * Math.PI * r;
              const dashLength = pct * circumference;
              const dashOffset = -cumulative * circumference;
              cumulative += pct;
              return (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`} strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${cx} ${cy})`} />
              );
            })}
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {segments.map((seg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: seg.color }} />
                <span style={{ color: colors.slate }}>{seg.label}</span>
                <span style={{ fontWeight: 600, marginLeft: "auto" }}>{fmt(seg.value)}</span>
                <span style={{ color: "#94a3b8", fontSize: 11 }}>({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const ExplainCard = ({ title, color, icon, children }: { title: string; color: string; icon: string; children: React.ReactNode }) => (
      <div style={{ background: colors.cardBg, borderRadius: 12, overflow: "hidden", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "#fff", padding: "14px 20px", fontSize: 15, fontWeight: 700 }}>
          {icon} {title}
        </div>
        <div style={{ padding: 20, fontSize: 14, lineHeight: 1.7, color: "#334155" }}>{children}</div>
      </div>
    );

    return (
      <div>
        {/* Card 1 — Résumé brut → net */}
        <ExplainCard title="Résumé de votre paie" color={colors.primary} icon="📄">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: colors.slate }}>Salaire brut</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: colors.primary }}>{fmt(brut)}</div>
            </div>
            <div style={{ fontSize: 28, color: "#94a3b8" }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: colors.slate }}>Net payé</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: colors.green }}>{fmt(netPaye)}</div>
            </div>
          </div>
          {expl?.brut_explication && <p>{expl.brut_explication}</p>}
          {expl?.net_paye_explication && <p style={{ marginTop: 8 }}>{expl.net_paye_explication}</p>}
        </ExplainCard>

        {/* Card 2 — Cotisations */}
        <ExplainCard title="Tes cotisations expliquées" color={colors.orange} icon="🛡️">
          {expl?.cotisations_explication && <p style={{ marginBottom: 16 }}>{expl.cotisations_explication}</p>}
          {renderDonut()}
        </ExplainCard>

        {/* Card 3 — Net imposable */}
        {expl?.net_imposable_explication && (
          <ExplainCard title="Net imposable" color={colors.violet} icon="💡">
            <p>{expl.net_imposable_explication}</p>
          </ExplainCard>
        )}

        {/* Card 4 — PAS */}
        <ExplainCard title="Le prélèvement à la source" color={colors.primary} icon="🏛️">
          {d.net?.taux_pas_pct !== null && d.net?.taux_pas_pct !== undefined && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: colors.primary }}>{fmtPct(d.net.taux_pas_pct)}</div>
              <div style={{ fontSize: 12, color: colors.slate }}>Ton taux de prélèvement</div>
            </div>
          )}
          {expl?.pas_explication && <p>{expl.pas_explication}</p>}
          <div style={{ background: colors.primary + "08", border: `1px solid ${colors.primary}20`, borderRadius: 8, padding: 12, marginTop: 12, fontSize: 12, color: colors.primary }}>
            💡 Si ta situation change (mariage, enfant, revenus en hausse/baisse), tu peux moduler ton taux sur impots.gouv.fr.
          </div>
        </ExplainCard>

        {/* Card 5 — Congés */}
        {expl?.conges_rtt_explication && (
          <ExplainCard title="Congés & RTT" color={colors.teal} icon="🏖️">
            <p>{expl.conges_rtt_explication}</p>
          </ExplainCard>
        )}

        {/* Card 6 — Épargne salariale */}
        {expl?.epargne_salariale_explication && (
          <ExplainCard title="Épargne salariale" color={colors.green} icon="🏦">
            <p>{expl.epargne_salariale_explication}</p>
          </ExplainCard>
        )}

        {/* Card 7 — Equity */}
        {expl?.equity_explication && (
          <ExplainCard title="Rémunération en actions (Equity)" color={colors.violet} icon="📈">
            {expl.equity_explication.actions_gratuites && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.violet, marginBottom: 6 }}>🎯 Actions gratuites</h4>
                <p style={{ whiteSpace: "pre-line" }}>{expl.equity_explication.actions_gratuites}</p>
              </div>
            )}
            {expl.equity_explication.rsu_simple && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.violet, marginBottom: 6 }}>📊 RSU (simple)</h4>
                <p style={{ whiteSpace: "pre-line" }}>{expl.equity_explication.rsu_simple}</p>
              </div>
            )}
            {expl.equity_explication.rsu_sell_to_cover && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.violet, marginBottom: 6 }}>📊 RSU (sell to cover)</h4>
                <p style={{ whiteSpace: "pre-line" }}>{expl.equity_explication.rsu_sell_to_cover}</p>
              </div>
            )}
            {expl.equity_explication.espp && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.teal, marginBottom: 6 }}>💳 ESPP</h4>
                <p style={{ whiteSpace: "pre-line" }}>{expl.equity_explication.espp}</p>
              </div>
            )}
            {expl.equity_explication.avantages_nature_compenses && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.gold, marginBottom: 6 }}>🍽️ Avantages compensés</h4>
                <p style={{ whiteSpace: "pre-line" }}>{expl.equity_explication.avantages_nature_compenses}</p>
              </div>
            )}
          </ExplainCard>
        )}

        {/* Card 8 — Points d'attention */}
        {Array.isArray(d.points_attention) && d.points_attention.length > 0 && (
          <ExplainCard title="Points d'attention" color={colors.gold} icon="⚠️">
            {d.points_attention.map((pt: any, i: number) => (
              <div key={i} style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, lineHeight: 1.6 }}>
                {typeof pt === "string" ? pt : pt?.message || JSON.stringify(pt)}
              </div>
            ))}
          </ExplainCard>
        )}

        {/* Card 9 — Conseils d'optimisation */}
        {Array.isArray(d.conseils_optimisation) && d.conseils_optimisation.length > 0 && (
          <ExplainCard title="Conseils d'optimisation" color={colors.green} icon="💡">
            {d.conseils_optimisation.map((conseil: any, i: number) => (
              <div key={i} style={{ background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, lineHeight: 1.6 }}>
                {typeof conseil === "string" ? conseil : conseil?.message || JSON.stringify(conseil)}
              </div>
            ))}
          </ExplainCard>
        )}

        {/* Card 10 — Cas particuliers */}
        {d.cas_particuliers_mois && (() => {
          const cas = d.cas_particuliers_mois;
          const detected: { label: string; expl: string }[] = [];
          const checks = [
            { key: "taux_pas_zero", label: "Taux PAS à 0%" },
            { key: "taux_pas_negatif", label: "Taux PAS négatif" },
            { key: "conge_paternite", label: "Congé paternité" },
            { key: "absence_longue_duree", label: "Absence longue durée" },
            { key: "conges_pris", label: "Congés pris" },
            { key: "prime_exceptionnelle", label: "Prime exceptionnelle" },
            { key: "entree_ou_sortie_mois", label: "Entrée/Sortie" },
            { key: "changement_taux_pas", label: "Changement taux PAS" },
            { key: "actions_gratuites_vesting", label: "Vesting actions gratuites" },
            { key: "rsu_massif", label: "RSU massif" },
          ];
          for (const check of checks) {
            const val = cas[check.key];
            if (val?.detecte) detected.push({ label: check.label, expl: val.explication || "" });
          }
          if (detected.length === 0) return null;
          return (
            <ExplainCard title="Ce qui est particulier ce mois-ci" color={colors.red} icon="⚡">
              {detected.map((item, i) => (
                <div key={i} style={{ background: colors.red + "08", border: `1px solid ${colors.red}20`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.red, marginBottom: 4 }}>⚡ {item.label}</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-line" }}>{item.expl}</p>
                </div>
              ))}
            </ExplainCard>
          );
        })()}
      </div>
    );
  };

  // ─── Tab 3: Données brutes ─────────────────────────────────
  const renderRawTab = () => {
    if (!data) return null;

    const renderValue = (val: any): string => {
      if (val === null || val === undefined) return "—";
      if (typeof val === "number") return val.toLocaleString("fr-FR");
      if (typeof val === "boolean") return val ? "✅ Oui" : "❌ Non";
      if (typeof val === "string") return val || "—";
      if (Array.isArray(val)) return val.length === 0 ? "(vide)" : JSON.stringify(val, null, 2);
      if (typeof val === "object") return JSON.stringify(val, null, 2);
      return String(val);
    };

    const renderSection = (sectionKey: string, sectionData: any, title: string, color: string) => {
      if (!sectionData || typeof sectionData !== "object") return null;
      const entries = Object.entries(sectionData);
      if (entries.length === 0) return null;

      return (
        <div key={sectionKey} style={{ background: colors.cardBg, borderRadius: 10, marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ background: color + "12", borderBottom: `2px solid ${color}30`, padding: "10px 16px" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color }}>{title}</h3>
          </div>
          <div style={{ padding: "4px 0" }}>
            {entries.map(([key, val]) => {
              if (val && typeof val === "object" && !Array.isArray(val)) {
                return (
                  <div key={key} style={{ padding: "6px 16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.slate, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {key.replace(/_/g, " ")}
                    </div>
                    {Object.entries(val).map(([subKey, subVal]) => (
                      <div key={subKey} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        padding: "4px 0 4px 12px", fontSize: 12, borderBottom: `1px solid ${colors.border}`,
                      }}>
                        <span style={{ color: colors.slate, minWidth: 180 }}>{subKey.replace(/_/g, " ")}</span>
                        <span style={{ fontWeight: 500, textAlign: "right", wordBreak: "break-word", maxWidth: "60%" }}>
                          {renderValue(subVal)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }

              if (Array.isArray(val)) {
                return (
                  <div key={key} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "6px 16px", fontSize: 13, borderBottom: `1px solid ${colors.border}`,
                  }}>
                    <span style={{ color: colors.slate }}>{key.replace(/_/g, " ")}</span>
                    <span style={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
                      {val.length === 0 ? <span style={{ color: "#94a3b8", fontStyle: "italic" }}>(vide)</span> : (
                        <pre style={{ margin: 0, fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                          {JSON.stringify(val, null, 2)}
                        </pre>
                      )}
                    </span>
                  </div>
                );
              }

              return (
                <div key={key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 16px", fontSize: 13, borderBottom: `1px solid ${colors.border}`,
                }}>
                  <span style={{ color: colors.slate }}>{key.replace(/_/g, " ")}</span>
                  <span style={{ fontWeight: 500, color: val === null || val === undefined ? "#94a3b8" : "#1e293b" }}>
                    {renderValue(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    // Build sections dynamically from actual data keys
    const sectionConfig: [string, string, string][] = [
      ["salarie", "👤 Salarié", colors.primary],
      ["employeur", "🏢 Employeur", colors.primary],
      ["periode", "📅 Période", colors.slate],
      ["remuneration_brute", "💶 Rémunération brute", colors.green],
      ["cotisations_salariales", "📋 Cotisations salariales", colors.orange],
      ["cotisations_patronales", "📋 Cotisations patronales", colors.primary],
      ["net", "💰 Net", colors.green],
      ["conges_rtt", "🏖️ Congés & RTT", colors.teal],
      ["epargne_salariale", "🏦 Épargne salariale", colors.green],
      ["remuneration_equity", "📈 Rémunération Equity", colors.violet],
      ["explications_pedagogiques", "💡 Explications pédagogiques", colors.violet],
      ["points_attention", "⚠️ Points d'attention", colors.gold],
      ["conseils_optimisation", "💡 Conseils d'optimisation", colors.green],
      ["cas_particuliers_mois", "⚡ Cas particuliers du mois", colors.red],
      ["cumuls_annuels", "📊 Cumuls annuels", colors.slate],
      ["informations_complementaires", "ℹ️ Informations complémentaires", colors.slate],
    ];

    return (
      <div>
        <div style={{ fontSize: 13, color: colors.slate, marginBottom: 12, fontStyle: "italic" }}>
          Toutes les données extraites par l'IA, champ par champ.
        </div>
        {sectionConfig.map(([key, title, color]) => {
          const val = (data as any)[key];
          if (!val) return null;
          // Arrays at root level
          if (Array.isArray(val)) {
            if (val.length === 0) return null;
            return (
              <div key={key} style={{ background: colors.cardBg, borderRadius: 10, marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ background: color + "12", borderBottom: `2px solid ${color}30`, padding: "10px 16px" }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color }}>{title}</h3>
                </div>
                <div style={{ padding: 16 }}>
                  {val.map((item: any, i: number) => (
                    <div key={i} style={{ background: "#f8fafc", borderRadius: 6, padding: "8px 12px", marginBottom: 4, fontSize: 13, lineHeight: 1.6 }}>
                      {typeof item === "string" ? item : <pre style={{ margin: 0, fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{JSON.stringify(item, null, 2)}</pre>}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return renderSection(key, val, title, color);
        })}

        {/* Usage / meta */}
        {data._usage && renderSection("_usage", data._usage, "📊 Consommation API", colors.slate)}
      </div>
    );
  };

  // ─── Main render ────────────────────────────────────────────
  return (
    <div style={{ fontFamily: font, background: colors.bg, minHeight: "100vh", padding: "24px 16px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
            📄 Analyseur de bulletin de paie
          </h1>
          <p style={{ fontSize: 14, color: colors.slate }}>
            Importez votre fiche de paie (PDF) et comprenez chaque ligne en langage clair
          </p>
        </div>

        {/* Upload zone */}
        {!data && (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? colors.primary : colors.border}`,
              borderRadius: 12, padding: "48px 24px", textAlign: "center", cursor: "pointer",
              background: isDragging ? colors.primary + "08" : colors.cardBg,
              transition: "all 0.2s", marginBottom: 16,
            }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            <div style={{ fontSize: 40, marginBottom: 12 }}>📎</div>
            {file ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{file.name}</div>
                <div style={{ fontSize: 12, color: colors.slate, marginTop: 4 }}>{(file.size / 1024).toFixed(0)} Ko</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>Glissez votre bulletin de paie ici</div>
                <div style={{ fontSize: 13, color: colors.slate, marginTop: 4 }}>ou cliquez pour sélectionner un PDF</div>
              </div>
            )}
          </div>
        )}

        {/* Workflow & Prompt panels */}
        {!data && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button onClick={() => setShowWorkflow(!showWorkflow)} style={{
                padding: "8px 14px", background: showWorkflow ? colors.primary + "12" : colors.cardBg,
                border: `1px solid ${showWorkflow ? colors.primary + "40" : colors.border}`, borderRadius: 8,
                fontSize: 13, cursor: "pointer", color: showWorkflow ? colors.primary : colors.slate, fontWeight: 600,
              }}>⚙️ Workflow & config</button>
              <button onClick={() => setShowPrompt(!showPrompt)} style={{
                padding: "8px 14px", background: showPrompt ? colors.violet + "12" : colors.cardBg,
                border: `1px solid ${showPrompt ? colors.violet + "40" : colors.border}`, borderRadius: 8,
                fontSize: 13, cursor: "pointer", color: showPrompt ? colors.violet : colors.slate, fontWeight: 600,
              }}>📝 Prompt système</button>
            </div>

            {showWorkflow && (
              <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>⚙️ Configuration du workflow OCR</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["Modèle IA", WORKFLOW_CONFIG.model],
                    ["Max tokens", WORKFLOW_CONFIG.max_tokens.toLocaleString("fr-FR")],
                    ["API endpoint", WORKFLOW_CONFIG.api_endpoint],
                    ["API version", WORKFLOW_CONFIG.anthropic_version],
                    ["Edge Function", WORKFLOW_CONFIG.edge_function],
                    ["Échelle PDF", `×${WORKFLOW_CONFIG.pdf_scale}`],
                    ["Format images", WORKFLOW_CONFIG.image_format],
                    ["Pages max", String(WORKFLOW_CONFIG.max_pages)],
                    ["Récupération JSON", WORKFLOW_CONFIG.json_recovery ? "✅ Activée" : "❌ Désactivée"],
                    ["Coût input", `$${WORKFLOW_CONFIG.cost_input_per_mtok}/MTok`],
                    ["Coût output", `$${WORKFLOW_CONFIG.cost_output_per_mtok}/MTok`],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", fontSize: 12, background: i % 2 === 0 ? "#f8fafc" : "transparent", borderRadius: 4 }}>
                      <span style={{ color: colors.slate, fontWeight: 600 }}>{label}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#1e293b", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: 10, background: "#eff6ff", borderRadius: 6, fontSize: 11, color: colors.primary, lineHeight: 1.6 }}>
                  <strong>Pipeline :</strong> PDF → pdf.js v3.11.174 (CDN isolé) → Canvas (scale {WORKFLOW_CONFIG.pdf_scale}) → JPEG {WORKFLOW_CONFIG.image_format.split(" ")[1]} → base64 → Edge Function → Anthropic API ({WORKFLOW_CONFIG.model}) → JSON → Parsing + récupération auto si tronqué → Affichage 3 onglets
                </div>
              </div>
            )}

            {showPrompt && (
              <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>📝 Prompt système (envoyé à Claude)</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    {customPrompt.trim() && (
                      <span style={{ background: colors.violet + "15", color: colors.violet, padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                        ✏️ Modifié
                      </span>
                    )}
                    <button onClick={() => setCustomPrompt("")} style={{
                      padding: "4px 10px", background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 6,
                      fontSize: 11, cursor: "pointer", color: colors.slate,
                    }}>🔄 Réinitialiser</button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: colors.slate, marginBottom: 8, lineHeight: 1.5 }}>
                  ⚠️ Si vous modifiez le prompt ci-dessous, votre version personnalisée sera envoyée à la place du prompt par défaut côté serveur.
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Laissez vide pour utiliser le prompt par défaut du serveur. Collez ici un prompt personnalisé pour le tester..."
                  style={{
                    width: "100%", minHeight: 300, padding: 12, border: `1px solid ${colors.border}`, borderRadius: 8,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12, lineHeight: 1.6,
                    resize: "vertical", color: "#1e293b", background: "#fafbfc",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                  <span>{customPrompt.length > 0 ? `${customPrompt.length} caractères` : "Prompt par défaut du serveur"}</span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(customPrompt || DEFAULT_PROMPT);
                  }} style={{
                    padding: "4px 10px", background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 6,
                    fontSize: 11, cursor: "pointer", color: colors.slate,
                  }}>📋 Copier</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {file && !data && !loading && (
          <button onClick={analyze} style={{
            width: "100%", padding: "14px", background: `linear-gradient(135deg, ${colors.primary}, ${colors.violet})`,
            color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16,
          }}>
            🔍 Analyser mon bulletin de paie {customPrompt.trim() ? "(prompt personnalisé)" : ""}
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
              width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
              borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px",
            }} />
            <div style={{ fontSize: 14, color: colors.primary, fontWeight: 600 }}>{progress}</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #ef4444", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.red }}>❌ Erreur</div>
            <div style={{ fontSize: 13, color: "#991b1b", marginTop: 4 }}>{error}</div>
            <button onClick={() => { setError(null); setFile(null); }} style={{
              marginTop: 8, padding: "6px 14px", background: colors.red, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer",
            }}>Réessayer</button>
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: colors.border, borderRadius: 10, padding: 4 }}>
              {[
                { key: "data" as const, label: "📋 Ma fiche de paie" },
                { key: "explain" as const, label: "💡 Comprendre ma paie" },
                { key: "raw" as const, label: "🗂️ Données brutes" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  flex: 1, padding: "10px 16px", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: activeTab === tab.key ? colors.cardBg : "transparent",
                  color: activeTab === tab.key ? "#1e293b" : colors.slate,
                  boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s",
                }}>{tab.label}</button>
              ))}
            </div>

            {activeTab === "data" ? renderDataTab() : activeTab === "explain" ? renderExplainTab() : renderRawTab()}

            {/* Usage info */}
            {data._usage && (
              <div style={{ marginTop: 12, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 16, fontSize: 12, color: colors.slate, flexWrap: "wrap" }}>
                <span>🤖 {data._usage.model}</span>
                <span>📥 {data._usage.input_tokens?.toLocaleString()} tokens in</span>
                <span>📤 {data._usage.output_tokens?.toLocaleString()} tokens out</span>
                <span>💰 ${data._usage.cost_total_usd}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={copyJson} style={{
                padding: "8px 16px", background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 8,
                fontSize: 13, cursor: "pointer", color: colors.slate,
              }}>📋 Copier le JSON</button>
              <button onClick={() => { setData(null); setFile(null); }} style={{
                padding: "8px 16px", background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 8,
                fontSize: 13, cursor: "pointer", color: colors.slate,
              }}>🔄 Nouvelle analyse</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
