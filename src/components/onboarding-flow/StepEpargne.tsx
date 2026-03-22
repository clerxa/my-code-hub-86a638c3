import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PiggyBank, Building2, Info } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { motion } from "framer-motion";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepEpargneProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function StepEpargne({ onNext, onSkip, onBack }: StepEpargneProps) {
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    capacite_epargne_mensuelle: profile?.capacite_epargne_mensuelle || 0,
    epargne_actuelle: profile?.epargne_actuelle || 0,
    epargne_livrets: profile?.epargne_livrets || 0,
    apport_disponible: profile?.apport_disponible || 0,
    patrimoine_assurance_vie: profile?.patrimoine_assurance_vie || 0,
    patrimoine_per: profile?.patrimoine_per || 0,
    patrimoine_pea: profile?.patrimoine_pea || 0,
    patrimoine_scpi: profile?.patrimoine_scpi || 0,
    patrimoine_crypto: profile?.patrimoine_crypto || 0,
    patrimoine_private_equity: profile?.patrimoine_private_equity || 0,
    patrimoine_autres: profile?.patrimoine_autres || 0,
    patrimoine_immo_valeur: profile?.patrimoine_immo_valeur || 0,
    patrimoine_immo_credit_restant: profile?.patrimoine_immo_credit_restant || 0,
    tmi: profile?.tmi || 0,
    parts_fiscales: profile?.parts_fiscales || 1,
    plafond_per_reportable: profile?.plafond_per_reportable || 0,
    objectif_achat_immo: profile?.objectif_achat_immo || false,
    projet_residence_principale: profile?.projet_residence_principale || false,
    projet_residence_secondaire: profile?.projet_residence_secondaire || false,
    projet_investissement_locatif: profile?.projet_investissement_locatif || false,
    budget_achat_immo: profile?.budget_achat_immo || null,
    budget_residence_principale: profile?.budget_residence_principale || null,
    budget_residence_secondaire: profile?.budget_residence_secondaire || null,
    budget_investissement_locatif: profile?.budget_investissement_locatif || null,
    duree_emprunt_souhaitee: profile?.duree_emprunt_souhaitee || 20,
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
      {/* Épargne */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-hero)] shadow-md">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Épargne & Patrimoine</CardTitle>
              <CardDescription>
                Votre patrimoine financier et immobilier constitue la base de votre bilan patrimonial. Même des montants approximatifs nous permettent de vous fournir des recommandations adaptées.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="capacite_epargne_mensuelle" label="Capacité d'épargne (€/mois)" placeholder="Ex: 500" desc="Ce que vous pouvez mettre de côté" />
            <NumField fieldKey="epargne_actuelle" label="Épargne totale actuelle (€)" placeholder="Ex: 15 000" />
            <NumField fieldKey="epargne_livrets" label="Épargne livrets (€)" placeholder="Ex: 10 000" desc="Livret A, LDDS, LEP..." />
            <NumField fieldKey="apport_disponible" label="Apport disponible (€)" placeholder="0" desc="Pour un futur achat immobilier" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Patrimoine financier</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumField fieldKey="patrimoine_assurance_vie" label="Assurance-vie (€)" />
              <NumField fieldKey="patrimoine_per" label="PER (€)" />
              <NumField fieldKey="patrimoine_pea" label="PEA / CTO (€)" />
              <NumField fieldKey="patrimoine_scpi" label="SCPI (€)" />
              <NumField fieldKey="patrimoine_crypto" label="Crypto (€)" />
              <NumField fieldKey="patrimoine_private_equity" label="Private Equity (€)" />
              <NumField fieldKey="patrimoine_autres" label="Autres placements (€)" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Patrimoine immobilier</Label>
            <div className="grid grid-cols-2 gap-3">
              <NumField fieldKey="patrimoine_immo_valeur" label="Valeur du bien (€)" placeholder="0" />
              <NumField fieldKey="patrimoine_immo_credit_restant" label="Capital restant dû (€)" placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiscalité */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">💶 Fiscalité</CardTitle>
          <CardDescription>Votre tranche marginale d'imposition (TMI) détermine l'impact réel de chaque décision financière. Si vous ne la connaissez pas, elle a pu être extraite automatiquement de votre avis d'imposition.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-sm flex items-center gap-1.5">
                TMI (%)
                <TooltipProvider><Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="text-xs max-w-xs">Tranche Marginale d'Imposition : 0%, 11%, 30%, 41% ou 45%.</p></TooltipContent></Tooltip></TooltipProvider>
              </Label>
              <Select value={String(formData.tmi || "")} onValueChange={(v) => updateField("tmi", parseFloat(v))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 %</SelectItem>
                  <SelectItem value="11">11 %</SelectItem>
                  <SelectItem value="30">30 %</SelectItem>
                  <SelectItem value="41">41 %</SelectItem>
                  <SelectItem value="45">45 %</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumField fieldKey="parts_fiscales" label="Parts fiscales" placeholder="Ex: 2.5" />
            <NumField fieldKey="plafond_per_reportable" label="Plafond PER reportable (€)" placeholder="0" />
          </div>
        </CardContent>
      </Card>

      {/* Projets immobiliers */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-origin)] shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Projets immobiliers</CardTitle>
              <CardDescription>Identifier vos projets nous permet de dimensionner votre capacité d'emprunt et de prioriser votre stratégie d'épargne.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <Label className="text-sm">Avez-vous un projet d'achat immobilier ?</Label>
            <Switch checked={formData.objectif_achat_immo as boolean || false} onCheckedChange={(v) => updateField("objectif_achat_immo", v)} />
          </div>

          {formData.objectif_achat_immo && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-3">
                {[
                  { key: "projet_residence_principale" as const, budgetKey: "budget_residence_principale" as const, label: "Résidence principale" },
                  { key: "projet_residence_secondaire" as const, budgetKey: "budget_residence_secondaire" as const, label: "Résidence secondaire" },
                  { key: "projet_investissement_locatif" as const, budgetKey: "budget_investissement_locatif" as const, label: "Investissement locatif" },
                ].map(item => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{item.label}</Label>
                      <Switch checked={formData[item.key] as boolean || false} onCheckedChange={(v) => updateField(item.key, v)} />
                    </div>
                    {formData[item.key] && (
                      <Input type="number" min={0} value={(formData[item.budgetKey] as number) || ""} onChange={(e) => updateField(item.budgetKey, parseFloat(e.target.value) || 0)} placeholder="Budget estimé (€)" className="h-9 text-sm" />
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField fieldKey="budget_achat_immo" label="Budget global (€)" placeholder="Ex: 300 000" />
                <div className="space-y-1">
                  <Label className="text-sm">Durée d'emprunt souhaitée</Label>
                  <Select value={String(formData.duree_emprunt_souhaitee || 20)} onValueChange={(v) => updateField("duree_emprunt_souhaitee", parseInt(v))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 15, 20, 25, 30].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} ans</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OnboardingNavButtons onNext={handleSubmit} onSkip={onSkip} onBack={onBack} isLoading={isSaving} />
    </motion.div>
  );
}
