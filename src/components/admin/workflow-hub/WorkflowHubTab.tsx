import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitBranch, 
  Lightbulb, 
  Calculator, 
  Bell, 
  LayoutDashboard,
  ArrowLeft,
  Workflow,
  Database
} from "lucide-react";
import { WorkflowSystemType, SYSTEM_CONFIG } from "./types";
import { WorkflowDashboard } from "./WorkflowDashboard";
import { useWorkflowData } from "./useWorkflowData";
import { SyncKeysButton } from "./SyncKeysButton";
import { EvaluationKeysView } from "./EvaluationKeysView";

// Lazy imports for the system tabs
import { OnboardingCMSTab } from "../OnboardingCMSTab";
import { RecommendationsTab } from "../RecommendationsTab";
import { SimulatorCTAsTab } from "../SimulatorCTAsTab";
import { NotificationsTab } from "../NotificationsTab";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GitBranch,
  Lightbulb,
  Calculator,
  Bell,
  Database,
};

export function WorkflowHubTab() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'keys' | WorkflowSystemType>('dashboard');
  const { getSystemStats, connections } = useWorkflowData();

  const systems: WorkflowSystemType[] = ['onboarding', 'recommendations', 'simulator_ctas', 'notifications'];

  const handleNavigateToSystem = (system: WorkflowSystemType) => {
    setActiveTab(system);
  };

  const renderSystemContent = () => {
    switch (activeTab) {
      case 'onboarding':
        return <OnboardingCMSTab />;
      case 'recommendations':
        return <RecommendationsTab />;
      case 'simulator_ctas':
        return <SimulatorCTAsTab />;
      case 'notifications':
        return <NotificationsTab />;
      default:
        return null;
    }
  };

  const totalRules = systems.reduce((sum, sys) => sum + getSystemStats(sys).total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20 ring-1 ring-primary/30">
              <Workflow className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Workflow Hub
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Centre de configuration unifié des interactions app → utilisateurs
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {systems.length} systèmes
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {totalRules} règles
                </Badge>
              <Badge variant="outline" className="text-xs">
                  {connections.length} connexions
                </Badge>
              </div>
            </div>
          </div>
          <SyncKeysButton />
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab !== 'dashboard' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTab('dashboard')}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          )}
          
          <TabsList className="flex-wrap h-auto p-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            
            <TabsTrigger value="keys" className="gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline">Clés</span>
            </TabsTrigger>
            
            {systems.map(systemKey => {
              const config = SYSTEM_CONFIG[systemKey];
              const stats = getSystemStats(systemKey);
              const Icon = ICONS[config.icon];

              return (
                <TabsTrigger 
                  key={systemKey} 
                  value={systemKey}
                  className="gap-2"
                >
                  {Icon && <Icon className={`h-4 w-4 ${config.color}`} />}
                  <span className="hidden sm:inline">{config.label}</span>
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] h-5 px-1.5 ml-1"
                  >
                    {stats.total}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-6">
          <WorkflowDashboard onNavigateToSystem={handleNavigateToSystem} />
        </TabsContent>

        <TabsContent value="keys" className="mt-6">
          <EvaluationKeysView />
        </TabsContent>

        {systems.map(systemKey => (
          <TabsContent key={systemKey} value={systemKey} className="mt-6">
            {activeTab === systemKey && renderSystemContent()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
