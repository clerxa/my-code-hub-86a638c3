import React, { useState, useCallback, useEffect, useRef } from "react";

const SUPABASE_FUNCTION_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ocr-bulletin-paie`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ─── Types ────────────────────────────────────────────────────────
interface PayslipData {
  salarie: any;
  employeur: any;
  periode: any;
  remuneration_brute: any;
  cotisations_salariales: any;
  cotisations_patronales: any;
  net: any;
  cumuls_annuels: any;
  epargne_salariale: any;
  conges_rtt: any;
  cout_employeur: any;
  explications_pedagogiques: any;
  meta: any;
  _usage?: any;
}

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

// ─── Main Component ──────────────────────────────────────────────
export default function OcrFicheDePaie() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [data, setData] = useState<PayslipData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"data" | "explain" | "raw">("data");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Open all sections by default when data loads
  useEffect(() => {
    if (data) {
      setOpenSections({
        identity: true, waterfall: true, cotisations: true,
        variables: true, epargne: true, conges: true, cumuls: true,
      });
    }
  }, [data]);

  // ─── PDF → Images ───────────────────────────────────────────
  const convertPdfToImages = useCallback(async (pdfFile: File): Promise<string[]> => {
    setProgress("Chargement de pdf.js…");

    // Load pdf.js v3 from CDN (avoid conflict with react-pdf's v5)
    if (!(window as any).__pdfjsLib3) {
      // Temporarily save any existing pdfjsLib (from react-pdf)
      const existing = (window as any).pdfjsLib;
      delete (window as any).pdfjsLib;
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
          (window as any).__pdfjsLib3 = (window as any).pdfjsLib;
          // Restore the original if it existed
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
        body: JSON.stringify({ images: images.map(img => img.split(",")[1]) }),
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
  }, [file, convertPdfToImages]);

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
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }
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

  // ─── Tab 1: Ma fiche de paie ───────────────────────────────
  const renderDataTab = () => {
    if (!data) return null;
    const d = data;
    const netPaye = d.net?.net_paye;
    const brut = d.remuneration_brute?.total_brut;
    const cotSal = d.cotisations_salariales?.total_cotisations_salariales;
    const csgNonDed = d.cotisations_salariales?.csg_crds_non_deductible;
    const netSocial = d.net?.net_social;
    const pas = d.net?.montant_pas_preleve;
    const tauxPas = d.net?.taux_pas_pct;

    return (
      <div>
        {/* Banner */}
        <div style={{
          background: netPaye && netPaye > 3000 ? `linear-gradient(135deg, ${colors.green}, #059669)` : `linear-gradient(135deg, ${colors.primary}, #3b82f6)`,
          color: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 16, fontFamily: font,
        }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Ce mois-ci</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(netPaye)} nets</div>
          {d.periode?.date_paiement && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Versés le {d.periode.date_paiement}</div>}
        </div>

        {/* PAS warning */}
        {tauxPas === 0 && (
          <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: "#92400e" }}>
            ⚠️ Votre taux PAS est à 0% — vérifiez que c'est intentionnel
          </div>
        )}

        {/* N-1 congés warning */}
        {d.conges_rtt?.conges_payes_n1_solde > 5 && (
          <div style={{ background: "#fef2f2", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: "#991b1b" }}>
            ⚠️ Vous avez {d.conges_rtt.conges_payes_n1_solde} jours de congés N-1 à solder avant le 31 mai
          </div>
        )}

        {/* Section 1 — Identity */}
        <AccordionSection id="identity" title="Identité & employeur" borderColor={colors.primary} icon="👤">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Salarié</h4>
              {[
                ["Nom", `${d.salarie?.prenom || ""} ${d.salarie?.nom || ""}`],
                ["Emploi", d.salarie?.emploi],
                ["Statut", d.salarie?.statut],
                ["Convention", d.salarie?.convention_collective],
                ["Entrée", d.salarie?.date_entree],
                ["Ancienneté", d.salarie?.anciennete_annees ? `${d.salarie.anciennete_annees} ans` : null],
                ["N° SS", d.salarie?.numero_securite_sociale],
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
              { label: "SALAIRE BRUT", value: brut, color: colors.primary, sign: "", tooltipKey: "brut", tooltipText: "Votre rémunération totale avant déductions : salaire de base + primes + heures supplémentaires." },
              { label: "Cotisations salariales", value: cotSal, color: colors.orange, sign: "−", tooltipKey: "cotsal", tooltipText: d.explications_pedagogiques?.ecart_brut_net_explication || "Cotisations obligatoires finançant votre protection sociale." },
              { label: "CSG/CRDS non déductible", value: csgNonDed, color: colors.gold, sign: "−", tooltipKey: "csg", tooltipText: d.explications_pedagogiques?.cotisations_a_quoi_ca_sert?.csg_crds || "Contributions au financement de la protection sociale." },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px",
                background: i % 2 === 0 ? "#fff" : "transparent", borderRadius: 6, marginBottom: 2,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, color: "#64748b" }}>{row.label}</span>
                  <InfoTooltip id={row.tooltipKey} text={row.tooltipText} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: row.color }}>
                  {row.sign} {fmt(row.value)}
                </span>
              </div>
            ))}

            <div style={{ borderTop: `2px dashed ${colors.violet}`, margin: "8px 0", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.violet }}>= NET SOCIAL</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.violet }}>{fmt(netSocial)}</span>
            </div>

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
                <InfoTooltip id="pas" text={d.explications_pedagogiques?.pas_explication || "Impôt sur le revenu prélevé chaque mois directement sur votre salaire."} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: colors.violet }}>− {fmt(pas)}</span>
            </div>

            <div style={{ borderTop: `2px solid ${colors.green}`, margin: "8px 0" }} />

            <div style={{
              background: `linear-gradient(135deg, ${colors.green}15, ${colors.green}08)`, border: `2px solid ${colors.green}40`,
              borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
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
              {d.cotisations_salariales && Object.entries(d.cotisations_salariales).filter(([k, v]) => k !== "total_cotisations_salariales" && v !== null && v !== 0).map(([key, val]) => {
                const explKey = key.includes("retraite") ? "retraite" : key.includes("sante") || key.includes("complementaire_sante") ? "sante" : key.includes("chomage") ? "chomage" : key.includes("csg") ? "csg_crds" : key.includes("prevoyance") ? "prevoyance" : null;
                const expl = explKey ? d.explications_pedagogiques?.cotisations_a_quoi_ca_sert?.[explKey] : null;
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.slate }}>{key.replace(/_/g, " ")}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 500 }}>{fmt(val as number)}</span>
                      {expl && <InfoTooltip id={`cot-s-${key}`} text={expl} />}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 700, color: colors.orange }}>
                <span>Total</span><span>{fmt(d.cotisations_salariales?.total_cotisations_salariales)}</span>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>Cotisations patronales</h4>
              {d.cotisations_patronales && Object.entries(d.cotisations_patronales).filter(([k, v]) => k !== "total_cotisations_patronales" && v !== null && v !== 0).map(([key, val]) => (
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
          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
            <StatCard label="Coût employeur total" value={fmt(d.cout_employeur?.cout_total_mensuel)} color={colors.primary} />
            {d.cout_employeur?.ratio_charges_sur_brut_pct && (
              <span style={{ background: colors.gold + "20", color: colors.gold, fontSize: 13, padding: "6px 14px", borderRadius: 20, fontWeight: 700 }}>
                {fmtPct(d.cout_employeur.ratio_charges_sur_brut_pct)} de charges
              </span>
            )}
          </div>
        </AccordionSection>

        {/* Section 4 — Variables & primes */}
        <AccordionSection id="variables" title="Éléments variables & primes" borderColor={colors.gold} icon="💰">
          {(() => {
            const items = [
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
              ["Intéressement brut", ep?.interesse_brut],
              ["Participation brute", ep?.participation_brute],
              ["Abondement employeur", ep?.abondement_employeur],
              ["Versement PEE", ep?.versement_pee],
              ["Versement PERCOI", ep?.versement_percoi],
            ].filter(([, v]) => v !== null && v !== undefined && v !== 0);
            if (items.length === 0) {
              return (
                <div style={{ background: `${colors.green}08`, border: `1px dashed ${colors.green}40`, borderRadius: 8, padding: 16, fontSize: 13, color: colors.green }}>
                  💡 Votre entreprise propose peut-être un PEE ou PERCOI — renseignez-vous auprès des RH.
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

        {/* Section 6 — Congés & RTT */}
        <AccordionSection id="conges" title="Congés & RTT" borderColor={colors.teal} icon="🏖️">
          {(() => {
            const c = d.conges_rtt;
            const items = [
              { label: "Congés payés N (solde)", value: c?.conges_payes_n_solde, max: 25 },
              { label: "Congés payés N-1 (solde)", value: c?.conges_payes_n1_solde, max: 25, warn: c?.conges_payes_n1_solde > 5 },
              { label: "RTT (solde)", value: c?.rtt_solde, max: 12 },
              { label: "Congés pris ce mois", value: c?.conges_pris_mois, max: null },
            ];
            return items.map((item, i) => item.value !== null && item.value !== undefined ? (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: item.warn ? colors.red : colors.slate }}>{item.warn ? "⚠️ " : ""}{item.label}</span>
                  <span style={{ fontWeight: 600, color: item.warn ? colors.red : colors.teal }}>{item.value} jours</span>
                </div>
                {item.max && (
                  <div style={{ background: colors.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%`, height: "100%", background: item.warn ? colors.red : colors.teal, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                )}
              </div>
            ) : null);
          })()}
        </AccordionSection>

        {/* Section 7 — Cumuls annuels */}
        <AccordionSection id="cumuls" title="Cumuls annuels" borderColor={colors.slate} icon="📅">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <StatCard label="Brut cumulé" value={fmt(d.cumuls_annuels?.brut_cumul)} color={colors.primary} />
            <StatCard label="Net imposable cumulé" value={fmt(d.cumuls_annuels?.net_imposable_cumul)} color={colors.violet} />
            <StatCard label="PAS cumulé" value={fmt(d.cumuls_annuels?.pas_cumul)} color={colors.orange} />
            <StatCard label="Coût employeur cumulé" value={fmt(d.cumuls_annuels?.cout_total_employeur_cumul)} color={colors.slate} />
          </div>
        </AccordionSection>

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "16px 0", lineHeight: 1.5, fontStyle: "italic" }}>
          Ces informations sont extraites automatiquement. MyFinCare n'est pas un éditeur de logiciel de paie — en cas de doute, contactez votre service RH ou un expert-comptable.
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
    const csgCrds = d.cotisations_salariales?.csg_crds_non_deductible || 0;
    const pas = d.net?.montant_pas_preleve || 0;
    const total = cotSal + csgCrds + pas + netPaye;

    // Donut segments
    const segments = [
      { label: "Net payé", value: netPaye, color: colors.green },
      { label: "Cotisations", value: cotSal, color: colors.orange },
      { label: "CSG/CRDS", value: csgCrds, color: colors.gold },
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
        {/* Card 1 — Introduction */}
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
          <p>{expl?.introduction}</p>
        </ExplainCard>

        {/* Card 2 — Brut ≠ Net */}
        <ExplainCard title="Pourquoi brut ≠ net ?" color={colors.violet} icon="🔍">
          <p style={{ marginBottom: 16 }}>{expl?.ecart_brut_net_explication}</p>
          {renderDonut()}
        </ExplainCard>

        {/* Card 3 — Cotisations explained */}
        <ExplainCard title="À quoi servent vos cotisations ?" color={colors.orange} icon="🛡️">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "🏦", title: "Retraite", key: "retraite", color: colors.primary },
              { icon: "🏥", title: "Santé", key: "sante", color: colors.green },
              { icon: "🛡️", title: "Chômage", key: "chomage", color: colors.orange },
              { icon: "📋", title: "CSG/CRDS", key: "csg_crds", color: colors.violet },
            ].map((item) => (
              <div key={item.key} style={{ background: item.color + "08", border: `1px solid ${item.color}20`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{item.icon} {item.title}</div>
                <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: colors.slate }}>
                  {expl?.cotisations_a_quoi_ca_sert?.[item.key] || "Pas d'information disponible."}
                </p>
              </div>
            ))}
          </div>
          {expl?.cotisations_a_quoi_ca_sert?.prevoyance && (
            <div style={{ marginTop: 12, background: colors.teal + "08", border: `1px solid ${colors.teal}20`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🩺 Prévoyance</div>
              <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: colors.slate }}>{expl.cotisations_a_quoi_ca_sert.prevoyance}</p>
            </div>
          )}
        </ExplainCard>

        {/* Card 4 — PAS */}
        <ExplainCard title="Le prélèvement à la source" color={colors.primary} icon="🏛️">
          {d.net?.taux_pas_pct !== null && d.net?.taux_pas_pct !== undefined && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: colors.primary }}>{fmtPct(d.net.taux_pas_pct)}</div>
              <div style={{ fontSize: 12, color: colors.slate }}>Votre taux de prélèvement</div>
            </div>
          )}
          <p>{expl?.pas_explication}</p>
          <div style={{ background: colors.primary + "08", border: `1px solid ${colors.primary}20`, borderRadius: 8, padding: 12, marginTop: 12, fontSize: 12, color: colors.primary }}>
            💡 Si votre situation change (mariage, enfant, revenus en hausse/baisse), vous pouvez moduler votre taux sur impots.gouv.fr.
          </div>
        </ExplainCard>

        {/* Card 5 — Coût employeur */}
        <ExplainCard title="Ce que vous coûtez à votre employeur" color={colors.slate} icon="🏢">
          {d.cout_employeur?.cout_total_mensuel && brut > 0 && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: colors.slate }}>Pour 100 € de coût employeur, vous recevez :</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: colors.green, margin: "8px 0" }}>
                {Math.round((netPaye / d.cout_employeur.cout_total_mensuel) * 100)} €
              </div>
            </div>
          )}
          <p>{expl?.cout_employeur_explication}</p>
        </ExplainCard>

        {/* Card 6 — Lignes inhabituelles */}
        {expl?.lignes_inhabituelles?.length > 0 && (
          <ExplainCard title="Ce qui est particulier ce mois-ci" color={colors.gold} icon="⚡">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {expl.lignes_inhabituelles.map((line: string, i: number) => (
                <li key={i} style={{ marginBottom: 6 }}>{line}</li>
              ))}
            </ul>
          </ExplainCard>
        )}

        {/* Card 7 — Points d'attention */}
        {expl?.points_attention?.length > 0 && (
          <ExplainCard title="Points d'attention" color={colors.red} icon="⚠️">
            {expl.points_attention.map((pt: string, i: number) => (
              <div key={i} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13 }}>
                ⚠️ {pt}
              </div>
            ))}
          </ExplainCard>
        )}

        {/* Card 8 — Conseils */}
        {expl?.conseils_optimisation?.length > 0 && (
          <ExplainCard title="Pour aller plus loin" color={colors.green} icon="💡">
            {expl.conseils_optimisation.map((conseil: string, i: number) => (
              <div key={i} style={{ background: colors.green + "08", border: `1px solid ${colors.green}20`, borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13 }}>
                💡 {conseil}
              </div>
            ))}
            <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginTop: 12 }}>
              Ces conseils sont indicatifs. Rapprochez-vous d'un conseiller patrimonial pour votre situation personnelle.
            </p>
          </ExplainCard>
        )}

        {/* Épargne salariale explanation */}
        <ExplainCard title="Épargne salariale" color={colors.green} icon="🏦">
          <p>{expl?.epargne_salariale_explication}</p>
        </ExplainCard>

        {/* Congés explanation */}
        <ExplainCard title="Vos congés" color={colors.teal} icon="🏖️">
          <p>{expl?.conges_explication}</p>
        </ExplainCard>
      </div>
    );
  };

  // ─── Tab 3: Données brutes ─────────────────────────────────
  const renderRawTab = () => {
    if (!data) return null;

    const renderValue = (val: any): string => {
      if (val === null || val === undefined) return "—";
      if (typeof val === "number") return val.toLocaleString("fr-FR");
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
              // Nested objects get their own sub-section
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

              // Arrays
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

              // Scalars
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

    const sections: [string, any, string, string][] = [
      ["salarie", data.salarie, "👤 Salarié", colors.primary],
      ["employeur", data.employeur, "🏢 Employeur", colors.primary],
      ["periode", data.periode, "📅 Période", colors.slate],
      ["remuneration_brute", data.remuneration_brute, "💶 Rémunération brute", colors.green],
      ["cotisations_salariales", data.cotisations_salariales, "📋 Cotisations salariales", colors.orange],
      ["cotisations_patronales", data.cotisations_patronales, "📋 Cotisations patronales", colors.primary],
      ["net", data.net, "💰 Net", colors.green],
      ["cumuls_annuels", data.cumuls_annuels, "📊 Cumuls annuels", colors.violet],
      ["epargne_salariale", data.epargne_salariale, "🏦 Épargne salariale", colors.green],
      ["conges_rtt", data.conges_rtt, "🏖️ Congés & RTT", colors.teal],
      ["cout_employeur", data.cout_employeur, "🏢 Coût employeur", colors.slate],
      ["explications_pedagogiques", data.explications_pedagogiques, "💡 Explications pédagogiques", colors.violet],
      ["meta", data.meta, "⚙️ Métadonnées", colors.slate],
    ];

    return (
      <div>
        <div style={{ fontSize: 13, color: colors.slate, marginBottom: 12, fontStyle: "italic" }}>
          Toutes les données extraites par l'IA, champ par champ.
        </div>
        {sections.map(([key, val, title, color]) => renderSection(key, val, title, color))}
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
              borderRadius: 12,
              padding: "48px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging ? colors.primary + "08" : colors.cardBg,
              transition: "all 0.2s",
              marginBottom: 16,
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

        {/* Analyze button */}
        {file && !data && !loading && (
          <button onClick={analyze} style={{
            width: "100%", padding: "14px", background: `linear-gradient(135deg, ${colors.primary}, ${colors.violet})`,
            color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16,
          }}>
            🔍 Analyser mon bulletin de paie
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
            {/* Tabs */}
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

            {/* Actions */}
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

            {/* Usage info */}
            {data._usage && (
              <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", display: "flex", gap: 12 }}>
                <span>Modèle : {data._usage.model}</span>
                <span>Tokens : {data._usage.total_tokens?.toLocaleString("fr-FR")}</span>
                <span>Coût : {data._usage.cost_total_usd?.toFixed(4)} $</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
