/**
 * Page dédiée au scoring d'intention RDV des utilisateurs
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame, Thermometer, Snowflake, Search, Users, TrendingUp, Target, BarChart3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ScoreSignal {
  signal_key: string;
  signal_label: string;
  signal_category: string;
  raw_count: number;
  points_per_unit: number;
  max_points: number | null;
  earned_points: number;
}

interface UserScore {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  total_score: number;
  max_possible: number;
  percentage: number;
  level: "froid" | "tiède" | "chaud" | "brûlant";
  signals: ScoreSignal[];
  by_category: Record<string, { earned: number; max: number }>;
}

const LEVEL_CONFIG = {
  brûlant: { color: "bg-red-500 text-white", icon: Flame, label: "🔥 Brûlant" },
  chaud: { color: "bg-orange-500 text-white", icon: Flame, label: "🟠 Chaud" },
  tiède: { color: "bg-yellow-500 text-black", icon: Thermometer, label: "🟡 Tiède" },
  froid: { color: "bg-blue-200 text-blue-800", icon: Snowflake, label: "🔵 Froid" },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  engagement: "Engagement",
  profile_maturity: "Maturité profil",
  intent_rdv: "Intent RDV",
};

export function IntentionScoringTab() {
  const [users, setUsers] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserScore | null>(null);

  useEffect(() => {
    loadAllScores();
  }, []);

  async function loadAllScores() {
    setLoading(true);
    try {
      // Load config, profiles, companies and all signal data
      const [configRes, profilesRes, companiesRes] = await Promise.all([
        supabase.from("intention_score_config").select("*").eq("is_active", true).order("display_order"),
        supabase.from("profiles").select("id, email, first_name, last_name, company_id, net_taxable_income"),
        supabase.from("companies").select("id, name"),
      ]);

      const configs = configRes.data || [];
      const profiles = profilesRes.data || [];
      const companyList = (companiesRes.data || []) as { id: string; name: string }[];
      setCompanies(companyList);
      const companyMap = Object.fromEntries(companyList.map((c) => [c.id, c.name]));

      // Batch fetch all signal sources
      const [loginsRes, simLogsRes, modulesRes, diagnosticRes, horizonRes, eventsRes, appointmentsRes, fpRes, riskRes, realEstateRes, prepRes] = await Promise.all([
        supabase.from("daily_logins").select("user_id"),
        supabase.from("simulation_logs").select("user_id, appointment_cta_clicked"),
        supabase.from("module_validations").select("user_id"),
        supabase.from("diagnostic_results").select("user_id, status").eq("status", "completed"),
        supabase.from("horizon_projects").select("user_id"),
        supabase.from("user_events").select("user_id, event_type, event_name"),
        supabase.from("appointments").select("user_id"),
        supabase.from("user_financial_profiles").select("user_id, is_complete"),
        (supabase as any).from("risk_profile").select("user_id"),
        (supabase as any).from("user_real_estate_properties").select("user_id"),
        supabase.from("appointment_preparation").select("user_id"),
      ]);

      // Build counts per user
      const countBy = (arr: any[] | null, key: string) => {
        const map: Record<string, number> = {};
        (arr || []).forEach((r) => { map[r[key]] = (map[r[key]] || 0) + 1; });
        return map;
      };

      const loginCounts = countBy(loginsRes.data, "user_id");
      const simCounts = countBy(simLogsRes.data, "user_id");
      const moduleCounts = countBy(modulesRes.data, "user_id");
      
      const diagnosticUsers = new Set((diagnosticRes.data || []).map((d) => d.user_id));
      const horizonUsers = new Set((horizonRes.data || []).map((h) => h.user_id));
      const appointmentUsers = new Set((appointmentsRes.data || []).map((a: any) => a.user_id));
      const fpCompleteUsers = new Set((fpRes.data || []).filter((f: any) => f.is_complete).map((f: any) => f.user_id));
      const riskUsers = new Set((riskRes.data || []).map((r: any) => r.user_id));
      const prepUsers = new Set((prepRes.data || []).map((p: any) => p.user_id));

      // Real estate count per user
      const realEstateCounts: Record<string, number> = {};
      (realEstateRes.data || []).forEach((r: any) => {
        realEstateCounts[r.user_id] = (realEstateCounts[r.user_id] || 0) + 1;
      });

      // Event counts per user per event
      const eventCounts: Record<string, Record<string, number>> = {};
      (eventsRes.data || []).forEach((e) => {
        if (!eventCounts[e.user_id]) eventCounts[e.user_id] = {};
        const key = `${e.event_type}:${e.event_name}`;
        eventCounts[e.user_id][key] = (eventCounts[e.user_id][key] || 0) + 1;
      });

      // Sim CTA counts
      const simCtaCounts: Record<string, number> = {};
      (simLogsRes.data || []).forEach((s) => {
        if (s.appointment_cta_clicked) {
          simCtaCounts[s.user_id] = (simCtaCounts[s.user_id] || 0) + 1;
        }
      });

      // Calculate scores for each user
      const scored: UserScore[] = profiles.map((p) => {
        const uid = p.id;
        const rawCounts: Record<string, number> = {
          daily_login: loginCounts[uid] || 0,
          simulation_completed: simCounts[uid] || 0,
          module_completed: moduleCounts[uid] || 0,
          financial_profile_filled: p.net_taxable_income && p.net_taxable_income > 0 ? 1 : 0,
          horizon_completed: horizonUsers.has(uid) ? 1 : 0,
          diagnostic_completed: diagnosticUsers.has(uid) ? 1 : 0,
          expert_booking_page_view: eventCounts[uid]?.["page_view:expert_booking_page"] || 0,
          offers_page_view: eventCounts[uid]?.["page_view:offers_page"] || 0,
          rdv_cta_click_no_conversion: eventCounts[uid]?.["cta_click:rdv_cta_no_conversion"] || 0,
          rdv_cta_click_from_simulator: simCtaCounts[uid] || 0,
          appointment_booked: appointmentUsers.has(uid) ? 1 : 0,
          financial_profile_complete: fpCompleteUsers.has(uid) ? 1 : 0,
          risk_profile_completed: riskUsers.has(uid) ? 1 : 0,
          real_estate_added: realEstateCounts[uid] || 0,
          appointment_preparation_done: prepUsers.has(uid) ? 1 : 0,
        };

        const signals: ScoreSignal[] = [];
        let totalScore = 0;
        let maxPossible = 0;
        const byCategory: Record<string, { earned: number; max: number }> = {};

        for (const config of configs) {
          const raw = rawCounts[config.signal_key] || 0;
          const rawPoints = raw * Number(config.points_per_unit);
          const maxPts = config.max_points ? Number(config.max_points) : rawPoints;
          const earned = Math.min(rawPoints, maxPts);

          signals.push({
            signal_key: config.signal_key,
            signal_label: config.signal_label,
            signal_category: config.signal_category,
            raw_count: raw,
            points_per_unit: Number(config.points_per_unit),
            max_points: config.max_points ? Number(config.max_points) : null,
            earned_points: earned,
          });

          totalScore += earned;
          maxPossible += maxPts;
          if (!byCategory[config.signal_category]) byCategory[config.signal_category] = { earned: 0, max: 0 };
          byCategory[config.signal_category].earned += earned;
          byCategory[config.signal_category].max += maxPts;
        }

        const pct = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
        const level: UserScore["level"] =
          pct >= 75 ? "brûlant" : pct >= 50 ? "chaud" : pct >= 25 ? "tiède" : "froid";

        return {
          userId: uid,
          email: p.email || "",
          firstName: p.first_name || "",
          lastName: p.last_name || "",
          companyName: companyMap[p.company_id] || "—",
          total_score: totalScore,
          max_possible: maxPossible,
          percentage: pct,
          level,
          signals,
          by_category: byCategory,
        };
      });

      // Sort by score descending
      scored.sort((a, b) => b.total_score - a.total_score);
      setUsers(scored);
    } catch (err) {
      console.error("Error loading scores:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (levelFilter !== "all" && u.level !== levelFilter) return false;
      if (companyFilter !== "all" && u.companyName !== companyFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          u.email.toLowerCase().includes(s) ||
          u.firstName.toLowerCase().includes(s) ||
          u.lastName.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [users, search, levelFilter, companyFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const brulant = users.filter((u) => u.level === "brûlant").length;
    const chaud = users.filter((u) => u.level === "chaud").length;
    const tiede = users.filter((u) => u.level === "tiède").length;
    const froid = users.filter((u) => u.level === "froid").length;
    const avgScore = total > 0 ? Math.round(users.reduce((s, u) => s + u.percentage, 0) / total) : 0;
    return { total, brulant, chaud, tiede, froid, avgScore };
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Scoring d'intention RDV</h2>
        <p className="text-muted-foreground">Analyse du niveau d'intention de chaque utilisateur à prendre rendez-vous avec un conseiller</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total users</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" />{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Score moyen</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-muted-foreground" />{stats.avgScore}%</div></CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">🔥 Brûlants</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.brulant}</div></CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">🟠 Chauds</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{stats.chaud}</div></CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">🟡 Tièdes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.tiede}</div></CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">🔵 Froids</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{stats.froid}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un utilisateur…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Niveau" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            <SelectItem value="brûlant">🔥 Brûlant</SelectItem>
            <SelectItem value="chaud">🟠 Chaud</SelectItem>
            <SelectItem value="tiède">🟡 Tiède</SelectItem>
            <SelectItem value="froid">🔵 Froid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Entreprise" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6">
        {/* User Table */}
        <Card className={`flex-1 ${selectedUser ? 'max-w-[60%]' : ''}`}>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Progression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</TableCell></TableRow>
                ) : (
                  filtered.slice(0, 100).map((u) => {
                    const config = LEVEL_CONFIG[u.level];
                    return (
                      <TableRow
                        key={u.userId}
                        className={`cursor-pointer hover:bg-muted/50 ${selectedUser?.userId === u.userId ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedUser(u)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{u.companyName}</TableCell>
                        <TableCell className="font-semibold">{u.total_score}/{u.max_possible}</TableCell>
                        <TableCell>
                          <Badge className={`${config.color} text-xs`}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={u.percentage} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-8">{u.percentage}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {filtered.length > 100 && (
              <p className="text-center text-sm text-muted-foreground py-3">
                Affichage limité aux 100 premiers résultats ({filtered.length} au total)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedUser && (
          <Card className="w-[40%] sticky top-24 self-start">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedUser.firstName} {selectedUser.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={LEVEL_CONFIG[selectedUser.level].color}>
                  {LEVEL_CONFIG[selectedUser.level].label}
                </Badge>
                <span className="text-lg font-bold">{selectedUser.total_score} pts ({selectedUser.percentage}%)</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Par catégorie</h4>
                {Object.entries(selectedUser.by_category).map(([cat, val]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="font-medium">{val.earned}/{val.max}</span>
                    </div>
                    <Progress value={val.max > 0 ? (val.earned / val.max) * 100 : 0} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Signal breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Détail des signaux</h4>
                {selectedUser.signals.map((s) => (
                  <div key={s.signal_key} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                    <div>
                      <span>{s.signal_label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({s.raw_count} × {s.points_per_unit}pt)
                      </span>
                    </div>
                    <span className={`font-medium ${s.earned_points > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s.earned_points}{s.max_points ? `/${s.max_points}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
