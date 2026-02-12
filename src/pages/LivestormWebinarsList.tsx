import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, TrendingUp, Plus, ArrowLeft, ExternalLink, Wifi, Loader2, Award, RefreshCw, Download, Mail, Search, UserCheck, UserX, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface WebinarModule {
  id: number;
  title: string;
  webinar_date: string;
  duration: string;
  points_registration: number;
  points_participation: number;
  webinar_registration_url: string;
  livestorm_session_id: string | null;
  parcours: {
    title: string;
  }[];
  registration_count: number;
  participation_count: number;
  external_registration_count: number;
  external_participation_count: number;
}

// Unified registration type
interface UnifiedRegistration {
  id: string;
  module_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  registered_at: string | null;
  joined_at: string | null;
  completed_at: string | null;
  registration_status: string;
  has_account: boolean;
  points_awarded: number | null;
  attendance_duration_seconds?: number;
  module_title: string;
}

type SortField = "name" | "email" | "company" | "webinar" | "status" | "date" | "hasAccount";
type SortDirection = "asc" | "desc";

const LivestormWebinarsList = () => {
  const navigate = useNavigate();
  const [webinars, setWebinars] = useState<WebinarModule[]>([]);
  const [unifiedRegistrations, setUnifiedRegistrations] = useState<UnifiedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingSession, setTestingSession] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingFromLivestorm, setSyncingFromLivestorm] = useState(false);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  
  // Filters
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Selection for bulk actions
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch webinar modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select(`
          id,
          title,
          webinar_date,
          duration,
          points_registration,
          points_participation,
          webinar_registration_url,
          livestorm_session_id
        `)
        .eq("type", "webinar")
        .order("webinar_date", { ascending: false });

      if (modulesError) throw modulesError;

      // For each module, fetch parcours and registration stats
      const enrichedWebinars = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: parcoursData } = await supabase
            .from("parcours_modules")
            .select(`parcours:parcours_id (title)`)
            .eq("module_id", module.id);

          // Internal registrations
          const { count: internalRegistrationCount } = await supabase
            .from("webinar_registrations")
            .select("*", { count: "exact", head: true })
            .eq("module_id", module.id);

          const { count: internalParticipationCount } = await supabase
            .from("webinar_registrations")
            .select("*", { count: "exact", head: true })
            .eq("module_id", module.id)
            .in("registration_status", ["joined", "completed"]);

          // External registrations
          const { count: externalRegistrationCount } = await supabase
            .from("webinar_external_registrations")
            .select("*", { count: "exact", head: true })
            .eq("module_id", module.id);

          const { count: externalParticipationCount } = await supabase
            .from("webinar_external_registrations")
            .select("*", { count: "exact", head: true })
            .eq("module_id", module.id)
            .eq("registration_status", "completed");

          return {
            ...module,
            parcours: parcoursData?.map((p: any) => p.parcours) || [],
            registration_count: (internalRegistrationCount || 0) + (externalRegistrationCount || 0),
            participation_count: (internalParticipationCount || 0) + (externalParticipationCount || 0),
            external_registration_count: externalRegistrationCount || 0,
            external_participation_count: externalParticipationCount || 0,
          };
        })
      );

      setWebinars(enrichedWebinars as any);

      // Fetch unified registrations (internal + external)
      const unified: UnifiedRegistration[] = [];

      // Internal registrations
      const { data: internalData } = await supabase
        .from("webinar_registrations")
        .select(`
          id,
          module_id,
          user_id,
          registration_status,
          registered_at,
          joined_at,
          completed_at,
          points_awarded,
          profiles (email, first_name, last_name, company_id),
          modules (title)
        `)
        .order("created_at", { ascending: false });

      if (internalData) {
        // Get company names for internal registrations
        const companyIds = [...new Set(internalData.filter((r: any) => r.profiles?.company_id).map((r: any) => r.profiles.company_id))];
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);
        
        const companyMap = new Map((companies || []).map(c => [c.id, c.name]));

        for (const reg of internalData as any[]) {
          unified.push({
            id: reg.id,
            module_id: reg.module_id,
            email: reg.profiles?.email || "",
            first_name: reg.profiles?.first_name,
            last_name: reg.profiles?.last_name,
            company_name: reg.profiles?.company_id ? companyMap.get(reg.profiles.company_id) || null : null,
            registered_at: reg.registered_at,
            joined_at: reg.joined_at,
            completed_at: reg.completed_at,
            registration_status: reg.registration_status,
            has_account: true,
            points_awarded: reg.points_awarded,
            module_title: reg.modules?.title || `Module #${reg.module_id}`,
          });
        }
      }

      // External registrations
      const { data: externalData } = await supabase
        .from("webinar_external_registrations")
        .select(`
          id,
          module_id,
          email,
          first_name,
          last_name,
          company_name,
          registered_at,
          joined_at,
          completed_at,
          registration_status,
          attendance_duration_seconds,
          modules (title)
        `)
        .order("created_at", { ascending: false });

      if (externalData) {
        for (const reg of externalData as any[]) {
          unified.push({
            id: reg.id,
            module_id: reg.module_id,
            email: reg.email,
            first_name: reg.first_name,
            last_name: reg.last_name,
            company_name: reg.company_name,
            registered_at: reg.registered_at,
            joined_at: reg.joined_at,
            completed_at: reg.completed_at,
            registration_status: reg.registration_status,
            has_account: false,
            points_awarded: null,
            attendance_duration_seconds: reg.attendance_duration_seconds,
            module_title: reg.modules?.title || `Module #${reg.module_id}`,
          });
        }
      }

      setUnifiedRegistrations(unified);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getParticipationRate = (registered: number, participated: number) => {
    if (registered === 0) return 0;
    return Math.round((participated / registered) * 100);
  };

  const testWebhookConnection = async (sessionId: string, moduleId: number) => {
    setTestingSession(moduleId);

    try {
      const response = await supabase.functions.invoke('livestorm-webhook', {
        body: { test: true, session_id: sessionId }
      });

      if (response.error) {
        toast.error("Erreur de connexion au webhook");
        return;
      }

      const data = response.data;
      
      if (data.success) {
        if (data.status === 'connected') {
          toast.success(`Connexion OK: ${data.module_title}`);
        } else if (data.status === 'session_not_found') {
          toast.error(data.message);
        } else {
          toast.success(data.message);
        }
      } else {
        toast.error(data.message || "Erreur webhook");
      }
    } catch (error) {
      console.error("Test webhook error:", error);
      toast.error("Impossible de contacter le webhook");
    } finally {
      setTestingSession(null);
    }
  };

  const syncWebhookData = async () => {
    setSyncing(true);
    try {
      const response = await supabase.functions.invoke('livestorm-webhook', {
        body: { test: true }
      });

      if (response.error) {
        toast.error("Erreur lors de la synchronisation");
        return;
      }

      if (response.data?.success) {
        toast.success("Webhook opérationnel - Données synchronisées");
        await fetchData();
      } else {
        toast.error(response.data?.message || "Erreur de synchronisation");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Impossible de synchroniser les données");
    } finally {
      setSyncing(false);
    }
  };

  const syncFromLivestorm = async () => {
    setSyncingFromLivestorm(true);
    try {
      const response = await supabase.functions.invoke('sync-livestorm-registrations', {
        body: {}
      });

      if (response.error) {
        console.error("Sync from Livestorm error:", response.error);
        toast.error("Erreur lors de la synchronisation depuis Livestorm");
        return;
      }

      const data = response.data;
      if (data?.success) {
        if ((data.errors || 0) > 0) {
          const firstError = Array.isArray(data.details)
            ? data.details.find((d: any) => d?.error)?.error
            : null;

          toast.error(firstError ? `Sync Livestorm: ${firstError}` : "Sync Livestorm: erreurs détectées");
          return;
        }

        toast.success(data.message || `${data.synced} inscription(s) synchronisée(s)`);
        await fetchData();
      } else {
        toast.error(data?.error || "Erreur de synchronisation");
      }
    } catch (error) {
      console.error("Sync from Livestorm error:", error);
      toast.error("Impossible de synchroniser depuis Livestorm");
    } finally {
      setSyncingFromLivestorm(false);
    }
  };

  const sendInvitations = async () => {
    const emailsToInvite = filteredRegistrations
      .filter(r => !r.has_account && selectedEmails.has(r.email))
      .map(r => r.email);

    if (emailsToInvite.length === 0) {
      toast.error("Aucun utilisateur sans compte sélectionné");
      return;
    }

    setSendingInvitations(true);
    try {
      const response = await supabase.functions.invoke('send-webinar-invitations', {
        body: { emails: emailsToInvite }
      });

      if (response.error) {
        toast.error("Erreur lors de l'envoi des invitations");
        return;
      }

      const data = response.data;
      if (data?.success) {
        toast.success(`${data.report.sent} invitation(s) envoyée(s)`);
        setSelectedEmails(new Set());
      } else {
        toast.error(data?.error || "Erreur d'envoi");
      }
    } catch (error) {
      console.error("Send invitations error:", error);
      toast.error("Impossible d'envoyer les invitations");
    } finally {
      setSendingInvitations(false);
    }
  };

  const sendAllInvitations = async () => {
    const emailsToInvite = filteredRegistrations
      .filter(r => !r.has_account)
      .map(r => r.email);

    if (emailsToInvite.length === 0) {
      toast.error("Aucun utilisateur sans compte à inviter");
      return;
    }

    setSendingInvitations(true);
    try {
      const response = await supabase.functions.invoke('send-webinar-invitations', {
        body: { emails: emailsToInvite }
      });

      if (response.error) {
        toast.error("Erreur lors de l'envoi des invitations");
        return;
      }

      const data = response.data;
      if (data?.success) {
        toast.success(`${data.report.sent} invitation(s) envoyée(s)`);
      } else {
        toast.error(data?.error || "Erreur d'envoi");
      }
    } catch (error) {
      console.error("Send invitations error:", error);
      toast.error("Impossible d'envoyer les invitations");
    } finally {
      setSendingInvitations(false);
    }
  };

  // Filtering
  const filteredRegistrations = useMemo(() => {
    return unifiedRegistrations.filter((reg) => {
      if (selectedModule !== "all" && reg.module_id !== parseInt(selectedModule)) {
        return false;
      }
      if (selectedStatus !== "all" && reg.registration_status !== selectedStatus) {
        return false;
      }
      if (selectedAccountFilter === "with_account" && !reg.has_account) {
        return false;
      }
      if (selectedAccountFilter === "without_account" && reg.has_account) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${reg.first_name || ""} ${reg.last_name || ""}`.toLowerCase();
        const matches =
          reg.email.toLowerCase().includes(query) ||
          fullName.includes(query) ||
          (reg.company_name || "").toLowerCase().includes(query) ||
          reg.module_title.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [unifiedRegistrations, selectedModule, selectedStatus, selectedAccountFilter, searchQuery]);

  // Sorting
  const sortedRegistrations = useMemo(() => {
    const sorted = [...filteredRegistrations];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          const nameA = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
          const nameB = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "company":
          comparison = (a.company_name || "").localeCompare(b.company_name || "");
          break;
        case "webinar":
          comparison = a.module_title.localeCompare(b.module_title);
          break;
        case "status":
          comparison = a.registration_status.localeCompare(b.registration_status);
          break;
        case "date":
          const dateA = a.registered_at ? new Date(a.registered_at).getTime() : 0;
          const dateB = b.registered_at ? new Date(b.registered_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "hasAccount":
          comparison = (a.has_account ? 1 : 0) - (b.has_account ? 1 : 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredRegistrations, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === sortedRegistrations.filter(r => !r.has_account).length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(sortedRegistrations.filter(r => !r.has_account).map(r => r.email)));
    }
  };

  const toggleSelectEmail = (email: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(email)) {
      newSet.delete(email);
    } else {
      newSet.add(email);
    }
    setSelectedEmails(newSet);
  };

  const stats = {
    total: filteredRegistrations.length,
    withAccount: filteredRegistrations.filter(r => r.has_account).length,
    withoutAccount: filteredRegistrations.filter(r => !r.has_account).length,
    participated: filteredRegistrations.filter(r => 
      r.registration_status === "joined" || r.registration_status === "completed"
    ).length,
    totalPoints: filteredRegistrations.reduce((sum, r) => sum + (r.points_awarded || 0), 0),
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "registration_pending":
        return <Badge variant="outline">En attente</Badge>;
      case "registration_confirmed":
        return <Badge className="bg-blue-500">Inscrit</Badge>;
      case "registered":
        return <Badge className="bg-blue-500">Inscrit</Badge>;
      case "joined":
        return <Badge className="bg-green-500">A participé</Badge>;
      case "completed":
        return <Badge className="bg-purple-500">Complété</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-primary" : "text-muted-foreground"}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold hero-gradient mb-2">Webinars Livestorm</h1>
              <p className="text-muted-foreground">
                Gérez vos webinars et suivez les inscriptions
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={syncFromLivestorm}
              disabled={syncingFromLivestorm}
              title="Récupère les inscrits directement depuis l'API Livestorm"
            >
              {syncingFromLivestorm ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sync Livestorm
            </Button>
            <Button 
              variant="outline" 
              onClick={syncWebhookData}
              disabled={syncing}
              title="Teste la connexion webhook"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Webhook
            </Button>
            <Button onClick={() => navigate("/admin/create-livestorm-webinar")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un webinar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">Liste des webinars</TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-1">
              Inscrits
              {unifiedRegistrations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {unifiedRegistrations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Liste des webinars */}
          <TabsContent value="list" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Webinars</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{webinars.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inscrits</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {webinars.reduce((sum, w) => sum + w.registration_count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Membres + externes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {webinars.reduce((sum, w) => sum + w.participation_count, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Webinars Table */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des webinars</CardTitle>
                <CardDescription>
                  {webinars.length} webinar(s) créé(s) depuis FinCare
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                  </div>
                ) : webinars.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucun webinar créé</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/admin/create-livestorm-webinar")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer votre premier webinar
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Lié</TableHead>
                          <TableHead>Titre</TableHead>
                          <TableHead>Date & Heure</TableHead>
                          <TableHead>Parcours</TableHead>
                          <TableHead>Inscrits</TableHead>
                          <TableHead>Participants</TableHead>
                          <TableHead>Taux</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {webinars.map((webinar) => (
                          <TableRow key={webinar.id}>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <span
                                  className={`h-3 w-3 rounded-full ${
                                    webinar.livestorm_session_id
                                      ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                      : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                  }`}
                                  title={
                                    webinar.livestorm_session_id
                                      ? `Connecté: ${webinar.livestorm_session_id}`
                                      : "Non connecté à Livestorm"
                                  }
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{webinar.title}</TableCell>
                            <TableCell>
                              {webinar.webinar_date
                                ? format(new Date(webinar.webinar_date), "PPp", { locale: fr })
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {webinar.parcours.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {webinar.parcours.map((p: any, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {p.title}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{webinar.registration_count}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">{webinar.participation_count}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  getParticipationRate(
                                    webinar.registration_count,
                                    webinar.participation_count
                                  ) >= 50
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {getParticipationRate(
                                  webinar.registration_count,
                                  webinar.participation_count
                                )}
                                %
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="text-muted-foreground">
                                  Inscr: +{webinar.points_registration}
                                </div>
                                <div className="text-muted-foreground">
                                  Partici: +{webinar.points_participation}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {webinar.livestorm_session_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => testWebhookConnection(webinar.livestorm_session_id!, webinar.id)}
                                    disabled={testingSession === webinar.id}
                                    title="Tester la connexion"
                                  >
                                    {testingSession === webinar.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Wifi className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {webinar.webinar_registration_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(webinar.webinar_registration_url, "_blank")
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Inscrits (unified) */}
          <TabsContent value="registrations" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avec compte</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.withAccount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sans compte</CardTitle>
                  <UserX className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.withoutAccount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participants</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.participated}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Points</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPoints}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher (nom, email, entreprise, webinar)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="w-[200px]">
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les webinars" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les webinars</SelectItem>
                        {webinars.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-[180px]">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="registration_pending">En attente</SelectItem>
                        <SelectItem value="registration_confirmed">Inscrit</SelectItem>
                        <SelectItem value="registered">Inscrit (externe)</SelectItem>
                        <SelectItem value="joined">A participé</SelectItem>
                        <SelectItem value="completed">Complété</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-[180px]">
                    <Select value={selectedAccountFilter} onValueChange={setSelectedAccountFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Compte FinCare" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="with_account">Avec compte</SelectItem>
                        <SelectItem value="without_account">Sans compte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bulk action button */}
                {stats.withoutAccount > 0 && (
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Button
                      onClick={sendAllInvitations}
                      disabled={sendingInvitations}
                      variant="default"
                    >
                      {sendingInvitations ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Inviter tous les non-inscrits ({stats.withoutAccount})
                    </Button>

                    {selectedEmails.size > 0 && (
                      <Button
                        onClick={sendInvitations}
                        disabled={sendingInvitations}
                        variant="outline"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Inviter la sélection ({selectedEmails.size})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registrations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des inscrits</CardTitle>
                <CardDescription>
                  {sortedRegistrations.length} inscription(s) trouvée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                  </div>
                ) : sortedRegistrations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune inscription trouvée</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedEmails.size === sortedRegistrations.filter(r => !r.has_account).length && sortedRegistrations.filter(r => !r.has_account).length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <SortableHeader field="name">Nom</SortableHeader>
                          <SortableHeader field="email">Email</SortableHeader>
                          <SortableHeader field="company">Entreprise</SortableHeader>
                          <SortableHeader field="webinar">Webinar</SortableHeader>
                          <SortableHeader field="hasAccount">Compte</SortableHeader>
                          <SortableHeader field="status">Statut</SortableHeader>
                          <SortableHeader field="date">Inscrit le</SortableHeader>
                          <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRegistrations.map((reg) => (
                          <TableRow key={`${reg.id}-${reg.has_account}`}>
                            <TableCell>
                              {!reg.has_account && (
                                <Checkbox 
                                  checked={selectedEmails.has(reg.email)}
                                  onCheckedChange={() => toggleSelectEmail(reg.email)}
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {reg.first_name || reg.last_name 
                                ? `${reg.first_name || ""} ${reg.last_name || ""}`.trim()
                                : "-"}
                            </TableCell>
                            <TableCell>{reg.email}</TableCell>
                            <TableCell>{reg.company_name || "-"}</TableCell>
                            <TableCell>{reg.module_title}</TableCell>
                            <TableCell>
                              {reg.has_account ? (
                                <Badge className="bg-green-500">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Membre
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  <UserX className="h-3 w-3 mr-1" />
                                  Externe
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(reg.registration_status)}</TableCell>
                            <TableCell>
                              {reg.registered_at
                                ? format(new Date(reg.registered_at), "Pp", { locale: fr })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {reg.has_account ? (
                                <Badge variant="outline" className="bg-primary/10">
                                  +{reg.points_awarded || 0}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LivestormWebinarsList;
