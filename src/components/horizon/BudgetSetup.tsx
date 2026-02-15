import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, PiggyBank, ArrowRight, ExternalLink } from "lucide-react";
import { useUserFinancialProfile } from "@/hooks/useUserFinancialProfile";
import { useNavigate } from "react-router-dom";

interface BudgetSetupProps {
  onSave: (data: { total_initial_capital: number; total_monthly_savings: number }) => Promise<void>;
}

export function BudgetSetup({ onSave }: BudgetSetupProps) {
  const [capital, setCapital] = useState("");
  const [monthly, setMonthly] = useState("");
  const [saving, setSaving] = useState(false);
  const { profile } = useUserFinancialProfile();
  const navigate = useNavigate();

  // Pre-fill monthly savings from financial profile
  useEffect(() => {
    if (profile?.capacite_epargne_mensuelle && !monthly) {
      setMonthly(String(profile.capacite_epargne_mensuelle));
    }
  }, [profile?.capacite_epargne_mensuelle]);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({
      total_initial_capital: Number(capital) || 0,
      total_monthly_savings: Number(monthly) || 0,
    });
    setSaving(false);
  };

  const isFromProfile = profile?.capacite_epargne_mensuelle && Number(monthly) === profile.capacite_epargne_mensuelle;

  return (
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
              onChange={(e) => setMonthly(e.target.value)}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€/m</span>
          </div>
          {profile?.capacite_epargne_mensuelle ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                {isFromProfile
                  ? "Pré-rempli depuis votre profil financier"
                  : `Votre profil indique ${new Intl.NumberFormat("fr-FR").format(profile.capacite_epargne_mensuelle)} €/mois`}
              </span>
              <span>·</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary"
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
  );
}
