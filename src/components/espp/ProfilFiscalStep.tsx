import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { UserFiscalProfile } from "@/types/espp";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfilFiscalStepProps {
  profile: Partial<UserFiscalProfile>;
  onUpdate: (profile: Partial<UserFiscalProfile>) => void;
  onNext: () => void;
}

export const ProfilFiscalStep = ({ profile, onUpdate, onNext }: ProfilFiscalStepProps) => {
  const tmiOptions = [
    { value: 0, label: "0% - Non imposable", desc: "Revenu net imposable ≤ 11 294 €" },
    { value: 11, label: "11% - Tranche 1", desc: "11 295 € à 28 797 €" },
    { value: 30, label: "30% - Tranche 2", desc: "28 798 € à 82 341 €" },
    { value: 41, label: "41% - Tranche 3", desc: "82 342 € à 177 106 €" },
    { value: 45, label: "45% - Tranche 4", desc: "> 177 106 €" }
  ];

  const isValid = profile.tmi !== undefined && profile.mode_imposition_plus_value;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Profil Fiscal</h2>
        <p className="text-muted-foreground">Configurez vos paramètres fiscaux pour des calculs précis</p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Qu'est-ce que le TMI ?</strong> Le Taux Marginal d'Imposition correspond à la tranche d'impôt sur le revenu dans laquelle vous vous situez. Il s'applique uniquement à la partie de vos revenus qui dépasse le seuil de la tranche.
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-3">
          <Label htmlFor="tmi" className="text-base font-semibold">Tranche Marginale d'Imposition (TMI)</Label>
          <Select 
            value={profile.tmi?.toString()} 
            onValueChange={(val) => onUpdate({ ...profile, tmi: parseInt(val) as any })}
          >
            <SelectTrigger id="tmi" className="w-full">
              <SelectValue placeholder="Sélectionnez votre TMI" />
            </SelectTrigger>
            <SelectContent>
              {tmiOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="imposition" className="text-base font-semibold">Mode d'imposition des plus-values</Label>
          <Select 
            value={profile.mode_imposition_plus_value} 
            onValueChange={(val) => onUpdate({ ...profile, mode_imposition_plus_value: val as any })}
          >
            <SelectTrigger id="imposition" className="w-full">
              <SelectValue placeholder="Choisissez votre mode d'imposition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PFU">
                <div className="flex flex-col">
                  <span className="font-semibold">PFU - Prélèvement Forfaitaire Unique (30%)</span>
                  <span className="text-xs text-muted-foreground">12,8% d'impôt + 17,2% de prélèvements sociaux</span>
                </div>
              </SelectItem>
              <SelectItem value="Barème">
                <div className="flex flex-col">
                  <span className="font-semibold">Barème progressif (TMI + 17,2%)</span>
                  <span className="text-xs text-muted-foreground">Votre TMI + 17,2% de prélèvements sociaux</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {profile.mode_imposition_plus_value === 'Barème' && (
          <Alert className="bg-accent/10 border-accent/30">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm">
              Avec le barème progressif, vos plus-values seront imposées à votre TMI de <strong>{profile.tmi}%</strong> + 17,2% de prélèvements sociaux.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          size="lg"
          className="min-w-[200px]"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};
