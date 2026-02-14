import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Users, 
  BookOpen, 
  Route, 
  Calculator,
  TrendingUp,
  Calendar,
  Video,
  Activity,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  Area,
  AreaChart
} from "recharts";

interface CompanyDashboardStatsProps {
  companyId: string;
}

interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  avg_points: number;
}

interface ExtendedStats {
  total_modules_completed: number;
  total_simulations: number;
  total_appointments: number;
}

interface ModuleChartData {
  module_name: string;
  completion_count: number;
}

interface SimulationStats {
  simulator_type: string;
  usage_count: number;
}

interface ParcoursStats {
  parcours_name: string;
  user_count: number;
}

interface RegistrationTrendData {
  month: string;
  registrations: number;
}

const MODULE_TYPE_LABELS: Record<string, string> = {
  video: "Vidéo",
  quiz: "Quiz",
  webinar: "Webinar",
  guide: "Guide",
  formation: "Formation",
  appointment: "Rendez-vous",
};

const SIMULATOR_LABELS: Record<string, string> = {
  per: "PER",
  lmnp: "LMNP",
  capacite_emprunt: "Capacité d'emprunt",
  pret_immobilier: "Prêt immobilier",
  epargne_precaution: "Épargne de précaution",
  interets_composes: "Intérêts composés",
  impots: "Impôts",
  espp: "ESPP",
  optimisation_fiscale: "Optimisation fiscale",
};

const CHART_SOLID_COLORS = [
  "#F97316",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
];

const GradientDefs = () => (
  <>
    <linearGradient id="gradient-0" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
      <stop offset="100%" stopColor="#FB923C" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
      <stop offset="100%" stopColor="#34D399" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#EC4899" stopOpacity={1} />
      <stop offset="100%" stopColor="#F472B6" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="gradient-5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
      <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="gradient-bar-primary" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
      <stop offset="100%" stopColor="#10B981" stopOpacity={0.9} />
    </linearGradient>
  </>
);

const getGradientFill = (index: number) => `url(#gradient-${index % 6})`;

