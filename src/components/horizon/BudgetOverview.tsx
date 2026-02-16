import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, PiggyBank, Settings2, Download, CheckCircle2 } from "lucide-react";
import { useUserFinancialProfile } from "@/hooks/useUserFinancialProfile";
import type { HorizonBudget } from "@/hooks/useHorizonBudget";

interface BudgetOverviewProps {
  budget: HorizonBudget;
  allocatedCapital: number;
  allocatedMonthly: number;
  onEditBudget: (data: { total_initial_capital: number; total_monthly_savings: number }) => Promise<void>;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function BudgetOverview({ budget, allocatedCapital, allocatedMonthly, onEditBudget }: BudgetOverviewProps) {
  const [editing, setEditing] = useState(false);
  const [capital, setCapital] = useState(String(budget.total_initial_capital));
  const [monthly, setMonthly] = useState(String(budget.total_monthly_savings));
  const [importedFromProfile, setImportedFromProfile] = useState(false);
  const { profile } = useUserFinancialProfile();

  const capitalPct = budget.total_initial_capital > 0 ? Math.min(100, (allocatedCapital / budget.total_initial_capital) * 100) : 0;
  const monthlyPct = budget.total_monthly_savings > 0 ? Math.min(100, (allocatedMonthly / budget.total_monthly_savings) * 100) : 0;

  const handleImportFromProfile = () => {
    if (profile?.capacite_epargne_mensuelle) {
      setMonthly(String(profile.capacite_epargne_mensuelle));
      setImportedFromProfile(true);
    }
  };

  const handleSave = async () => {
    await onEditBudget({
      total_initial_capital: Number(capital) || 0,
      total_monthly_savings: Number(monthly) || 0,
    });
    setEditing(false);
    setImportedFromProfile(false);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Mon Budget Global</h3>
            <Button variant="ghost" size="sm" onClick={() => {
              setCapital(String(budget.total_initial_capital));
              setMonthly(String(budget.total_monthly_savings));
              setEditing(true);
            }}>
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Capital */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                Capital alloué
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{fmt(allocatedCapital)}</span>
                <span className="text-sm text-muted-foreground">/ {fmt(budget.total_initial_capital)}</span>
              </div>
              <Progress value={capitalPct} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Disponible : {fmt(budget.total_initial_capital - allocatedCapital)}
              </p>
            </div>

            {/* Monthly */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PiggyBank className="h-4 w-4 text-primary" />
                Épargne mensuelle allouée
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{fmt(allocatedMonthly)}</span>
                <span className="text-sm text-muted-foreground">/ {fmt(budget.total_monthly_savings)}</span>
              </div>
              <Progress value={monthlyPct} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Disponible : {fmt(budget.total_monthly_savings - allocatedMonthly)}/mois
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editing} onOpenChange={(open) => { setEditing(open); if (!open) setImportedFromProfile(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier mon budget</DialogTitle>
            <DialogDescription>
              Ajustez votre enveloppe globale. Ces montants seront répartis entre vos projets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Capital initial disponible (€)</Label>
              <Input type="number" min="0" value={capital} onChange={e => setCapital(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Épargne mensuelle disponible (€/mois)</Label>
              <Input type="number" min="0" value={monthly} onChange={e => { setMonthly(e.target.value); setImportedFromProfile(false); }} />
              {profile?.capacite_epargne_mensuelle ? (
                <div className="pt-1">
                  {!importedFromProfile ? (
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
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
