import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Settings, Building2, FileText, RefreshCw, Eye, Search, CheckCircle, Clock, XCircle, Download, ExternalLink, Calendar, Trash2 } from "lucide-react";
import { TaxPermanenceConfigEditor } from "./TaxPermanenceConfigEditor";
import type { TaxPermanenceConfig } from "@/types/tax-declaration";
import type { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  SITUATION_MARITALE_OPTIONS, 
  TMI_OPTIONS, 
  REVENUS_ACTIVITE, 
  REVENUS_CAPITAL, 
  REVENUS_PLUS_VALUES,
  OPTIMISATION_OPTIONS,
  EXPERTISE_AVOCAT_OPTIONS,
  TYPE_RDV_OPTIONS 
} from "@/types/tax-declaration";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompanyTaxConfig {
  id: string;
  name: string;
  tax_declaration_help_enabled: boolean;
  max_tax_declarations: number | null;
  tax_permanence_config: TaxPermanenceConfig | null;
  declarations_count: number;
}

interface TaxRequest {
  id: string;
  user_id: string;
  company_id: string;
  entreprise: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  status: string;
  submitted_at: string;
  situation_maritale: string;
  nombre_enfants: number;
  revenu_imposable_precedent: number;
  tmi: string;
  revenus_types: string[];
  optimisation_types: string[];
  optimisation_autres: string[];
  expertise_avocat: string[];
  delegation_complete: boolean;
  type_rdv: string;
  commentaires: string;
  is_perlib_client: boolean;
  conseiller_dedie: string;
  intitule_poste: string;
  avis_imposition_url: string;
  autres_justificatifs_urls: string[];
  modified_at?: string;
  modification_count?: number;
}

interface HubspotAppointment {
  id: string;
  hubspot_meeting_id: string | null;
  hubspot_contact_id: string | null;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  meeting_title: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_link: string | null;
  booking_source: string | null;
  company_id: string | null;
  raw_payload: Json | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'completed', label: 'Terminé', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800 border-red-300' },
];

