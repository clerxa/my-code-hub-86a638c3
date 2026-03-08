import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { useOptimisationFiscaleCalculations } from "@/hooks/useOptimisationFiscaleCalculations";
import { useEffect } from "react";
import { HelpCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SituationFiscaleStepProps {
  data: Partial<OptimisationFiscaleSimulation>;
  onChange: (data: Partial<OptimisationFiscaleSimulation>) => void;
}

function FieldTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const SituationFiscaleStep = ({ data, onChange }: SituationFiscaleStepProps) => {
  const { calculerPlafondPERTotal, calculerImpot, calculerTMI } = useOptimisationFiscaleCalculations();

  // Calcul automatique de l'impôt, TMI et du plafond PER
  useEffect(() => {
    const updates: Partial<OptimisationFiscaleSimulation> = {};
    
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
    
    if (data.revenus_professionnels) {
      const plafondPER = data.revenus_professionnels * 0.10;
      const plafondPERTotal = calculerPlafondPERTotal(data);
      updates.plafond_per = plafondPER;
      updates.plafond_per_total = plafondPERTotal;
    }
    
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

  // TMI explanation
  const tmiExplanation = (() => {
    const tmi = data.tmi || 0;
    if (tmi === 0) return "Votre revenu est en dessous du seuil d'imposition.";
    if (tmi === 11) return "Chaque euro supplémentaire de revenu est imposé à 11 %. Le PER a un impact modéré à cette tranche.";
    if (tmi === 30) return "Chaque euro supplémentaire de revenu est imposé à 30 %. Le PER devient un levier intéressant : 1 € déduit = 0,30 € d'économie.";
    if (tmi === 41) return "Chaque euro supplémentaire est imposé à 41 %. Le PER est un levier très puissant : 1 € déduit = 0,41 € d'économie.";
    if (tmi === 45) return "Tranche la plus élevée. Le PER est le levier le plus efficace : 1 € déduit = 0,45 € d'économie d'impôt.";
    return "";
  })();

  return (
    <div className="space-y-6">
      {/* Encadré pédagogique */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Comment remplir cette étape ?</strong> Munissez-vous de votre dernier avis d'imposition. 
          Vous y trouverez votre revenu imposable, votre situation familiale et vos plafonds PER disponibles.
          Si vous n'avez pas votre avis sous la main, vous pouvez estimer votre revenu imposable en prenant 
          votre salaire net annuel × 0,9.
        </AlertDescription>
      </Alert>

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
              <Label htmlFor="revenu_imposable">
                Revenu imposable annuel (€)
                <FieldTooltip content="Montant en case 1AJ de votre déclaration de revenus (ou la somme des cases 1AJ + 1BJ pour un couple). Si vous ne le connaissez pas, prenez votre salaire net annuel × 0,9 comme estimation." />
              </Label>
              <Input
                id="revenu_imposable"
                type="number"
                value={data.revenu_imposable || ''}
                onChange={(e) => onChange({ ...data, revenu_imposable: parseFloat(e.target.value) || 0 })}
                placeholder="Ex : 50 000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenus_professionnels">
                Revenus professionnels (€)
                <FieldTooltip content="Vos salaires nets annuels (avant impôt). Ce montant sert uniquement à calculer votre plafond PER disponible (10 % de vos revenus professionnels, minimum 4 399 €)." />
              </Label>
              <Input
                id="revenus_professionnels"
                type="number"
                value={data.revenus_professionnels || ''}
                onChange={(e) => onChange({ ...data, revenus_professionnels: parseFloat(e.target.value) || 0 })}
                placeholder="Ex : 50 000"
              />
              <p className="text-xs text-muted-foreground">Utilisé pour calculer votre plafond PER (10 % de ce montant)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situation_familiale">
                Situation familiale
                <FieldTooltip content="Votre statut matrimonial détermine le nombre de parts fiscales et donc le calcul du quotient familial. Un couple marié ou pacsé bénéficie de 2 parts de base." />
              </Label>
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
              <Label htmlFor="nb_enfants">
                Nombre d'enfants à charge
                <FieldTooltip content="Chaque enfant ajoute une demi-part fiscale (1 part entière à partir du 3e enfant). Cela réduit votre quotient familial et donc votre impôt." />
              </Label>
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
                <span className="text-sm text-muted-foreground">
                  Tranche Marginale d'Imposition :
                  <FieldTooltip content="Le TMI est le taux auquel est imposé chaque euro supplémentaire de revenu. C'est la donnée la plus importante pour évaluer l'efficacité d'une déduction comme le PER." />
                </span>
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
            {tmiExplanation && data.tmi && data.tmi > 0 && (
              <p className="text-xs text-muted-foreground bg-background/50 rounded p-2 mt-2">
                💡 {tmiExplanation}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plafond PER disponible</CardTitle>
          <CardDescription>
            Plafonds non utilisés les années précédentes — retrouvez ces montants dans la rubrique "Plafond épargne retraite" de votre avis d'imposition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plafond_per_report_n1">
                Report N-1 (€)
                <FieldTooltip content="Plafond PER non utilisé l'année dernière. Indiqué sur votre dernier avis d'imposition, rubrique 'Plafond épargne retraite non utilisé'." />
              </Label>
              <Input
                id="plafond_per_report_n1"
                type="number"
                value={data.plafond_per_report_n1 || ''}
                onChange={(e) => onChange({ ...data, plafond_per_report_n1: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plafond_per_report_n2">
                Report N-2 (€)
                <FieldTooltip content="Plafond PER non utilisé il y a 2 ans. Les plafonds sont reportables sur 3 ans maximum." />
              </Label>
              <Input
                id="plafond_per_report_n2"
                type="number"
                value={data.plafond_per_report_n2 || ''}
                onChange={(e) => onChange({ ...data, plafond_per_report_n2: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plafond_per_report_n3">
                Report N-3 (€)
                <FieldTooltip content="Plafond PER non utilisé il y a 3 ans. Dernier exercice reportable — ce plafond sera perdu l'année prochaine s'il n'est pas utilisé." />
              </Label>
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

          {(data.plafond_per_report_n3 || 0) > 0 && (
            <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Votre report N-3 de <strong>{(data.plafond_per_report_n3 || 0).toLocaleString('fr-FR')} €</strong> expire 
                l'année prochaine. Pensez à l'utiliser en priorité pour ne pas le perdre.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
