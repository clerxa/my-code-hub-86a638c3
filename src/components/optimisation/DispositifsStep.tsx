import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { DISPOSITIFS, getDispositifIcon } from "@/lib/dispositifs";
import { Check } from "lucide-react";

interface DispositifsStepProps {
  data: Partial<OptimisationFiscaleSimulation>;
  onChange: (data: Partial<OptimisationFiscaleSimulation>) => void;
}

export const DispositifsStep = ({ data, onChange }: DispositifsStepProps) => {
  const dispositifsSelectionnes = data.dispositifs_selectionnes || [];

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choisissez vos dispositifs</CardTitle>
          <CardDescription>
            Sélectionnez les dispositifs fiscaux que vous souhaitez utiliser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DISPOSITIFS.map((dispositif) => {
              const Icon = getDispositifIcon(dispositif.icon);
              const selected = isSelected(dispositif.id);

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
                    <Button
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDispositif(dispositif.id);
                      }}
                    >
                      {selected ? 'Sélectionné' : 'Ajouter'}
                    </Button>
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
