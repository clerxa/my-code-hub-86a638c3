import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, TrendingUp, Calendar, Coins, Receipt, Wallet, PieChart } from "lucide-react";
import { ESPPLot, VenteESPP, UserFiscalProfile, ResultatAnnuel } from "@/types/espp";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface ResultatsStepProps {
  lots: (ESPPLot & { plan_nom?: string })[];
  ventes: (VenteESPP & { lot?: ESPPLot })[];
  profile: UserFiscalProfile;
  onPrevious: () => void;
  onFinish: () => void;
}

export const ResultatsStep = ({ lots, ventes, profile, onPrevious, onFinish }: ResultatsStepProps) => {
  // Calcul des résultats globaux
  const totalGainAcquisition = lots.reduce((sum, lot) => sum + lot.gain_acquisition_total_eur, 0);
  const totalPlusValue = ventes.reduce((sum, vente) => sum + (vente.plus_value_eur || 0), 0);
  const totalImpots = ventes.reduce((sum, vente) => sum + (vente.impot_calcule || 0), 0);
  const totalPrelevementsSociaux = ventes.reduce((sum, vente) => sum + (vente.prelevements_sociaux || 0), 0);
  const totalNet = ventes.reduce((sum, vente) => sum + (vente.net_apres_impot || 0), 0);

  // Calcul des résultats par année
  const resultatsParAnnee: ResultatAnnuel[] = [];
  const anneesMap = new Map<number, ResultatAnnuel>();

  ventes.forEach(vente => {
    const annee = new Date(vente.date_vente).getFullYear();
    if (!anneesMap.has(annee)) {
      anneesMap.set(annee, {
        annee,
        totalGainAcquisition: 0,
        totalPlusValue: 0,
        totalImpots: 0,
        totalNet: 0,
        nbTransactions: 0
      });
    }
    const resultat = anneesMap.get(annee)!;
    resultat.totalPlusValue += vente.plus_value_eur || 0;
    resultat.totalImpots += (vente.impot_calcule || 0) + (vente.prelevements_sociaux || 0);
    resultat.totalNet += vente.net_apres_impot || 0;
    resultat.nbTransactions += 1;
  });

  lots.forEach(lot => {
    const annee = new Date(lot.date_acquisition).getFullYear();
    if (!anneesMap.has(annee)) {
      anneesMap.set(annee, {
        annee,
        totalGainAcquisition: 0,
        totalPlusValue: 0,
        totalImpots: 0,
        totalNet: 0,
        nbTransactions: 0
      });
    }
    anneesMap.get(annee)!.totalGainAcquisition += lot.gain_acquisition_total_eur;
  });

  Array.from(anneesMap.values()).forEach(r => resultatsParAnnee.push(r));
  resultatsParAnnee.sort((a, b) => a.annee - b.annee);

  // Données pour le graphique en barres
  const chartData = resultatsParAnnee.map(r => ({
    annee: r.annee.toString(),
    'Gains acquisition': Math.round(r.totalGainAcquisition),
    'Plus-values': Math.round(r.totalPlusValue),
    'Impôts': Math.round(-r.totalImpots),
    'Net': Math.round(r.totalNet)
  }));

  // Données pour le pie chart
  const pieData = [
    { name: 'Gains acquisition', value: Math.round(totalGainAcquisition), color: '#10b981' },
    { name: 'Plus-values', value: Math.round(totalPlusValue), color: '#3b82f6' },
    { name: 'Impôts & charges', value: Math.round(totalImpots + totalPrelevementsSociaux), color: '#ef4444' }
  ].filter(d => d.value > 0);

  const quantiteRestante = lots.reduce((sum, lot) => {
    const vendu = ventes
      .filter(v => v.lot_id === lot.id)
      .reduce((s, v) => s + v.quantite_vendue, 0);
    return sum + (lot.quantite_achetee_brut - vendu);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Résultats & Fiscalité</h2>
        </div>
        <p className="text-muted-foreground">Synthèse complète de votre simulation ESPP</p>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Gains acquisition
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {totalGainAcquisition.toFixed(2)} €
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Plus-values
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {totalPlusValue.toFixed(2)} €
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Impôts totaux
              </p>
              <p className="text-2xl font-bold text-red-600">
                {(totalImpots + totalPrelevementsSociaux).toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">
                Dont {totalImpots.toFixed(2)} € impôt + {totalPrelevementsSociaux.toFixed(2)} € PS
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Net perçu
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {totalNet.toFixed(2)} €
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Informations pédagogiques */}
      <Alert className="bg-primary/5 border-primary/20">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Mode d'imposition :</strong> {profile.mode_imposition_plus_value} 
          {profile.mode_imposition_plus_value === 'PFU' ? ' (12,8% + 17,2% PS)' : ` (TMI ${profile.tmi}% + 17,2% PS)`}
          <br />
          <strong>Actions restantes :</strong> {quantiteRestante.toFixed(4)} actions
          <br />
          <strong>Nombre de plans :</strong> {lots.length} • <strong>Transactions de vente :</strong> {ventes.length}
        </AlertDescription>
      </Alert>

      {/* Graphique en barres par année */}
      {chartData.length > 0 && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Évolution par année fiscale
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="annee" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))' 
                }}
              />
              <Legend />
              <Bar dataKey="Gains acquisition" fill="#10b981" />
              <Bar dataKey="Plus-values" fill="#3b82f6" />
              <Bar dataKey="Impôts" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Répartition en pie chart */}
      {pieData.length > 0 && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Répartition globale
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))' 
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tableau récapitulatif par année */}
      {resultatsParAnnee.length > 0 && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-xl font-semibold mb-4">Détail par année fiscale</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-2">Année</th>
                  <th className="p-2 text-right">Gains acquisition</th>
                  <th className="p-2 text-right">Plus-values</th>
                  <th className="p-2 text-right">Impôts</th>
                  <th className="p-2 text-right">Net</th>
                  <th className="p-2 text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {resultatsParAnnee.map((resultat) => (
                  <tr key={resultat.annee} className="border-b">
                    <td className="p-2 font-semibold">{resultat.annee}</td>
                    <td className="p-2 text-right text-emerald-600">{resultat.totalGainAcquisition.toFixed(2)} €</td>
                    <td className="p-2 text-right text-blue-600">{resultat.totalPlusValue.toFixed(2)} €</td>
                    <td className="p-2 text-right text-red-600">{resultat.totalImpots.toFixed(2)} €</td>
                    <td className="p-2 text-right text-purple-600 font-semibold">{resultat.totalNet.toFixed(2)} €</td>
                    <td className="p-2 text-right text-muted-foreground">{resultat.nbTransactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button onClick={onPrevious} variant="outline" size="lg">
          Précédent
        </Button>
        <Button onClick={onFinish} size="lg" className="min-w-[200px]">
          Terminer
        </Button>
      </div>
    </div>
  );
};
