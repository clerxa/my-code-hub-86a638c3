import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ChevronDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface TaxInputFormProps {
  revenuImposable: string;
  setRevenuImposable: (value: string) => void;
  statutMarital: string;
  setStatutMarital: (value: string) => void;
  nombreEnfants: string;
  setNombreEnfants: (value: string) => void;
  reductionsImpot: string;
  setReductionsImpot: (value: string) => void;
  creditsImpot: string;
  setCreditsImpot: (value: string) => void;
  onCalculer: () => void;
  isCalculating: boolean;
}

const statutOptions = [
  { value: "celibataire", label: "Célibataire" },
  { value: "marie", label: "Marié(e)" },
  { value: "pacs", label: "Pacsé(e)" },
  { value: "divorce", label: "Divorcé(e)" },
  { value: "veuf", label: "Veuf(ve)" },
  { value: "separe", label: "Séparé(e)" },
  { value: "union-libre", label: "Union libre" },
];

export function TaxInputForm({
  revenuImposable,
  setRevenuImposable,
  statutMarital,
  setStatutMarital,
  nombreEnfants,
  setNombreEnfants,
  reductionsImpot,
  setReductionsImpot,
  creditsImpot,
  setCreditsImpot,
  onCalculer,
  isCalculating,
}: TaxInputFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatRevenuDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  const handleRevenuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setRevenuImposable(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Calculez votre impôt 2025</CardTitle>
          <CardDescription className="text-base">
            Renseignez vos informations pour estimer votre impôt sur le revenu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Revenu imposable */}
          <div className="space-y-3">
            <Label htmlFor="revenu" className="text-base font-medium">
              Revenu net imposable annuel
            </Label>
            <div className="relative">
              <Input
                id="revenu"
                type="text"
                inputMode="numeric"
                placeholder="Ex: 45 000"
                value={formatRevenuDisplay(revenuImposable)}
                onChange={handleRevenuChange}
                className="text-lg h-12 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                €
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Montant indiqué sur votre avis d'imposition (ligne "Revenu imposable")
            </p>
          </div>

          {/* Situation familiale */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Situation familiale</Label>
            <RadioGroup 
              value={statutMarital} 
              onValueChange={setStatutMarital}
              className="grid grid-cols-2 gap-3"
            >
              {statutOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value} 
                    className="font-normal cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Nombre d'enfants */}
          <div className="space-y-3">
            <Label htmlFor="enfants" className="text-base font-medium">
              Nombre d'enfants à charge
            </Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setNombreEnfants(Math.max(0, parseInt(nombreEnfants) - 1).toString())}
                disabled={parseInt(nombreEnfants) <= 0}
              >
                -
              </Button>
              <Input
                id="enfants"
                type="number"
                min="0"
                value={nombreEnfants}
                onChange={(e) => setNombreEnfants(e.target.value)}
                className="w-20 text-center text-lg h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setNombreEnfants((parseInt(nombreEnfants) + 1).toString())}
              >
                +
              </Button>
            </div>
          </div>

          {/* Options avancées */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Réductions et crédits d'impôt</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reductions">Réductions d'impôt (€)</Label>
                <Input
                  id="reductions"
                  type="number"
                  placeholder="0"
                  value={reductionsImpot}
                  onChange={(e) => setReductionsImpot(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dons, investissements locatifs, emploi à domicile...
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Crédits d'impôt (€)</Label>
                <Input
                  id="credits"
                  type="number"
                  placeholder="0"
                  value={creditsImpot}
                  onChange={(e) => setCreditsImpot(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Garde d'enfants, travaux de rénovation énergétique...
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bouton de calcul */}
          <Button 
            onClick={onCalculer} 
            className="w-full h-12 text-base"
            disabled={!revenuImposable || isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculer mon impôt
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
