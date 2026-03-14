import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmt, safe } from "./payslipUtils";

interface PayslipDetailModalProps {
  open: boolean;
  onClose: () => void;
  modalType: string | null;
  data: any;
}

export default function PayslipDetailModal({ open, onClose, modalType, data }: PayslipDetailModalProps) {
  if (!modalType || !data) return null;

  const renderContent = () => {
    switch (modalType) {
      case "rsu_sell_to_cover":
        return <RSUSellToCoverModal data={data} />;
      case "rsu_simple":
        return <RSUSimpleModal data={data} />;
      case "actions_gratuites_qualifie":
        return <ActionsGratuitesQualifieModal data={data} />;
      case "actions_gratuites_non_qualifie":
        return <ActionsGratuitesNonQualifieModal data={data} />;
      case "espp":
        return <ESPPModal data={data} />;
      case "avantages_nature":
        return <AvantagesNatureModal data={data} />;
      case "cotisations_retraite":
      case "cotisations_sante":
      case "cotisations_chomage":
      case "cotisations_csg":
        return <CotisationsDetailModal data={data} type={modalType.replace("cotisations_", "")} />;
      case "brut_net_explication":
        return <BrutNetModal data={data} />;
      default:
        // Try to show pedagogical explanation from data if available
        return <GenericExplanationModal data={data} modalType={modalType} />;
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      brut_net_explication: "📖 Comment on passe de brut à net ?",
      rsu_sell_to_cover: "📊 RSU Sell-To-Cover : Explication détaillée",
      rsu_simple: "📊 RSU Simple : Explication détaillée",
      actions_gratuites_qualifie: "🎁 Actions gratuites — Plan qualifié",
      actions_gratuites_non_qualifie: "⚠️ Actions gratuites — Plan non qualifié",
      espp: "🏪 ESPP : Plan d'achat d'actions",
      avantages_nature: "🍽️ Avantages en nature compensés",
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

function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground mb-1">{title}</div>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function InfoBox({ type = "info", children }: { type?: "info" | "success" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200",
    success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-200",
  };
  return (
    <div className={`rounded-lg border p-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}

function RSUSellToCoverModal({ data }: { data: any }) {
  const rsu = data.remuneration_equity?.rsu_restricted_stock_units;
  if (!rsu) return <p>Données RSU non disponibles.</p>;

  return (
    <div className="space-y-4">
      <p>
        <strong>{data.employeur?.nom || "L'entreprise"}</strong> t'a attribué{" "}
        <strong>{fmt(rsu.gain_brut_total)}</strong> d'actions RSU ce mois-ci.
      </p>

      <div className="space-y-4">
        <StepCard number={1} title="Vesting des RSU">
          Les actions deviennent acquises. Valeur totale : {fmt(rsu.gain_brut_total)}.
        </StepCard>
        <StepCard number={2} title="Calcul des taxes">
          <div className="space-y-1 mt-1">
            <div className="flex justify-between">
              <span>Cotisations sociales</span>
              <span className="font-medium">{fmt(rsu.cotisations_supplementaires_estimees)}</span>
            </div>
            {rsu.impot_supplementaire_estime && (
              <div className="flex justify-between">
                <span>Impôt sur le revenu</span>
                <span className="font-medium">{fmt(rsu.impot_supplementaire_estime)}</span>
              </div>
            )}
          </div>
        </StepCard>
        <StepCard number={3} title={`Vente automatique (${rsu.quotite_cedee_pct || 45}%)`}>
          {rsu.nb_actions_vendues || "?"} actions vendues automatiquement pour couvrir les impôts.
          Valeur vendue : {fmt(rsu.valeur_actions_vendues)}.
        </StepCard>
        <StepCard number={4} title="Résultat pour toi">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Actions conservées</div>
              <div className="font-bold text-green-700 dark:text-green-400">{fmt(rsu.valeur_actions_conservees)}</div>
              <div className="text-xs text-muted-foreground">{rsu.nb_actions_conservees} actions</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Cash reçu (STC)</div>
              <div className="font-bold text-blue-700 dark:text-blue-400">{fmt(rsu.remboursement_stc_ou_broker)}</div>
              <div className="text-xs text-muted-foreground">Ajouté au net payé</div>
            </div>
          </div>
        </StepCard>
      </div>

      <InfoBox type="info">
        💡 <strong>Conseil</strong> : Tes {rsu.nb_actions_conservees} actions conservées sont à toi. Tu peux les vendre quand tu veux.
        Garde-les au moins 2 ans pour bénéficier d'un abattement fiscal de 50%.
      </InfoBox>

      <InfoBox type="warning">
        ⚠️ <strong>Diversification</strong> : Ne mets pas tout ton patrimoine dans les actions de ton employeur.
      </InfoBox>
    </div>
  );
}

function RSUSimpleModal({ data }: { data: any }) {
  const rsu = data.remuneration_equity?.rsu_restricted_stock_units;
  if (!rsu) return <p>Données RSU non disponibles.</p>;

  return (
    <div className="space-y-4">
      <p>
        Des RSU d'une valeur de <strong>{fmt(rsu.gain_brut_total)}</strong> sont devenues acquises.
      </p>
      <StepCard number={1} title="Ajout au brut">
        Le gain RSU est ajouté à ton brut pour le calcul des cotisations sociales.
      </StepCard>
      <StepCard number={2} title="Reprise RSU">
        Le gain est ensuite retiré de ton net à payer (ligne "Reprise RSU").
      </StepCard>
      <StepCard number={3} title="Remboursement broker">
        {fmt(rsu.remboursement_stc_ou_broker)} d'impôt prélevé par le broker te sont remboursés.
      </StepCard>
      {rsu.mecanisme_description && (
        <InfoBox type="info">💡 {rsu.mecanisme_description}</InfoBox>
      )}
    </div>
  );
}

function ActionsGratuitesQualifieModal({ data }: { data: any }) {
  const ag = data.remuneration_equity?.actions_gratuites_acquises || [];
  const totalActions = ag.reduce((acc: number, a: any) => acc + (a.nb_actions || 0), 0);
  const totalValeur = ag.reduce((acc: number, a: any) => acc + (a.valeur_fiscale_totale || 0), 0);

  return (
    <div className="space-y-4">
      <InfoBox type="success">
        ✅ <strong>Plan qualifié</strong> — Ton plan respecte les conditions légales françaises.
        Tu bénéficies d'une fiscalité ultra-avantageuse !
      </InfoBox>

      <div className="space-y-3">
        <div className="font-semibold">Ce que ça signifie :</div>
        <div className="space-y-2 text-muted-foreground">
          <p>1️⃣ <strong>AUCUN IMPÔT à payer ce mois-ci</strong> — La valeur de {fmt(totalValeur)} n'est PAS ajoutée à ton net imposable.</p>
          <p>2️⃣ <strong>Les {totalActions} actions sont maintenant à toi</strong> — Elles sont sur ton compte titre.</p>
          <p>3️⃣ <strong>Imposition uniquement à la VENTE</strong> — PFU 30% ou barème IR avec abattements possibles.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-semibold">💡 Stratégies possibles :</div>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
          <p><strong>Option 1 (Sécuriser)</strong> : Vendre immédiatement → récupérer {fmt(totalValeur)} en cash.</p>
          <p><strong>Option 2 (Optimiser)</strong> : Garder 2+ ans → abattement de 50% sur la plus-value.</p>
          <p><strong>Option 3 (Compromis)</strong> : Vendre 20-30% pour sécuriser du cash, garder le reste.</p>
        </div>
      </div>
    </div>
  );
}

function ActionsGratuitesNonQualifieModal({ data }: { data: any }) {
  const ag = data.remuneration_equity?.actions_gratuites_acquises || [];
  const totalActions = ag.reduce((acc: number, a: any) => acc + (a.nb_actions || 0), 0);
  const totalValeur = ag.reduce((acc: number, a: any) => acc + (a.valeur_fiscale_totale || 0), 0);

  return (
    <div className="space-y-4">
      <InfoBox type="warning">
        ⚠️ <strong>Plan non qualifié</strong> — La valeur des actions est ajoutée à ton net imposable.
        Tu paies l'impôt immédiatement ce mois-ci.
      </InfoBox>
      <p>
        {totalActions} actions ({fmt(totalValeur)}) sont devenues acquises. L'impôt est prélevé via le PAS
        ce mois-ci, même si tu n'as pas reçu de cash.
      </p>
      <InfoBox type="info">
        💡 <strong>Conseil</strong> : Vends au moins 10-15% des actions rapidement pour récupérer du cash et compenser l'impôt payé.
      </InfoBox>
    </div>
  );
}

function ESPPModal({ data }: { data: any }) {
  const espp = data.remuneration_equity?.espp_employee_stock_purchase_plan;
  if (!espp) return null;

  return (
    <div className="space-y-4">
      <p>Tu participes à l'ESPP de <strong>{data.employeur?.nom || "ton entreprise"}</strong>.</p>
      <div className="space-y-3">
        <StepCard number={1} title="Prélèvement mensuel">
          {fmt(espp.contribution_mensuelle)} prélevés sur ton net payé chaque mois.
        </StepCard>
        <StepCard number={2} title="Achat d'actions (tous les 6 mois)">
          L'entreprise utilise ces fonds pour acheter des actions à ta place, avec une décote de 15%.
        </StepCard>
        <StepCard number={3} title="Gain automatique">
          Si l'action vaut 100€, tu l'achètes 85€ → gain immédiat de 15% !
        </StepCard>
      </div>
      <InfoBox type="success">
        ✅ L'ESPP est un excellent dispositif d'épargne. Tu peux revendre les actions dès réception pour sécuriser le gain de 15%.
      </InfoBox>
    </div>
  );
}

function AvantagesNatureModal({ data }: { data: any }) {
  const av = data.remuneration_equity?.avantages_nature_compenses;
  if (!av) return null;

  return (
    <div className="space-y-4">
      <p>
        <strong>{data.employeur?.nom || "L'entreprise"}</strong> te fournit des repas gratuits d'une valeur de{" "}
        {fmt(av.food_bik_benefit_in_kind)}/mois.
      </p>
      <div className="space-y-1 bg-muted/50 rounded-lg p-3">
        <div className="flex justify-between">
          <span>Avantage en nature (BIK)</span>
          <span className="font-medium">{fmt(av.food_bik_benefit_in_kind)}</span>
        </div>
        <div className="flex justify-between">
          <span>Compensation fiscale (Gross-Up)</span>
          <span className="font-medium text-green-600">+{fmt(av.gross_up_compensation)}</span>
        </div>
        <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
          <span>Impact net</span>
          <span>≈ 0 €</span>
        </div>
      </div>
      <InfoBox type="success">
        ✅ L'employeur compense intégralement l'impact fiscal. Tu profites de l'avantage SANS perte nette.
      </InfoBox>
    </div>
  );
}

function CotisationsDetailModal({ data, type }: { data: any; type: string }) {
  const cs = data.cotisations_salariales || {};
  const cp = data.cotisations_patronales || {};

  const details: Record<string, { label: string; sal: number | null; pat: number | null }[]> = {
    retraite: [
      { label: "Vieillesse plafonnée", sal: cs.vieillesse_plafonnee, pat: cp.vieillesse_patronale },
      { label: "Vieillesse déplafonnée", sal: cs.vieillesse_deplafonnee, pat: null },
      { label: "Retraite complémentaire T1", sal: cs.retraite_complementaire_tranche1, pat: cp.retraite_complementaire_patronale },
      { label: "Retraite complémentaire T2", sal: cs.retraite_complementaire_tranche2, pat: null },
      { label: "CEG", sal: cs.ceg_salarie, pat: null },
      { label: "CET", sal: cs.cet_salarie, pat: null },
      { label: "APEC", sal: cs.apec_ou_agirc_arrco, pat: null },
    ],
    sante: [
      { label: "Maladie", sal: cs.sante_maladie, pat: cp.sante_maladie_patronale },
      { label: "Complémentaire santé", sal: cs.complementaire_sante_salarie, pat: cp.complementaire_sante_patronale },
      { label: "Prévoyance", sal: cs.prevoyance_salarie, pat: cp.prevoyance_patronale },
    ],
    chomage: [
      { label: "Assurance chômage", sal: cs.assurance_chomage, pat: cp.assurance_chomage_patronale },
    ],
    csg: [
      { label: "CSG déductible", sal: cs.csg_deductible, pat: null },
      { label: "CSG/CRDS non déductible", sal: cs.csg_crds_non_deductible, pat: null },
    ],
  };

  const rows = details[type] || [];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 text-xs font-semibold">
          <span>Cotisation</span>
          <span className="text-right">Part salariale</span>
          <span className="text-right">Part patronale</span>
        </div>
        {rows.filter(r => r.sal || r.pat).map((row, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 p-3 border-t text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-right font-medium">{row.sal ? fmt(row.sal) : "—"}</span>
            <span className="text-right font-medium">{row.pat ? fmt(row.pat) : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrutNetModal({ data }: { data: any }) {
  const brut = data.remuneration_brute?.total_brut;
  const cotSal = data.cotisations_salariales?.total_cotisations_salariales;
  const netAvantImpot = data.net?.net_avant_impot;
  const pas = data.net?.montant_pas;
  const tauxPas = data.net?.taux_pas_pct;
  const netPaye = data.net?.net_paye;
  const cotPat = data.cotisations_patronales?.total_cotisations_patronales;
  const coutTotal = data.informations_complementaires?.cout_total_employeur;

  const cotPct = brut && cotSal ? Math.round((cotSal / brut) * 100) : null;

  // If we lack detailed data, show a text-only explanation
  if (!brut && !netPaye) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Ton bulletin de paie suit toujours le même chemin pour arriver au montant versé sur ton compte :
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">1️⃣</span>
            <div>
              <div className="font-semibold text-foreground">Salaire brut</div>
              <p className="text-muted-foreground text-sm">C'est le montant total avant toute déduction : salaire de base + primes + heures sup + avantages.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">2️⃣</span>
            <div>
              <div className="font-semibold text-foreground">− Cotisations sociales (~22-25%)</div>
              <p className="text-muted-foreground text-sm">Retraite, santé, chômage, CSG/CRDS. Ces cotisations financent ta protection sociale.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">3️⃣</span>
            <div>
              <div className="font-semibold text-foreground">= Net avant impôt</div>
              <p className="text-muted-foreground text-sm">Ce que tu gagnes après cotisations, avant l'impôt sur le revenu.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">4️⃣</span>
            <div>
              <div className="font-semibold text-foreground">− Prélèvement à la source (PAS)</div>
              <p className="text-muted-foreground text-sm">L'impôt sur le revenu prélevé chaque mois. Le taux dépend de tes revenus de l'année précédente.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">5️⃣</span>
            <div>
              <div className="font-semibold text-foreground">= Net payé 💰</div>
              <p className="text-muted-foreground text-sm">Le montant réellement versé sur ton compte bancaire.</p>
            </div>
          </div>
        </div>
        <InfoBox type="info">
          💡 Lance l'analyse avancée pour voir la décomposition exacte avec les montants de ton bulletin.
        </InfoBox>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual flow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <span className="text-sm font-medium text-foreground">Salaire brut</span>
          <span className="text-lg font-bold text-foreground">{fmt(brut)}</span>
        </div>

        <div className="flex items-center justify-center text-muted-foreground text-sm">
          − Cotisations sociales{cotPct ? ` (~${cotPct}%)` : ""}
        </div>

        <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
          <span className="text-sm text-muted-foreground">Cotisations salariales</span>
          <span className="text-base font-bold text-red-600 dark:text-red-400">− {fmt(cotSal)}</span>
        </div>

        <div className="flex items-center justify-center text-muted-foreground text-sm">=</div>

        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <span className="text-sm font-medium text-foreground">Net avant impôt</span>
          <span className="text-base font-bold text-foreground">{fmt(netAvantImpot)}</span>
        </div>

        <div className="flex items-center justify-center text-muted-foreground text-sm">
          − Impôt sur le revenu (PAS {tauxPas ? `${Math.abs(tauxPas).toFixed(1)}%` : ""})
        </div>

        <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
          <span className="text-sm text-muted-foreground">Prélèvement à la source</span>
          <span className="text-base font-bold text-red-600 dark:text-red-400">− {fmt(Math.abs(pas || 0))}</span>
        </div>

        <div className="flex items-center justify-center text-muted-foreground text-sm">=</div>

        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <span className="text-base font-bold text-green-700 dark:text-green-400">NET PAYÉ</span>
          <span className="text-xl font-extrabold text-green-700 dark:text-green-400">{fmt(netPaye)}</span>
        </div>
      </div>

      {/* Employer cost info */}
      {(cotPat || coutTotal) && (
        <InfoBox type="info">
          💡 Ton employeur paie aussi {cotPat ? fmt(cotPat) : "des cotisations patronales"} de charges patronales.
          {coutTotal ? ` Coût total pour ${data.employeur?.nom || "l'entreprise"} : ${fmt(coutTotal)} ce mois-ci.` : ""}
        </InfoBox>
      )}
    </div>
  );
}
