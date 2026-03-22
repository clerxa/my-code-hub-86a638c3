import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, Users, Calendar } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface StepSituationPersonnelleProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepSituationPersonnelle({ onNext, onSkip }: StepSituationPersonnelleProps) {
  const { user } = useAuth();
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    date_naissance: profile?.date_naissance || "",
    situation_familiale: profile?.situation_familiale || "",
    nb_enfants: profile?.nb_enfants || 0,
    statut_residence: profile?.statut_residence || null,
  });

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Also sync to profiles table
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
            <div className="p-2 rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Votre situation personnelle</CardTitle>
              <CardDescription>
                Ces informations personnalisent vos recommandations fiscales et patrimoniales.
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
