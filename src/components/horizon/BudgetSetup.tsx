import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, PiggyBank, ArrowRight, ExternalLink, Download, CheckCircle2, Lightbulb } from "lucide-react";
import { useUserFinancialProfile } from "@/hooks/useUserFinancialProfile";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BudgetSetupProps {
  onSave: (data: { total_initial_capital: number; total_monthly_savings: number }) => Promise<void>;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export function BudgetSetup({ onSave }: BudgetSetupProps) {
  const [capital, setCapital] = useState("");
  const [monthly, setMonthly] = useState("");
  const [saving, setSaving] = useState(false);
  const [imported, setImported] = useState(false);
  const { profile } = useUserFinancialProfile();
  const navigate = useNavigate();

  const handleImportFromProfile = () => {
    if (profile?.capacite_epargne_mensuelle) {
      setMonthly(String(profile.capacite_epargne_mensuelle));
      setImported(true);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({
      total_initial_capital: Number(capital) || 0,
      total_monthly_savings: Number(monthly) || 0,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Context card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Comment ça marche ?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Horizon vous permet de planifier vos projets de vie en répartissant votre épargne de façon optimale.
                Commencez par définir votre <strong>enveloppe globale</strong> :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {[
                  "Le capital initial correspond à l'épargne que vous souhaitez mobiliser immédiatement pour vos projets (apport immobilier, placement initial…).",
                  "L'épargne mensuelle est le montant que vous pouvez consacrer chaque mois à vos projets futurs.",
                  "Ces montants seront ensuite répartis entre vos différents projets pour créer votre stratégie sur-mesure.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form card */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Configurez votre budget</CardTitle>
          <CardDescription>
            Renseignez votre capital disponible et votre capacité d'épargne mensuelle pour commencer à planifier vos projets.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-md mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="capital" className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Capital initial disponible
            </Label>
            <div className="relative">
              <Input
                id="capital"
                type="number"
                min="0"
                placeholder="50 000"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-primary" />
              Épargne mensuelle disponible
            </Label>
            <div className="relative">
              <Input
                id="monthly"
                type="number"
                min="0"
                placeholder="1 000"
                value={monthly}
                onChange={(e) => { setMonthly(e.target.value); setImported(false); }}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€/m</span>
            </div>

            {/* Import from profile button */}
            {profile?.capacite_epargne_mensuelle ? (
              <div className="space-y-1.5">
                {!imported ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5"
                    onClick={handleImportFromProfile}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Importer depuis mon profil ({fmt(profile.capacite_epargne_mensuelle)} €/mois)
                  </Button>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Importé depuis votre profil financier
                  </p>
                )}
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => navigate("/employee/profile?tab=savings&highlight=capacite_epargne_mensuelle")}
                >
                  Modifier dans mon profil
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ) : null}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || (!capital && !monthly)}
            className="w-full gap-2"
          >
            Commencer à planifier
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
