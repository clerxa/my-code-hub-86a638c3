import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Filter, Download, Eye, Calendar, User, Calculator, MousePointerClick, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SimulationLog {
  id: string;
  user_id: string | null;
  session_id: string | null;
  simulator_type: string;
  simulation_data: Record<string, any>;
  results_data: Record<string, any>;
  is_saved_to_history: boolean;
  cta_clicked: string[];
  appointment_cta_clicked: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

const SIMULATOR_LABELS: Record<string, string> = {
  per: "PER",
  lmnp: "LMNP",
  capacite_emprunt: "Capacité d'emprunt",
  pret_immobilier: "Prêt immobilier",
  epargne_precaution: "Épargne de précaution",
  optimisation_fiscale: "Optimisation fiscale",
  interets_composes: "Intérêts composés",
  impots: "Impôts",
  espp: "ESPP",
};

export function SimulationLogsTab() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SimulationLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [simulatorFilter, setSimulatorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<SimulationLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, simulatorFilter, statusFilter]);

  const fetchLogs = async () => {
    try {
      // Fetch logs with user info
      const { data: logsData, error } = await supabase
        .from("simulation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch user profiles for user info
      const userIds = [...new Set((logsData || []).filter(l => l.user_id).map(l => l.user_id))];
      
      let userMap: Record<string, { email: string; first_name: string; last_name: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", userIds);
        
        if (profiles) {
          profiles.forEach(p => {
            userMap[p.id] = { 
              email: p.email || "", 
              first_name: p.first_name || "", 
              last_name: p.last_name || "" 
            };
          });
        }
      }

      const enrichedLogs = (logsData || []).map(log => ({
        ...log,
        simulation_data: log.simulation_data as Record<string, any>,
        results_data: log.results_data as Record<string, any>,
        cta_clicked: (log.cta_clicked as string[]) || [],
        user_email: log.user_id ? userMap[log.user_id]?.email : "Anonyme",
        user_name: log.user_id 
          ? `${userMap[log.user_id]?.first_name || ""} ${userMap[log.user_id]?.last_name || ""}`.trim() || "Inconnu"
          : "Anonyme",
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error("Error fetching simulation logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.user_email?.toLowerCase().includes(term) ||
          log.user_name?.toLowerCase().includes(term) ||
          log.simulator_type.toLowerCase().includes(term)
      );
    }

    if (simulatorFilter !== "all") {
      filtered = filtered.filter(log => log.simulator_type === simulatorFilter);
    }

    if (statusFilter === "saved") {
      filtered = filtered.filter(log => log.is_saved_to_history);
    } else if (statusFilter === "not_saved") {
      filtered = filtered.filter(log => !log.is_saved_to_history);
    } else if (statusFilter === "cta_clicked") {
      filtered = filtered.filter(log => log.cta_clicked.length > 0);
    } else if (statusFilter === "appointment") {
      filtered = filtered.filter(log => log.appointment_cta_clicked);
    }

    setFilteredLogs(filtered);
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Utilisateur",
      "Email",
      "Simulateur",
      "Enregistré",
      "CTA cliqués",
      "RDV demandé"
    ];

    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: fr }),
      log.user_name,
      log.user_email,
      SIMULATOR_LABELS[log.simulator_type] || log.simulator_type,
      log.is_saved_to_history ? "Oui" : "Non",
      log.cta_clicked.join(", "),
      log.appointment_cta_clicked ? "Oui" : "Non"
    ]);

    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `simulations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getStatusBadges = (log: SimulationLog) => {
    const badges = [];
    
    if (log.is_saved_to_history) {
      badges.push(
        <Badge key="saved" variant="default" className="bg-green-100 text-green-700">
          <Save className="h-3 w-3 mr-1" />
          Enregistré
        </Badge>
      );
    }
    
    if (log.cta_clicked.length > 0) {
      badges.push(
        <Badge key="cta" variant="secondary" className="bg-blue-100 text-blue-700">
          <MousePointerClick className="h-3 w-3 mr-1" />
          {log.cta_clicked.length} CTA
        </Badge>
      );
    }
    
    if (log.appointment_cta_clicked) {
      badges.push(
        <Badge key="rdv" variant="default" className="bg-orange-100 text-orange-700">
          <Calendar className="h-3 w-3 mr-1" />
          RDV
        </Badge>
      );
    }

    return badges.length > 0 ? badges : <span className="text-muted-foreground text-sm">-</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stats
  const totalSimulations = logs.length;
  const savedSimulations = logs.filter(l => l.is_saved_to_history).length;
  const ctaClicks = logs.filter(l => l.cta_clicked.length > 0).length;
  const appointmentRequests = logs.filter(l => l.appointment_cta_clicked).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight hero-gradient">Simulations réalisées</h2>
          <p className="text-muted-foreground">
            Suivi de toutes les simulations validées par les utilisateurs
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalSimulations}</p>
                <p className="text-sm text-muted-foreground">Simulations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Save className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{savedSimulations}</p>
                <p className="text-sm text-muted-foreground">Enregistrées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{ctaClicks}</p>
                <p className="text-sm text-muted-foreground">CTA cliqués</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{appointmentRequests}</p>
                <p className="text-sm text-muted-foreground">Demandes RDV</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={simulatorFilter} onValueChange={setSimulatorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les simulateurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les simulateurs</SelectItem>
                {Object.entries(SIMULATOR_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="saved">Enregistrées</SelectItem>
                <SelectItem value="not_saved">Non enregistrées</SelectItem>
                <SelectItem value="cta_clicked">CTA cliqué</SelectItem>
                <SelectItem value="appointment">Demande de RDV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Simulateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune simulation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.user_name}</p>
                        <p className="text-sm text-muted-foreground">{log.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {SIMULATOR_LABELS[log.simulator_type] || log.simulator_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getStatusBadges(log)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la simulation</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 p-4">
                {/* User Info */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Utilisateur
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p><strong>Nom:</strong> {selectedLog.user_name}</p>
                    <p><strong>Email:</strong> {selectedLog.user_email}</p>
                    <p><strong>Date:</strong> {format(new Date(selectedLog.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h4 className="font-semibold mb-2">Statut</h4>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadges(selectedLog)}
                    {selectedLog.cta_clicked.length > 0 && (
                      <div className="w-full mt-2 text-sm text-muted-foreground">
                        CTAs cliqués: {selectedLog.cta_clicked.join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Data */}
                <div>
                  <h4 className="font-semibold mb-2">Données saisies</h4>
                  <pre className="bg-muted/50 rounded-lg p-3 text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.simulation_data, null, 2)}
                  </pre>
                </div>

                {/* Results */}
                <div>
                  <h4 className="font-semibold mb-2">Résultats</h4>
                  <pre className="bg-muted/50 rounded-lg p-3 text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.results_data, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
