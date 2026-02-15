import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, BookOpen, Calculator, TrendingUp, Clock, Trophy, 
  BarChart3, Activity, Target, Building2 
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

interface CompanyStats {
  companyId: string;
  companyName: string;
  totalEmployees: number;
  activeEmployees: number;
  activationRate: number;
  avgPoints: number;
  modulesCompleted: number;
  simulationsCount: number;
  avgSessionMinutes: number;
  appointmentsCount: number;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 197 37% 24%))",
  "hsl(var(--chart-4, 43 74% 66%))",
  "hsl(var(--chart-5, 27 87% 67%))",
];

export function AnalyticsDashboardTab() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [moduleChartData, setModuleChartData] = useState<any[]>([]);
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [registrationTrends, setRegistrationTrends] = useState<any[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchAllStats();
  }, [companies]);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("companies")
      .select("id, name, partnership_type")
      .order("name");
    setCompanies(data || []);
  };

  const fetchAllStats = async () => {
    if (companies.length === 0) return;
    setLoading(true);

    try {
      // Fetch profiles with company info
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, company_id, total_points, completed_modules, last_login, current_session_start, created_at");

      // Fetch module validations
      const { data: validations } = await supabase
        .from("module_validations")
        .select("user_id, module_id");

      // Fetch simulation logs
      const { data: simLogs } = await supabase
        .from("simulation_logs")
        .select("user_id, simulator_type, created_at");

      // Fetch appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("user_id, created_at");

      // Fetch modules for chart
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title");

      // Build per-company stats
      const stats: CompanyStats[] = companies.map((company) => {
        const companyProfiles = (profiles || []).filter((p) => p.company_id === company.id);
        const companyUserIds = new Set(companyProfiles.map((p) => p.id));
        const activeProfiles = companyProfiles.filter((p) => p.last_login);
        const companyValidations = (validations || []).filter((v) => companyUserIds.has(v.user_id));
        const companySims = (simLogs || []).filter((s) => companyUserIds.has(s.user_id));
        const companyAppointments = (appointments || []).filter((a) => companyUserIds.has(a.user_id));
        const avgPts = companyProfiles.length > 0
          ? companyProfiles.reduce((s, p) => s + (p.total_points || 0), 0) / companyProfiles.length
          : 0;

        return {
          companyId: company.id,
          companyName: company.name,
          totalEmployees: companyProfiles.length,
          activeEmployees: activeProfiles.length,
          activationRate: companyProfiles.length > 0 ? (activeProfiles.length / companyProfiles.length) * 100 : 0,
          avgPoints: Math.round(avgPts),
          modulesCompleted: companyValidations.length,
          simulationsCount: companySims.length,
          avgSessionMinutes: 0, // Would need session tracking
          appointmentsCount: companyAppointments.length,
        };
      });

      setCompanyStats(stats.sort((a, b) => b.activationRate - a.activationRate));

      // Module completion chart data
      const moduleCounts: Record<number, number> = {};
      (validations || []).forEach((v) => {
        moduleCounts[v.module_id] = (moduleCounts[v.module_id] || 0) + 1;
      });
      const moduleChart = (modules || [])
        .map((m) => ({ name: m.title.substring(0, 20), completions: moduleCounts[m.id] || 0 }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 8);
      setModuleChartData(moduleChart);

      // Simulation type distribution
      const simTypeCounts: Record<string, number> = {};
      (simLogs || []).forEach((s) => {
        const type = s.simulator_type || "Autre";
        simTypeCounts[type] = (simTypeCounts[type] || 0) + 1;
      });
      const simData = Object.entries(simTypeCounts)
        .map(([name, value]) => ({ name: formatSimType(name), value }))
        .sort((a, b) => b.value - a.value);
      setSimulationData(simData);

      // Registration trends (all companies)
      const monthCounts: Record<string, number> = {};
      (profiles || []).forEach((p) => {
        const month = p.created_at?.substring(0, 7) || "";
        if (month) monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
      const trends = Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, count]) => ({
          month: formatMonth(month),
          inscriptions: count,
        }));
      setRegistrationTrends(trends);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSimType = (type: string) => {
    const map: Record<string, string> = {
      per: "PER",
      capacite_emprunt: "Capacité d'emprunt",
      epargne_precaution: "Épargne précaution",
      espp: "ESPP",
      impots: "Impôts",
      lmnp: "LMNP",
      girardin: "Girardin",
    };
    return map[type] || type;
  };

  const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
  };

  // Filtered stats
  const filteredStats = useMemo(() => {
    if (selectedCompanyId === "all") return companyStats;
    return companyStats.filter((s) => s.companyId === selectedCompanyId);
  }, [companyStats, selectedCompanyId]);

  // Aggregated KPIs
  const kpis = useMemo(() => {
    const stats = filteredStats;
    return {
      totalEmployees: stats.reduce((s, c) => s + c.totalEmployees, 0),
      activeEmployees: stats.reduce((s, c) => s + c.activeEmployees, 0),
      avgActivation: stats.length > 0 ? stats.reduce((s, c) => s + c.activationRate, 0) / stats.length : 0,
      totalModules: stats.reduce((s, c) => s + c.modulesCompleted, 0),
      totalSimulations: stats.reduce((s, c) => s + c.simulationsCount, 0),
      totalAppointments: stats.reduce((s, c) => s + c.appointmentsCount, 0),
      avgPoints: stats.length > 0 ? Math.round(stats.reduce((s, c) => s + c.avgPoints, 0) / stats.length) : 0,
    };
  }, [filteredStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & Engagement
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d'ensemble de l'engagement par entreprise
          </p>
        </div>
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Toutes les entreprises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Utilisateurs inscrits" value={kpis.totalEmployees} />
        <KPICard icon={Activity} label="Utilisateurs actifs" value={kpis.activeEmployees} subtitle={`${kpis.avgActivation.toFixed(0)}% d'activation`} />
        <KPICard icon={BookOpen} label="Modules complétés" value={kpis.totalModules} />
        <KPICard icon={Calculator} label="Simulations réalisées" value={kpis.totalSimulations} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard icon={Trophy} label="Points moyens" value={kpis.avgPoints} />
        <KPICard icon={Target} label="RDV Expert pris" value={kpis.totalAppointments} />
        <KPICard icon={Building2} label="Entreprises actives" value={filteredStats.filter((s) => s.activeEmployees > 0).length} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendance des inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrationTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="inscriptions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Module completions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Top modules complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moduleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={moduleChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Simulator usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Utilisation des simulateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simulationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={simulationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {simulationData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Company ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Classement par entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {companyStats.slice(0, 10).map((stat, i) => (
                <div key={stat.companyId} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{stat.companyName}</span>
                      <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                        {stat.activationRate.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={stat.activationRate} className="h-2" />
                  </div>
                </div>
              ))}
              {companyStats.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Aucune entreprise</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed company table */}
      {selectedCompanyId === "all" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail par entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3">Entreprise</th>
                    <th className="text-right py-2 px-3">Inscrits</th>
                    <th className="text-right py-2 px-3">Actifs</th>
                    <th className="text-right py-2 px-3">Activation</th>
                    <th className="text-right py-2 px-3">Modules</th>
                    <th className="text-right py-2 px-3">Simulations</th>
                    <th className="text-right py-2 px-3">Pts moy.</th>
                    <th className="text-right py-2 px-3">RDV</th>
                  </tr>
                </thead>
                <tbody>
                  {companyStats.map((stat) => (
                    <tr key={stat.companyId} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{stat.companyName}</td>
                      <td className="text-right py-2 px-3">{stat.totalEmployees}</td>
                      <td className="text-right py-2 px-3">{stat.activeEmployees}</td>
                      <td className="text-right py-2 px-3">
                        <Badge variant={stat.activationRate > 50 ? "default" : "secondary"} className="text-xs">
                          {stat.activationRate.toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-3">{stat.modulesCompleted}</td>
                      <td className="text-right py-2 px-3">{stat.simulationsCount}</td>
                      <td className="text-right py-2 px-3">{stat.avgPoints}</td>
                      <td className="text-right py-2 px-3">{stat.appointmentsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subtitle }: { icon: React.ElementType; label: string; value: number; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {subtitle && <p className="text-xs text-primary font-medium">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
