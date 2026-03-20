import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, AlertTriangle, Receipt, Clock, TrendingDown, BookOpen, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { SimulatorCard } from "@/components/simulators/SimulatorCard";
import { useAuth } from "@/components/AuthProvider";
import { useVegaPortfolio } from "@/hooks/useVegaPortfolio";
import { VegaPortfolioDashboard } from "@/components/vega/VegaPortfolioDashboard";

interface Simulator {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  route: string;
  feature_key: string | null;
  duration_minutes: number;
  order_num: number;
  visibility_status?: 'visible' | 'disabled' | 'hidden';
}

const complexityPoints = [
  {
    icon: Receipt,
    title: "Fiscalité différente selon chaque dispositif",
    description: "RSU, ESPP, stock-options… chacun a ses propres règles fiscales et sociales.",
  },
  {
    icon: Clock,
    title: "Le timing de cession change tout",
    description: "Vendre trop tôt ou trop tard peut doubler votre imposition réelle.",
  },
  {
    icon: TrendingDown,
    title: "La valeur brute n'est jamais ce que vous percevez",
    description: "Entre charges sociales, IR et prélèvements, l'écart peut dépasser 40%.",
  },
];

const dispositifs = [
  {
    id: "espp",
    title: "ESPP – Plan d'achat d'actions à prix réduit",
    content: "L'ESPP (Employee Stock Purchase Plan) permet aux salariés d'acheter des actions de leur entreprise à un prix réduit, généralement avec une décote de 15%. Le gain est soumis à une fiscalité spécifique selon la durée de détention.",
  },
  {
    id: "rsu",
    title: "RSU – Actions gratuites attribuées par l'employeur",
    content: "Les RSU (Restricted Stock Units) sont des actions attribuées gratuitement après une période d'acquisition. Elles sont imposées comme un revenu salarial à l'acquisition, puis comme une plus-value à la cession.",
  },
  {
    id: "stock-options",
    title: "Stock-options – Droit d'acheter des actions à prix fixé",
    content: "Les stock-options donnent le droit d'acheter des actions à un prix fixé à l'avance (prix d'exercice). Le gain se réalise si le cours de l'action dépasse ce prix au moment de l'exercice.",
  },
  {
    id: "bspce",
    title: "BSPCE – Version startup des stock-options",
    content: "Les BSPCE (Bons de Souscription de Parts de Créateur d'Entreprise) sont réservés aux jeunes entreprises. Ils bénéficient d'un régime fiscal avantageux avec une imposition au taux forfaitaire des plus-values mobilières.",
  },
  {
    id: "aga",
    title: "AGA – Actions gratuites avec période d'acquisition",
    content: "Les AGA (Attribution Gratuite d'Actions) suivent un régime similaire aux RSU. Après une période d'acquisition obligatoire, les actions deviennent la propriété du salarié avec un abattement fiscal possible.",
  },
];

