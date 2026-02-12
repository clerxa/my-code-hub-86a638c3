/**
 * Formulaire de saisie pour le simulateur PVI
 * Interface notariale avec sections logiques
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Calculator, Loader2, Building2, Home, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DatePickerWithPresets } from '@/components/ui/date-picker-with-presets';
import type { PVIFormInputs, NatureBien, ModeAcquisition, ModeTravaux } from '@/types/pvi';

interface PVIInputFormProps {
  formData: PVIFormInputs;
  onFormChange: (data: Partial<PVIFormInputs>) => void;
  onSubmit: () => void;
  isCalculating: boolean;
  dureeDetention?: number;
}

export const PVIInputForm: React.FC<PVIInputFormProps> = ({
  formData,
  onFormChange,
  onSubmit,
  isCalculating,
  dureeDetention
}) => {
  
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === 0) return '';
    return value.toLocaleString('fr-FR');
  };
  
  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
  };
  
  const canUseForfaitTravaux = dureeDetention !== undefined && dureeDetention >= 5;
  const isResidencePrincipale = formData.nature_bien === 'residence_principale';
  
  return (
    <TooltipProvider>
      <Card className="w-full max-w-2xl mx-auto border-border/50 shadow-lg">
        <CardHeader className="space-y-2 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Simulateur Plus-Value Immobilière</CardTitle>
              <CardDescription>
                Calcul de l'impôt sur la plus-value lors de la vente d'un bien
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Section A: Le Bien et les Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">A</span>
              Le Bien et les Dates
            </h3>
            
            <div className="grid gap-4">
              {/* Nature du bien */}
              <div className="space-y-2">
                <Label>Nature du bien</Label>
                <Select 
                  value={formData.nature_bien} 
                  onValueChange={(v) => onFormChange({ nature_bien: v as NatureBien })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez la nature du bien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residence_principale">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-green-600" />
                        Résidence Principale
                      </div>
                    </SelectItem>
                    <SelectItem value="residence_secondaire">Résidence Secondaire</SelectItem>
                    <SelectItem value="investissement_locatif">Investissement Locatif</SelectItem>
                    <SelectItem value="terrain_batir">Terrain à bâtir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Alert résidence principale */}
              {isResidencePrincipale && (
                <Alert className="bg-green-500/10 border-green-500/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    <strong>Exonération totale !</strong> La plus-value sur la vente de votre résidence principale est totalement exonérée d'impôt (Art. 150 U II du CGI).
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Dates - masquées si résidence principale */}
              {!isResidencePrincipale && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date acquisition */}
                    <div className="space-y-2">
                      <Label>Date d'acquisition</Label>
                      <DatePickerWithPresets
                        date={formData.date_acquisition ? new Date(formData.date_acquisition) : undefined}
                        onDateChange={(date) => date && onFormChange({ date_acquisition: format(date, 'yyyy-MM-dd') })}
                        disabled={(date) => date > new Date()}
                        placeholder="Sélectionner une date"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                      />
                    </div>
                    
                    {/* Date cession */}
                    <div className="space-y-2">
                      <Label>Date de cession prévisionnelle</Label>
                      <DatePickerWithPresets
                        date={formData.date_cession ? new Date(formData.date_cession) : undefined}
                        onDateChange={(date) => date && onFormChange({ date_cession: format(date, 'yyyy-MM-dd') })}
                        disabled={(date) => formData.date_acquisition ? date < new Date(formData.date_acquisition) : false}
                        placeholder="Sélectionner une date"
                        fromYear={new Date().getFullYear() - 5}
                        toYear={new Date().getFullYear() + 10}
                      />
                    </div>
                  </div>
                  
                  {/* Durée de détention calculée */}
                  {dureeDetention !== undefined && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <span className="text-muted-foreground">Durée de détention : </span>
                      <span className="font-semibold text-foreground">{dureeDetention} ans</span>
                      {dureeDetention >= 22 && (
                        <span className="ml-2 text-green-600 dark:text-green-400">✓ Exonération IR</span>
                      )}
                      {dureeDetention >= 30 && (
                        <span className="ml-2 text-green-600 dark:text-green-400">✓ Exonération totale</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Section B: Les Prix - toujours visible pour info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">B</span>
              Les Prix
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prix d'acquisition */}
              <div className="space-y-2">
                <Label>Prix d'acquisition</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumber(formData.prix_acquisition)}
                    onChange={(e) => onFormChange({ prix_acquisition: parseNumber(e.target.value) })}
                    placeholder="200 000"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
              
              {/* Prix de cession */}
              <div className="space-y-2">
                <Label>Prix de cession (vente)</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumber(formData.prix_cession)}
                    onChange={(e) => onFormChange({ prix_cession: parseNumber(e.target.value) })}
                    placeholder="350 000"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
            </div>
            
            {/* Affichage plus-value brute pour résidence principale */}
            {isResidencePrincipale && formData.prix_acquisition > 0 && formData.prix_cession > 0 && (
              <div className="bg-green-500/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Plus-value réalisée</p>
                <p className="text-2xl font-bold text-green-600">
                  {(formData.prix_cession - formData.prix_acquisition).toLocaleString('fr-FR')} €
                </p>
                <p className="text-sm text-green-600 mt-1">Totalement exonérée d'impôt</p>
              </div>
            )}
          </div>
          
          {/* Section C: Majorations - masquée si résidence principale */}
          {!isResidencePrincipale && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">C</span>
                Majorations du Prix d'Acquisition
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Art. 150 VB du CGI : Ces frais viennent majorer le prix d'acquisition et réduisent ainsi la plus-value imposable.</p>
                  </TooltipContent>
                </Tooltip>
              </h3>
              
              <div className="space-y-4">
                {/* Frais d'acquisition */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Frais d'acquisition (notaire)
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Vous pouvez opter pour le forfait de 7.5% du prix d'acquisition ou déclarer le montant réel des frais.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="frais-forfait"
                        checked={formData.mode_frais_acquisition === 'forfait'}
                        onCheckedChange={(checked) => 
                          onFormChange({ mode_frais_acquisition: checked ? 'forfait' : 'reel' })
                        }
                      />
                      <label htmlFor="frais-forfait" className="text-sm cursor-pointer">
                        Forfait 7.5%
                        {formData.mode_frais_acquisition === 'forfait' && formData.prix_acquisition > 0 && (
                          <span className="ml-2 text-muted-foreground">
                            ({(formData.prix_acquisition * 0.075).toLocaleString('fr-FR')} €)
                          </span>
                        )}
                      </label>
                    </div>
                    
                    {formData.mode_frais_acquisition === 'reel' && (
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatNumber(formData.frais_acquisition_reel)}
                          onChange={(e) => onFormChange({ frais_acquisition_reel: parseNumber(e.target.value) })}
                          placeholder="Montant réel"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Travaux */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Travaux réalisés
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Le forfait de 15% n'est disponible qu'après 5 ans de détention. Avant, seuls les travaux réels sur factures sont déductibles.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="travaux-forfait"
                        checked={formData.mode_travaux === 'forfait_15'}
                        disabled={!canUseForfaitTravaux}
                        onCheckedChange={(checked) => 
                          onFormChange({ mode_travaux: checked ? 'forfait_15' : 'reel' })
                        }
                      />
                      <label 
                        htmlFor="travaux-forfait" 
                        className={cn(
                          "text-sm cursor-pointer",
                          !canUseForfaitTravaux && "text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        Forfait 15%
                        {!canUseForfaitTravaux && <span className="ml-1">(disponible après 5 ans)</span>}
                        {formData.mode_travaux === 'forfait_15' && formData.prix_acquisition > 0 && (
                          <span className="ml-2 text-muted-foreground">
                            ({(formData.prix_acquisition * 0.15).toLocaleString('fr-FR')} €)
                          </span>
                        )}
                      </label>
                    </div>
                    
                    {formData.mode_travaux === 'reel' && (
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatNumber(formData.travaux_reel)}
                          onChange={(e) => onFormChange({ travaux_reel: parseNumber(e.target.value) })}
                          placeholder="Montant sur factures"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Bouton de calcul */}
          <Button
            onClick={onSubmit}
            disabled={
              isCalculating || 
              !formData.prix_acquisition || 
              !formData.prix_cession ||
              (!isResidencePrincipale && (!formData.date_acquisition || !formData.date_cession))
            }
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Calcul en cours...
              </>
            ) : isResidencePrincipale ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Voir le récapitulatif
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-5 w-5" />
                Calculer l'imposition
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
