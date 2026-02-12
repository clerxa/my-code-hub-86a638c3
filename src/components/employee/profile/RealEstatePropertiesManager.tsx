/**
 * Component for managing real estate investment properties in the financial profile.
 * Allows users to add, edit, and remove rental/investment properties.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Building2, Plus, Trash2, ChevronDown, ChevronUp, Euro, 
  Home, CreditCard, Receipt, Wallet, X, Check, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRealEstateProperties, RealEstateProperty, RealEstatePropertyInput } from "@/hooks/useUserRealEstateProperties";

interface RealEstatePropertiesManagerProps {
  className?: string;
}

// Default empty property for the creation form
const getEmptyPropertyForm = (index: number): RealEstatePropertyInput => ({
  nom_bien: `Bien ${index + 1}`,
  valeur_estimee: 0,
  capital_restant_du: 0,
  mensualite_credit: 0,
  charges_mensuelles: 0,
  revenus_locatifs_mensuels: 0,
});

export function RealEstatePropertiesManager({ className }: RealEstatePropertiesManagerProps) {
  const { 
    properties, 
    isLoading, 
    addProperty, 
    updateProperty, 
    deleteProperty,
    isAdding,
    totals 
  } = useUserRealEstateProperties();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPropertyForm, setNewPropertyForm] = useState<RealEstatePropertyInput>(getEmptyPropertyForm(properties.length));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleStartAddProperty = () => {
    setNewPropertyForm(getEmptyPropertyForm(properties.length));
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewPropertyForm(getEmptyPropertyForm(properties.length));
  };

  const handleConfirmAdd = () => {
    addProperty(newPropertyForm);
    setShowAddForm(false);
    setNewPropertyForm(getEmptyPropertyForm(properties.length + 1));
  };

  const handleNewPropertyFieldChange = (field: keyof RealEstatePropertyInput, value: string | number) => {
    if (typeof value === 'string' && field !== 'nom_bien') {
      const cleanValue = value.replace(/[^0-9]/g, '');
      const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
      setNewPropertyForm(prev => ({ ...prev, [field]: numValue }));
    } else {
      setNewPropertyForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleUpdateField = (
    property: RealEstateProperty, 
    field: keyof RealEstateProperty, 
    value: string
  ) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    updateProperty({ id: property.id, [field]: numValue });
  };

  const handleUpdateName = (property: RealEstateProperty, name: string) => {
    updateProperty({ id: property.id, nom_bien: name });
  };

  const getNumericDisplayValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null || value === 0) return '';
    return value.toLocaleString('fr-FR');
  };

  // Render the property form fields (reused for both new and existing properties)
  const renderPropertyForm = (
    data: RealEstatePropertyInput | RealEstateProperty,
    onFieldChange: (field: keyof RealEstatePropertyInput, value: string) => void,
    onNameChange: (name: string) => void
  ) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nom du bien</Label>
        <Input
          value={data.nom_bien}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: Appartement Paris 11"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-muted-foreground" />
            <Label>Valeur estimée du bien (€)</Label>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            value={getNumericDisplayValue(data.valeur_estimee)}
            onChange={(e) => onFieldChange('valeur_estimee', e.target.value)}
            placeholder="Ex: 250 000"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <Label>Capital restant dû (€)</Label>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            value={getNumericDisplayValue(data.capital_restant_du)}
            onChange={(e) => onFieldChange('capital_restant_du', e.target.value)}
            placeholder="Ex: 180 000"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
            <Label>Mensualité crédit (€/mois)</Label>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            value={getNumericDisplayValue(data.mensualite_credit)}
            onChange={(e) => onFieldChange('mensualite_credit', e.target.value)}
            placeholder="Ex: 950"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <Label>Charges mensuelles (€/mois)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="text-xs max-w-[260px] p-2">
                Charges de copropriété, taxe foncière, frais d'agence, garantie loyers impayés et autres taxes relatives à votre bien
              </PopoverContent>
            </Popover>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            value={getNumericDisplayValue(data.charges_mensuelles)}
            onChange={(e) => onFieldChange('charges_mensuelles', e.target.value)}
            placeholder="Ex: 200"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-1.5">
            <Euro className="h-3.5 w-3.5 text-muted-foreground" />
            <Label>Loyers perçus (€/mois)</Label>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            value={getNumericDisplayValue(data.revenus_locatifs_mensuels)}
            onChange={(e) => onFieldChange('revenus_locatifs_mensuels', e.target.value)}
            placeholder="Ex: 1 200"
          />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Chargement des biens immobiliers...
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Property list */}
      {properties.length === 0 && !showAddForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun bien immobilier locatif ou d'investissement</p>
          <p className="text-xs mt-1">Cliquez sur "Ajouter un bien" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const isExpanded = expandedIds.has(property.id);
            
            return (
              <Card key={property.id} className="overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(property.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">{property.nom_bien}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                        <span>Valeur: {Number(property.valeur_estimee || 0).toLocaleString('fr-FR')} €</span>
                        <span>Loyers: {Number(property.revenus_locatifs_mensuels || 0).toLocaleString('fr-FR')} €/mois</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProperty(property.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 space-y-4">
                    <div className="border-t pt-4">
                      {renderPropertyForm(
                        property,
                        (field, value) => handleUpdateField(property, field, value),
                        (name) => handleUpdateName(property, name)
                      )}

                      {/* Property summary */}
                      <div className="mt-4 p-3 rounded-lg bg-muted/30 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valeur nette:</span>
                          <span className="ml-2 font-medium">
                            {(Number(property.valeur_estimee || 0) - Number(property.capital_restant_du || 0)).toLocaleString('fr-FR')} €
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cash-flow:</span>
                          <span className={cn(
                            "ml-2 font-medium",
                            (Number(property.revenus_locatifs_mensuels || 0) - Number(property.mensualite_credit || 0) - Number(property.charges_mensuelles || 0)) >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          )}>
                            {(Number(property.revenus_locatifs_mensuels || 0) - Number(property.mensualite_credit || 0) - Number(property.charges_mensuelles || 0)).toLocaleString('fr-FR')} €/mois
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add property form */}
      {showAddForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Nouveau bien immobilier
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCancelAdd}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {renderPropertyForm(
              newPropertyForm,
              (field, value) => handleNewPropertyFieldChange(field, value),
              (name) => setNewPropertyForm(prev => ({ ...prev, nom_bien: name }))
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCancelAdd}>
                Annuler
              </Button>
              <Button onClick={handleConfirmAdd} disabled={isAdding}>
                <Check className="h-4 w-4 mr-2" />
                {isAdding ? "Ajout..." : "Ajouter ce bien"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add button */}
      {!showAddForm && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleStartAddProperty}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un bien
        </Button>
      )}

      {/* Totals summary */}
      {properties.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Récapitulatif patrimoine immobilier locatif
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Valeur totale:</span>
              <div className="font-semibold text-lg">
                {totals.valeurTotale.toLocaleString('fr-FR')} €
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Crédit restant:</span>
              <div className="font-semibold text-lg">
                {totals.capitalRestantTotal.toLocaleString('fr-FR')} €
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Valeur nette:</span>
              <div className="font-semibold text-lg text-primary">
                {(totals.valeurTotale - totals.capitalRestantTotal).toLocaleString('fr-FR')} €
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Mensualités crédits:</span>
              <div className="font-medium">
                {totals.mensualitesTotal.toLocaleString('fr-FR')} €/mois
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Charges totales:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="text-xs max-w-[260px] p-2">
                    Charges de copropriété, taxe foncière, frais d'agence, garantie loyers impayés et autres taxes relatives à vos biens
                  </PopoverContent>
                </Popover>
              </div>
              <div className="font-medium">
                {totals.chargesTotal.toLocaleString('fr-FR')} €/mois
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Loyers perçus:</span>
              <div className="font-medium text-emerald-600 dark:text-emerald-400">
                {totals.revenusLocatifsTotal.toLocaleString('fr-FR')} €/mois
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
