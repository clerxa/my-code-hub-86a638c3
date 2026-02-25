import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Settings, ExternalLink, X, ArrowUpDown, ArrowUp, ArrowDown, Link2, Copy, Check } from "lucide-react";
import type { Company, CompanyModule } from "@/types/database";
import type { TaxPermanenceConfig } from "@/types/tax-declaration";

import { ImageUpload } from "./ImageUpload";
import { TaxPermanenceConfigEditor } from "./TaxPermanenceConfigEditor";

interface Module {
  id: number;
  title: string;
}

interface CompanyContact {
  id?: string;
  nom: string;
  email: string;
  telephone: string;
  role_contact: string;
  photo_url?: string;
}

interface CompaniesTabProps {
  companies: Company[];
  modules: Module[];
  onRefresh: () => void;
}

function SignupLinkCopy({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/join/${slug}`;
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien d'inscription copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={url}>
        /join/{slug}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copier le lien">
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}

export const CompaniesTab = ({ companies, modules, onRefresh }: CompaniesTabProps) => {
  const navigate = useNavigate();
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [companyStats, setCompanyStats] = useState<Record<string, { employeeCount: number; avgProgress: number }>>({});
  
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  const [sortField, setSortField] = useState<keyof Company | 'employeeCount' | 'avgProgress' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [createFormData, setCreateFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
    rang: null as number | null,
  });
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
    rang: null as number | null,
    referral_typeform_url: "",
    expert_booking_url: "",
    expert_booking_hubspot_embed: "",
    simulators_config: [] as any[],
    documents_resources: [] as any[],
    webinar_replays: [] as any[],
    email_domains: [] as string[],
    partnership_type: "",
    company_size: null as number | null,
    employee_locations: [] as string[],
    has_foreign_employees: false,
    work_mode: "",
    compensation_devices: {
      rsu: { enabled: false, qualified: false },
      espp: false,
      stock_options: false,
      bspce: false,
      pee: false,
      perco: false,
      pero: false,
      variable_compensation: "",
      employees_ratio: ""
    },
    hr_challenges: {
      salary_frustrations: "",
      financial_anxiety: false,
      understanding_gaps: false,
      tax_optimization_interest: false,
      recurring_declaration_errors: false
    },
    internal_initiatives: {
      financial_education_service: false,
      internal_webinars: false,
      pee_perco_rsu_program: false,
      satisfaction_level: "",
      missing_elements: ""
    },
    internal_communications: {
      channels: [] as string[],
      employee_engagement_level: "",
      communication_capacity: ""
    },
    tax_declaration_help_enabled: false,
    tax_permanence_config: null as TaxPermanenceConfig | null
  });

  const [newContact, setNewContact] = useState<Partial<CompanyContact>>({
    nom: '',
    email: '',
    telephone: '',
    role_contact: '',
    photo_url: ''
  });
  const [newEmailDomain, setNewEmailDomain] = useState("");
  const [newDocument, setNewDocument] = useState({ title: "", description: "", url: "" });
  const [newWebinar, setNewWebinar] = useState({ title: "", description: "", date: "", url: "" });


  const handleSort = (field: keyof Company | 'employeeCount' | 'avgProgress') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    if (!sortField) return 0;
    
    // Handle virtual fields from companyStats
    if (sortField === 'employeeCount') {
      const aValue = companyStats[a.id]?.employeeCount || 0;
      const bValue = companyStats[b.id]?.employeeCount || 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (sortField === 'avgProgress') {
      const aValue = companyStats[a.id]?.avgProgress || 0;
      const bValue = companyStats[b.id]?.avgProgress || 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle regular Company fields
    const aValue = a[sortField as keyof Company];
    const bValue = b[sortField as keyof Company];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const SortButton = ({ field, children }: { field: keyof Company | 'employeeCount' | 'avgProgress'; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleSort(field)}>
      {children}
      {sortField === field ? (
        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </div>
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await (supabase as any)
        .from("companies")
        .insert([createFormData]);

      if (error) throw error;
      toast.success("Entreprise créée");
      
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        logo_url: "",
        primary_color: "#3b82f6",
        secondary_color: "#8b5cf6",
        rang: null,
      });
      onRefresh();
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Erreur lors de la création");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        referral_typeform_url: formData.referral_typeform_url || null,
        expert_booking_url: formData.expert_booking_url || null,
        expert_booking_hubspot_embed: formData.expert_booking_hubspot_embed || null,
        simulators_config: formData.simulators_config.length > 0 ? formData.simulators_config : null,
        documents_resources: formData.documents_resources.length > 0 ? formData.documents_resources : null,
        webinar_replays: formData.webinar_replays.length > 0 ? formData.webinar_replays : null,
        tax_permanence_config: formData.tax_permanence_config
      };

      const { error } = await (supabase as any)
        .from("companies")
        .update(dataToSave)
        .eq("id", editingCompany!.id);

      if (error) throw error;
      toast.success("Entreprise mise à jour");

      setIsDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) return;

    try {
      // Check for dependencies
      const { data: parcours, error: parcoursError } = await supabase
        .from("parcours_companies")
        .select("id")
        .eq("company_id", id);

      if (parcoursError) throw parcoursError;

      // If there are dependencies, delete them first
      if (parcours && parcours.length > 0) {
        const { error: deleteParcoursError } = await supabase
          .from("parcours_companies")
          .delete()
          .eq("company_id", id);

        if (deleteParcoursError) throw deleteParcoursError;
      }

      // Now delete the company
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Entreprise supprimée");
      onRefresh();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast.error(`Erreur lors de la suppression: ${error.message || 'Veuillez vérifier les dépendances'}`);
    }
  };

  const openModulesDialog = async (company: Company) => {
    setSelectedCompany(company);
    
    const { data, error } = await (supabase as any)
      .from("company_modules")
      .select("module_id")
      .eq("company_id", company.id) as { data: CompanyModule[] | null; error: any };

    if (!error && data) {
      setSelectedModules(data.map((cm: CompanyModule) => cm.module_id));
    }
    
    setIsModulesDialogOpen(true);
  };

  const handleSaveModules = async () => {
    if (!selectedCompany) return;

    try {
      await (supabase as any)
        .from("company_modules")
        .delete()
        .eq("company_id", selectedCompany.id);

      if (selectedModules.length > 0) {
        const modulesToInsert = selectedModules.map((moduleId, index) => ({
          company_id: selectedCompany.id,
          module_id: moduleId,
          is_active: true,
          custom_order: index + 1
        }));

        const { error } = await (supabase as any)
          .from("company_modules")
          .insert(modulesToInsert);

        if (error) throw error;
      }

      toast.success("Parcours mis à jour");
      setIsModulesDialogOpen(false);
      setSelectedCompany(null);
      setSelectedModules([]);
    } catch (error) {
      console.error("Error saving modules:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const openEditDialog = async (company: Company) => {
    setEditingCompany(company);
    
    // Charger les contacts depuis company_contacts
    const { data: contacts } = await supabase
      .from('company_contacts')
      .select('*')
      .eq('company_id', company.id);
    
    setCompanyContacts(contacts || []);
    
    // Merge avec les valeurs par défaut pour éviter les undefined
    const defaultCompensation = {
      rsu: { enabled: false, qualified: false },
      espp: false,
      stock_options: false,
      bspce: false,
      pee: false,
      perco: false,
      pero: false,
      variable_compensation: "",
      employees_ratio: ""
    };
    
    const defaultHrChallenges = {
      salary_frustrations: "",
      financial_anxiety: false,
      understanding_gaps: false,
      tax_optimization_interest: false,
      recurring_declaration_errors: false
    };
    
    const defaultInitiatives = {
      financial_education_service: false,
      internal_webinars: false,
      pee_perco_rsu_program: false,
      satisfaction_level: "",
      missing_elements: ""
    };
    
    const defaultCommunications = {
      channels: [],
      employee_engagement_level: "",
      communication_capacity: ""
    };
    
    setFormData({
      name: company.name,
      logo_url: company.logo_url || "",
      primary_color: company.primary_color,
      secondary_color: company.secondary_color,
      rang: (company as any).rang || null,
      referral_typeform_url: company.referral_typeform_url || "",
      expert_booking_url: company.expert_booking_url || "",
      expert_booking_hubspot_embed: company.expert_booking_hubspot_embed || "",
      simulators_config: company.simulators_config || [],
      documents_resources: company.documents_resources || [],
      webinar_replays: company.webinar_replays || [],
      email_domains: company.email_domains || [],
      partnership_type: company.partnership_type || "",
      company_size: company.company_size || null,
      employee_locations: company.employee_locations || [],
      has_foreign_employees: company.has_foreign_employees || false,
      work_mode: company.work_mode || "",
      compensation_devices: {
        ...defaultCompensation,
        ...(company.compensation_devices || {}),
        rsu: {
          ...defaultCompensation.rsu,
          ...(company.compensation_devices?.rsu || {})
        }
      },
      hr_challenges: {
        ...defaultHrChallenges,
        ...(company.hr_challenges || {})
      },
      internal_initiatives: {
        ...defaultInitiatives,
        ...(company.internal_initiatives || {})
      },
      internal_communications: {
        ...defaultCommunications,
        ...(company.internal_communications || {})
      },
      tax_declaration_help_enabled: (company as any).tax_declaration_help_enabled || false,
      tax_permanence_config: (company as any).tax_permanence_config || null
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      primary_color: "#3b82f6",
      secondary_color: "#8b5cf6",
      rang: null,
      referral_typeform_url: "",
      expert_booking_url: "",
      expert_booking_hubspot_embed: "",
      simulators_config: [],
      documents_resources: [],
      webinar_replays: [],
      email_domains: [],
      partnership_type: "",
      company_size: null,
      employee_locations: [],
      has_foreign_employees: false,
      work_mode: "",
      compensation_devices: {
        rsu: { enabled: false, qualified: false },
        espp: false,
        stock_options: false,
        bspce: false,
        pee: false,
        perco: false,
        pero: false,
        variable_compensation: "",
        employees_ratio: ""
      },
      hr_challenges: {
        salary_frustrations: "",
        financial_anxiety: false,
        understanding_gaps: false,
        tax_optimization_interest: false,
        recurring_declaration_errors: false
      },
      internal_initiatives: {
        financial_education_service: false,
        internal_webinars: false,
        pee_perco_rsu_program: false,
        satisfaction_level: "",
        missing_elements: ""
      },
      internal_communications: {
        channels: [],
        employee_engagement_level: "",
        communication_capacity: ""
      },
      tax_declaration_help_enabled: false,
      tax_permanence_config: null
    });
    setEditingCompany(null);
    setNewContact({ nom: '', email: '', telephone: '', role_contact: '' });
    setNewEmailDomain("");
    setNewDocument({ title: "", description: "", url: "" });
    setNewWebinar({ title: "", description: "", date: "", url: "" });
    setNewLocation("");
    setCompanyContacts([]);
  };

  const [newLocation, setNewLocation] = useState("");

  // Fetch company statistics
  const fetchCompanyStats = async () => {
    try {
      const stats: Record<string, { employeeCount: number; avgProgress: number }> = {};
      
      for (const company of companies) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("completed_modules")
          .eq("company_id", company.id);

        if (error) {
          console.error("Error fetching profiles:", error);
          continue;
        }

        const employeeCount = profiles?.length || 0;
        const avgProgress = employeeCount > 0
          ? profiles.reduce((sum, p) => sum + (p.completed_modules?.length || 0), 0) / employeeCount
          : 0;

        stats[company.id] = {
          employeeCount,
          avgProgress: Math.round(avgProgress * 10) / 10 // Arrondi à 1 décimale
        };
      }
      
      setCompanyStats(stats);
    } catch (error) {
      console.error("Error fetching company stats:", error);
    }
  };

  // Fetch stats on component mount and when companies change
  useEffect(() => {
    if (companies.length > 0) {
      fetchCompanyStats();
    }
  }, [companies]);

  const addLocation = () => {
    if (newLocation.trim()) {
      setFormData({
        ...formData,
        employee_locations: [...formData.employee_locations, newLocation.trim()]
      });
      setNewLocation("");
    }
  };

  const removeLocation = (index: number) => {
    setFormData({
      ...formData,
      employee_locations: formData.employee_locations.filter((_, i) => i !== index)
    });
  };

  const addEmailDomain = () => {
    if (newEmailDomain.trim()) {
      const domain = newEmailDomain.trim().startsWith('@') ? newEmailDomain.trim() : `@${newEmailDomain.trim()}`;
      setFormData({
        ...formData,
        email_domains: [...formData.email_domains, domain]
      });
      setNewEmailDomain("");
    }
  };

  const removeEmailDomain = (index: number) => {
    setFormData({
      ...formData,
      email_domains: formData.email_domains.filter((_, i) => i !== index)
    });
  };

  const toggleSimulator = (simulatorCode: string) => {
    const currentSimulators = formData.simulators_config || [];
    const isSelected = currentSimulators.includes(simulatorCode);
    
    setFormData({
      ...formData,
      simulators_config: isSelected
        ? currentSimulators.filter((code: string) => code !== simulatorCode)
        : [...currentSimulators, simulatorCode]
    });
  };

  const addDocument = () => {
    if (newDocument.title && newDocument.url) {
      setFormData({
        ...formData,
        documents_resources: [...formData.documents_resources, { ...newDocument }]
      });
      setNewDocument({ title: "", description: "", url: "" });
    }
  };

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      documents_resources: formData.documents_resources.filter((_, i) => i !== index)
    });
  };

  const addWebinar = () => {
    if (newWebinar.title && newWebinar.url) {
      setFormData({
        ...formData,
        webinar_replays: [...formData.webinar_replays, { ...newWebinar }]
      });
      setNewWebinar({ title: "", description: "", date: "", url: "" });
    }
  };

  const removeWebinar = (index: number) => {
    setFormData({
      ...formData,
      webinar_replays: formData.webinar_replays.filter((_, i) => i !== index)
    });
  };

  const toggleModule = (moduleId: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Entreprises</CardTitle>
            <div className="flex gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle entreprise
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle entreprise</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations essentielles pour créer une entreprise
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="create_name">Nom de l'entreprise *</Label>
                      <Input
                        id="create_name"
                        value={createFormData.name}
                        onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                        required
                        placeholder="Nom de l'entreprise"
                      />
                    </div>

                    <ImageUpload
                      label="Logo de l'entreprise"
                      value={createFormData.logo_url || ""}
                      onChange={(url) => setCreateFormData({ ...createFormData, logo_url: url })}
                      bucketName="landing-images"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="create_primary_color">Couleur primaire</Label>
                        <Input
                          id="create_primary_color"
                          type="color"
                          value={createFormData.primary_color}
                          onChange={(e) => setCreateFormData({ ...createFormData, primary_color: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create_secondary_color">Couleur secondaire</Label>
                        <Input
                          id="create_secondary_color"
                          type="color"
                          value={createFormData.secondary_color}
                          onChange={(e) => setCreateFormData({ ...createFormData, secondary_color: e.target.value })}
                        />
                      </div>
                    </div>


                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit">
                        Créer
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? "Modifier l'entreprise" : "Nouvelle entreprise"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                      <TabsTrigger value="general">Général</TabsTrigger>
                      <TabsTrigger value="company-details">Détails</TabsTrigger>
                      <TabsTrigger value="compensation">Rémunération</TabsTrigger>
                      <TabsTrigger value="hr">RH/CSE</TabsTrigger>
                      <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
                      <TabsTrigger value="links">Liens</TabsTrigger>
                      <TabsTrigger value="content">Contenus</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="partnership_type">Entité en charge du partenariat</Label>
                        <Select
                          value={formData.partnership_type || ''}
                          onValueChange={(value) => setFormData({ ...formData, partnership_type: value })}
                        >
                          <SelectTrigger id="partnership_type" className="bg-background">
                            <SelectValue placeholder="Sélectionner une entité" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="CSE">CSE</SelectItem>
                            <SelectItem value="Département RH">Département RH</SelectItem>
                            <SelectItem value="Département Communication">Département Communication</SelectItem>
                            <SelectItem value="Département RSE">Département RSE</SelectItem>
                            <SelectItem value="Département Financier">Département Financier</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                            <SelectItem value="Aucun">Aucun</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <ImageUpload
                        label="Logo de l'entreprise"
                        value={formData.logo_url || ""}
                        onChange={(url) => setFormData({ ...formData, logo_url: url })}
                        bucketName="landing-images"
                      />

                      <div className="space-y-2">
                        <Label>Domaines de messagerie autorisés</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newEmailDomain}
                            onChange={(e) => setNewEmailDomain(e.target.value)}
                            placeholder="@exemple.com"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmailDomain())}
                          />
                          <Button type="button" onClick={addEmailDomain}>Ajouter</Button>
                        </div>
                        <div className="space-y-1">
                          {formData.email_domains.map((domain, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-mono text-sm">{domain}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmailDomain(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primary_color">Couleur primaire</Label>
                          <Input
                            id="primary_color"
                            type="color"
                            value={formData.primary_color}
                            onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondary_color">Couleur secondaire</Label>
                          <Input
                            id="secondary_color"
                            type="color"
                            value={formData.secondary_color}
                            onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          />
                        </div>
                      </div>

                    </TabsContent>

                    <TabsContent value="company-details" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_size">Effectif de l'entreprise</Label>
                        <Input
                          id="company_size"
                          type="number"
                          value={formData.company_size || ""}
                          onChange={(e) => setFormData({ ...formData, company_size: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Ex: 250"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Localisation des salariés</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            placeholder="Ex: Paris, Lyon, Remote..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                          />
                          <Button type="button" onClick={addLocation}>Ajouter</Button>
                        </div>
                        <div className="space-y-1">
                          {formData.employee_locations.map((location, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span>{location}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLocation(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_foreign_employees"
                          checked={formData.has_foreign_employees}
                          onCheckedChange={(checked) => setFormData({ ...formData, has_foreign_employees: checked === true })}
                        />
                        <Label htmlFor="has_foreign_employees">Présence de salariés étrangers</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="work_mode">Mode de travail</Label>
                        <select
                          id="work_mode"
                          value={formData.work_mode}
                          onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="remote">Full Remote</option>
                          <option value="hybrid">Hybride</option>
                          <option value="office">Full Office</option>
                        </select>
                      </div>
                    </TabsContent>

                    <TabsContent value="compensation" className="space-y-4">
                      <h3 className="font-semibold text-lg">Dispositifs de rémunération</h3>
                      
                      <div className="space-y-4 border p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rsu_enabled"
                            checked={formData.compensation_devices.rsu.enabled}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              compensation_devices: {
                                ...formData.compensation_devices,
                                rsu: { ...formData.compensation_devices.rsu, enabled: checked === true }
                              }
                            })}
                          />
                          <Label htmlFor="rsu_enabled">RSU (Restricted Stock Units)</Label>
                        </div>
                        
                        {formData.compensation_devices.rsu.enabled && (
                          <div className="ml-6 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="rsu_qualified"
                                checked={formData.compensation_devices.rsu.qualified}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  compensation_devices: {
                                    ...formData.compensation_devices,
                                    rsu: { ...formData.compensation_devices.rsu, qualified: checked === true }
                                  }
                                })}
                              />
                              <Label htmlFor="rsu_qualified">Plan qualifié</Label>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="espp"
                          checked={formData.compensation_devices.espp}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, espp: checked === true }
                          })}
                        />
                        <Label htmlFor="espp">ESPP (Employee Stock Purchase Plan)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="stock_options"
                          checked={formData.compensation_devices.stock_options}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, stock_options: checked === true }
                          })}
                        />
                        <Label htmlFor="stock_options">Stock-Options</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bspce"
                          checked={formData.compensation_devices.bspce}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, bspce: checked === true }
                          })}
                        />
                        <Label htmlFor="bspce">BSPCE</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pee"
                          checked={formData.compensation_devices.pee}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, pee: checked === true }
                          })}
                        />
                        <Label htmlFor="pee">PEE (Plan d'Épargne Entreprise)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="perco"
                          checked={formData.compensation_devices.perco}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, perco: checked === true }
                          })}
                        />
                        <Label htmlFor="perco">PERCO (Plan d'Épargne Retraite Collectif)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pero"
                          checked={formData.compensation_devices.pero}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, pero: checked === true }
                          })}
                        />
                        <Label htmlFor="pero">PERO (Plan d'Épargne Retraite Obligatoire)</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="variable_compensation">Variables significatifs et timing de versement</Label>
                        <Textarea
                          id="variable_compensation"
                          value={formData.compensation_devices.variable_compensation}
                          onChange={(e) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, variable_compensation: e.target.value }
                          })}
                          placeholder="Ex: Bonus annuel versé en mars, intéressement versé en juin..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employees_ratio">Proportion du nombre de salariés concernés par ces dispositifs</Label>
                        <Input
                          id="employees_ratio"
                          value={formData.compensation_devices.employees_ratio}
                          onChange={(e) => setFormData({
                            ...formData,
                            compensation_devices: { ...formData.compensation_devices, employees_ratio: e.target.value }
                          })}
                          placeholder="Ex: 80% des cadres, 40% des employés..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="niveau_maturite_financiere">Niveau présumé de maturité financière des salariés</Label>
                        <select
                          id="niveau_maturite_financiere"
                          value={(formData as any).niveau_maturite_financiere || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            niveau_maturite_financiere: e.target.value
                          } as any)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="faible">Faible</option>
                          <option value="moyen">Moyen</option>
                          <option value="élevé">Élevé</option>
                        </select>
                      </div>
                    </TabsContent>

                    <TabsContent value="hr" className="space-y-4">
                      <h3 className="font-semibold text-lg">Enjeux RH/CSE</h3>

                      <div className="space-y-2">
                        <Label htmlFor="salary_frustrations">Points de frustration de vos salariés liés à l'argent</Label>
                        <Textarea
                          id="salary_frustrations"
                          value={formData.hr_challenges.salary_frustrations}
                          onChange={(e) => setFormData({
                            ...formData,
                            hr_challenges: { ...formData.hr_challenges, salary_frustrations: e.target.value }
                          })}
                          placeholder="Ex: Complexité des dispositifs, manque de transparence, timing des versements..."
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="financial_anxiety"
                          checked={formData.hr_challenges.financial_anxiety}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            hr_challenges: { ...formData.hr_challenges, financial_anxiety: checked === true }
                          })}
                        />
                        <Label htmlFor="financial_anxiety">Présence d'anxiété financière</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="understanding_gaps"
                          checked={formData.hr_challenges.understanding_gaps}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            hr_challenges: { ...formData.hr_challenges, understanding_gaps: checked === true }
                          })}
                        />
                        <Label htmlFor="understanding_gaps">Manque de compréhension des dispositifs</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tax_optimization_interest"
                          checked={formData.hr_challenges.tax_optimization_interest}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            hr_challenges: { ...formData.hr_challenges, tax_optimization_interest: checked === true }
                          })}
                        />
                        <Label htmlFor="tax_optimization_interest">Intérêt fort pour l'optimisation fiscale</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="recurring_declaration_errors"
                          checked={formData.hr_challenges.recurring_declaration_errors}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            hr_challenges: { ...formData.hr_challenges, recurring_declaration_errors: checked === true }
                          })}
                        />
                        <Label htmlFor="recurring_declaration_errors">Erreurs récurrentes dans les déclarations</Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="initiatives" className="space-y-4">
                      <h3 className="font-semibold text-lg">Initiatives déjà mises en place</h3>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="financial_education_service"
                          checked={formData.internal_initiatives.financial_education_service}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            internal_initiatives: { ...formData.internal_initiatives, financial_education_service: checked === true }
                          })}
                        />
                        <Label htmlFor="financial_education_service">Service d'éducation financière</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="internal_webinars"
                          checked={formData.internal_initiatives.internal_webinars}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            internal_initiatives: { ...formData.internal_initiatives, internal_webinars: checked === true }
                          })}
                        />
                        <Label htmlFor="internal_webinars">Webinars internes</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pee_perco_rsu_program"
                          checked={formData.internal_initiatives.pee_perco_rsu_program}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            internal_initiatives: { ...formData.internal_initiatives, pee_perco_rsu_program: checked === true }
                          })}
                        />
                        <Label htmlFor="pee_perco_rsu_program">Programme d'accompagnement sur PEE/PERCO/RSU</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="satisfaction_level">Niveau de satisfaction sur les initiatives déjà mises en place</Label>
                        <select
                          id="satisfaction_level"
                          value={formData.internal_initiatives.satisfaction_level}
                          onChange={(e) => setFormData({
                            ...formData,
                            internal_initiatives: { ...formData.internal_initiatives, satisfaction_level: e.target.value }
                          })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="très_insatisfait">Très insatisfait</option>
                          <option value="insatisfait">Insatisfait</option>
                          <option value="neutre">Neutre</option>
                          <option value="satisfait">Satisfait</option>
                          <option value="très_satisfait">Très satisfait</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="missing_elements">Ce qui manque aujourd'hui</Label>
                        <Textarea
                          id="missing_elements"
                          value={formData.internal_initiatives.missing_elements}
                          onChange={(e) => setFormData({
                            ...formData,
                            internal_initiatives: { ...formData.internal_initiatives, missing_elements: e.target.value }
                          })}
                          placeholder="Ex: Formations sur la fiscalité, accompagnement personnalisé, outils de simulation..."
                          rows={4}
                        />
                      </div>

                      <h3 className="font-semibold text-lg mt-6">Canaux de communication internes</h3>

                      <div className="space-y-2">
                        <Label>Canaux de communication disponibles</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {['Slack', 'Teams', 'Email', 'Intranet', 'Autres'].map((channel) => (
                            <div key={channel} className="flex items-center space-x-2">
                              <Checkbox
                                id={`channel_${channel}`}
                                checked={formData.internal_communications.channels.includes(channel)}
                                onCheckedChange={(checked) => {
                                  const newChannels = checked
                                    ? [...formData.internal_communications.channels, channel]
                                    : formData.internal_communications.channels.filter(c => c !== channel);
                                  setFormData({
                                    ...formData,
                                    internal_communications: { ...formData.internal_communications, channels: newChannels }
                                  });
                                }}
                              />
                              <Label htmlFor={`channel_${channel}`}>{channel}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employee_engagement_level">Niveau d'engagement des salariés dans les initiatives internes</Label>
                        <select
                          id="employee_engagement_level"
                          value={formData.internal_communications.employee_engagement_level}
                          onChange={(e) => setFormData({
                            ...formData,
                            internal_communications: { ...formData.internal_communications, employee_engagement_level: e.target.value }
                          })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="très_faible">Très faible</option>
                          <option value="faible">Faible</option>
                          <option value="moyen">Moyen</option>
                          <option value="élevé">Élevé</option>
                          <option value="très_élevé">Très élevé</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="communication_capacity">Capacité de communication</Label>
                        <Input
                          id="communication_capacity"
                          value={formData.internal_communications.communication_capacity}
                          onChange={(e) => setFormData({
                            ...formData,
                            internal_communications: { ...formData.internal_communications, communication_capacity: e.target.value }
                          })}
                          placeholder="Ex: 2-3 push par mois, newsletter hebdomadaire..."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="links" className="space-y-4">
                      {/* Contacts référents */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-lg font-semibold">Contacts référents</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Ajoutez les contacts RH/Finance de l'entreprise
                          </p>
                        </div>
                        
                        {companyContacts.length > 0 && (
                          <div className="space-y-2">
                            {companyContacts.map((contact, index) => (
                              <div key={contact.id || index} className="p-4 bg-muted rounded-lg">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    {contact.photo_url ? (
                                      <img 
                                        src={contact.photo_url} 
                                        alt={contact.nom}
                                        className="w-12 h-12 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                        {contact.nom.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      <p className="font-medium">{contact.nom}</p>
                                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                                      <p className="text-sm text-muted-foreground">{contact.telephone}</p>
                                      <p className="text-xs text-muted-foreground italic">{contact.role_contact}</p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      if (contact.id) {
                                        await supabase.from('company_contacts').delete().eq('id', contact.id);
                                        setCompanyContacts(companyContacts.filter(c => c.id !== contact.id));
                                        toast.success('Contact supprimé');
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="p-4 border rounded-lg space-y-3">
                          <Label>Ajouter un contact</Label>
                          <Input
                            placeholder="Nom"
                            value={newContact.nom || ''}
                            onChange={(e) => setNewContact({ ...newContact, nom: e.target.value })}
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={newContact.email || ''}
                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                          />
                          <Input
                            placeholder="Téléphone"
                            value={newContact.telephone || ''}
                            onChange={(e) => setNewContact({ ...newContact, telephone: e.target.value })}
                          />
                          <Input
                            placeholder="Rôle (ex: DRH, Responsable Finance)"
                            value={newContact.role_contact || ''}
                            onChange={(e) => setNewContact({ ...newContact, role_contact: e.target.value })}
                          />
                          <ImageUpload
                            label="Photo d'identité"
                            value={newContact.photo_url || ""}
                            onChange={(url) => setNewContact({ ...newContact, photo_url: url })}
                            bucketName="landing-images"
                          />
                          <Button 
                            type="button" 
                            onClick={async () => {
                              if (editingCompany && newContact.nom && newContact.email) {
                                const { data, error } = await supabase
                                  .from('company_contacts')
                                  .insert({
                                    company_id: editingCompany.id,
                                    nom: newContact.nom,
                                    email: newContact.email,
                                    telephone: newContact.telephone || '',
                                    role_contact: newContact.role_contact || '',
                                    photo_url: newContact.photo_url || null
                                  })
                                  .select()
                                  .single();
                                
                                if (!error && data) {
                                  setCompanyContacts([...companyContacts, data]);
                                  setNewContact({ nom: '', email: '', telephone: '', role_contact: '', photo_url: '' });
                                  toast.success('Contact ajouté');
                                } else {
                                  toast.error('Erreur lors de l\'ajout du contact');
                                }
                              } else {
                                toast.error('Nom et email sont obligatoires');
                              }
                            }}
                          >
                            Ajouter le contact
                          </Button>
                        </div>
                      </div>

                      {/* Lien parrainage */}
                      <div className="space-y-2">
                        <Label htmlFor="referral_typeform_url">Lien Typeform Parrainage</Label>
                        <Input
                          id="referral_typeform_url"
                          value={formData.referral_typeform_url}
                          onChange={(e) => setFormData({ ...formData, referral_typeform_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      {/* Lien prise de rendez-vous */}
                      <div className="space-y-2">
                        <Label htmlFor="expert_booking_url">Lien Prise de RDV Expert (fallback)</Label>
                        <Input
                          id="expert_booking_url"
                          value={formData.expert_booking_url}
                          onChange={(e) => setFormData({ ...formData, expert_booking_url: e.target.value })}
                          placeholder="https://..."
                        />
                        <p className="text-sm text-muted-foreground">Lien de secours si le code HubSpot n&apos;est pas fourni</p>
                      </div>

                      {/* Code d'intégration HubSpot */}
                      <div className="space-y-2">
                        <Label htmlFor="expert_booking_hubspot_embed">Code d&apos;intégration HubSpot</Label>
                        <Textarea
                          id="expert_booking_hubspot_embed"
                          value={formData.expert_booking_hubspot_embed}
                          onChange={(e) => setFormData({ ...formData, expert_booking_hubspot_embed: e.target.value })}
                          placeholder='<div class="meetings-iframe-container" data-src="https://meetings-eu1.hubspot.com/..."></div>'
                          rows={5}
                          className="font-mono text-sm"
                        />
                        <p className="text-sm text-muted-foreground">Collez le code HTML complet fourni par HubSpot (avec la div et le script)</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-6">
                      {/* Aide déclaration fiscale */}
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Aide à la déclaration fiscale</Label>
                            <p className="text-sm text-muted-foreground">
                              Activer l'accompagnement fiscal pour les collaborateurs de cette entreprise
                            </p>
                          </div>
                          <Switch
                            checked={formData.tax_declaration_help_enabled}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tax_declaration_help_enabled: checked }))}
                          />
                        </div>
                        
                        {formData.tax_declaration_help_enabled && (
                          <div className="pt-4 border-t space-y-4">
                            {/* Quota Configuration */}
                            <div className="space-y-2">
                              <Label htmlFor="max_tax_declarations">Nombre maximum d'accompagnements</Label>
                              <Input
                                id="max_tax_declarations"
                                type="number"
                                value={(formData as any).max_tax_declarations || 100}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  max_tax_declarations: parseInt(e.target.value) || 100 
                                } as any))}
                                placeholder="100"
                                className="w-32"
                              />
                              <p className="text-xs text-muted-foreground">
                                Nombre maximum de demandes d'aide fiscale pour cette entreprise
                              </p>
                            </div>
                            
                            <TaxPermanenceConfigEditor
                              config={formData.tax_permanence_config}
                              onChange={(config) => setFormData(prev => ({ ...prev, tax_permanence_config: config }))}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Simulateurs */}
                      <div className="space-y-2">
                        <Label>Simulateurs disponibles</Label>
                        <div className="space-y-3 p-4 border rounded">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sim-espp"
                              checked={formData.simulators_config?.includes("simulateur_espp")}
                              onCheckedChange={() => toggleSimulator("simulateur_espp")}
                            />
                            <Label htmlFor="sim-espp" className="cursor-pointer">
                              Simulateur ESPP
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sim-impots"
                              checked={formData.simulators_config?.includes("simulateur-impots")}
                              onCheckedChange={() => toggleSimulator("simulateur-impots")}
                            />
                            <Label htmlFor="sim-impots" className="cursor-pointer">
                              Simulateur Impôts
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sim-rsu"
                              checked={formData.simulators_config?.includes("simulateur-rsu")}
                              onCheckedChange={() => toggleSimulator("simulateur-rsu")}
                              disabled
                            />
                            <Label htmlFor="sim-rsu" className="cursor-pointer text-muted-foreground">
                              Simulateur RSU (à venir)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sim-bspce"
                              checked={formData.simulators_config?.includes("simulateur-bspce")}
                              onCheckedChange={() => toggleSimulator("simulateur-bspce")}
                              disabled
                            />
                            <Label htmlFor="sim-bspce" className="cursor-pointer text-muted-foreground">
                              Simulateur BSPCE (à venir)
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="space-y-2">
                        <Label>Documents & Ressources</Label>
                        <div className="space-y-2 p-3 border rounded">
                          <Input
                            value={newDocument.title}
                            onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                            placeholder="Titre du document"
                          />
                          <Input
                            value={newDocument.description}
                            onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                            placeholder="Description (optionnel)"
                          />
                          <Input
                            value={newDocument.url}
                            onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                            placeholder="URL"
                          />
                          <Button type="button" onClick={addDocument} className="w-full">
                            Ajouter le document
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {formData.documents_resources.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <div className="font-medium">{doc.title}</div>
                                <div className="text-sm text-muted-foreground">{doc.url}</div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDocument(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Webinars */}
                      <div className="space-y-2">
                        <Label>Replay Webinars</Label>
                        <div className="space-y-2 p-3 border rounded">
                          <Input
                            value={newWebinar.title}
                            onChange={(e) => setNewWebinar({ ...newWebinar, title: e.target.value })}
                            placeholder="Titre du webinar"
                          />
                          <Input
                            value={newWebinar.description}
                            onChange={(e) => setNewWebinar({ ...newWebinar, description: e.target.value })}
                            placeholder="Description (optionnel)"
                          />
                          <Input
                            type="date"
                            value={newWebinar.date}
                            onChange={(e) => setNewWebinar({ ...newWebinar, date: e.target.value })}
                            placeholder="Date"
                          />
                          <Input
                            value={newWebinar.url}
                            onChange={(e) => setNewWebinar({ ...newWebinar, url: e.target.value })}
                            placeholder="URL"
                          />
                          <Button type="button" onClick={addWebinar} className="w-full">
                            Ajouter le webinar
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {formData.webinar_replays.map((webinar, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <div className="font-medium">{webinar.title}</div>
                                <div className="text-sm text-muted-foreground">{webinar.url}</div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeWebinar(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingCompany ? "Mettre à jour" : "Créer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton field="name">Nom</SortButton></TableHead>
                <TableHead><SortButton field="partnership_type">Entité en charge du partenariat</SortButton></TableHead>
                <TableHead>Rang</TableHead>
                <TableHead className="text-center">Effectif déclaré</TableHead>
                <TableHead className="text-center"><SortButton field="employeeCount">Nb salariés inscrits</SortButton></TableHead>
                <TableHead className="text-center"><SortButton field="avgProgress">% moyen progression</SortButton></TableHead>
                <TableHead className="text-center">Aide Fiscale</TableHead>
                <TableHead>Lien inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <Select
                      value={company.partnership_type || "none"}
                      onValueChange={async (value) => {
                        const newType = value === "none" ? null : value;
                        const { error } = await supabase
                          .from("companies")
                          .update({ partnership_type: newType })
                          .eq("id", company.id);
                        
                        if (error) {
                          toast.error("Impossible de mettre à jour l'entité");
                        } else {
                          toast.success("L'entité a été modifiée avec succès");
                          onRefresh();
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        <SelectItem value="CSE">CSE</SelectItem>
                        <SelectItem value="Département RH">Département RH</SelectItem>
                        <SelectItem value="Département Communication">Département Communication</SelectItem>
                        <SelectItem value="Département RSE">Département RSE</SelectItem>
                        <SelectItem value="Département Financier">Département Financier</SelectItem>
                        <SelectItem value="Direction Générale">Direction Générale</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                        <SelectItem value="Aucun">Aucun</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={(company as any).rang?.toString() || "none"}
                      onValueChange={async (value) => {
                        const newRang = value === "none" ? null : parseInt(value);
                        const { error } = await supabase
                          .from("companies")
                          .update({ rang: newRang })
                          .eq("id", company.id);
                        
                        if (error) {
                          toast.error("Impossible de mettre à jour le rang");
                        } else {
                          toast.success("Le rang a été modifié avec succès");
                          onRefresh();
                        }
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Rang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        <SelectItem value="1">Rang 1</SelectItem>
                        <SelectItem value="2">Rang 2</SelectItem>
                        <SelectItem value="3">Rang 3</SelectItem>
                        <SelectItem value="4">Rang 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">{company.company_size || "-"}</TableCell>
                  <TableCell className="text-center">{companyStats[company.id]?.employeeCount || 0}</TableCell>
                  <TableCell className="text-center">{companyStats[company.id]?.avgProgress || 0}%</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={(company as any).tax_declaration_help_enabled || false}
                      onCheckedChange={async (checked) => {
                        const { error } = await supabase
                          .from("companies")
                          .update({ tax_declaration_help_enabled: checked })
                          .eq("id", company.id);
                        
                        if (error) {
                          toast.error("Impossible de mettre à jour");
                        } else {
                          toast.success(checked ? "Aide fiscale activée" : "Aide fiscale désactivée");
                          onRefresh();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {(company as any).signup_slug ? (
                      <SignupLinkCopy slug={(company as any).signup_slug} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/company/${company.id}`)}
                        title="Voir la page entreprise"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModulesDialog(company)}
                        title="Gérer les parcours"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(company)}
                        title="Modifier l'entreprise"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parcours personnalisé - {selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              Sélectionnez les modules disponibles pour cette entreprise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pb-4">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedModules.includes(module.id)}
                  onCheckedChange={() => toggleModule(module.id)}
                />
                <Label className="cursor-pointer">{module.title}</Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModulesDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveModules}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
