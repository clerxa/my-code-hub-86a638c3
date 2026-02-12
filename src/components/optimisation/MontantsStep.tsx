import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { DISPOSITIFS, getDispositifIcon } from "@/lib/dispositifs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";

interface MontantsStepProps {
  data: Partial<OptimisationFiscaleSimulation>;
  onChange: (data: Partial<OptimisationFiscaleSimulation>) => void;
}

export const MontantsStep = ({ data, onChange }: MontantsStepProps) => {
  const fiscalRules = useFiscalRules();
  const dispositifsSelectionnes = data.dispositifs_selectionnes || [];

  const renderDispositifForm = (dispositifId: string) => {
    const dispositif = DISPOSITIFS.find((d) => d.id === dispositifId);
    if (!dispositif) return null;

    const Icon = getDispositifIcon(dispositif.icon);

    switch (dispositifId) {
      case 'per':
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montant_per">Montant à verser (€)</Label>
                <Input
                  id="montant_per"
                  type="number"
                  value={data.montant_per || ''}
                  onChange={(e) => onChange({ ...data, montant_per: parseFloat(e.target.value) || 0 })}
                  placeholder="5000"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Plafond PER disponible : <strong>{(data.plafond_per_total || 0).toLocaleString('fr-FR')} €</strong>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      case 'dons_75':
      case 'dons_66':
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`montant_${dispositifId}`}>Montant des dons (€)</Label>
                <Input
                  id={`montant_${dispositifId}`}
                  type="number"
                  value={dispositifId === 'dons_75' ? data.dons_75_montant || '' : data.dons_66_montant || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onChange({
                      ...data,
                      [dispositifId === 'dons_75' ? 'dons_75_montant' : 'dons_66_montant']: value,
                    });
                  }}
                  placeholder="500"
                />
              </div>
              {dispositifId === 'dons_75' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Les dons supérieurs à 1000€ basculeront automatiquement en réduction à 66%
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case 'aide_domicile':
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montant_aide_domicile">Montant annuel (€)</Label>
                <Input
                  id="montant_aide_domicile"
                  type="number"
                  value={data.montant_aide_domicile || ''}
                  onChange={(e) => onChange({ ...data, montant_aide_domicile: parseFloat(e.target.value) || 0 })}
                  placeholder="3000"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Crédit d'impôt : 50% des dépenses, plafonné à 6000€ (soit 3000€ de crédit maximum)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      case 'garde_enfants':
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montant_garde_enfant">Montant annuel (€)</Label>
                <Input
                  id="montant_garde_enfant"
                  type="number"
                  value={data.montant_garde_enfant || ''}
                  onChange={(e) => onChange({ ...data, montant_garde_enfant: parseFloat(e.target.value) || 0 })}
                  placeholder="2000"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Crédit d'impôt : 50% des dépenses, plafonné à 3500€ par enfant
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      case 'pinel':
      case 'pinel_om':
        const isPinelOM = dispositifId === 'pinel_om';
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`prix_${dispositifId}`}>Prix d'achat (€)</Label>
                <Input
                  id={`prix_${dispositifId}`}
                  type="number"
                  value={isPinelOM ? data.prix_pinel_om || '' : data.prix_pinel || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onChange({
                      ...data,
                      [isPinelOM ? 'prix_pinel_om' : 'prix_pinel']: value,
                    });
                  }}
                  placeholder="250000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`duree_${dispositifId}`}>Durée d'engagement</Label>
                  <Select
                    value={(isPinelOM ? data.duree_pinel_om : data.duree_pinel)?.toString() || '6'}
                    onValueChange={(value) => {
                      const duree = parseInt(value);
                      const taux = isPinelOM
                        ? duree === 6 ? 23 : duree === 9 ? 29 : 32
                        : duree === 6 ? 9 : duree === 9 ? 12 : 14;
                      onChange({
                        ...data,
                        [isPinelOM ? 'duree_pinel_om' : 'duree_pinel']: duree,
                        [isPinelOM ? 'taux_pinel_om' : 'taux_pinel']: taux,
                      });
                    }}
                  >
                    <SelectTrigger id={`duree_${dispositifId}`}>
                      <SelectValue placeholder="Durée" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 ans</SelectItem>
                      <SelectItem value="9">9 ans</SelectItem>
                      <SelectItem value="12">12 ans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Taux de réduction</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                    <span className="font-medium">
                      {isPinelOM ? data.taux_pinel_om || 23 : data.taux_pinel || 9}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'girardin':
        const tauxGirardin = data.taux_girardin || 110;
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montant_girardin">Montant investi (€)</Label>
                <Input
                  id="montant_girardin"
                  type="number"
                  value={data.montant_girardin || ''}
                  onChange={(e) => onChange({ ...data, montant_girardin: parseFloat(e.target.value) || 0 })}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taux_girardin">Période de souscription (taux estimés, non contractuels)</Label>
                <Select
                  value={tauxGirardin.toString()}
                  onValueChange={(value) => onChange({ ...data, taux_girardin: parseInt(value) })}
                >
                  <SelectTrigger id="taux_girardin">
                    <SelectValue placeholder="Sélectionner la période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={fiscalRules.girardin_rate_t1.toString()}>T1 (Jan-Mar) - {fiscalRules.girardin_rate_t1}% de réduction</SelectItem>
                    <SelectItem value={fiscalRules.girardin_rate_t2.toString()}>T2 (Avr-Jun) - {fiscalRules.girardin_rate_t2}% de réduction</SelectItem>
                    <SelectItem value={fiscalRules.girardin_rate_t3.toString()}>T3 (Jul-Sep) - {fiscalRules.girardin_rate_t3}% de réduction</SelectItem>
                    <SelectItem value={fiscalRules.girardin_rate_t4.toString()}>T4 (Oct-Déc) - {fiscalRules.girardin_rate_t4}% de réduction</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le taux varie selon la période de souscription : plus tôt dans l'année, plus le taux est avantageux.
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Réduction d'impôt : {tauxGirardin}% du montant investi (soit {((data.montant_girardin || 0) * tauxGirardin / 100).toLocaleString('fr-FR')} €)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      case 'pme_fcpi_fip':
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montant_pme">Montant investi (€)</Label>
                <Input
                  id="montant_pme"
                  type="number"
                  value={data.montant_pme || ''}
                  onChange={(e) => onChange({ ...data, montant_pme: parseFloat(e.target.value) || 0 })}
                  placeholder="10000"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Réduction d'impôt : 18% du montant investi (soit {((data.montant_pme || 0) * 0.18).toLocaleString('fr-FR')} €)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      case 'esus':
        return (
          <Card key={dispositifId}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{dispositif.nom}</CardTitle>
              </div>
              <CardDescription>{dispositif.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montant_esus">Montant investi (€)</Label>
                <Input
                  id="montant_esus"
                  type="number"
                  value={data.montant_esus || ''}
                  onChange={(e) => onChange({ ...data, montant_esus: parseFloat(e.target.value) || 0 })}
                  placeholder="10000"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Réduction d'impôt : 18% du montant investi, plafonné à 13 000€
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {dispositifsSelectionnes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucun dispositif sélectionné. Retournez à l'étape précédente pour en choisir.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Saisissez les montants pour chaque dispositif</h3>
            <p className="text-sm text-muted-foreground">
              Renseignez les montants que vous envisagez d'investir ou de dépenser
            </p>
          </div>
          {dispositifsSelectionnes.map(renderDispositifForm)}
        </div>
      )}
    </div>
  );
};