export default function VegaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const portfolio = useVegaPortfolio();

  const { data: simulators, isLoading } = useQuery({
    queryKey: ['vega-simulators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulators')
        .select('*')
        .eq('is_active', true)
        .eq('vega_eligible', true)
        .order('order_num');
      if (error) throw error;
      return data as Simulator[];
    },
  });

  const { data: simulationCountsByType = {} } = useQuery({
    queryKey: ['vega-sim-counts', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('simulations')
        .select('type')
        .eq('user_id', user.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((sim) => { counts[sim.type] = (counts[sim.type] || 0) + 1; });
      return counts;
    },
    enabled: !!user,
  });

  const routeToType: Record<string, string> = {
    '/simulateur-rsu': 'rsu',
    '/simulateur-espp': 'espp',
    '/simulateur-bspce': 'bspce',
  };

  const vegaCardNames: Record<string, string> = {
    '/simulateur-rsu': 'Mes plans RSU',
    '/simulateur-espp': 'Mes plans ESPP',
    '/simulateur-bspce': 'Mes plans BSPCE',
  };

  const visibleSimulators = simulators?.filter(s => s.visibility_status !== 'hidden') || [];
  const netPercent = 62;

  // Determine if we should show portfolio or landing
  const showPortfolio = portfolio.hasPlans && !portfolio.isLoading;

  return (
    <EmployeeLayout activeSection="vega">
      <div className="space-y-8">
        {/* Hero — always visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mx-auto">
            <Sparkles className="h-4 w-4" />
            Exclusif FinCare
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="hero-gradient">VEGA</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {showPortfolio
              ? "Votre portefeuille d'actions en temps réel"
              : "Comprenez l'avantage réel de vos actions"
            }
          </p>
        </motion.div>

        {showPortfolio ? (
          /* ====== PORTFOLIO MODE ====== */
          <Tabs defaultValue="portfolio" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="portfolio" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Mon portefeuille
              </TabsTrigger>
              <TabsTrigger value="learn" className="gap-2">
                <BookOpen className="h-4 w-4" />
                En savoir plus
              </TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="space-y-8">
              <VegaPortfolioDashboard portfolio={portfolio} />

              {/* Simulators grid */}
              {visibleSimulators.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold text-foreground">Voir mes plans</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleSimulators.map((simulator) => {
                      const simType = routeToType[simulator.route];
                      const count = simType ? (simulationCountsByType[simType] || 0) : 0;
                      return (
                        <SimulatorCard
                          key={simulator.id}
                          name={vegaCardNames[simulator.route] || simulator.name}
                          description={simulator.description}
                          icon={simulator.icon}
                          route={simulator.route}
                          featureKey={simulator.feature_key}
                          durationMinutes={simulator.duration_minutes}
                          visibilityStatus={simulator.visibility_status as any}
                          simulationsCount={count}
                          buttonLabel="Accéder à mes plans"
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="learn" className="space-y-8">
              <LearningContent />
            </TabsContent>
          </Tabs>
        ) : (
          /* ====== LANDING MODE (no plans yet) ====== */
          <LandingContent
            isLoading={isLoading}
            visibleSimulators={visibleSimulators}
            routeToType={routeToType}
            simulationCountsByType={simulationCountsByType}
            netPercent={netPercent}
          />
        )}
      </div>
    </EmployeeLayout>
  );
}

/* ====== Landing page content (extracted from original) ====== */
function LandingContent({
  isLoading,
  visibleSimulators,
  routeToType,
  simulationCountsByType,
  netPercent,
}: {
  isLoading: boolean;
  visibleSimulators: any[];
  routeToType: Record<string, string>;
  simulationCountsByType: Record<string, number>;
  netPercent: number;
}) {
  return (
    <div className="space-y-12">
      {/* Impact stat banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-2xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 p-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="relative flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm md:text-base text-foreground">
              En moyenne, les salariés <strong className="text-accent">sous-estiment la valeur de leur equity de 40%</strong>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pourquoi c'est complexe */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="space-y-6"
      >
        <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground">
          Pourquoi l'equity est difficile à évaluer seul
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {complexityPoints.map((point, i) => (
            <Card key={i} className="bg-card/60 border-border/40 backdrop-blur-sm">
              <CardContent className="pt-6 pb-5 px-5 space-y-3 text-center">
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <point.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{point.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Simulated result preview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="max-w-lg mx-auto"
      >
        <Card className="overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardContent className="pt-5 pb-5 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Exemple de simulation RSU
            </p>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Valeur brute</p>
                <p className="text-2xl font-bold text-foreground">10 000 €</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">Net perçu estimé</p>
                <p className="text-2xl font-bold text-primary">6 200 €</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${netPercent}%` }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 €</span>
                <span className="text-primary font-medium">62% net</span>
                <span>10 000 €</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/70 italic text-center">
              Résultat indicatif selon TMI à 30%
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Simulators Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement des simulateurs...</p>
          </CardContent>
        </Card>
      ) : visibleSimulators.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="space-y-4"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground">
            Lancez votre simulation
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSimulators.map((simulator) => {
              const simType = routeToType[simulator.route];
              const count = simType ? (simulationCountsByType[simType] || 0) : 0;
              return (
                <SimulatorCard
                  key={simulator.id}
                  name={simulator.name}
                  description={simulator.description}
                  icon={simulator.icon}
                  route={simulator.route}
                  featureKey={simulator.feature_key}
                  durationMinutes={simulator.duration_minutes}
                  visibilityStatus={simulator.visibility_status as any}
                  simulationsCount={count}
                  buttonLabel="Accéder à mes plans"
                />
              );
            })}
          </div>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-medium">Aucun simulateur disponible</p>
            <p className="text-sm text-muted-foreground">
              De nouveaux outils seront bientôt ajoutés à VEGA.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dispositifs accordion */}
      <LearningContent />

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="bg-muted/30 border border-border/50 rounded-xl p-6 text-center space-y-2"
      >
        <p className="text-sm text-muted-foreground">
          <strong>VEGA</strong> regroupe les simulateurs dédiés à vos dispositifs d'actionnariat salarié.
          Chaque outil vous aide à comprendre et optimiser la fiscalité de vos actions.
        </p>
      </motion.div>
    </div>
  );
}

/* ====== Pedagogical content (reusable) ====== */
function LearningContent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 max-w-2xl mx-auto"
    >
      <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground">
        Comprendre les dispositifs
      </h2>
      <Accordion type="multiple" className="space-y-2">
        {dispositifs.map((d) => (
          <AccordionItem key={d.id} value={d.id} className="border border-border/40 rounded-lg bg-card/60 backdrop-blur-sm px-4 overflow-hidden">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary hover:no-underline py-4">
              {d.title}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {d.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
