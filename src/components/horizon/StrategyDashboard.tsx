import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target, TrendingUp, Wallet, Calendar, Rocket, ArrowRight,
  PieChart as PieChartIcon, Shield, Zap, MessageCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { HorizonProject } from "@/hooks/useHorizonProjects";
import type { HorizonBudget } from "@/hooks/useHorizonBudget";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setBookingReferrerWithUtm } from "@/hooks/useBookingReferrer";
import confetti from "canvas-confetti";

interface StrategyDashboardProps {
  projects: HorizonProject[];
  budget: HorizonBudget;
  allocatedCapital: number;
  allocatedMonthly: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function computeProjected(project: HorizonProject) {
  const rate = Number(project.annual_return_rate || 0) / 100;
  const monthlyRate = rate / 12;
  const months = project.duration_months || 120;
  const apport = Number(project.apport);
  const monthly = Number(project.monthly_allocation);

  if (monthlyRate > 0) {
    return apport * Math.pow(1 + monthlyRate, months) +
      monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }
  return apport + monthly * months;
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",   // Blue primary
  "hsl(271, 81%, 56%)",   // Purple secondary
  "hsl(38, 92%, 50%)",    // Amber accent
  "hsl(160, 84%, 39%)",   // Emerald
  "hsl(340, 82%, 52%)",   // Rose
  "hsl(200, 98%, 39%)",   // Cyan
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }
};

