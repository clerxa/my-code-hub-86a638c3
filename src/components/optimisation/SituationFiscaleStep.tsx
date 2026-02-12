import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { useOptimisationFiscaleCalculations } from "@/hooks/useOptimisationFiscaleCalculations";
import { useEffect } from "react";

interface SituationFiscaleStepProps {
  data: Partial<OptimisationFiscaleSimulation>;
  onChange: (data: Partial<OptimisationFiscaleSimulation>) => void;
}

export const SituationFiscaleStep = ({ data, onChange }: SituationFiscaleStepProps) => {
  const { calculerPlafondPERTotal, calculerImpot, calculerTMI } = useOptimisationFiscaleCalculations();

  // Calcul automatique de l'impôt, TMI et du plafond PER
  useEffect(() => {
    const updates: Partial<OptimisationFiscaleSimulation> = {};
    
    // Calcul automatique de l'impôt et du TMI
    if (data.revenu_imposable && data.situation_familiale !== undefined) {
      const impotCalcule = calculerImpot(
        data.revenu_imposable,
        data.situation_familiale || 'celibataire',
        data.nb_enfants || 0
      );
      const tmiCalcule = calculerTMI(
        data.revenu_imposable,
        data.situation_familiale || 'celibataire',
        data.nb_enfants || 0
      );
      updates.impot_avant = impotCalcule;
      updates.tmi = tmiCalcule;
    }
    
    // Calcul automatique du plafond PER
    if (data.revenus_professionnels) {
      const plafondPER = data.revenus_professionnels * 0.10;
      const plafondPERTotal = calculerPlafondPERTotal(data);
      updates.plafond_per = plafondPER;
      updates.plafond_per_total = plafondPERTotal;
    }
    
    // Mise à jour uniquement si des changements ont été calculés
    if (Object.keys(updates).length > 0) {
      onChange({
        ...data,
        ...updates,
      });
    }
  }, [
    data.revenu_imposable,
    data.situation_familiale,
    data.nb_enfants,
    data.revenus_professionnels,
    data.plafond_per_report_n1,
    data.plafond_per_report_n2,
    data.plafond_per_report_n3,
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Situation fiscale</CardTitle>
          <CardDescription>
            Renseignez vos informations fiscales pour calculer votre impôt actuel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenu_imposable">Revenu imposable annuel (€)</Label>
              <Input
                id="revenu_imposable"
                type="number"
                value={data.revenu_imposable || ''}
                onChange={(e) => onChange({ ...data, revenu_imposable: parseFloat(e.target.value) || 0 })}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenus_professionnels">Revenus professionnels (€)</Label>
              <Input
                id="revenus_professionnels"
                type="number"
                value={data.revenus_professionnels || ''}
                onChange={(e) => onChange({ ...data, revenus_professionnels: parseFloat(e.target.value) || 0 })}
                placeholder="50000"
              />
              <p className="text-xs text-muted-foreground">Pour le calcul du plafond PER</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situation_familiale">Situation familiale</Label>
              <Select
                value={data.situation_familiale || 'celibataire'}
                onValueChange={(value: any) => onChange({ ...data, situation_familiale: value })}
              >
                <SelectTrigger id="situation_familiale">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
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
              <Label htmlFor="nb_enfants">Nombre d'enfants à charge</Label>
              <Input
                id="nb_enfants"
                type="number"
                min="0"
                value={data.nb_enfants || 0}
                onChange={(e) => onChange({ ...data, nb_enfants: parseInt(e.target.value) || 0 })}
              />
            </div>

          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
            <h3 className="font-semibold text-sm">Résultats calculés automatiquement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tranche Marginale d'Imposition :</span>
                <span className="text-lg font-bold text-primary">
                  {data.tmi || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Impôt estimé actuel :</span>
                <span className="text-lg font-bold text-primary">
                  {(data.impot_avant || 0).toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plafond PER disponible</CardTitle>
          <CardDescription>
            Plafonds non utilisés les années précédentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plafond_per_report_n1">Report N-1 (€)</Label>
              <Input
                id="plafond_per_report_n1"
                type="number"
                value={data.plafond_per_report_n1 || ''}
                onChange={(e) => onChange({ ...data, plafond_per_report_n1: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plafond_per_report_n2">Report N-2 (€)</Label>
              <Input
                id="plafond_per_report_n2"
                type="number"
                value={data.plafond_per_report_n2 || ''}
                onChange={(e) => onChange({ ...data, plafond_per_report_n2: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plafond_per_report_n3">Report N-3 (€)</Label>
              <Input
                id="plafond_per_report_n3"
                type="number"
                value={data.plafond_per_report_n3 || ''}
                onChange={(e) => onChange({ ...data, plafond_per_report_n3: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Plafond PER total disponible :</span>
              <span className="text-lg font-bold text-primary">
                {(data.plafond_per_total || 0).toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
