import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calendar, Info, TrendingUp, Archive } from "lucide-react";
import { ESPPPlan } from "@/types/espp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useESPPCalculations } from "@/hooks/useESPPCalculations";

interface PlanESPPStepProps {
  plans: Partial<ESPPPlan>[];
  existingPlans: ESPPPlan[];
  onUpdate: (plans: Partial<ESPPPlan>[]) => void;
  onDelete: (planId: string) => Promise<void>;
  onSelectPlan: (planId: string) => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
}

export const PlanESPPStep = ({ plans, existingPlans, onUpdate, onDelete, onSelectPlan, onNext, onPrevious }: PlanESPPStepProps) => {
  const { calculerGainAcquisition } = useESPPCalculations();

  const addPlan = () => {
    onUpdate([...plans, {
      nom_plan: '',
      entreprise: '',
      devise_plan: 'USD',
      date_debut: '',
      date_fin: '',
      lookback: true,
      discount_pct: 15,
      fmv_debut: 0,
      fmv_fin: 0,
      montant_investi: 0,
      taux_change_payroll: 1,
    }]);
  };

  const removePlan = (index: number) => {
    const newPlans = plans.filter((_, i) => i !== index);
    onUpdate(newPlans);
  };

  const updatePlan = (index: number, updates: Partial<ESPPPlan>) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], ...updates };
    onUpdate(newPlans);
  };

  const isValid = plans.length > 0 && plans.every(plan => 
    plan.nom_plan && 
    plan.entreprise && 
    plan.date_debut && 
    plan.date_fin && 
    plan.fmv_debut && 
    plan.fmv_fin && 
    plan.montant_investi &&
    plan.taux_change_payroll
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Plans ESPP</h2>
        <p className="text-muted-foreground">Ajoutez vos différents plans d'achat d'actions</p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Plan ESPP :</strong> Un Employee Stock Purchase Plan permet d'acheter des actions de votre entreprise à prix réduit. Le <strong>lookback</strong> compare le prix en début et fin de période pour vous donner le meilleur prix. Le <strong>discount</strong> est la réduction appliquée (souvent 15%).
        </AlertDescription>
      </Alert>

      {/* Plans existants sauvegardés */}
      {existingPlans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Plans sauvegardés ({existingPlans.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingPlans.map((plan) => {
              const calcul = calculerGainAcquisition(plan);
              return (
                <Card key={plan.id} className="p-4 space-y-3 bg-accent/5 border-accent/20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-lg">{plan.nom_plan}</h4>
                      <p className="text-sm text-muted-foreground">{plan.entreprise}</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Période:</span>
                          <span className="font-medium">
                            {new Date(plan.date_debut).toLocaleDateString()} → {new Date(plan.date_fin).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Actions:</span>
                          <span className="font-medium">{calcul.quantiteActions.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gain acquisition:</span>
                          <span className="font-medium text-emerald-600">{calcul.gainAcquisitionEUR.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectPlan(plan.id)}
                        className="h-8 w-8 p-0"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(plan.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan, index) => {
          const calcul = calculerGainAcquisition(plan);
          
          return (
            <Card key={index} className="p-6 space-y-4 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Plan {index + 1}
                </h3>
                {plans.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removePlan(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du plan *</Label>
                  <Input 
                    placeholder="Ex: H1 2024"
                    value={plan.nom_plan || ''}
                    onChange={(e) => updatePlan(index, { nom_plan: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Entreprise *</Label>
                  <Input 
                    placeholder="Ex: Apple Inc."
                    value={plan.entreprise || ''}
                    onChange={(e) => updatePlan(index, { entreprise: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <Input 
                    type="date"
                    value={plan.date_debut || ''}
                    onChange={(e) => updatePlan(index, { date_debut: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date de fin *</Label>
                  <Input 
                    type="date"
                    value={plan.date_fin || ''}
                    onChange={(e) => updatePlan(index, { date_fin: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select 
                    value={plan.devise_plan || 'USD'}
                    onValueChange={(val) => updatePlan(index, { devise_plan: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dollar américain</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - Livre sterling</SelectItem>
                      <SelectItem value="CHF">CHF - Franc suisse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Taux de change (payroll) *</Label>
                  <Input 
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 0.92"
                    value={plan.taux_change_payroll || ''}
                    onChange={(e) => updatePlan(index, { taux_change_payroll: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>FMV début de période * ({plan.devise_plan || 'USD'})</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.00"
                    value={plan.fmv_debut || ''}
                    onChange={(e) => updatePlan(index, { fmv_debut: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>FMV fin de période * ({plan.devise_plan || 'USD'})</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Ex: 180.00"
                    value={plan.fmv_fin || ''}
                    onChange={(e) => updatePlan(index, { fmv_fin: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount (%) *</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={plan.discount_pct || 15}
                    onChange={(e) => updatePlan(index, { discount_pct: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Montant investi * ({plan.devise_plan || 'USD'})</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5000.00"
                    value={plan.montant_investi || ''}
                    onChange={(e) => updatePlan(index, { montant_investi: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Broker (optionnel)</Label>
                  <Input 
                    placeholder="Ex: Morgan Stanley"
                    value={plan.broker || ''}
                    onChange={(e) => updatePlan(index, { broker: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`lookback-${index}`}
                    checked={plan.lookback || false}
                    onCheckedChange={(checked) => updatePlan(index, { lookback: checked })}
                  />
                  <Label htmlFor={`lookback-${index}`} className="cursor-pointer">Lookback activé</Label>
                </div>
              </div>

              {calcul.quantiteActions > 0 && (
                <Alert className="bg-accent/10 border-accent/30">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <AlertDescription>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Actions achetées :</strong> {calcul.quantiteActions.toFixed(4)}</div>
                      <div><strong>Prix d'achat :</strong> {calcul.prixAchatFinal.toFixed(2)} {plan.devise_plan}</div>
                      <div><strong>Gain d'acquisition :</strong> {calcul.gainAcquisitionEUR.toFixed(2)} €</div>
                      <div><strong>PRU fiscal :</strong> {calcul.pruFiscalEUR.toFixed(4)} €</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          );
        })}
      </div>

      <Button 
        onClick={addPlan} 
        variant="outline" 
        className="w-full"
        size="lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un plan ESPP
      </Button>

      <div className="flex justify-between">
        <Button onClick={onPrevious} variant="outline" size="lg">
          Précédent
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg" className="min-w-[200px]">
          Continuer
        </Button>
      </div>
    </div>
  );
};
