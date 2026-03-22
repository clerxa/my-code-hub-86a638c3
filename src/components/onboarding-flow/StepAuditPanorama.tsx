import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2 } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";

interface StepAuditPanoramaProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepAuditPanorama({ onNext, onSkip }: StepAuditPanoramaProps) {
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    situation_familiale: profile?.situation_familiale || "",
    nb_enfants: profile?.nb_enfants || 0,
    statut_residence: profile?.statut_residence || null,
    revenu_mensuel_net: profile?.revenu_mensuel_net || 0,
    charges_fixes_mensuelles: profile?.charges_fixes_mensuelles || 0,
    capacite_epargne_mensuelle: profile?.capacite_epargne_mensuelle || 0,
    epargne_livrets: profile?.epargne_livrets || 0,
  });

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    saveProfile(formData, { onSuccess: () => onNext() });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Complétez votre profil patrimonial</CardTitle>
          <CardDescription>
            Ces informations alimentent votre tableau de bord PANORAMA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Situation familiale</Label>
            <Select
              value={formData.situation_familiale || ""}
              onValueChange={(v) => updateField("situation_familiale", v)}
            >
              <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="celibataire">Célibataire</SelectItem>
                <SelectItem value="marie">Marié(e)</SelectItem>
                <SelectItem value="pacse">Pacsé(e)</SelectItem>
                <SelectItem value="divorce">Divorcé(e)</SelectItem>
                <SelectItem value="veuf">Veuf(ve)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre d'enfants à charge</Label>
            <Input
              type="number"
              min={0}
              value={formData.nb_enfants || 0}
              onChange={(e) => updateField("nb_enfants", parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>Statut de résidence</Label>
            <Select
              value={formData.statut_residence || ""}
              onValueChange={(v) => updateField("statut_residence", v)}
            >
              <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="locataire">Locataire</SelectItem>
                <SelectItem value="proprietaire">Propriétaire</SelectItem>
                <SelectItem value="heberge">Hébergé(e)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Revenus nets mensuels du foyer (€)</Label>
            <Input
              type="number"
              min={0}
              value={formData.revenu_mensuel_net || ""}
              onChange={(e) => updateField("revenu_mensuel_net", parseFloat(e.target.value) || 0)}
              placeholder="Ex: 3 500"
            />
          </div>

          <div className="space-y-2">
            <Label>Charges fixes mensuelles (€)</Label>
            <Input
              type="number"
              min={0}
              value={formData.charges_fixes_mensuelles || ""}
              onChange={(e) => updateField("charges_fixes_mensuelles", parseFloat(e.target.value) || 0)}
              placeholder="Ex: 1 200"
            />
          </div>

          <div className="space-y-2">
            <Label>Capacité d'épargne mensuelle (€)</Label>
            <Input
              type="number"
              min={0}
              value={formData.capacite_epargne_mensuelle || ""}
              onChange={(e) => updateField("capacite_epargne_mensuelle", parseFloat(e.target.value) || 0)}
              placeholder="Ex: 500"
            />
          </div>

          <div className="space-y-2">
            <Label>Épargne sur livrets (€)</Label>
            <Input
              type="number"
              min={0}
              value={formData.epargne_livrets || ""}
              onChange={(e) => updateField("epargne_livrets", parseFloat(e.target.value) || 0)}
              placeholder="Ex: 10 000"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continuer <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}
