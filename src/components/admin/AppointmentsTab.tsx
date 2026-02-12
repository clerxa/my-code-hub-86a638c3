import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Users, Clock, MapPin, Trash2, Eye, RefreshCw, ExternalLink } from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface HubspotAppointment {
  id: string;
  hubspot_meeting_id: string | null;
  user_email: string;
  user_name: string | null;
  meeting_title: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_link: string | null;
  host_name: string | null;
  booking_source: string | null;
  company_id: string | null;
  raw_payload: any;
  created_at: string;
  referrer_path: string | null;
  referrer_label: string | null;
  companies?: { name: string } | null;
}

const BOOKING_SOURCE_CONFIG: Record<string, { label: string; page: string; color: string }> = {
  tax_declaration_help: {
    label: "Aide Fiscale",
    page: "Formulaire d'aide à la déclaration",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  expert_booking: {
    label: "Expert (Défaut)",
    page: "Page Expert Booking",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  expert_booking_rang_1: {
    label: "Expert Rang 1",
    page: "Page Expert Booking (Rang 1)",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  expert_booking_rang_2: {
    label: "Expert Rang 2",
    page: "Page Expert Booking (Rang 2)",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  },
  expert_booking_rang_3: {
    label: "Expert Rang 3",
    page: "Page Expert Booking (Rang 3)",
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  },
  expert_booking_rang_4: {
    label: "Expert Rang 4",
    page: "Page Expert Booking (Rang 4)",
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  },
};

export function AppointmentsTab() {
  const [appointments, setAppointments] = useState<HubspotAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hubspot_appointments")
      .select(`
        id,
        hubspot_meeting_id,
        user_email,
        user_name,
        meeting_title,
        meeting_start_time,
        meeting_end_time,
        meeting_link,
        host_name,
        booking_source,
        company_id,
        raw_payload,
        created_at,
        referrer_path,
        referrer_label,
        companies:company_id(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Erreur lors du chargement des rendez-vous");
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("hubspot_appointments").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Rendez-vous supprimé");
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const getSourceConfig = (source: string | null) => {
    if (!source) return { label: "Inconnu", page: "Page inconnue", color: "bg-gray-100 text-gray-800" };
    return BOOKING_SOURCE_CONFIG[source] || { label: source, page: "Page inconnue", color: "bg-gray-100 text-gray-800" };
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.meeting_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = sourceFilter === "all" || apt.booking_source === sourceFilter;

    return matchesSearch && matchesSource;
  });

  const uniqueSources = [...new Set(appointments.map((a) => a.booking_source).filter(Boolean))];

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter((a) => a.meeting_start_time && !isPast(new Date(a.meeting_start_time))).length,
    past: appointments.filter((a) => a.meeting_start_time && isPast(new Date(a.meeting_start_time))).length,
    noDate: appointments.filter((a) => !a.meeting_start_time).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tous les Rendez-vous</h2>
          <p className="text-muted-foreground">
            Liste de tous les rendez-vous pris via les formulaires de l'application
          </p>
        </div>
        <Button onClick={fetchAppointments} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-sm text-muted-foreground">À venir</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-2xl font-bold">{stats.past}</p>
                <p className="text-sm text-muted-foreground">Passés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{uniqueSources.length}</p>
                <p className="text-sm text-muted-foreground">Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom ou titre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrer par source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                {uniqueSources.map((source) => (
                  <SelectItem key={source} value={source!}>
                    {getSourceConfig(source).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rendez-vous ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun rendez-vous trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Page d'origine</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Hôte</TableHead>
                    <TableHead>Lien</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => {
                    const sourceConfig = getSourceConfig(apt.booking_source);
                    return (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{apt.user_name || "—"}</p>
                            <p className="text-sm text-muted-foreground">{apt.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{apt.companies?.name || "—"}</span>
                        </TableCell>
                        <TableCell>
                          {apt.meeting_start_time ? (
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(apt.meeting_start_time), "d MMM yyyy", { locale: fr })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(apt.meeting_start_time), "HH:mm", { locale: fr })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Non définie</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {apt.referrer_label ? (
                              <>
                                <p className="text-sm font-medium">{apt.referrer_label}</p>
                                <p className="text-xs text-muted-foreground">{apt.referrer_path}</p>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Accès direct</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={sourceConfig.color} variant="outline">
                            {sourceConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{apt.host_name || "—"}</span>
                        </TableCell>
                        <TableCell>
                          {apt.meeting_link ? (
                            <a
                              href={apt.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Lien
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Voir le payload">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>Payload HubSpot</DialogTitle>
                                </DialogHeader>
                                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                  {JSON.stringify(apt.raw_payload, null, 2)}
                                </pre>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer ce rendez-vous ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. Le rendez-vous de {apt.user_email} sera supprimé.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAppointment(apt.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
