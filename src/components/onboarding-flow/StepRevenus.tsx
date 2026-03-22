import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, Loader2, Euro, Info } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { motion } from "framer-motion";

interface StepRevenusProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepRevenus({ onNext, onSkip }: StepRevenusProps) {
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    revenu_annuel_brut: profile?.revenu_annuel_brut || 0,
    revenu_mensuel_net: profile?.revenu_mensuel_net || 0,
    revenu_fiscal_annuel: profile?.revenu_fiscal_annuel || 0,
    revenu_fiscal_foyer: profile?.revenu_fiscal_foyer || 0,
    revenu_annuel_conjoint: profile?.revenu_annuel_conjoint || 0,
    revenu_annuel_brut_conjoint: profile?.revenu_annuel_brut_conjoint || 0,
    autres_revenus_mensuels: profile?.autres_revenus_mensuels || 0,
    revenus_locatifs: profile?.revenus_locatifs || 0,
    revenus_dividendes: profile?.revenus_dividendes || 0,
    revenus_ventes_actions: profile?.revenus_ventes_actions || 0,
    revenus_capital_autres: profile?.revenus_capital_autres || 0,
    has_equity_income_this_year: profile?.has_equity_income_this_year || false,
    equity_income_amount: profile?.equity_income_amount || 0,
  });

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    saveProfile(formData, { onSuccess: () => onNext() });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Revenus professionnels */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Vos revenus professionnels</CardTitle>
              <CardDescription>
                Vos revenus sont la base de toute analyse financière : calcul de votre taux d'imposition, de votre capacité d'épargne et de votre reste à vivre. Plus ces données sont précises, plus vos recommandations seront pertinentes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              💡 Vous retrouverez ces informations sur votre bulletin de paie de décembre ou votre avis d'imposition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Revenu annuel brut (€)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-xs">Montant brut annuel avant cotisations, visible sur votre contrat ou bulletin de décembre.</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number" min={0}
                value={formData.revenu_annuel_brut || ""}
                onChange={(e) => updateField("revenu_annuel_brut", parseFloat(e.target.value) || 0)}
                placeholder="Ex: 55 000"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Revenu net mensuel (€)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-xs">Montant net perçu chaque mois après cotisations et avant impôt.</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number" min={0}
                value={formData.revenu_mensuel_net || ""}
                onChange={(e) => updateField("revenu_mensuel_net", parseFloat(e.target.value) || 0)}
                placeholder="Ex: 3 500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Revenu fiscal de référence (€/an)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-xs">Ligne « Revenu fiscal de référence » sur votre avis d'imposition.</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number" min={0}
                value={formData.revenu_fiscal_annuel || ""}
                onChange={(e) => updateField("revenu_fiscal_annuel", parseFloat(e.target.value) || 0)}
                placeholder="Ex: 42 000"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Revenu fiscal du foyer (€/an)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-xs">Total des revenus imposables du foyer fiscal (conjoint inclus).</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number" min={0}
                value={formData.revenu_fiscal_foyer || ""}
                onChange={(e) => updateField("revenu_fiscal_foyer", parseFloat(e.target.value) || 0)}
                placeholder="Ex: 65 000"
              />
            </div>
          </div>

          {/* Conjoint */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Revenus nets annuels du conjoint (€)</Label>
              <Input
                type="number" min={0}
                value={formData.revenu_annuel_conjoint || ""}
                onChange={(e) => updateField("revenu_annuel_conjoint", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Si marié(e) ou pacsé(e)</p>
            </div>
            <div className="space-y-2">
              <Label>Revenu brut annuel du conjoint (€)</Label>
              <Input
                type="number" min={0}
                value={formData.revenu_annuel_brut_conjoint || ""}
                onChange={(e) => updateField("revenu_annuel_brut_conjoint", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Autres revenus */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Revenus complémentaires</CardTitle>
          <CardDescription>Revenus réguliers hors salaire principal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Autres revenus mensuels (€)</Label>
              <Input
                type="number" min={0}
                value={formData.autres_revenus_mensuels || ""}
                onChange={(e) => updateField("autres_revenus_mensuels", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Revenus locatifs mensuels (€)</Label>
              <Input
                type="number" min={0}
                value={formData.revenus_locatifs || ""}
                onChange={(e) => updateField("revenus_locatifs", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Dividendes annuels (€)</Label>
              <Input
                type="number" min={0}
                value={formData.revenus_dividendes || ""}
                onChange={(e) => updateField("revenus_dividendes", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Plus-values sur actions (€/an)</Label>
              <Input
                type="number" min={0}
                value={formData.revenus_ventes_actions || ""}
                onChange={(e) => updateField("revenus_ventes_actions", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Autres revenus du capital (€/an)</Label>
              <Input
                type="number" min={0}
                value={formData.revenus_capital_autres || ""}
                onChange={(e) => updateField("revenus_capital_autres", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Equity income this year */}
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Revenus d'actionnariat cette année ?</Label>
                <p className="text-xs text-muted-foreground">RSU vestées, ESPP vendues, stock-options exercées...</p>
              </div>
              <Switch
                checked={formData.has_equity_income_this_year as boolean || false}
                onCheckedChange={(v) => updateField("has_equity_income_this_year", v)}
              />
            </div>
            {formData.has_equity_income_this_year && (
              <div className="space-y-2">
                <Label className="text-sm">Montant estimé (€)</Label>
                <Input
                  type="number" min={0}
                  value={formData.equity_income_amount || ""}
                  onChange={(e) => updateField("equity_income_amount", parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 15 000"
                />
              </div>
            )}
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
