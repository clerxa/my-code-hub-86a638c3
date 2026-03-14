import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fmt } from "./payslipUtils";
import type { PayslipData, PointAttention } from "@/types/payslip";

interface PayslipDetailModalProps {
  open: boolean;
  onClose: () => void;
  modalType: string | null;
  data: PayslipData;
  /** The active point d'attention (for point_* modals) */
  activePoint?: PointAttention | null;
}

export default function PayslipDetailModal({ open, onClose, modalType, data, activePoint }: PayslipDetailModalProps) {
  if (!modalType || !data) return null;

  const renderContent = () => {
    // Point d'attention modal — show explication_detaillee
    if (modalType.startsWith("point_") && activePoint) {
      return <PointAttentionModal point={activePoint} />;
    }

    switch (modalType) {
      case "brut_net_explication":
        return <BrutNetModal data={data} />;
      case "cotisations_retraite":
      case "cotisations_sante":
      case "cotisations_chomage":
      case "cotisations_csg":
        return <CotisationsDetailModal data={data} type={modalType.replace("cotisations_", "")} />;
      default:
        return <GenericModal data={data} modalType={modalType} />;
    }
  };

  const getTitle = () => {
    if (modalType.startsWith("point_") && activePoint) {
      return activePoint.titre;
    }
    const titles: Record<string, string> = {
      brut_net_explication: "📖 Comment on passe de brut à net ?",
      cotisations_retraite: "🏦 Détail cotisations retraite",
      cotisations_sante: "🏥 Détail cotisations santé",
      cotisations_chomage: "🛡️ Détail cotisations chômage",
      cotisations_csg: "📋 Détail CSG/CRDS",
    };
    return titles[modalType] || "Détails";
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{getTitle()}</DialogTitle>
          <DialogDescription className="sr-only">Explication détaillée</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════ POINT D'ATTENTION MODAL ═══════════

function PointAttentionModal({ point }: { point: PointAttention }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-medium">
        {point.resume}
      </div>
      {point.explication_detaillee && (
        <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {point.explication_detaillee}
        </div>
      )}
    </div>
  );
}

// ═══════════ BRUT → NET MODAL ═══════════

function BrutNetModal({ data }: { data: PayslipData }) {
  const brut = data.remuneration_brute?.total_brut;
  const cotSal = data.cotisations_salariales?.total_cotisations_salariales;
  const netAvantImpot = data.net?.net_avant_impot;
  const pas = data.net?.montant_pas;
  const tauxPas = data.net?.taux_pas_pct;
  const netPaye = data.net?.net_paye;

  const cotPct = brut && cotSal ? Math.round((cotSal / brut) * 100) : null;

  // Generic explanation if no numbers
  if (!brut && !netPaye) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Ton bulletin de paie suit toujours le même chemin pour arriver au montant versé sur ton compte :
        </p>
        <div className="space-y-3">
          {[
            { step: "1️⃣", title: "Salaire brut", desc: "Salaire de base + primes + heures sup + avantages." },
            { step: "2️⃣", title: "− Cotisations sociales (~22-25%)", desc: "Retraite, santé, chômage, CSG/CRDS." },
            { step: "3️⃣", title: "= Net avant impôt", desc: "Ce que tu gagnes après cotisations." },
            { step: "4️⃣", title: "− Prélèvement à la source (PAS)", desc: "L'impôt sur le revenu prélevé chaque mois." },
            { step: "5️⃣", title: "= Net payé 💰", desc: "Le montant réellement versé sur ton compte." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-lg">{item.step}</span>
              <div>
                <div className="font-semibold text-foreground">{item.title}</div>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <span className="text-sm font-medium text-foreground">Salaire brut</span>
          <span className="text-lg font-bold text-foreground">{fmt(brut)}</span>
        </div>
        <div className="flex items-center justify-center text-muted-foreground text-sm">
          − Cotisations sociales{cotPct ? ` (~${cotPct}%)` : ""}
        </div>
        <div className="flex items-center justify-between bg-destructive/5 rounded-lg p-3">
          <span className="text-sm text-muted-foreground">Cotisations salariales</span>
          <span className="text-base font-bold text-destructive">− {fmt(cotSal)}</span>
        </div>
        <div className="flex items-center justify-center text-muted-foreground text-sm">=</div>
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <span className="text-sm font-medium text-foreground">Net avant impôt</span>
          <span className="text-base font-bold text-foreground">{fmt(netAvantImpot)}</span>
        </div>
        <div className="flex items-center justify-center text-muted-foreground text-sm">
          − Impôt sur le revenu (PAS {tauxPas ? `${Math.abs(tauxPas).toFixed(1)}%` : ""})
        </div>
        <div className="flex items-center justify-between bg-destructive/5 rounded-lg p-3">
          <span className="text-sm text-muted-foreground">Prélèvement à la source</span>
          <span className="text-base font-bold text-destructive">− {fmt(Math.abs(pas || 0))}</span>
        </div>
        <div className="flex items-center justify-center text-muted-foreground text-sm">=</div>
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <span className="text-base font-bold text-green-700 dark:text-green-400">NET PAYÉ</span>
          <span className="text-xl font-extrabold text-green-700 dark:text-green-400">{fmt(netPaye)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════ COTISATIONS DETAIL MODAL ═══════════

function CotisationsDetailModal({ data, type }: { data: PayslipData; type: string }) {
  const cs: any = data.cotisations_salariales || {};
  const cp: any = (data as any).cotisations_patronales || {};

  // Sanitize: if salariale === patronale for a line, it's likely a duplication error
  const sanitize = (sal: number | null, pat: number | null, expectSalZero = false) => {
    if (sal && pat && sal === pat && expectSalZero) return { sal: null, pat };
    if (expectSalZero && sal && !pat) return { sal: null, pat: sal };
    return { sal, pat };
  };

  const maladieFixed = sanitize(cs.sante_maladie ?? null, cp.sante_maladie_patronale ?? null, true);
  const chomageFixed = sanitize(cs.assurance_chomage ?? null, cp.assurance_chomage_patronale ?? null, true);

  const details: Record<string, { label: string; sal: number | null; pat: number | null }[]> = {
    retraite: [
      { label: "Vieillesse plafonnée", sal: cs.vieillesse_plafonnee ?? null, pat: cp.vieillesse_patronale ?? null },
      { label: "Vieillesse déplafonnée", sal: cs.vieillesse_deplafonnee ?? null, pat: null },
      { label: "Retraite complémentaire T1", sal: cs.retraite_complementaire_tranche1 ?? null, pat: cp.retraite_complementaire_patronale ?? null },
      { label: "Retraite complémentaire T2", sal: cs.retraite_complementaire_tranche2 ?? null, pat: null },
      { label: "CEG", sal: cs.ceg_salarie ?? null, pat: null },
      { label: "CET", sal: cs.cet_salarie ?? null, pat: null },
      { label: "APEC", sal: cs.apec_ou_agirc_arrco ?? null, pat: null },
    ],
    sante: [
      { label: "Maladie", sal: maladieFixed.sal, pat: maladieFixed.pat },
      { label: "Complémentaire santé", sal: cs.complementaire_sante_salarie ?? null, pat: cp.complementaire_sante_patronale ?? null },
      { label: "Prévoyance", sal: cs.prevoyance_salarie ?? null, pat: cp.prevoyance_patronale ?? null },
    ],
    chomage: [
      { label: "Assurance chômage", sal: chomageFixed.sal, pat: chomageFixed.pat },
    ],
    csg: [
      { label: "CSG déductible", sal: cs.csg_deductible ?? null, pat: null },
      { label: "CSG/CRDS non déductible", sal: cs.csg_crds_non_deductible ?? null, pat: null },
    ],
  };

  const rows = (details[type] || []).filter(r => r.sal || r.pat);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 text-xs font-semibold">
          <span>Cotisation</span>
          <span className="text-right">Part salariale</span>
          <span className="text-right">Part patronale</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 p-3 border-t text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-right font-medium">{row.sal ? fmt(row.sal) : "—"}</span>
            <span className="text-right font-medium">{row.pat ? fmt(row.pat) : "—"}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">
        ⚠️ Les montants affichés sont extraits automatiquement et peuvent contenir des approximations.
      </p>
    </div>
  );
}

// ═══════════ GENERIC MODAL ═══════════

function GenericModal({ data, modalType }: { data: PayslipData; modalType: string }) {
  const expl = (data as any).explications_pedagogiques;
  const explanation = expl?.[modalType];

  if (explanation) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{explanation}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Les détails pour cette section seront disponibles avec l'analyse avancée.
      </p>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        💡 Lance l'analyse avancée pour obtenir des explications détaillées et personnalisées.
      </div>
    </div>
  );
}