export function CompanyDashboardStats({ companyId }: CompanyDashboardStatsProps) {
  const [loading, setLoading] = useState(true);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
  const [moduleChartData, setModuleChartData] = useState<ModuleChartData[]>([]);
  const [simulationStats, setSimulationStats] = useState<SimulationStats[]>([]);
  const [parcoursStats, setParcoursStats] = useState<ParcoursStats[]>([]);
  const [registrationTrends, setRegistrationTrends] = useState<RegistrationTrendData[]>([]);
  const [webinarStats, setWebinarStats] = useState<{ total_registrations: number }>({ total_registrations: 0 });

  useEffect(() => {
    fetchAllStats();
  }, [companyId]);

  const fetchAllStats = async () => {
    setLoading(true);

    try {
      // Fetch all stats in parallel - no date filtering, all-time data
      const [empStatsRes, extStatsRes, moduleChartRes, simStatsRes] = await Promise.all([
        supabase.rpc("get_company_employee_stats", { 
          p_company_id: companyId,
          p_start_date: null,
          p_end_date: null
        }),
        supabase.rpc("get_company_extended_stats", { 
          p_company_id: companyId,
          p_start_date: null,
          p_end_date: null
        }),
        supabase.rpc("get_company_module_chart_data", { 
          p_company_id: companyId
        }),
        supabase.rpc("get_company_simulation_stats", { 
          p_company_id: companyId,
          p_start_date: null,
          p_end_date: null
        })
      ]);

      if (!empStatsRes.error && empStatsRes.data) {
        setEmployeeStats(empStatsRes.data as unknown as EmployeeStats);
      }
      if (!extStatsRes.error && extStatsRes.data) {
        setExtendedStats(extStatsRes.data as unknown as ExtendedStats);
      }
      if (!moduleChartRes.error && moduleChartRes.data) {
        setModuleChartData((moduleChartRes.data as unknown as ModuleChartData[]) || []);
      }
      if (!simStatsRes.error && simStatsRes.data) {
        setSimulationStats(simStatsRes.data as unknown as SimulationStats[]);
      }

      // Fetch secondary data in parallel
      await Promise.all([
        fetchParcoursDistribution(),
        fetchWebinarStats(),
        fetchRegistrationTrends(),
      ]);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParcoursDistribution = async () => {
    try {
      const { data: companyUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", companyId);

      if (!companyUsers || companyUsers.length === 0) {
        setParcoursStats([]);
        return;
      }

      const userIds = companyUsers.map(u => u.id);

      const { data: userParcoursData } = await supabase
        .from("user_parcours")
        .select("parcours_id")
        .in("user_id", userIds);

      if (!userParcoursData || userParcoursData.length === 0) {
        setParcoursStats([]);
        return;
      }

      const parcoursIds = [...new Set(userParcoursData.map(u => u.parcours_id).filter(Boolean))];
      
      const { data: parcoursData } = await supabase
        .from("parcours")
        .select("id, title")
        .in("id", parcoursIds);

      const parcoursCounts: Record<string, { name: string; count: number }> = {};
      parcoursData?.forEach(p => {
        parcoursCounts[p.id] = { name: p.title, count: 0 };
      });

      userParcoursData.forEach(u => {
        if (u.parcours_id && parcoursCounts[u.parcours_id]) {
          parcoursCounts[u.parcours_id].count++;
        }
      });

      setParcoursStats(
        Object.values(parcoursCounts)
          .filter(p => p.count > 0)
          .map(p => ({ parcours_name: p.name, user_count: p.count }))
      );
    } catch (error) {
      console.error("Error fetching parcours distribution:", error);
    }
  };

  const fetchWebinarStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-company-webinars", {
        body: { company_id: companyId },
      });

      if (error) throw error;

      const webinarsData = ((data as any)?.webinars as Array<{ total_registrations: number }> | undefined) || [];
      const total = webinarsData.reduce((acc, w) => acc + (w.total_registrations || 0), 0);

      setWebinarStats({ total_registrations: total });
    } catch (error) {
      console.error("Error fetching webinar stats:", error);
      setWebinarStats({ total_registrations: 0 });
    }
  };

  const fetchRegistrationTrends = async () => {
    try {
      const { data, error } = await supabase.rpc("get_company_registration_trends", {
        p_company_id: companyId
      });

      if (error) {
        console.error("Error fetching registration trends:", error);
        setRegistrationTrends([]);
        return;
      }

      const rawData = data as unknown as { month_key: string; month_label: string; registrations: number }[];
      if (!rawData || rawData.length === 0) {
        setRegistrationTrends([]);
        return;
      }

      const trends = rawData
        .map(item => ({
          month: item.month_label,
          registrations: Number(item.registrations)
        }))
        .slice(-12);

      setRegistrationTrends(trends);
    } catch (error) {
      console.error("Error fetching registration trends:", error);
      setRegistrationTrends([]);
    }
  };

  // Prepare chart data
  const moduleChartFormatted = moduleChartData
    .filter(d => d.completion_count > 0)
    .map(d => ({
      name: d.module_name,
      value: d.completion_count
    }));

  const simulationChartData = simulationStats
    .filter(s => s.usage_count > 0)
    .map(s => ({
      name: SIMULATOR_LABELS[s.simulator_type] || s.simulator_type,
      simulations: s.usage_count,
      utilisateurs: 0
    }));

  const registeredCount = employeeStats?.active_employees || 0;
  const totalCount = employeeStats?.total_employees || 0;
  const connectionRate = totalCount > 0
    ? Math.round((registeredCount / totalCount) * 100) 
    : 0;

  const totalSimulations = simulationStats.reduce((acc, s) => acc + s.usage_count, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Vue d'ensemble
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Données globales de l'engagement de vos collaborateurs
        </p>
      </div>

      {/* Main Stats Grid */}
      <TooltipProvider>
        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Nombre d'utilisateurs */}
          <StatCard
            icon={<Users className="h-5 w-5" />}
            title="Nombre d'utilisateurs"
            value={totalCount}
            subtitle={`${registeredCount} se sont connectés`}
            badgeText={totalCount ? `${connectionRate}%` : undefined}
            colorClass="from-violet-500/20 to-violet-500/5"
            iconColorClass="text-violet-600 bg-violet-500/10"
            tooltip="Nombre total de profils enregistrés pour cette entreprise."
          />

          {/* Taux de connexion */}
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            title="Taux de connexion"
            value={`${connectionRate}%`}
            subtitle={`${registeredCount} utilisateurs se sont connectés`}
            colorClass="from-primary/20 to-primary/5"
            iconColorClass="text-primary bg-primary/10"
            tooltip="Pourcentage d'utilisateurs qui se sont connectés au moins une fois."
          />

          {/* Modules complétés */}
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Modules complétés"
            value={extendedStats?.total_modules_completed || 0}
            subtitle={`Moy. ${totalCount > 0 ? (((extendedStats?.total_modules_completed || 0) / totalCount).toFixed(1)) : 0} par utilisateur`}
            colorClass="from-secondary/20 to-secondary/5"
            iconColorClass="text-secondary bg-secondary/10"
          />

          {/* RDV Experts */}
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            title="Rendez-vous pris"
            value={extendedStats?.total_appointments || 0}
            subtitle={`0 réalisés`}
            colorClass="from-accent/20 to-accent/5"
            iconColorClass="text-accent bg-accent/10"
            tooltip="Nombre total de rendez-vous pris avec un conseiller."
          />
        </motion.div>

        {/* Secondary Stats */}
        <motion.div 
          className="grid gap-4 md:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatCard
            icon={<Calculator className="h-5 w-5" />}
            title="Simulations réalisées"
            value={totalSimulations}
            subtitle={`${simulationStats.length} simulateurs utilisés`}
            colorClass="from-orange-500/20 to-orange-500/5"
            iconColorClass="text-orange-600 bg-orange-500/10"
          />

          <StatCard
            icon={<Route className="h-5 w-5" />}
            title="Parcours actifs"
            value={parcoursStats.reduce((acc, p) => acc + p.user_count, 0)}
            subtitle="Utilisateurs en parcours"
            colorClass="from-cyan-500/20 to-cyan-500/5"
            iconColorClass="text-cyan-600 bg-cyan-500/10"
            tooltip="Nombre d'utilisateurs actuellement engagés dans un parcours de formation."
          />

          <StatCard
            icon={<Video className="h-5 w-5" />}
            title="Inscrits aux webinars"
            value={webinarStats.total_registrations}
            subtitle="Total d'inscriptions à des webinars"
            colorClass="from-green-500/20 to-green-500/5"
            iconColorClass="text-green-600 bg-green-500/10"
          />
        </motion.div>
      </TooltipProvider>

      {/* Charts Section */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Module Types Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Répartition par type de module
            </CardTitle>
            <CardDescription>Modules complétés par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            {moduleChartFormatted.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <GradientDefs />
                    </defs>
                    <Pie
                      data={moduleChartFormatted}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {moduleChartFormatted.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getGradientFill(index)}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))"
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                      formatter={(value: number, name: string) => [`${value} complétés`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucun module complété</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulations Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Utilisation des simulateurs
            </CardTitle>
            <CardDescription>Simulations par outil</CardDescription>
          </CardHeader>
          <CardContent>
            {simulationChartData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulationChartData} layout="vertical">
                    <defs>
                      <GradientDefs />
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={130}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))"
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Bar 
                      dataKey="simulations" 
                      fill="url(#gradient-bar-primary)" 
                      radius={[0, 6, 6, 0]}
                      name="Simulations"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucune simulation effectuée</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Parcours Distribution Chart */}
      {parcoursStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                Répartition par type de parcours
              </CardTitle>
              <CardDescription>Distribution des utilisateurs selon leur parcours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <GradientDefs />
                    </defs>
                    <Pie
                      data={parcoursStats.map(p => ({ name: p.parcours_name, value: p.user_count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {parcoursStats.map((_, index) => (
                        <Cell 
                          key={`cell-parcours-${index}`} 
                          fill={getGradientFill(index)}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))"
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Registration Trends Chart */}
      {registrationTrends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Évolution des inscriptions
              </CardTitle>
              <CardDescription>Nouvelles inscriptions par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationTrends}>
                    <defs>
                      <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))"
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRegistrations)"
                      name="Inscriptions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  badgeText?: string;
  colorClass: string;
  iconColorClass: string;
  tooltip?: string;
}

function StatCard({ icon, title, value, subtitle, badgeText, colorClass, iconColorClass, tooltip }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", colorClass)} />
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className={cn("p-2.5 rounded-xl", iconColorClass)}>
            {icon}
          </div>
          {badgeText && (
            <Badge variant="outline" className="text-xs font-medium">
              {badgeText}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {tooltip && (
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </UITooltip>
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
