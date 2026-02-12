import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  GitBranch, 
  Lightbulb, 
  Calculator, 
  Bell, 
  ArrowRight, 
  Link2,
  Activity,
  TrendingUp,
  Zap,
  Eye
} from "lucide-react";
import { WorkflowSystemType, SYSTEM_CONFIG, WorkflowConnection } from "./types";
import { useWorkflowData } from "./useWorkflowData";

interface WorkflowDashboardProps {
  onNavigateToSystem: (system: WorkflowSystemType) => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GitBranch,
  Lightbulb,
  Calculator,
  Bell,
};

export function WorkflowDashboard({ onNavigateToSystem }: WorkflowDashboardProps) {
  const { loading, connections, getSystemStats } = useWorkflowData();

  const systems: WorkflowSystemType[] = ['onboarding', 'recommendations', 'simulator_ctas', 'notifications'];
  
  // Group connections by source system
  const connectionsBySource = connections.reduce((acc, conn) => {
    if (!acc[conn.sourceSystem]) acc[conn.sourceSystem] = [];
    acc[conn.sourceSystem].push(conn);
    return acc;
  }, {} as Record<WorkflowSystemType, WorkflowConnection[]>);

  // Calculate total stats
  const totalRules = systems.reduce((sum, sys) => sum + getSystemStats(sys).total, 0);
  const totalActive = systems.reduce((sum, sys) => sum + getSystemStats(sys).active, 0);
  const totalConnections = connections.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total règles</p>
                <p className="text-3xl font-bold">{totalRules}</p>
              </div>
              <Activity className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Règles actives</p>
                <p className="text-3xl font-bold text-emerald-600">{totalActive}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connexions</p>
                <p className="text-3xl font-bold text-amber-600">{totalConnections}</p>
              </div>
              <Link2 className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Systèmes</p>
                <p className="text-3xl font-bold text-purple-600">{systems.length}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map(systemKey => {
          const config = SYSTEM_CONFIG[systemKey];
          const stats = getSystemStats(systemKey);
          const Icon = ICONS[config.icon];
          const systemConnections = connectionsBySource[systemKey] || [];

          return (
            <Card 
              key={systemKey} 
              className={`group hover:shadow-md transition-all cursor-pointer ${config.bgColor} ${config.borderColor} border-2`}
              onClick={() => onNavigateToSystem(systemKey)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${config.bgColor} ring-1 ${config.borderColor}`}>
                      {Icon && <Icon className={`h-5 w-5 ${config.color}`} />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {config.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Stats */}
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-xs">
                    {stats.total} {stats.total > 1 ? 'règles' : 'règle'}
                  </Badge>
                  <Badge variant="default" className="text-xs bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                    {stats.active} active{stats.active > 1 ? 's' : ''}
                  </Badge>
                  {systemConnections.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Link2 className="h-3 w-3 mr-1" />
                      {systemConnections.length} connexion{systemConnections.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Connections preview */}
                {systemConnections.length > 0 && (
                  <div className="space-y-1.5 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Connexions sortantes :</p>
                    {systemConnections.slice(0, 3).map(conn => (
                      <div key={conn.id} className="flex items-center gap-2 text-xs">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{conn.sourceName}</span>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {SYSTEM_CONFIG[conn.targetSystem].label}
                        </Badge>
                      </div>
                    ))}
                    {systemConnections.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{systemConnections.length - 3} autres...
                      </p>
                    )}
                  </div>
                )}

                {systemConnections.length === 0 && (
                  <div className="text-xs text-muted-foreground italic border-t pt-3">
                    Aucune connexion vers d'autres systèmes
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Global Connections Overview */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Vue d'ensemble des connexions
            </CardTitle>
            <CardDescription>
              Toutes les interdépendances entre les systèmes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {connections.map(conn => {
                const sourceConfig = SYSTEM_CONFIG[conn.sourceSystem];
                const targetConfig = SYSTEM_CONFIG[conn.targetSystem];
                const SourceIcon = ICONS[sourceConfig.icon];
                const TargetIcon = ICONS[targetConfig.icon];

                return (
                  <div 
                    key={conn.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-1.5 rounded ${sourceConfig.bgColor}`}>
                      {SourceIcon && <SourceIcon className={`h-3.5 w-3.5 ${sourceConfig.color}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{conn.sourceName}</p>
                      <p className="text-[10px] text-muted-foreground">{sourceConfig.label}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className={`p-1.5 rounded ${targetConfig.bgColor}`}>
                      {TargetIcon && <TargetIcon className={`h-3.5 w-3.5 ${targetConfig.color}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{conn.targetName}</p>
                      <p className="text-[10px] text-muted-foreground">{targetConfig.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
