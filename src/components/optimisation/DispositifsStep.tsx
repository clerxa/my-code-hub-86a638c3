import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { DISPOSITIFS, getDispositifIcon } from "@/lib/dispositifs";
import { Check, Info, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DispositifsStepProps {
  data: Partial<OptimisationFiscaleSimulation>;
  onChange: (data: Partial<OptimisationFiscaleSimulation>) => void;
}

export const DispositifsStep = ({ data, onChange }: DispositifsStepProps) => {
  const dispositifsSelectionnes = data.dispositifs_selectionnes || [];
  const tmi = data.tmi || 0;

  const toggleDispositif = (id: string) => {
    const newSelection = dispositifsSelectionnes.includes(id)
      ? dispositifsSelectionnes.filter((d) => d !== id)
      : [...dispositifsSelectionnes, id];
    
    onChange({
      ...data,
      dispositifs_selectionnes: newSelection,
    });
  };

  const isSelected = (id: string) => dispositifsSelectionnes.includes(id);

  const getCategorieColor = (categorie: string) => {
    switch (categorie) {
      case 'reduction':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'deduction':
        return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'credit':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case 'reduction':
        return 'Réduction d\'impôt';
      case 'deduction':
        return 'Déduction du revenu';
      case 'credit':
        return 'Crédit d\'impôt';
      default:
        return categorie;
    }
  };

  // Recommendation logic
  const getRecommendation = (dispositifId: string): string | null => {
    switch (dispositifId) {
      case 'per':
        if (tmi >= 41) return `🔥 Très recommandé avec votre TMI à ${tmi}% : 1 € versé = ${(tmi / 100).toFixed(2)} € d'économie`;
        if (tmi >= 30) return `✅ Intéressant avec votre TMI à ${tmi}% : 1 € versé = 0,30 € d'économie`;
        if (tmi === 11) return `Impact modéré avec un TMI à 11 %. À étudier selon votre horizon retraite.`;
        return null;
      case 'girardin':
        if ((data.impot_avant || 0) >= 5000) return `Adapté à votre niveau d'imposition (${(data.impot_avant || 0).toLocaleString('fr-FR')} €)`;
        return `Attention : nécessite un impôt suffisant pour absorber la réduction`;
      case 'aide_domicile':
      case 'garde_enfants':
        return `Crédit d'impôt : remboursable même si vous n'êtes pas imposable`;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pedagogical intro */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm space-y-1">
          <p><strong>Comment choisir ?</strong> Sélectionnez les dispositifs que vous utilisez déjà ou que vous envisagez. 
          Pas d'inquiétude, vous pourrez ajuster les montants à l'étape suivante.</p>
          <p className="text-xs text-muted-foreground">
            Les badges indiquent le type de mécanisme : 
            <span className="text-green-600 dark:text-green-400 font-medium"> Déduction</span> (réduit votre revenu), 
            <span className="text-blue-600 dark:text-blue-400 font-medium"> Réduction</span> (réduit votre impôt), 
            <span className="text-purple-600 dark:text-purple-400 font-medium"> Crédit d'impôt</span> (remboursable).
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Choisissez vos dispositifs</CardTitle>
          <CardDescription>
            Sélectionnez les dispositifs fiscaux que vous souhaitez utiliser ou explorer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DISPOSITIFS.map((dispositif) => {
              const Icon = getDispositifIcon(dispositif.icon);
              const selected = isSelected(dispositif.id);
              const recommendation = getRecommendation(dispositif.id);

              return (
                <Card
                  key={dispositif.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selected ? 'border-primary shadow-md' : ''
                  }`}
                  onClick={() => toggleDispositif(dispositif.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {selected && (
                          <div className="p-1 rounded-full bg-primary">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <Badge className={getCategorieColor(dispositif.categorie)} variant="secondary">
                        {getCategorieLabel(dispositif.categorie)}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{dispositif.nom}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium text-primary">{dispositif.description}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{dispositif.explication}</p>
                    {recommendation && (
                      <div className="flex items-start gap-1.5 p-2 rounded bg-primary/5 border border-primary/10 mt-1">
                        <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{recommendation}</p>
                      </div>
                    )}
                    <button
                      className={`w-full mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 transition-colors ${
                        selected 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDispositif(dispositif.id);
                      }}
                    >
                      {selected ? 'Sélectionné' : 'Ajouter'}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {dispositifsSelectionnes.length > 0 && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">
                {dispositifsSelectionnes.length} dispositif{dispositifsSelectionnes.length > 1 ? 's' : ''} sélectionné{dispositifsSelectionnes.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