export function StrategyDashboard({ projects, budget, allocatedCapital, allocatedMonthly }: StrategyDashboardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const activeProjects = projects.filter(p => p.status === "active");

  // Aggregate products
  const productMap = new Map<string, { name: string; count: number; totalApport: number; totalMonthly: number; totalTarget: number; totalProjected: number; color: string }>();
  activeProjects.forEach((p, i) => {
    const key = p.product_name || "Épargne libre";
    const existing = productMap.get(key);
    const projected = computeProjected(p);
    if (existing) {
      existing.count += 1;
      existing.totalApport += Number(p.apport);
      existing.totalMonthly += Number(p.monthly_allocation);
      existing.totalTarget += Number(p.target_amount);
      existing.totalProjected += projected;
    } else {
      productMap.set(key, {
        name: key,
        count: 1,
        totalApport: Number(p.apport),
        totalMonthly: Number(p.monthly_allocation),
        totalTarget: Number(p.target_amount),
        totalProjected: projected,
        color: CHART_COLORS[i % CHART_COLORS.length],
      });
    }
  });
  const productData = Array.from(productMap.values());

  // Global stats
  const totalTarget = activeProjects.reduce((s, p) => s + Number(p.target_amount), 0);
  const totalProjected = activeProjects.reduce((s, p) => s + computeProjected(p), 0);
  const globalPct = totalTarget > 0 ? Math.min(100, Math.round((totalProjected / totalTarget) * 100)) : 0;
  const maxHorizon = Math.max(...activeProjects.map(p => Math.round((p.duration_months || 120) / 12)), 0);
  const totalInterests = totalProjected - allocatedCapital - (allocatedMonthly * Math.max(...activeProjects.map(p => p.duration_months || 120), 0));

  // Pie data for allocation
  const pieDataApport = productData.map(p => ({ name: p.name, value: p.totalApport, color: p.color }));
  const pieDataMonthly = productData.map(p => ({ name: p.name, value: p.totalMonthly, color: p.color }));

  const handleCTA = () => {
    confetti({ particleCount: 120, spread: 90, origin: { x: 0.5, y: 0.6 }, colors: ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981'] });
    // Navigate to expert booking with UTM tracking
    setBookingReferrerWithUtm('/employee/horizon', 'horizon_passer_action');
    navigate('/expert-booking');
  };

  if (activeProjects.length === 0) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="overflow-hidden border-primary/20">
        {/* Header banner */}
        <motion.div
          variants={itemVariants}
          className="relative bg-gradient-to-r from-primary via-purple-600 to-accent p-6 sm:p-8 text-white overflow-hidden cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Ma Stratégie Financière</h2>
              </div>
              <p className="text-white/80 text-sm">
                {activeProjects.length} projet{activeProjects.length > 1 ? "s" : ""} · Horizon {maxHorizon} an{maxHorizon > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                {globalPct >= 100 ? "✅" : "🚀"} {globalPct}% faisable
              </Badge>
              {expanded ? <ChevronUp className="h-5 w-5 text-white/60" /> : <ChevronDown className="h-5 w-5 text-white/60" />}
            </div>
          </div>
        </motion.div>

        {expanded && (
            <div>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* KPI Row */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard
                    icon={<Target className="h-4 w-4" />}
                    label="Objectif total"
                    value={fmt(totalTarget)}
                    color="text-primary"
                    bgColor="bg-primary/10"
                  />
                  <KpiCard
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Projeté total"
                    value={fmt(totalProjected)}
                    color="text-emerald-600 dark:text-emerald-400"
                    bgColor="bg-emerald-500/10"
                  />
                  <KpiCard
                    icon={<Wallet className="h-4 w-4" />}
                    label="Épargne mensuelle"
                    value={fmt(allocatedMonthly)}
                    color="text-purple-600 dark:text-purple-400"
                    bgColor="bg-purple-500/10"
                    sub="/mois"
                  />
                  <KpiCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Horizon max"
                    value={`${maxHorizon}`}
                    color="text-amber-600 dark:text-amber-400"
                    bgColor="bg-amber-500/10"
                    sub={`an${maxHorizon > 1 ? "s" : ""}`}
                  />
                </motion.div>

                {/* Global feasibility bar */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Faisabilité globale</span>
                    <span className="font-bold text-foreground">{globalPct}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={globalPct} className="h-3 rounded-full" />
                    {globalPct >= 100 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 bg-emerald-500 text-white rounded-full p-0.5"
                      >
                        <Shield className="h-3 w-3" />
                      </motion.div>
                    )}
                  </div>
                  {totalInterests > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Vos intérêts composés génèrent {fmt(totalInterests)} supplémentaires
                    </p>
                  )}
                </motion.div>

                {/* Charts + Products grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Allocation chart */}
                  <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <PieChartIcon className="h-4 w-4 text-primary" />
                      Répartition du capital initial
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieDataApport}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieDataApport.map((entry, index) => (
                              <Cell key={index} fill={entry.color} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => fmt(value)}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--popover))",
                              color: "hsl(var(--popover-foreground))",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {pieDataApport.map((d, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Monthly allocation chart */}
                  <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <PieChartIcon className="h-4 w-4 text-purple-500" />
                      Répartition de l'épargne mensuelle
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieDataMonthly}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieDataMonthly.map((entry, index) => (
                              <Cell key={index} fill={entry.color} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => fmt(value)}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--popover))",
                              color: "hsl(var(--popover-foreground))",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {pieDataMonthly.map((d, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Products summary cards */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Produits à ouvrir
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {productData.map((product, i) => {
                      const pct = product.totalTarget > 0 ? Math.min(100, Math.round((product.totalProjected / product.totalTarget) * 100)) : 0;
                      return (
                        <motion.div
                          key={product.name}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: product.color }} />
                              <span className="font-semibold text-sm text-foreground">{product.name}</span>
                            </div>
                            {product.count > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                ×{product.count}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Apport</span>
                              <p className="font-medium text-foreground">{fmt(product.totalApport)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mensuel</span>
                              <p className="font-medium text-foreground">{fmt(product.totalMonthly)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Objectif</span>
                              <p className="font-medium text-foreground">{fmt(product.totalTarget)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Projeté</span>
                              <p className="font-medium text-emerald-600 dark:text-emerald-400">{fmt(product.totalProjected)}</p>
                            </div>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                          <p className="text-xs text-muted-foreground text-right">{pct}% de l'objectif</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* CTA section */}
                <motion.div
                  variants={itemVariants}
                  className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 via-purple-500/10 to-amber-500/10 border border-primary/20 p-6 text-center space-y-4"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.08),transparent_60%)]" />
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">
                      Prêt à concrétiser votre stratégie ?
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Prenez rendez-vous avec un conseiller certifié pour valider votre plan d'action et ouvrir vos produits financiers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/25"
                        onClick={handleCTA}
                      >
                        <Rocket className="h-4 w-4" />
                        Passer à l'action
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="lg" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Poser une question
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </div>
          )}
      </Card>
    </motion.div>
  );
}

function KpiCard({ icon, label, value, color, bgColor, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  sub?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="border rounded-xl p-3 sm:p-4 space-y-1 bg-card hover:shadow-md transition-shadow"
    >
      <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}>
        <div className={`p-1 rounded-md ${bgColor}`}>{icon}</div>
        {label}
      </div>
      <p className="text-lg sm:text-xl font-bold text-foreground">
        {value}
        {sub && <span className="text-xs font-normal text-muted-foreground ml-1">{sub}</span>}
      </p>
    </motion.div>
  );
}
