import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { DISPOSITIFS, getDispositifIcon } from "@/lib/dispositifs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, HelpCircle, Info, Lightbulb } from "lucide-react";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";

interface MontantsStepProps {
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

function ExempleChiffre({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 mt-2">
      <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

export const MontantsStep = ({ data, onChange }: MontantsStepProps) => {
  const fiscalRules = useFiscalRules();
  const dispositifsSelectionnes = data.dispositifs_selectionnes || [];
  const tmi = data.tmi || 30;

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
                <Label htmlFor="montant_per">
                  Montant à verser (€)
                  <FieldTooltip content="Le PER est une déduction : le montant versé est retiré de votre revenu imposable. L'économie réelle dépend de votre TMI. Attention : l'épargne sera bloquée jusqu'à la retraite (sauf cas de déblocage anticipé)." />
                </Label>
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
                  {(data.montant_per || 0) > (data.plafond_per_total || 0) && (
                    <span className="text-destructive ml-1">
                      — Vous dépassez votre plafond de {((data.montant_per || 0) - (data.plafond_per_total || 0)).toLocaleString('fr-FR')} €
                    </span>
                  )}
                </AlertDescription>
              </Alert>
              <ExempleChiffre 
                text={`Avec votre TMI à ${tmi} %, un versement de ${(data.montant_per || 5000).toLocaleString('fr-FR')} € vous ferait économiser environ ${Math.round((data.montant_per || 5000) * tmi / 100).toLocaleString('fr-FR')} € d'impôt.`}
              />
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
                <Label htmlFor={`montant_${dispositifId}`}>
                  Montant des dons (€)
                  <FieldTooltip content={dispositifId === 'dons_75' 
                    ? "Dons aux associations d'aide aux personnes en difficulté (Restos du Cœur, Secours populaire…). Les dons au-delà de 1 000 € basculent automatiquement en réduction à 66 %. Hors plafond des niches fiscales." 
                    : "Dons aux associations d'intérêt général, fondations, partis politiques… Plafonnés à 20 % du revenu imposable."
                  } />
                </Label>
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
                    Les dons supérieurs à 1 000 € basculeront automatiquement en réduction à 66 %
                  </AlertDescription>
                </Alert>
              )}
              <ExempleChiffre 
                text={dispositifId === 'dons_75' 
                  ? `Un don de ${(data.dons_75_montant || 500).toLocaleString('fr-FR')} € vous ferait économiser ${Math.round(Math.min(data.dons_75_montant || 500, 1000) * 0.75).toLocaleString('fr-FR')} € d'impôt (75 % jusqu'à 1 000 €). Avantage : hors plafond des niches fiscales.`
                  : `Un don de ${(data.dons_66_montant || 1000).toLocaleString('fr-FR')} € vous ferait économiser ${Math.round((data.dons_66_montant || 1000) * 0.66).toLocaleString('fr-FR')} € d'impôt.`
                }
              />
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
                <Label htmlFor="montant_aide_domicile">
                  Montant annuel (€)
                  <FieldTooltip content="Somme des dépenses pour l'emploi d'un salarié à domicile : ménage, garde d'enfants, jardinage, cours particuliers… Incluez les charges patronales." />
                </Label>
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
                  Crédit d'impôt : 50 % des dépenses, plafonné à 6 000 € de dépenses (soit 3 000 € de crédit maximum)
                </AlertDescription>
              </Alert>
              <ExempleChiffre 
                text={`Pour ${(data.montant_aide_domicile || 4000).toLocaleString('fr-FR')} € de dépenses, vous récupérez ${Math.min(Math.round((data.montant_aide_domicile || 4000) * 0.5), 3000).toLocaleString('fr-FR')} € — même si vous n'êtes pas imposable (c'est un crédit d'impôt remboursable).`}
              />
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
                <Label htmlFor="montant_garde_enfant">
                  Montant annuel (€)
                  <FieldTooltip content="Frais de garde hors domicile : crèche, assistante maternelle, garderie périscolaire. Pour les enfants de moins de 6 ans au 1er janvier de l'année d'imposition." />
                </Label>
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
                  Crédit d'impôt : 50 % des dépenses, plafonné à 3 500 € par enfant
                </AlertDescription>
              </Alert>
              <ExempleChiffre
                text={`Pour ${(data.montant_garde_enfant || 3000).toLocaleString('fr-FR')} € de frais de garde, vous récupérez ${Math.min(Math.round((data.montant_garde_enfant || 3000) * 0.5), 1750).toLocaleString('fr-FR')} € par enfant (crédit d'impôt remboursable).`}
              />
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
                <Label htmlFor={`prix_${dispositifId}`}>
                  Prix d'achat (€)
                  <FieldTooltip content={isPinelOM 
                    ? "Prix d'achat du bien neuf en Outre-mer. Plafonné à 300 000 € et 5 500 €/m². La réduction est majorée mais entre dans le plafond OM de 18 000 €."
                    : "Prix d'achat du bien neuf en métropole. Plafonné à 300 000 € et 5 500 €/m². L'engagement locatif doit respecter des plafonds de loyer et de ressources du locataire."
                  } />
                </Label>
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
              {(() => {
                const prix = isPinelOM ? (data.prix_pinel_om || 250000) : (data.prix_pinel || 250000);
                const tauxP = isPinelOM ? (data.taux_pinel_om || 23) : (data.taux_pinel || 9);
                const dureeP = isPinelOM ? (data.duree_pinel_om || 6) : (data.duree_pinel || 6);
                const reductionTotale = Math.round(prix * tauxP / 100);
                const reductionAnnuelle = Math.round(reductionTotale / dureeP);
                return (
                  <ExempleChiffre
                    text={`Pour un bien à ${prix.toLocaleString('fr-FR')} € sur ${dureeP} ans : réduction totale de ${reductionTotale.toLocaleString('fr-FR')} €, soit ${reductionAnnuelle.toLocaleString('fr-FR')} €/an déduits de votre impôt.`}
                  />
                );
              })()}
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
                <Label htmlFor="montant_girardin">
                  Montant investi (€)
                  <FieldTooltip content="Investissement à fonds perdus dans du matériel industriel en Outre-mer. La réduction dépasse le montant investi (jusqu'à 125 %). L'avantage est immédiat (dès l'année de souscription) mais le capital investi n'est pas récupérable." />
                </Label>
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
              <ExempleChiffre
                text={`Pour ${(data.montant_girardin || 10000).toLocaleString('fr-FR')} € investis au T1 : réduction de ${Math.round((data.montant_girardin || 10000) * tauxGirardin / 100).toLocaleString('fr-FR')} €. Attention : le capital investi est perdu — seule la réduction d'impôt constitue le gain.`}
              />
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
                <Label htmlFor="montant_pme">
                  Montant investi (€)
                  <FieldTooltip content="Investissement au capital de PME non cotées, FCPI ou FIP. Le capital est bloqué 5 à 8 ans. La réduction est de 18 %, plafonnée à 50 000 € (célibataire) ou 100 000 € (couple)." />
                </Label>
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
                  Réduction d'impôt : 18 % du montant investi (soit {((data.montant_pme || 0) * 0.18).toLocaleString('fr-FR')} €)
                </AlertDescription>
              </Alert>
              <ExempleChiffre
                text={`Pour ${(data.montant_pme || 10000).toLocaleString('fr-FR')} € investis : ${Math.round((data.montant_pme || 10000) * 0.18).toLocaleString('fr-FR')} € de réduction d'impôt. Le capital reste investi dans l'entreprise 5 à 8 ans avec un risque de perte.`}
              />
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
                <Label htmlFor="montant_esus">
                  Montant investi (€)
                  <FieldTooltip content="Investissement dans des Entreprises Solidaires d'Utilité Sociale (label ESUS). La réduction est de 18 %, avec un plafond spécifique de 13 000 € indépendant du plafond global des niches." />
                </Label>
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
                  Réduction d'impôt : 18 % du montant investi, plafonné à 13 000 €
                </AlertDescription>
              </Alert>
              <ExempleChiffre
                text={`Pour ${(data.montant_esus || 10000).toLocaleString('fr-FR')} € investis : ${Math.round((data.montant_esus || 10000) * 0.18).toLocaleString('fr-FR')} € de réduction. Avantage : plafond indépendant du plafond global de 10 000 €.`}
              />
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
              Renseignez les montants que vous envisagez d'investir ou de dépenser. Les exemples chiffrés sont calculés 
              avec votre TMI de {tmi} %.
            </p>
          </div>
          {dispositifsSelectionnes.map(renderDispositifForm)}
        </div>
      )}
    </div>
  );
};
