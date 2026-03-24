import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepSituationPersonnelleProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function StepSituationPersonnelle({ onNext, onSkip, onBack }: StepSituationPersonnelleProps) {
  const { user } = useAuth();
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    date_naissance: profile?.date_naissance || "",
    situation_familiale: profile?.situation_familiale || "",
    nb_enfants: profile?.nb_enfants || 0,
    nb_personnes_foyer: profile?.nb_personnes_foyer || 1,
    statut_residence: profile?.statut_residence || null,
  });

  const computeFoyerCount = (situation: string | null | undefined, enfants: number) => {
    const adults = (situation === "marie" || situation === "pacse") ? 2 : 1;
    return adults + enfants;
  };

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Auto-compute nb_personnes_foyer
      if (field === "situation_familiale" || field === "nb_enfants") {
        const sit = field === "situation_familiale" ? (value as string) : next.situation_familiale;
        const enf = field === "nb_enfants" ? (value as number) : (next.nb_enfants ?? 0);
        next.nb_personnes_foyer = computeFoyerCount(sit, enf);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const profileUpdates: Record<string, any> = {};
    if (formData.date_naissance) profileUpdates.birth_date = formData.date_naissance;
    if (formData.situation_familiale) profileUpdates.marital_status = formData.situation_familiale;
    if (formData.nb_enfants !== undefined) profileUpdates.children_count = formData.nb_enfants;

    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from("profiles").update(profileUpdates).eq("id", user!.id);
    }

    saveProfile(formData, { onSuccess: () => onNext() });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-hero)] shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Votre situation personnelle</CardTitle>
              <CardDescription>
                Votre situation familiale détermine votre nombre de parts fiscales et influence directement votre taux d'imposition. Ces données nous permettent d'adapter toutes vos projections.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date de naissance
            </Label>
            <Input
              type="date"
              value={formData.date_naissance || ""}
              onChange={(e) => updateField("date_naissance", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Utilisée pour calculer votre âge et adapter les projections retraite.
            </p>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre d'enfants à charge</Label>
              <Input
                type="number"
                min={0}
                value={formData.nb_enfants ?? 0}
                onChange={(e) => updateField("nb_enfants", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de personnes dans le foyer</Label>
              <Input
                type="number"
                min={1}
                value={formData.nb_personnes_foyer ?? 1}
                readOnly
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Calculé automatiquement (vous inclus·e)</p>
            </div>
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
                <SelectItem value="heberge">Hébergé(e) à titre gratuit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <OnboardingNavButtons
        onNext={handleSubmit}
        onSkip={onSkip}
        onBack={onBack}
        isLoading={isSaving}
      />
    </motion.div>
  );
}
