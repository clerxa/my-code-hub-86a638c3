import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, TrendingUp, PiggyBank } from "lucide-react";
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
    { key: "has_rsu_aga" as const, valKey: "valeur_rsu_aga" as const, label: "RSU / AGA", desc: "Actions gratuites" },
    { key: "has_espp" as const, valKey: "valeur_espp" as const, label: "ESPP", desc: "Plan d'achat d'actions" },
    { key: "has_stock_options" as const, valKey: "valeur_stock_options" as const, label: "Stock-options", desc: "Options sur actions" },
    { key: "has_bspce" as const, valKey: "valeur_bspce" as const, label: "BSPCE", desc: "Bons de souscription" },
  ];

  const savingsItems = [
    { key: "has_pee" as const, valKey: "valeur_pee" as const, label: "PEE", desc: "Plan d'Épargne Entreprise" },
    { key: "has_perco" as const, valKey: "valeur_perco" as const, label: "PERCO / PERCOL", desc: "Épargne Retraite Collectif" },
    { key: "has_pero" as const, valKey: null, label: "PERO (Art. 83)", desc: "Retraite Obligatoire" },
  ];

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
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Situation professionnelle</CardTitle>
              <CardDescription>
                Votre type de contrat et votre ancienneté impactent vos droits sociaux, votre capacité d'emprunt et vos avantages fiscaux.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Poste occupé</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex: Chef de projet, Développeur..." />
            </div>
            <div className="space-y-2">
              <Label>Type de contrat</Label>
              <Select value={formData.type_contrat || ""} onValueChange={(v) => updateField("type_contrat", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
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
            <div className="space-y-2">
              <Label>Secteur d'activité</Label>
              <Select value={formData.secteur_activite || ""} onValueChange={(v) => updateField("secteur_activite", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
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
            <div className="space-y-2">
              <Label>Ancienneté (années)</Label>
              <Input type="number" min={0} value={formData.anciennete_annees || ""} onChange={(e) => updateField("anciennete_annees", parseInt(e.target.value) || 0)} placeholder="Ex: 3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-legend)] shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Rémunération en actions</CardTitle>
              <CardDescription>
                Ces dispositifs représentent souvent une part significative de votre patrimoine. Les identifier permet de calculer votre patrimoine total et d'anticiper les impacts fiscaux.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {equityItems.map(item => (
              <div key={item.key} className="space-y-2">
                <label className={cn("flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all", formData[item.key] ? "bg-primary/5 border-primary" : "bg-background hover:bg-muted border-border")}>
                  <input type="checkbox" checked={formData[item.key] as boolean || false} onChange={(e) => updateField(item.key, e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                  <div>
                    <span className="font-medium text-sm">{item.label}</span>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </label>
                {formData[item.key] && (
                  <Input type="number" min={0} value={(formData[item.valKey] as number) || ""} onChange={(e) => updateField(item.valKey, parseFloat(e.target.value) || 0)} placeholder="Valeur estimée (€)" className="h-8 text-sm" />
                )}
              </div>
            ))}
          </div>
          <label className={cn("flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all", formData.has_equity_autres ? "bg-primary/5 border-primary" : "bg-background hover:bg-muted border-border")}>
            <input type="checkbox" checked={formData.has_equity_autres as boolean || false} onChange={(e) => updateField("has_equity_autres", e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
            <div>
              <span className="font-medium text-sm">Autres dispositifs</span>
              <p className="text-xs text-muted-foreground">Warrants, AGA spécifiques...</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Épargne salariale */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-origin)] shadow-md">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Épargne salariale</CardTitle>
              <CardDescription>
                Vos plans d'épargne salariale bénéficient souvent d'abondements et d'avantages fiscaux.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {savingsItems.map(item => (
              <div key={item.key} className="space-y-2">
                <label className={cn("flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all", formData[item.key] ? "bg-primary/5 border-primary" : "bg-background hover:bg-muted border-border")}>
                  <input type="checkbox" checked={formData[item.key] as boolean || false} onChange={(e) => updateField(item.key, e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                  <div>
                    <span className="font-medium text-sm">{item.label}</span>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </label>
                {formData[item.key] && item.valKey && (
                  <Input type="number" min={0} value={(formData[item.valKey] as number) || ""} onChange={(e) => updateField(item.valKey, parseFloat(e.target.value) || 0)} placeholder="Valeur estimée (€)" className="h-8 text-sm" />
                )}
              </div>
            ))}
          </div>
          <label className={cn("flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all", formData.has_epargne_autres ? "bg-primary/5 border-primary" : "bg-background hover:bg-muted border-border")}>
            <input type="checkbox" checked={formData.has_epargne_autres as boolean || false} onChange={(e) => updateField("has_epargne_autres", e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
            <div>
              <span className="font-medium text-sm">Autres dispositifs d'épargne</span>
              <p className="text-xs text-muted-foreground">CET, intéressement non investi...</p>
            </div>
          </label>
        </CardContent>
      </Card>

      <OnboardingNavButtons onNext={handleSubmit} onSkip={onSkip} onBack={onBack} isLoading={isSaving} />
    </motion.div>
  );
}