export const TaxHelpAdminTab = () => {
  const [activeTab, setActiveTab] = useState("config");
  
  // Config state
  const [companies, setCompanies] = useState<CompanyTaxConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<CompanyTaxConfig | null>(null);
  const [formData, setFormData] = useState({
    max_tax_declarations: 100,
    tax_permanence_config: null as TaxPermanenceConfig | null,
  });

  // Requests state
  const [requests, setRequests] = useState<TaxRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<TaxRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<TaxRequest | null>(null);

  // HubSpot appointments state
  const [hubspotAppointments, setHubspotAppointments] = useState<HubspotAppointment[]>([]);
  const [hubspotLoading, setHubspotLoading] = useState(true);
  const [hubspotSearchTerm, setHubspotSearchTerm] = useState("");
  const [selectedPayload, setSelectedPayload] = useState<Json | null>(null);
  const [isPayloadDialogOpen, setIsPayloadDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<HubspotAppointment | null>(null);

  useEffect(() => {
    fetchCompanies();
    fetchRequests();
    fetchHubspotAppointments();
  }, []);

  // ===== CONFIG FUNCTIONS =====
  const fetchCompanies = async () => {
    setConfigLoading(true);
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, tax_declaration_help_enabled, max_tax_declarations, tax_permanence_config")
        .order("name");

      if (companiesError) throw companiesError;

      const { data: countsData, error: countsError } = await supabase
        .from("tax_declaration_requests")
        .select("company_id");

      if (countsError) throw countsError;

      const countsByCompany: Record<string, number> = {};
      countsData?.forEach((d) => {
        countsByCompany[d.company_id] = (countsByCompany[d.company_id] || 0) + 1;
      });

      const enrichedCompanies: CompanyTaxConfig[] = (companiesData || []).map((c) => ({
        id: c.id,
        name: c.name,
        tax_declaration_help_enabled: c.tax_declaration_help_enabled || false,
        max_tax_declarations: c.max_tax_declarations,
        tax_permanence_config: c.tax_permanence_config as unknown as TaxPermanenceConfig | null,
        declarations_count: countsByCompany[c.id] || 0,
      }));

      setCompanies(enrichedCompanies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Erreur lors du chargement des entreprises");
    } finally {
      setConfigLoading(false);
    }
  };

  const toggleTaxHelp = async (companyId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ tax_declaration_help_enabled: enabled })
        .eq("id", companyId);

      if (error) throw error;

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId ? { ...c, tax_declaration_help_enabled: enabled } : c
        )
      );

      toast.success(enabled ? "Aide fiscale activée" : "Aide fiscale désactivée");
    } catch (error) {
      console.error("Error toggling tax help:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const openConfigDialog = (company: CompanyTaxConfig) => {
    setEditingCompany(company);
    setFormData({
      max_tax_declarations: company.max_tax_declarations || 100,
      tax_permanence_config: company.tax_permanence_config,
    });
  };

  const saveConfig = async () => {
    if (!editingCompany) return;

    try {
      const { error } = await supabase
        .from("companies")
        .update({
          max_tax_declarations: formData.max_tax_declarations,
          tax_permanence_config: formData.tax_permanence_config as unknown as Json,
        })
        .eq("id", editingCompany.id);

      if (error) throw error;

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === editingCompany.id
            ? {
                ...c,
                max_tax_declarations: formData.max_tax_declarations,
                tax_permanence_config: formData.tax_permanence_config,
              }
            : c
        )
      );

      toast.success("Configuration sauvegardée");
      setEditingCompany(null);
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  // ===== REQUESTS FUNCTIONS =====
  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tax_declaration_requests")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as unknown as TaxRequest[]);
    } catch (error) {
      console.error("Error fetching tax declaration requests:", error);
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setRequestsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tax_declaration_requests")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: newStatus } : req
      ));
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteRequest = async (request: TaxRequest) => {
    try {
      const { error } = await supabase
        .from("tax_declaration_requests")
        .delete()
        .eq("id", request.id);

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success("Demande supprimée avec succès");
      setRequestToDelete(null);
      
      // Refresh companies to update counts
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Erreur lors de la suppression de la demande");
    }
  };

  // ===== HUBSPOT APPOINTMENTS FUNCTIONS =====
  const fetchHubspotAppointments = async () => {
    setHubspotLoading(true);
    try {
      const { data, error } = await supabase
        .from("hubspot_appointments")
        .select("*")
        .eq("booking_source", "tax_declaration_help")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHubspotAppointments((data || []) as unknown as HubspotAppointment[]);
    } catch (error) {
      console.error("Error fetching HubSpot appointments:", error);
      toast.error("Erreur lors du chargement des RDV HubSpot");
    } finally {
      setHubspotLoading(false);
    }
  };

  const deleteAppointment = async (appointment: HubspotAppointment) => {
    try {
      const { error } = await supabase
        .from("hubspot_appointments")
        .delete()
        .eq("id", appointment.id);

      if (error) throw error;

      setHubspotAppointments(prev => prev.filter(a => a.id !== appointment.id));
      toast.success("RDV supprimé avec succès");
      setAppointmentToDelete(null);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Erreur lors de la suppression du RDV");
    }
  };

  const viewPayload = (payload: Json | null) => {
    setSelectedPayload(payload);
    setIsPayloadDialogOpen(true);
  };

  const filteredHubspotAppointments = hubspotAppointments.filter(apt => {
    const searchLower = hubspotSearchTerm.toLowerCase();
    return (
      apt.user_email?.toLowerCase().includes(searchLower) ||
      apt.user_name?.toLowerCase().includes(searchLower) ||
      apt.meeting_title?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge variant="outline" className={statusOption?.color}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.entreprise.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getLabelForId = (id: string, options: { id: string; label: string }[]) => {
    return options.find(o => o.id === id)?.label || id;
  };

  const openDetailDialog = (request: TaxRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const exportToPDF = (request: TaxRequest) => {
    const content = `
DEMANDE D'AIDE À LA DÉCLARATION FISCALE
=======================================
Date de soumission: ${format(new Date(request.submitted_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
Statut: ${STATUS_OPTIONS.find(s => s.value === request.status)?.label || request.status}

INFORMATIONS GÉNÉRALES
----------------------
Nom: ${request.prenom} ${request.nom}
Email: ${request.email}
Téléphone: ${request.telephone || 'Non renseigné'}
Entreprise: ${request.entreprise}
Poste: ${request.intitule_poste}
Client Perlib: ${request.is_perlib_client ? `Oui (${request.conseiller_dedie})` : 'Non'}

SITUATION FISCALE
-----------------
Situation maritale: ${SITUATION_MARITALE_OPTIONS.find(o => o.value === request.situation_maritale)?.label || 'Non renseigné'}
Nombre d'enfants: ${request.nombre_enfants}
Revenu imposable N-1: ${request.revenu_imposable_precedent?.toLocaleString('fr-FR') || 'Non renseigné'} €
TMI: ${TMI_OPTIONS.find(o => o.value === request.tmi)?.label || 'Non renseigné'}

REVENUS 2025
------------
${(request.revenus_types || []).map(id => `• ${getLabelForId(id, [...REVENUS_ACTIVITE, ...REVENUS_CAPITAL, ...REVENUS_PLUS_VALUES])}`).join('\n') || 'Aucun sélectionné'}

OPTIMISATION FISCALE
--------------------
${(request.optimisation_types || []).map(id => `• ${getLabelForId(id, OPTIMISATION_OPTIONS)}`).join('\n') || 'Aucun sélectionné'}
${(request.optimisation_autres || []).length > 0 ? `\nAutres dispositifs:\n${request.optimisation_autres.map(item => `• ${item}`).join('\n')}` : ''}

EXPERTISE AVOCAT
----------------
${(request.expertise_avocat || []).map(id => `• ${getLabelForId(id, EXPERTISE_AVOCAT_OPTIONS)}`).join('\n') || 'Aucun sélectionné'}
Délégation complète: ${request.delegation_complete ? 'Oui' : 'Non'}

RENDEZ-VOUS
-----------
Type: ${TYPE_RDV_OPTIONS.find(o => o.value === request.type_rdv)?.label || 'Non renseigné'}
${request.commentaires ? `Commentaires: ${request.commentaires}` : ''}

DOCUMENTS
---------
Avis d'imposition: ${request.avis_imposition_url || 'Non fourni'}
${(request.autres_justificatifs_urls || []).length > 0 ? `Autres justificatifs:\n${request.autres_justificatifs_urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}` : 'Aucun autre justificatif'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `declaration-fiscale-${request.nom}-${request.prenom}-${format(new Date(request.submitted_at), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Export téléchargé");
  };

  const enabledCompanies = companies.filter((c) => c.tax_declaration_help_enabled);
  const totalDeclarations = companies.reduce((sum, c) => sum + c.declarations_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Aide à la Déclaration Fiscale
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurez et gérez les demandes d'aide fiscale
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchCompanies(); fetchRequests(); fetchHubspotAppointments(); }} disabled={configLoading || requestsLoading || hubspotLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${(configLoading || requestsLoading || hubspotLoading) ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Demandes ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="hubspot" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            RDV HubSpot ({hubspotAppointments.length})
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Entreprises activées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enabledCompanies.length} / {companies.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total demandes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeclarations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quota total utilisé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enabledCompanies.reduce((sum, c) => sum + c.declarations_count, 0)} /{" "}
                  {enabledCompanies.reduce((sum, c) => sum + (c.max_tax_declarations || 100), 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Companies Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Entreprises
              </CardTitle>
              <CardDescription>
                Activez l'aide fiscale et configurez les options pour chaque entreprise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead className="text-center">Activé</TableHead>
                    <TableHead className="text-center">Quota utilisé</TableHead>
                    <TableHead className="text-center">Permanences</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucune entreprise
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => {
                      const quota = company.max_tax_declarations || 100;
                      const usage = (company.declarations_count / quota) * 100;
                      const permanenceOptions = company.tax_permanence_config?.options?.filter(
                        (o) => o.enabled
                      );

                      return (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={company.tax_declaration_help_enabled}
                              onCheckedChange={(checked) => toggleTaxHelp(company.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {company.tax_declaration_help_enabled ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className={usage >= 90 ? "text-destructive font-medium" : ""}>
                                  {company.declarations_count} / {quota}
                                </span>
                                {usage >= 90 && (
                                  <Badge variant="destructive" className="text-xs">
                                    Presque plein
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {company.tax_declaration_help_enabled ? (
                              permanenceOptions && permanenceOptions.length > 0 ? (
                                <div className="flex justify-center gap-1 flex-wrap">
                                  {permanenceOptions.map((opt) => (
                                    <Badge key={opt.id} variant="secondary" className="text-xs">
                                      {opt.label}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  Non configuré
                                </Badge>
                              )
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openConfigDialog(company)}
                              disabled={!company.tax_declaration_help_enabled}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Configurer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, entreprise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">En attente</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'in_progress').length}
                </div>
                <div className="text-xs text-muted-foreground">En cours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Terminés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <XCircle className="h-5 w-5 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'cancelled').length}
                </div>
                <div className="text-xs text-muted-foreground">Annulés</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {requestsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune demande trouvée
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collaborateur</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Modifié</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.prenom} {request.nom}</div>
                          <div className="text-sm text-muted-foreground">{request.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.entreprise}</TableCell>
                      <TableCell>
                        {format(new Date(request.submitted_at), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {(request.modification_count || 0) > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {request.modification_count}x
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={request.status}
                          onValueChange={(value) => updateStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            {getStatusBadge(request.status)}
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportToPDF(request)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRequestToDelete(request)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* HubSpot Appointments Tab */}
        <TabsContent value="hubspot" className="space-y-6">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom, titre..."
                value={hubspotSearchTerm}
                onChange={(e) => setHubspotSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{hubspotAppointments.length}</div>
                <div className="text-xs text-muted-foreground">Total RDV confirmés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">
                  {hubspotAppointments.filter(a => a.meeting_start_time && new Date(a.meeting_start_time) > new Date()).length}
                </div>
                <div className="text-xs text-muted-foreground">RDV à venir</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-gray-500" />
                <div className="text-2xl font-bold">
                  {hubspotAppointments.filter(a => a.meeting_start_time && new Date(a.meeting_start_time) <= new Date()).length}
                </div>
                <div className="text-xs text-muted-foreground">RDV passés</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {hubspotLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredHubspotAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rendez-vous trouvé
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Titre réunion</TableHead>
                    <TableHead>Date RDV</TableHead>
                    <TableHead>Reçu le</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHubspotAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{apt.user_name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{apt.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{apt.meeting_title || '-'}</TableCell>
                      <TableCell>
                        {apt.meeting_start_time ? (
                          <div>
                            <div>{format(new Date(apt.meeting_start_time), "dd/MM/yyyy", { locale: fr })}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(apt.meeting_start_time), "HH:mm", { locale: fr })}
                            </div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(apt.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {apt.raw_payload ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewPayload(apt.raw_payload)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Aucune donnée
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {apt.meeting_link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAppointmentToDelete(apt)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration - {editingCompany?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nombre maximum de déclarations</Label>
              <Input
                type="number"
                min={1}
                value={formData.max_tax_declarations}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    max_tax_declarations: parseInt(e.target.value) || 100,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Quota actuel : {editingCompany?.declarations_count || 0} /{" "}
                {formData.max_tax_declarations} utilisé
              </p>
            </div>

            <TaxPermanenceConfigEditor
              config={formData.tax_permanence_config}
              onChange={(config) =>
                setFormData((prev) => ({ ...prev, tax_permanence_config: config }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingCompany(null)}>
              Annuler
            </Button>
            <Button onClick={saveConfig}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Informations générales</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Nom:</span> {selectedRequest.prenom} {selectedRequest.nom}</div>
                    <div><span className="text-muted-foreground">Email:</span> {selectedRequest.email}</div>
                    <div><span className="text-muted-foreground">Téléphone:</span> {selectedRequest.telephone || '-'}</div>
                    <div><span className="text-muted-foreground">Entreprise:</span> {selectedRequest.entreprise}</div>
                    <div><span className="text-muted-foreground">Poste:</span> {selectedRequest.intitule_poste}</div>
                    <div><span className="text-muted-foreground">Client Perlib:</span> {selectedRequest.is_perlib_client ? `Oui (${selectedRequest.conseiller_dedie})` : 'Non'}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Situation fiscale</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Situation:</span> {SITUATION_MARITALE_OPTIONS.find(o => o.value === selectedRequest.situation_maritale)?.label || '-'}</div>
                    <div><span className="text-muted-foreground">Enfants:</span> {selectedRequest.nombre_enfants}</div>
                    <div><span className="text-muted-foreground">Revenu N-1:</span> {selectedRequest.revenu_imposable_precedent?.toLocaleString('fr-FR')} €</div>
                    <div><span className="text-muted-foreground">TMI:</span> {TMI_OPTIONS.find(o => o.value === selectedRequest.tmi)?.label || '-'}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Revenus 2025</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRequest.revenus_types || []).map((id: string) => (
                      <Badge key={id} variant="secondary">
                        {getLabelForId(id, [...REVENUS_ACTIVITE, ...REVENUS_CAPITAL, ...REVENUS_PLUS_VALUES])}
                      </Badge>
                    ))}
                    {(!selectedRequest.revenus_types || selectedRequest.revenus_types.length === 0) && (
                      <span className="text-muted-foreground text-sm">Aucun sélectionné</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Optimisation fiscale</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRequest.optimisation_types || []).map((id: string) => (
                      <Badge key={id} variant="secondary">
                        {getLabelForId(id, OPTIMISATION_OPTIONS)}
                      </Badge>
                    ))}
                  </div>
                  {(selectedRequest.optimisation_autres || []).length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Autres: </span>
                      {selectedRequest.optimisation_autres.map((item, i) => (
                        <Badge key={i} variant="outline" className="ml-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Expertise avocat</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRequest.expertise_avocat || []).map((id: string) => (
                      <Badge key={id} variant="secondary">
                        {getLabelForId(id, EXPERTISE_AVOCAT_OPTIONS)}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Délégation complète:</span> {selectedRequest.delegation_complete ? 'Oui' : 'Non'}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Rendez-vous & Documents</h3>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Type RDV:</span> {TYPE_RDV_OPTIONS.find(o => o.value === selectedRequest.type_rdv)?.label || '-'}</div>
                    {selectedRequest.commentaires && (
                      <div><span className="text-muted-foreground">Commentaires:</span> {selectedRequest.commentaires}</div>
                    )}
                    {selectedRequest.avis_imposition_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Avis d'imposition:</span>
                        <a href={selectedRequest.avis_imposition_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          Voir <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {(selectedRequest.autres_justificatifs_urls || []).length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Autres justificatifs:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedRequest.autres_justificatifs_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                              Document {i + 1} <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* HubSpot Payload Dialog */}
      <Dialog open={isPayloadDialogOpen} onOpenChange={setIsPayloadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Réponse Webhook HubSpot</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Confirmation */}
      <AlertDialog open={!!appointmentToDelete} onOpenChange={() => setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rendez-vous de{" "}
              <strong>{appointmentToDelete?.user_name || appointmentToDelete?.user_email}</strong>{" "}
              sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => appointmentToDelete && deleteAppointment(appointmentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Request Confirmation */}
      <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La demande de{" "}
              <strong>{requestToDelete?.prenom} {requestToDelete?.nom}</strong>{" "}
              ({requestToDelete?.email}) sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestToDelete && deleteRequest(requestToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
