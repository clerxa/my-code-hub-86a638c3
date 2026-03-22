import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { motion } from "framer-motion";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepChargesProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function StepCharges({ onNext, onSkip, onBack }: StepChargesProps) {
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    charges_fixes_mensuelles: profile?.charges_fixes_mensuelles || 0,
    loyer_actuel: profile?.loyer_actuel || 0,
    credits_immobilier: profile?.credits_immobilier || 0,
    credits_consommation: profile?.credits_consommation || 0,
    credits_auto: profile?.credits_auto || 0,
    pensions_alimentaires: profile?.pensions_alimentaires || 0,
    charges_copropriete_taxes: profile?.charges_copropriete_taxes || 0,
    charges_energie: profile?.charges_energie || 0,
    charges_assurance_habitation: profile?.charges_assurance_habitation || 0,
    charges_transport_commun: profile?.charges_transport_commun || 0,
    charges_assurance_auto: profile?.charges_assurance_auto || 0,
    charges_lld_loa_auto: profile?.charges_lld_loa_auto || 0,
    charges_internet: profile?.charges_internet || 0,
    charges_mobile: profile?.charges_mobile || 0,
    charges_abonnements: profile?.charges_abonnements || 0,
    charges_frais_scolarite: profile?.charges_frais_scolarite || 0,
    charges_autres: profile?.charges_autres || 0,
  });

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    saveProfile(formData, { onSuccess: () => onNext() });
  };

  const NumField = ({ fieldKey, label, placeholder, desc }: { fieldKey: keyof FinancialProfileInput; label: string; placeholder?: string; desc?: string }) => (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number" min={0}
        value={(formData[fieldKey] as number) || ""}
        onChange={(e) => updateField(fieldKey, parseFloat(e.target.value) || 0)}
        placeholder={placeholder || "0"}
        className="h-9 text-sm"
      />
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Logement */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-hero)] shadow-md">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Logement & Énergie</CardTitle>
              <CardDescription>Le logement est généralement votre premier poste de dépenses. Ces données servent à calculer votre reste à vivre et votre taux d'endettement.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="loyer_actuel" label="Loyer (€/mois)" placeholder="Ex: 900" />
            <NumField fieldKey="credits_immobilier" label="Crédit immobilier (€/mois)" placeholder="Ex: 1 200" />
            <NumField fieldKey="charges_copropriete_taxes" label="Copropriété & taxes (€/mois)" placeholder="Ex: 150" />
            <NumField fieldKey="charges_energie" label="Énergie (€/mois)" placeholder="Ex: 120" />
            <NumField fieldKey="charges_assurance_habitation" label="Assurance habitation (€/mois)" placeholder="Ex: 30" />
          </div>
        </CardContent>
      </Card>

      {/* Transports */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">🚗 Transports & Mobilité</CardTitle>
          <CardDescription>Vos frais de transport impactent votre reste à vivre et peuvent ouvrir droit à des déductions fiscales.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="charges_transport_commun" label="Transport en commun (€/mois)" placeholder="Ex: 75" />
            <NumField fieldKey="charges_assurance_auto" label="Assurance auto (€/mois)" placeholder="Ex: 50" />
            <NumField fieldKey="charges_lld_loa_auto" label="LLD / LOA auto (€/mois)" placeholder="Ex: 300" />
            <NumField fieldKey="credits_auto" label="Crédit auto (€/mois)" placeholder="Ex: 200" />
          </div>
        </CardContent>
      </Card>

      {/* Autres charges */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">📱 Autres charges récurrentes</CardTitle>
          <CardDescription>Ces charges fixes réduisent votre capacité d'épargne mensuelle. Les identifier précisément nous aide à vous proposer des pistes d'optimisation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="charges_internet" label="Internet (€/mois)" placeholder="Ex: 35" />
            <NumField fieldKey="charges_mobile" label="Mobile (€/mois)" placeholder="Ex: 20" />
            <NumField fieldKey="charges_abonnements" label="Abonnements (€/mois)" placeholder="Ex: 40" desc="Netflix, Spotify, salle de sport..." />
            <NumField fieldKey="charges_frais_scolarite" label="Frais de scolarité (€/mois)" placeholder="0" />
            <NumField fieldKey="credits_consommation" label="Crédit conso (€/mois)" placeholder="0" />
            <NumField fieldKey="pensions_alimentaires" label="Pension alimentaire (€/mois)" placeholder="0" />
            <NumField fieldKey="charges_autres" label="Autres charges (€/mois)" placeholder="0" />
          </div>
        </CardContent>
      </Card>

      <OnboardingNavButtons onNext={handleSubmit} onSkip={onSkip} onBack={onBack} isLoading={isSaving} />
    </motion.div>
  );
}
