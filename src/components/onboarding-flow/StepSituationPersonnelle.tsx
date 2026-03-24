import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
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

  const situationOptions = [
    { value: "celibataire", label: "Célibataire", emoji: "👤" },
    { value: "marie", label: "Marié(e)", emoji: "💑" },
    { value: "pacse", label: "Pacsé(e)", emoji: "🤝" },
    { value: "divorce", label: "Divorcé(e)", emoji: "📝" },
    { value: "veuf", label: "Veuf(ve)", emoji: "🕊️" },
  ];

  const residenceOptions = [
    { value: "locataire", label: "Locataire", emoji: "🏠" },
    { value: "proprietaire", label: "Propriétaire", emoji: "🏡" },
    { value: "heberge", label: "Hébergé(e)", emoji: "🏘️" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-4xl">👤</span>
        <h2 className="text-2xl font-bold text-white">Votre situation personnelle</h2>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Ces informations déterminent vos parts fiscales et influencent directement vos projections.
        </p>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-6 space-y-5"
      >
        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Date de naissance
          </Label>
          <Input
            type="date"
            value={formData.date_naissance || ""}
            onChange={(e) => updateField("date_naissance", e.target.value)}
            className="bg-white/[0.06] border-white/[0.08] text-white focus:border-primary/50"
          />
          <p className="text-[11px] text-white/25">
            Utilisée pour adapter vos projections retraite.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs">Situation familiale</Label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {situationOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("situation_familiale", opt.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                  formData.situation_familiale === opt.value
                    ? "border-primary bg-primary/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/70"
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-[10px] font-medium leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Enfants à charge</Label>
            <Input
              type="number"
              min={0}
              value={formData.nb_enfants ?? 0}
              onChange={(e) => updateField("nb_enfants", parseInt(e.target.value) || 0)}
              className="bg-white/[0.06] border-white/[0.08] text-white focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Personnes dans le foyer</Label>
            <Input
              type="number"
              min={1}
              value={formData.nb_personnes_foyer ?? 1}
              readOnly
              className="bg-white/[0.03] border-white/[0.05] text-white/50"
            />
            <p className="text-[10px] text-white/25">Calculé automatiquement</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs">Résidence principale</Label>
          <div className="grid grid-cols-3 gap-2">
            {residenceOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField("statut_residence", opt.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  formData.statut_residence === opt.value
                    ? "border-primary bg-primary/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/70"
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-[10px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <OnboardingNavButtons
        onNext={handleSubmit}
        onSkip={onSkip}
        onBack={onBack}
        isLoading={isSaving}
      />
    </div>
  );
}
