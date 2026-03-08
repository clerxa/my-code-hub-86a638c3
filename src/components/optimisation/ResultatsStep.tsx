import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { useOptimisationFiscaleCalculations } from "@/hooks/useOptimisationFiscaleCalculations";
import { DISPOSITIFS } from "@/lib/dispositifs";
import { AlertCircle, TrendingDown, Calendar, Lightbulb, ArrowRight, Info } from "lucide-react";
import { useMemo } from "react";
import { useCTARulesEngine } from "@/hooks/useCTARulesEngine";
import { SimulationCTASection } from "@/components/simulators/SimulationCTASection";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ReTooltip } from 'recharts';

interface ResultatsStepProps {
  data: Partial<OptimisationFiscaleSimulation>;
  onPrendreRdv: () => void;
  onSave?: () => void;
  onCTAClick?: (ctaId: string, isAppointment: boolean) => void;
}

const DONUT_COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'];
const formatEur = (v: number) => `${v.toLocaleString('fr-FR')} €`;

export const ResultatsStep = ({ data, onPrendreRdv, onSave, onCTAClick }: ResultatsStepProps) => {
  const { calculerImpotFinal, calculerPlafondUnique } = useOptimisationFiscaleCalculations();
  
  const resultats = useMemo(() => calculerImpotFinal(data), [data]);
  const plafondDetail = useMemo(() => calculerPlafondUnique(data), [data]);
  
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
    { nom: 'PER', montant: resultats.reductions.reduction_per, id: 'per', type: 'deduction' as const },
    { nom: 'Dons 75%', montant: resultats.reductions.reduction_dons_75, id: 'dons_75', type: 'reduction' as const },
    { nom: 'Dons 66%', montant: resultats.reductions.reduction_dons_66, id: 'dons_66', type: 'reduction' as const },
    { nom: 'Aide à domicile', montant: resultats.reductions.reduction_aide_domicile, id: 'aide_domicile', type: 'credit' as const },
    { nom: "Garde d'enfants", montant: resultats.reductions.reduction_garde_enfant, id: 'garde_enfants', type: 'credit' as const },
    { nom: 'Pinel', montant: resultats.reductions.reduction_pinel_annuelle, id: 'pinel', type: 'reduction' as const },
    { nom: 'Pinel Outre-mer', montant: resultats.reductions.reduction_pinel_om_annuelle, id: 'pinel_om', type: 'reduction' as const },
    { nom: 'Girardin', montant: resultats.reductions.reduction_girardin, id: 'girardin', type: 'reduction' as const },
    { nom: 'PME/FCPI/FIP', montant: resultats.reductions.reduction_pme, id: 'pme_fcpi_fip', type: 'reduction' as const },
    { nom: 'ESUS', montant: resultats.reductions.reduction_esus, id: 'esus', type: 'reduction' as const },
  ].filter((d) => (data.dispositifs_selectionnes || []).includes(d.id) && d.montant > 0);

  // Sort by efficiency (highest savings first)
  const sortedReductions = [...detailsReductions].sort((a, b) => b.montant - a.montant);

  // Donut chart data
  const donutData = useMemo(() => {
    const items = [
      { name: 'Impôt restant', value: Math.max(0, resultats.impot_apres) },
      ...detailsReductions.map(d => ({ name: d.nom, value: d.montant })),
    ];
    return items.filter(d => d.value > 0);
  }, [resultats, detailsReductions]);

  const donutColors = ['hsl(var(--muted-foreground))', ...DONUT_COLORS];

  // PER optimization tip
  const perSelected = (data.dispositifs_selectionnes || []).includes('per');
  const perMontant = data.montant_per || 0;
  const perPlafond = data.plafond_per_total || 0;
  const perUnderutilized = perSelected && perMontant < perPlafond * 0.8;
  const perNotSelected = !perSelected && (data.tmi || 0) >= 30;
  const perEconomiePotentielle = perNotSelected 
    ? Math.round(Math.min(perPlafond, 10000) * (data.tmi || 30) / 100)
    : perUnderutilized 
    ? Math.round((perPlafond - perMontant) * (data.tmi || 30) / 100)
    : 0;

  // TMI change analysis
  const tmiMessage = useMemo(() => {
    if (!perSelected || perMontant === 0) return null;
    const tmi = data.tmi || 0;
    // Simplified: if PER deduction is significant relative to income
    if (tmi >= 30 && perMontant >= 5000) {
      return `Votre versement PER de ${perMontant.toLocaleString('fr-FR')} € a réduit votre revenu imposable. Avec votre TMI à ${tmi} %, chaque euro versé sur le PER vous a fait économiser ${(tmi / 100).toFixed(2)} € d'impôt.`;
    }
    return null;
  }, [perSelected, perMontant, data.tmi]);

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

          {/* TMI commentary */}
          {tmiMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{tmiMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donut chart avant/après */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition de votre impôt</CardTitle>
          <CardDescription>Visualisation de l'impact de chaque dispositif</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={donutColors[i]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v: number) => formatEur(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Détail par dispositif — classé par efficacité */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par dispositif</CardTitle>
          <CardDescription>Classé par impact décroissant sur votre impôt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedReductions.map((detail, index) => (
              <div key={detail.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                  <div>
                    <span className="font-medium">{detail.nom}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({detail.type === 'deduction' ? 'Déduction' : detail.type === 'credit' ? 'Crédit d\'impôt' : 'Réduction'})
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">
                  {detail.montant.toLocaleString('fr-FR')} €
                </span>
              </div>
            ))}
          </div>

          {/* Efficiency insight */}
          {sortedReductions.length >= 2 && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Votre dispositif le plus efficace est <strong>{sortedReductions[0].nom}</strong> avec 
                  {' '}{sortedReductions[0].montant.toLocaleString('fr-FR')} € d'économie, 
                  soit {data.impot_avant ? ((sortedReductions[0].montant / data.impot_avant) * 100).toFixed(1) : '—'}% de votre impôt initial.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PER optimization tip */}
      {(perNotSelected || perUnderutilized) && perEconomiePotentielle > 0 && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {perNotSelected 
                    ? 'Le PER pourrait être votre meilleur levier'
                    : 'Vous n\'utilisez pas tout votre plafond PER'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {perNotSelected 
                    ? `Avec votre TMI à ${data.tmi}%, un versement PER est directement déduit de votre revenu imposable. En versant jusqu'à ${Math.min(perPlafond, 10000).toLocaleString('fr-FR')} € (dans votre plafond), vous pourriez économiser environ ${perEconomiePotentielle.toLocaleString('fr-FR')} € d'impôt supplémentaires. De plus, le PER échappe au plafond des niches fiscales.`
                    : `Il vous reste ${(perPlafond - perMontant).toLocaleString('fr-FR')} € de plafond PER disponible. En versant ce montant supplémentaire, vous pourriez économiser environ ${perEconomiePotentielle.toLocaleString('fr-FR')} € d'impôt en plus. Le PER échappe au plafond des niches fiscales.`
                  }
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Attention : les sommes versées sur un PER sont bloquées jusqu'à la retraite (sauf achat de résidence principale et cas exceptionnels). 
                  Un expert peut vous aider à trouver le bon équilibre.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plafond unique avec répartition */}
      <Card>
        <CardHeader>
          <CardTitle>Plafonnement des niches fiscales</CardTitle>
          <CardDescription>{plafondDetail.raison}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Plafond applicable : {plafondDetail.plafondApplicable.toLocaleString('fr-FR')} €
              </span>
              <span className={`text-sm font-semibold ${plafondDetail.isDepasse ? 'text-destructive' : 'text-muted-foreground'}`}>
                {plafondDetail.totalUtilise.toLocaleString('fr-FR')} € utilisés ({plafondDetail.pourcentage.toFixed(1)}%)
              </span>
            </div>
            
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
              {plafondDetail.isDepasse && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-destructive animate-pulse" />
              )}
            </div>

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

          {/* Pedagogical explanation */}
          <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
            <p className="text-xs text-muted-foreground font-medium">💡 Comment ça fonctionne ?</p>
            <p className="text-xs text-muted-foreground">
              L'État plafonne les avantages fiscaux liés aux « niches » à <strong>10 000 € par an</strong> (ou 18 000 € 
              si vous avez des investissements Outre-mer). Si la somme de vos réductions et crédits d'impôt dépasse ce plafond, 
              l'excédent est perdu — il ne réduit pas votre impôt.
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Bonne nouvelle :</strong> le PER (déduction) et les dons à 75 % ne sont pas soumis à ce plafond.
              {plafondDetail.repartition.some(r => r.dispositifId === 'girardin') && (
                <> Pour le Girardin industriel de plein droit, seuls 44 % de la réduction entrent dans le plafonnement.</>
              )}
            </p>
          </div>
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
              Concrètement, {(plafondDetail.totalUtilise - plafondDetail.plafondApplicable).toLocaleString('fr-FR')} € de réductions 
              ne seront pas appliqués à votre impôt cette année.
            </p>
            <p>
              Un expert peut vous aider à répartir vos investissements sur plusieurs années 
              ou à identifier des alternatives hors plafond (PER, dons).
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
