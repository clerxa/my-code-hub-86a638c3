import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { SimulatorCard } from "@/components/simulators/SimulatorCard";
import { useAuth } from "@/components/AuthProvider";

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

export default function VegaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Fetch simulation counts per type
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
    '/simulateur-rsu': 'rsu_simulations',
    '/simulateur-espp': 'espp',
  };

  const visibleSimulators = simulators?.filter(s => s.visibility_status !== 'hidden') || [];

  return (
    <EmployeeLayout activeSection="vega">
      <div className="space-y-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mx-auto">
            <Sparkles className="h-4 w-4" />
            Exclusif FinCare
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="hero-gradient">Vega</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Comprenez l'avantage réel de vos actions
          </p>
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
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
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
                />
              );
            })}
          </motion.div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">Aucun simulateur disponible</p>
              <p className="text-sm text-muted-foreground">
                De nouveaux outils seront bientôt ajoutés à Vega.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/30 border border-border/50 rounded-xl p-6 text-center space-y-2"
        >
          <p className="text-sm text-muted-foreground">
            <strong>Vega</strong> regroupe les simulateurs dédiés à vos dispositifs d'actionnariat salarié. 
            Chaque outil vous aide à comprendre et optimiser la fiscalité de vos actions.
          </p>
        </motion.div>
      </div>
    </EmployeeLayout>
  );
}
