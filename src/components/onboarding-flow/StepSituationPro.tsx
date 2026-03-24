import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepSituationProProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function StepSituationPro({ onNext, onSkip, onBack }: StepSituationProProps) {
  const { user } = useAuth();
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [jobTitle, setJobTitle] = useState("");
  const [formData, setFormData] = useState<FinancialProfileInput>({
    type_contrat: profile?.type_contrat || "",
    anciennete_annees: profile?.anciennete_annees || 0,
    secteur_activite: profile?.secteur_activite || null,
    has_rsu_aga: profile?.has_rsu_aga || false,
    has_espp: profile?.has_espp || false,
    has_stock_options: profile?.has_stock_options || false,
    has_bspce: profile?.has_bspce || false,
    has_equity_autres: profile?.has_equity_autres || false,
    valeur_rsu_aga: profile?.valeur_rsu_aga || 0,
    valeur_espp: profile?.valeur_espp || 0,
    valeur_stock_options: profile?.valeur_stock_options || 0,
    valeur_bspce: profile?.valeur_bspce || 0,
    has_pee: profile?.has_pee || false,
    has_perco: profile?.has_perco || false,
    has_pero: profile?.has_pero || false,
    has_epargne_autres: profile?.has_epargne_autres || false,
    valeur_pee: profile?.valeur_pee || 0,
    valeur_perco: profile?.valeur_perco || 0,
  });

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (jobTitle.trim()) {
      await supabase.from("profiles").update({ job_title: jobTitle.trim() }).eq("id", user!.id);
    }
    saveProfile(formData, { onSuccess: () => onNext() });
  };

  const equityItems = [
    { key: "has_rsu_aga" as const, valKey: "valeur_rsu_aga" as const, label: "RSU / AGA", emoji: "📈" },
    { key: "has_espp" as const, valKey: "valeur_espp" as const, label: "ESPP", emoji: "💹" },
    { key: "has_stock_options" as const, valKey: "valeur_stock_options" as const, label: "Stock-options", emoji: "⚡" },
    { key: "has_bspce" as const, valKey: "valeur_bspce" as const, label: "BSPCE", emoji: "🚀" },
  ];

  const savingsItems = [
    { key: "has_pee" as const, valKey: "valeur_pee" as const, label: "PEE", emoji: "🏦" },
    { key: "has_perco" as const, valKey: "valeur_perco" as const, label: "PERCO", emoji: "🎯" },
    { key: "has_pero" as const, valKey: null, label: "PERO", emoji: "🛡️" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-4xl">💼</span>
        <h2 className="text-2xl font-bold text-white">Situation professionnelle</h2>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Votre contrat et vos dispositifs d'entreprise impactent votre patrimoine et vos avantages fiscaux.
        </p>
      </div>

      {/* Job info */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Poste occupé</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex: Chef de projet" className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Type de contrat</Label>
            <Select value={formData.type_contrat || ""} onValueChange={(v) => updateField("type_contrat", v)}>
              <SelectTrigger className="bg-white/[0.06] border-white/[0.08] text-white"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CDI">CDI</SelectItem>
                <SelectItem value="CDD">CDD</SelectItem>
                <SelectItem value="Freelance">Freelance / Indépendant</SelectItem>
                <SelectItem value="Fonctionnaire">Fonctionnaire</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Secteur d'activité</Label>
            <Select value={formData.secteur_activite || ""} onValueChange={(v) => updateField("secteur_activite", v)}>
              <SelectTrigger className="bg-white/[0.06] border-white/[0.08] text-white"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tech">Tech / Numérique</SelectItem>
                <SelectItem value="finance">Finance / Banque</SelectItem>
                <SelectItem value="sante">Santé / Pharma</SelectItem>
                <SelectItem value="industrie">Industrie</SelectItem>
                <SelectItem value="commerce">Commerce / Distribution</SelectItem>
                <SelectItem value="conseil">Conseil / Services</SelectItem>
                <SelectItem value="public">Secteur public</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Ancienneté (années)</Label>
            <Input type="number" min={0} value={formData.anciennete_annees || ""} onChange={(e) => updateField("anciennete_annees", parseInt(e.target.value) || 0)} placeholder="Ex: 3" className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50" />
          </div>
        </div>
      </motion.div>

      {/* Equity */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-secondary/20 bg-secondary/[0.04] backdrop-blur-md p-6 space-y-4"
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📈</span>
          <div>
            <h3 className="text-sm font-semibold text-white">Rémunération en actions</h3>
            <p className="text-xs text-white/35">Identifiez vos dispositifs pour calculer votre patrimoine total</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {equityItems.map(item => (
            <div key={item.key} className="space-y-2">
              <button
                type="button"
                onClick={() => updateField(item.key, !(formData[item.key] as boolean))}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                  formData[item.key]
                    ? "border-secondary bg-secondary/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
                )}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
              {formData[item.key] && (
                <Input type="number" min={0} value={(formData[item.valKey] as number) || ""} onChange={(e) => updateField(item.valKey, parseFloat(e.target.value) || 0)} placeholder="Valeur estimée (€)" className="h-8 text-sm bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20" />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => updateField("has_equity_autres", !(formData.has_equity_autres as boolean))}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
            formData.has_equity_autres
              ? "border-secondary bg-secondary/10 text-white"
              : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
          )}
        >
          <span className="text-lg">✨</span>
          <span className="font-medium text-sm">Autres dispositifs</span>
        </button>
      </motion.div>

      {/* Savings */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-primary/20 bg-primary/[0.04] backdrop-blur-md p-6 space-y-4"
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏦</span>
          <div>
            <h3 className="text-sm font-semibold text-white">Épargne salariale</h3>
            <p className="text-xs text-white/35">Abondements et avantages fiscaux inclus</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {savingsItems.map(item => (
            <div key={item.key} className="space-y-2">
              <button
                type="button"
                onClick={() => updateField(item.key, !(formData[item.key] as boolean))}
                className={cn(
                  "w-full flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                  formData[item.key]
                    ? "border-primary bg-primary/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
                )}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="font-medium text-xs">{item.label}</span>
              </button>
              {formData[item.key] && item.valKey && (
                <Input type="number" min={0} value={(formData[item.valKey] as number) || ""} onChange={(e) => updateField(item.valKey, parseFloat(e.target.value) || 0)} placeholder="Valeur (€)" className="h-8 text-sm bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20" />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => updateField("has_epargne_autres", !(formData.has_epargne_autres as boolean))}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
            formData.has_epargne_autres
              ? "border-primary bg-primary/10 text-white"
              : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
          )}
        >
          <span className="text-lg">💎</span>
          <span className="font-medium text-sm">Autres dispositifs d'épargne</span>
        </button>
      </motion.div>

      <OnboardingNavButtons onNext={handleSubmit} onSkip={onSkip} onBack={onBack} isLoading={isSaving} />
    </div>
  );
}
