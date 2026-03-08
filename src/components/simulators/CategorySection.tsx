import { Calculator, TrendingUp, PieChart, Wallet, Shield, Home, Building2, Landmark, Receipt, FolderOpen } from 'lucide-react';
import { SimulatorCard } from './SimulatorCard';

interface Simulator {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  route: string;
  feature_key: string | null;
  duration_minutes: number;
  visibility_status?: 'visible' | 'disabled' | 'hidden';
}

interface SimulationCounts {
  [simulatorType: string]: number;
}

interface CategorySectionProps {
  name: string;
  description: string | null;
  icon: string;
  simulators: Simulator[];
  simulationCounts?: SimulationCounts;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'calculator': Calculator,
  'trending-up': TrendingUp,
  'pie-chart': PieChart,
  'wallet': Wallet,
  'shield': Shield,
  'home': Home,
  'building-2': Building2,
  'landmark': Landmark,
  'receipt': Receipt,
  'folder': FolderOpen,
};

export function CategorySection({ name, description, icon, simulators, simulationCounts = {} }: CategorySectionProps) {
  const IconComponent = iconMap[icon] || FolderOpen;
  
  // Helper to extract simulator type from route
  const getSimulatorType = (route: string): string | null => {
    const routeToType: Record<string, string> = {
      '/simulateur-interets-composes': 'interets_composes',
      '/simulateur-epargne-precaution': 'epargne_precaution',
      '/simulateur-capacite-emprunt': 'capacite_emprunt',
      '/simulateur-pret-immobilier': 'pret_immobilier',
      '/simulateur-per': 'per',
      '/simulateur-impots': 'impots',
      '/simulateur-espp': 'espp',
      '/simulateur-pvi': 'pvi',
      '/simulateur-lmnp': 'lmnp',
      '/simulateur-rsu': 'rsu',
      '/simulateur-bspce': 'bspce',
      '/optimisation-fiscale': 'optimisation_fiscale',
      '/simulateur-capacite-epargne': 'capacite_epargne_sim',
    };
    return routeToType[route] || null;
  };
  
  // Filter out hidden simulators
  const visibleSimulators = simulators.filter(s => s.visibility_status !== 'hidden');

  if (visibleSimulators.length === 0) return null;

  return (
    <section className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-border/50">
        <div className="p-2.5 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold tracking-tight">{name}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
          {visibleSimulators.length} simulateur{visibleSimulators.length > 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Simulators Grid - Equal height cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSimulators.map((simulator) => {
          const simType = getSimulatorType(simulator.route);
          const count = simType ? (simulationCounts[simType] || 0) : 0;
          return (
            <SimulatorCard
              key={simulator.id}
              name={simulator.name}
              description={simulator.description}
              icon={simulator.icon}
              route={simulator.route}
              featureKey={simulator.feature_key}
              durationMinutes={simulator.duration_minutes}
              visibilityStatus={simulator.visibility_status}
              simulationsCount={count}
            />
          );
        })}
      </div>
    </section>
  );
}
