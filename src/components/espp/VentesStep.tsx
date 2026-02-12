import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingDown, Info } from "lucide-react";
import { VenteESPP, ESPPLot, UserFiscalProfile } from "@/types/espp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useESPPCalculations } from "@/hooks/useESPPCalculations";

interface VentesStepProps {
  ventes: Partial<VenteESPP>[];
  lots: ESPPLot[];
  profile: UserFiscalProfile;
  onUpdate: (ventes: Partial<VenteESPP>[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const VentesStep = ({ ventes, lots, profile, onUpdate, onNext, onPrevious }: VentesStepProps) => {
  const { calculerPlusValue } = useESPPCalculations();

  const addVente = () => {
    onUpdate([...ventes, {
      lot_id: '',
      quantite_vendue: 0,
      prix_vente_devise: 0,
      date_vente: '',
      taux_change: 1,
      frais_vente: 0,
      devise: 'USD'
    }]);
  };

  const removeVente = (index: number) => {
    const newVentes = ventes.filter((_, i) => i !== index);
    onUpdate(newVentes);
  };

  const updateVente = (index: number, updates: Partial<VenteESPP>) => {
    const newVentes = [...ventes];
    newVentes[index] = { ...newVentes[index], ...updates };
    onUpdate(newVentes);
  };

  const getLotDetails = (lotId: string) => {
    return lots.find(l => l.id === lotId);
  };

  const getQuantiteDisponible = (lotId: string) => {
    const lot = getLotDetails(lotId);
    if (!lot) return 0;
    
    const totalVendu = ventes
      .filter(v => v.lot_id === lotId)
      .reduce((sum, v) => sum + (v.quantite_vendue || 0), 0);
    
    return lot.quantite_achetee_brut - totalVendu;
  };

  const isValid = ventes.length === 0 || ventes.every(vente => {
    if (!vente.lot_id) return true; // lignes vides autorisées

    const isComplete =
      (vente.quantite_vendue ?? 0) > 0 &&
      (vente.prix_vente_devise ?? 0) > 0 &&
      !!vente.date_vente &&
      (vente.taux_change ?? 0) > 0;

    return isComplete && vente.quantite_vendue! <= getQuantiteDisponible(vente.lot_id);
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Ventes d'Actions</h2>
        <p className="text-muted-foreground">Enregistrez vos transactions de vente</p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Plus-value de cession :</strong> La différence entre le prix de vente et le PRU fiscal (FMV x taux de change payroll). Elle est imposée selon votre choix fiscal ({profile.mode_imposition_plus_value}).
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {ventes.map((vente, index) => {
          const lot = getLotDetails(vente.lot_id || '');
          const quantiteDispo = getQuantiteDisponible(vente.lot_id || '');
          
          let resultatVente = null;
          if (lot && vente.quantite_vendue && vente.prix_vente_devise && vente.taux_change) {
            resultatVente = calculerPlusValue(
              vente.quantite_vendue,
              vente.prix_vente_devise,
              vente.taux_change,
              lot.pru_fiscal_eur,
              lot.fmv_retenu_plan,
              vente.frais_vente || 0,
              profile
            );
          }

          return (
            <Card key={index} className="p-6 space-y-4 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Vente {index + 1}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeVente(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Lot concerné *</Label>
                  <Select 
                    value={vente.lot_id || ''}
                    onValueChange={(val) => {
                      const selectedLot = lots.find(l => l.id === val);
                      updateVente(index, { 
                        lot_id: val,
                        devise: selectedLot ? 'USD' : vente.devise 
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un lot" />
                    </SelectTrigger>
                    <SelectContent>
                      {lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          Lot du {new Date(lot.date_acquisition).toLocaleDateString()} - 
                          {getQuantiteDisponible(lot.id).toFixed(4)} actions disponibles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lot && (
                    <p className="text-xs text-muted-foreground">
                      PRU fiscal : {lot.pru_fiscal_eur.toFixed(4)} € • 
                      FMV plan : {lot.fmv_retenu_plan.toFixed(2)} USD
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date de vente *</Label>
                  <Input 
                    type="date"
                    value={vente.date_vente || ''}
                    onChange={(e) => updateVente(index, { date_vente: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantité vendue * (max: {quantiteDispo.toFixed(4)})</Label>
                  <Input 
                    type="number"
                    step="0.0001"
                    max={quantiteDispo}
                    placeholder="Ex: 100.0000"
                    value={vente.quantite_vendue || ''}
                    onChange={(e) => updateVente(index, { quantite_vendue: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prix de vente unitaire * ({vente.devise || 'USD'})</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Ex: 200.00"
                    value={vente.prix_vente_devise || ''}
                    onChange={(e) => updateVente(index, { prix_vente_devise: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Taux de change (vente) *</Label>
                  <Input 
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 0.92"
                    value={vente.taux_change || ''}
                    onChange={(e) => updateVente(index, { taux_change: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Frais de vente (€)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Ex: 25.00"
                    value={vente.frais_vente || 0}
                    onChange={(e) => updateVente(index, { frais_vente: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {resultatVente && (
                <Alert className="bg-accent/10 border-accent/30">
                  <TrendingDown className="h-4 w-4 text-accent" />
                  <AlertDescription>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Plus-value brute :</strong> {resultatVente.plusValueBrute.toFixed(2)} {vente.devise}</div>
                      <div><strong>Plus-value EUR :</strong> {resultatVente.plusValueEUR.toFixed(2)} €</div>
                      <div><strong>Impôt :</strong> {resultatVente.impot.toFixed(2)} €</div>
                      <div><strong>Prélèvements sociaux :</strong> {resultatVente.prelevementsSociaux.toFixed(2)} €</div>
                      <div className="col-span-2 pt-2 border-t border-accent/30">
                        <strong>Net après impôt :</strong> <span className="text-lg text-accent">{resultatVente.netApresImpot.toFixed(2)} €</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          );
        })}
      </div>

      {lots.length > 0 && (
        <Button 
          onClick={addVente} 
          variant="outline" 
          className="w-full"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une vente
        </Button>
      )}

      {lots.length === 0 && (
        <Alert className="bg-destructive/10 border-destructive/30">
          <Info className="h-4 w-4 text-destructive" />
          <AlertDescription>
            Aucun lot disponible. Retournez à l'étape précédente pour créer des lots d'achat.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button onClick={onPrevious} variant="outline" size="lg">
          Précédent
        </Button>
        <Button onClick={onNext} size="lg" className="min-w-[200px]">
          Voir les résultats
        </Button>
      </div>
    </div>
  );
};
