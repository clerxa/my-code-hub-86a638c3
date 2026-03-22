import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, Wallet, PiggyBank } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { motion } from "framer-motion";

interface StepChargesEpargneProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepChargesEpargne({ onNext, onSkip }: StepChargesEpargneProps) {
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    charges_fixes_mensuelles: profile?.charges_fixes_mensuelles || 0,
    loyer_actuel: profile?.loyer_actuel || 0,
    credits_immobilier: profile?.credits_immobilier || 0,
    credits_consommation: profile?.credits_consommation || 0,
    capacite_epargne_mensuelle: profile?.capacite_epargne_mensuelle || 0,
    epargne_livrets: profile?.epargne_livrets || 0,
    patrimoine_assurance_vie: profile?.patrimoine_assurance_vie || 0,
    patrimoine_per: profile?.patrimoine_per || 0,
    patrimoine_pea: profile?.patrimoine_pea || 0,
    patrimoine_immo_valeur: profile?.patrimoine_immo_valeur || 0,
    patrimoine_immo_credit_restant: profile?.patrimoine_immo_credit_restant || 0,
  });

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    saveProfile(formData, { onSuccess: () => onNext() });
  };

  const chargesFields = [
    { key: "loyer_actuel" as const, label: "Loyer ou crédit immobilier (€/mois)", placeholder: "Ex: 900" },
    { key: "credits_consommation" as const, label: "Crédits à la consommation (€/mois)", placeholder: "Ex: 150" },
    { key: "charges_fixes_mensuelles" as const, label: "Autres charges fixes (€/mois)", placeholder: "Ex: 200" },
  ];

  const epargneFields = [
    { key: "capacite_epargne_mensuelle" as const, label: "Capacité d'épargne mensuelle (€)", placeholder: "Ex: 500", desc: "Montant que vous pouvez mettre de côté chaque mois" },
    { key: "epargne_livrets" as const, label: "Épargne sur livrets (€)", placeholder: "Ex: 10 000", desc: "Livret A, LDDS, LEP..." },
  ];

  const patrimoineFields = [
    { key: "patrimoine_assurance_vie" as const, label: "Assurance-vie (€)", placeholder: "0" },
    { key: "patrimoine_per" as const, label: "PER (€)", placeholder: "0" },
    { key: "patrimoine_pea" as const, label: "PEA / CTO (€)", placeholder: "0" },
    { key: "patrimoine_immo_valeur" as const, label: "Valeur immobilier (€)", placeholder: "0" },
    { key: "patrimoine_immo_credit_restant" as const, label: "Crédit immo restant (€)", placeholder: "0" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Charges */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Vos charges mensuelles</CardTitle>
              <CardDescription>
                Les principaux postes de dépenses récurrentes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chargesFields.map(item => (
              <div key={item.key} className="space-y-1.5">
                <Label className="text-sm">{item.label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={(formData[item.key] as number) || ""}
                  onChange={(e) => updateField(item.key, parseFloat(e.target.value) || 0)}
                  placeholder={item.placeholder}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Épargne */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Épargne & Patrimoine</CardTitle>
              <CardDescription>
                Indiquez vos montants d'épargne — même approximatifs, c'est utile.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Épargne mensuelle et livrets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {epargneFields.map(item => (
              <div key={item.key} className="space-y-1.5">
                <Label className="text-sm">{item.label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={(formData[item.key] as number) || ""}
                  onChange={(e) => updateField(item.key, parseFloat(e.target.value) || 0)}
                  placeholder={item.placeholder}
                />
                {item.desc && <p className="text-xs text-muted-foreground">{item.desc}</p>}
              </div>
            ))}
          </div>

          {/* Patrimoine détaillé */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Patrimoine (optionnel)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {patrimoineFields.map(item => (
                <div key={item.key} className="space-y-1">
                  <Label className="text-xs">{item.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={(formData[item.key] as number) || ""}
                    onChange={(e) => updateField(item.key, parseFloat(e.target.value) || 0)}
                    placeholder={item.placeholder}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={isSaving} size="lg" className="gap-2 px-8 shadow-md">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continuer <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Enregistrer et compléter plus tard
        </button>
      </div>
    </motion.div>
  );
}
