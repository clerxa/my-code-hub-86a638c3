import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { useOptimisationFiscaleCalculations } from "@/hooks/useOptimisationFiscaleCalculations";
import { DISPOSITIFS } from "@/lib/dispositifs";
import { AlertCircle, TrendingDown, Calendar } from "lucide-react";
import { useMemo } from "react";
import { useCTARulesEngine } from "@/hooks/useCTARulesEngine";
import { SimulationCTASection } from "@/components/simulators/SimulationCTASection";

interface ResultatsStepProps {
  data: Partial<OptimisationFiscaleSimulation>;
  onPrendreRdv: () => void;
  onSave?: () => void;
  onCTAClick?: (ctaId: string, isAppointment: boolean) => void;
}

export const ResultatsStep = ({ data, onPrendreRdv, onSave, onCTAClick }: ResultatsStepProps) => {
  const { calculerImpotFinal, calculerPlafondUnique } = useOptimisationFiscaleCalculations();
  
  // Calculs des résultats
  const resultats = useMemo(() => calculerImpotFinal(data), [data]);
  const plafondDetail = useMemo(() => calculerPlafondUnique(data), [data]);
  
  // CTA intelligents
  const { ctas } = useCTARulesEngine('optimisation_fiscale', {
    economie_totale: resultats?.economie_totale,
    plafond_per_utilise: resultats?.reductions?.plafond_per_utilise,
    dispositifs_selectionnes: data.dispositifs_selectionnes || [],
    tmi: data.tmi,
  });

  const getDispositifNom = (id: string) => {
    return DISPOSITIFS.find((d) => d.id === id)?.nom || id;
  };

  const detailsReductions = [
    { nom: 'PER', montant: resultats.reductions.reduction_per, id: 'per' },
    { nom: 'Dons 75%', montant: resultats.reductions.reduction_dons_75, id: 'dons_75' },
    { nom: 'Dons 66%', montant: resultats.reductions.reduction_dons_66, id: 'dons_66' },
    { nom: 'Aide à domicile', montant: resultats.reductions.reduction_aide_domicile, id: 'aide_domicile' },
    { nom: "Garde d'enfants", montant: resultats.reductions.reduction_garde_enfant, id: 'garde_enfants' },
    { nom: 'Pinel', montant: resultats.reductions.reduction_pinel_annuelle, id: 'pinel' },
    { nom: 'Pinel Outre-mer', montant: resultats.reductions.reduction_pinel_om_annuelle, id: 'pinel_om' },
    { nom: 'Girardin', montant: resultats.reductions.reduction_girardin, id: 'girardin' },
    { nom: 'PME/FCPI/FIP', montant: resultats.reductions.reduction_pme, id: 'pme_fcpi_fip' },
    { nom: 'ESUS', montant: resultats.reductions.reduction_esus, id: 'esus' },
  ].filter((d) => (data.dispositifs_selectionnes || []).includes(d.id) && d.montant > 0);

  const segmentColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-indigo-500',
  ];

  return (
    <div className="space-y-6">
      {/* Synthèse globale */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" />
            Synthèse de votre optimisation fiscale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Impôt avant optimisation</p>
              <p className="text-2xl font-bold">{(data.impot_avant || 0).toLocaleString('fr-FR')} €</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary">
              <p className="text-sm text-muted-foreground mb-1">Impôt après optimisation</p>
              <p className="text-2xl font-bold text-primary">{resultats.impot_apres.toLocaleString('fr-FR')} €</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500">
              <p className="text-sm text-muted-foreground mb-1">Économie totale</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {resultats.economie_totale.toLocaleString('fr-FR')} €
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
            <span className="text-xl font-semibold">Taux d'économie :</span>
            <span className="text-3xl font-bold text-primary">
              {data.impot_avant ? ((resultats.economie_totale / data.impot_avant) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Détail par dispositif */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par dispositif</CardTitle>
          <CardDescription>Économies générées par chaque dispositif fiscal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detailsReductions.map((detail) => (
              <div key={detail.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="font-medium">{detail.nom}</span>
                <span className="text-lg font-bold text-primary">
                  {detail.montant.toLocaleString('fr-FR')} €
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plafond unique avec répartition */}
      <Card>
        <CardHeader>
          <CardTitle>Plafonnement des niches fiscales</CardTitle>
          <CardDescription>{plafondDetail.raison}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Jauge principale */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Plafond applicable : {plafondDetail.plafondApplicable.toLocaleString('fr-FR')} €
              </span>
              <span className={`text-sm font-semibold ${plafondDetail.isDepasse ? 'text-destructive' : 'text-muted-foreground'}`}>
                {plafondDetail.totalUtilise.toLocaleString('fr-FR')} € utilisés ({plafondDetail.pourcentage.toFixed(1)}%)
              </span>
            </div>
            
            {/* Barre de progression segmentée */}
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                {plafondDetail.repartition.map((segment, index) => (
                  <div
                    key={segment.dispositifId}
                    className={`h-full ${segmentColors[index % segmentColors.length]} transition-all`}
                    style={{ width: `${Math.min(segment.pourcentagePlafond, 100 - plafondDetail.repartition.slice(0, index).reduce((sum, s) => sum + s.pourcentagePlafond, 0))}%` }}
                    title={`${segment.nom}: ${segment.montantPlafonnable.toLocaleString('fr-FR')} €`}
                  />
                ))}
              </div>
              {/* Ligne de dépassement */}
              {plafondDetail.isDepasse && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-destructive animate-pulse" />
              )}
            </div>

            {/* Légende */}
            <div className="flex flex-wrap gap-3 mt-4">
              {plafondDetail.repartition.map((segment, index) => (
                <div key={segment.dispositifId} className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full ${segmentColors[index % segmentColors.length]}`} />
                  <span className="text-muted-foreground">{segment.nom}</span>
                  <span className="font-medium">{segment.montantPlafonnable.toLocaleString('fr-FR')} €</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note explicative */}
          <p className="text-xs text-muted-foreground">
            Note : Le PER (déduction) et les dons à 75% ne sont pas soumis au plafonnement des niches fiscales.
            {plafondDetail.repartition.some(r => r.dispositifId === 'girardin') && (
              <> Pour le Girardin industriel de plein droit, seuls 44% de la réduction entrent dans le plafonnement.</>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Alerte dépassement + CTA expert */}
      {plafondDetail.isDepasse && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention : Dépassement du plafond des niches fiscales</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              Vous dépassez le plafond de {plafondDetail.plafondApplicable.toLocaleString('fr-FR')} € de{' '}
              <strong>{(plafondDetail.totalUtilise - plafondDetail.plafondApplicable).toLocaleString('fr-FR')} €</strong>.
              Une partie de vos réductions ne sera pas utilisée cette année.
            </p>
            <p>
              Un expert peut vous aider à optimiser la répartition de vos investissements sur plusieurs années
              ou à identifier des alternatives plus efficaces.
            </p>
            <Button onClick={onPrendreRdv} variant="outline" className="mt-2 gap-2">
              <Calendar className="w-4 h-4" />
              Prendre RDV avec un expert
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* CTA intelligents */}
      <SimulationCTASection 
        ctas={ctas}
        onSave={onSave}
        onCTAClick={onCTAClick}
        onAction={(type, value) => {
          if (type === 'external_link' || type === 'internal_link') {
            onPrendreRdv();
          }
        }}
      />
    </div>
  );
};
