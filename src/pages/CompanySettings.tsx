import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, X, Trophy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/AuthProvider";

import { ImageUpload } from "@/components/admin/ImageUpload";

interface CompanyContact {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role_contact: string | null;
}

const CompanySettings = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [newContact, setNewContact] = useState({ nom: '', email: '', telephone: '', role_contact: '' });
  const [newEmailDomain, setNewEmailDomain] = useState("");
  const [newLocation, setNewLocation] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
    referral_typeform_url: "",
    expert_booking_url: "",
    expert_booking_hubspot_embed: "",
    email_domains: [] as string[],
    partnership_type: "",
    company_size: null as number | null,
    employee_locations: [] as string[],
    has_foreign_employees: false,
    work_mode: "",
    enable_points_ranking: false,
    compensation_devices: {
      rsu: false,
      espp: false,
      stock_options: false,
      bspce: false,
      pee: false,
      perco: false,
      pero: false,
      autres: { enabled: false, description: "" },
      variable_compensation_frequency: [] as string[],
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
    }
  });

  useEffect(() => {
    if (id) {
      fetchCompanyData();
    }
  }, [id, user]);

  const fetchCompanyData = async () => {
    if (!user || !id) return;

    try {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (companyError) throw companyError;

      const { data: contactsData } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", id);

      if (contactsData) {
        setContacts(contactsData);
      }

      const defaultCompensation = {
        rsu: false,
        espp: false,
        stock_options: false,
        bspce: false,
        pee: false,
        perco: false,
        pero: false,
        autres: { enabled: false, description: "" },
        variable_compensation_frequency: [] as string[],
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

      const companyCompensation = company.compensation_devices as any;
      const companyHrChallenges = company.hr_challenges as any;
      const companyInitiatives = company.internal_initiatives as any;
      const companyCommunications = company.internal_communications as any;

      setFormData({
        name: company.name || "",
        logo_url: company.logo_url || "",
        primary_color: company.primary_color || "#3b82f6",
        secondary_color: company.secondary_color || "#8b5cf6",
        referral_typeform_url: company.referral_typeform_url || "",
        expert_booking_url: company.expert_booking_url || "",
        expert_booking_hubspot_embed: company.expert_booking_hubspot_embed || "",
        email_domains: company.email_domains || [],
        partnership_type: company.partnership_type || "",
        company_size: company.company_size || null,
        employee_locations: company.employee_locations || [],
        has_foreign_employees: company.has_foreign_employees || false,
        work_mode: company.work_mode || "",
        enable_points_ranking: company.enable_points_ranking || false,
        compensation_devices: {
          ...defaultCompensation,
          ...(companyCompensation || {}),
          autres: {
            ...defaultCompensation.autres,
            ...(companyCompensation?.autres || {})
          },
          variable_compensation_frequency: companyCompensation?.variable_compensation_frequency || []
        },
        hr_challenges: {
          ...defaultHrChallenges,
          ...(companyHrChallenges || {})
        },
        internal_initiatives: {
          ...defaultInitiatives,
          ...(companyInitiatives || {})
        },
        internal_communications: {
          ...defaultCommunications,
          ...(companyCommunications || {})
        }
      });
    } catch (error: any) {
      console.error("Error fetching company data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        referral_typeform_url: formData.referral_typeform_url || null,
        expert_booking_url: formData.expert_booking_url || null,
        expert_booking_hubspot_embed: formData.expert_booking_hubspot_embed || null,
      };

      const { error } = await supabase
        .from("companies")
        .update(dataToSave)
        .eq("id", id);

      if (error) throw error;

      toast.success("Modifications enregistrées avec succès");
      navigate(`/company/${id}`);
    } catch (error: any) {
      console.error("Error saving company data:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const addEmailDomain = () => {
    if (newEmailDomain.trim()) {
      setFormData({
        ...formData,
        email_domains: [...formData.email_domains, newEmailDomain.trim()]
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

  const addContact = async () => {
    if (!id || !newContact.nom || !newContact.email) return;

    try {
      const { error } = await supabase
        .from("company_contacts")
        .insert([{ ...newContact, company_id: id }]);

      if (error) throw error;

      toast.success("Contact ajouté");
      setNewContact({ nom: '', email: '', telephone: '', role_contact: '' });
      
      const { data } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", id);
      
      if (data) setContacts(data);
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Erreur lors de l'ajout du contact");
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from("company_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast.success("Contact supprimé");
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (error) {
      console.error("Error removing contact:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/company/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la page entreprise
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl hero-gradient">Configuration de l'entreprise</h1>
            <p className="text-muted-foreground mt-2">
              Gérez toutes les informations de votre entreprise
            </p>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="compensation">Rémunération</TabsTrigger>
              <TabsTrigger value="hr">RH</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'entreprise</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nom de l'entreprise"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Couleur principale</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Couleur secondaire</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          placeholder="#8b5cf6"
                        />
                      </div>
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label>Domaines de messagerie autorisés</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newEmailDomain}
                        onChange={(e) => setNewEmailDomain(e.target.value)}
                        placeholder="@exemple.com"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmailDomain())}
                      />
                      <Button type="button" onClick={addEmailDomain}>
                        <Plus className="h-4 w-4" />
                      </Button>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Gamification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <Label htmlFor="enable_points_ranking" className="font-medium">
                        Activer les points et le classement
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Les employés accumulent des points en complétant des modules et sont classés entre eux
                      </p>
                    </div>
                    <Switch
                      id="enable_points_ranking"
                      checked={formData.enable_points_ranking}
                      onCheckedChange={(checked) => setFormData({ ...formData, enable_points_ranking: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liens utiles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="referral_typeform_url">URL Typeform de parrainage</Label>
                    <Input
                      id="referral_typeform_url"
                      value={formData.referral_typeform_url}
                      onChange={(e) => setFormData({ ...formData, referral_typeform_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expert_booking_url">URL de prise de RDV expert</Label>
                    <Input
                      id="expert_booking_url"
                      value={formData.expert_booking_url}
                      onChange={(e) => setFormData({ ...formData, expert_booking_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expert_booking_hubspot_embed">Code embed HubSpot</Label>
                    <Textarea
                      id="expert_booking_hubspot_embed"
                      value={formData.expert_booking_hubspot_embed}
                      onChange={(e) => setFormData({ ...formData, expert_booking_hubspot_embed: e.target.value })}
                      placeholder="<script>...</script>"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Détails de l'entreprise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_size">Effectif</Label>
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
                        placeholder="Ex: Paris, Lyon..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                      />
                      <Button type="button" onClick={addLocation}>
                        <Plus className="h-4 w-4" />
                      </Button>
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
                    <Select
                      value={formData.work_mode}
                      onValueChange={(value) => setFormData({ ...formData, work_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Full Remote</SelectItem>
                        <SelectItem value="hybrid">Hybride</SelectItem>
                        <SelectItem value="office">Full Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compensation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dispositifs de rémunération</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rsu"
                        checked={formData.compensation_devices.rsu}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          compensation_devices: { ...formData.compensation_devices, rsu: checked === true }
                        })}
                      />
                      <Label htmlFor="rsu">RSU (Actions gratuites)</Label>
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
                      <Label htmlFor="espp">ESPP (Plan d'achat d'actions)</Label>
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
                      <Label htmlFor="stock_options">Stock Options</Label>
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
                      <Label htmlFor="pee">PEE (Plan Épargne Entreprise)</Label>
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
                      <Label htmlFor="perco">PERCO</Label>
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
                      <Label htmlFor="pero">PERO</Label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="autres"
                          checked={formData.compensation_devices.autres.enabled}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            compensation_devices: {
                              ...formData.compensation_devices,
                              autres: { ...formData.compensation_devices.autres, enabled: checked === true }
                            }
                          })}
                        />
                        <Label htmlFor="autres">Autres</Label>
                      </div>
                      {formData.compensation_devices.autres.enabled && (
                        <div className="ml-6">
                          <Input
                            value={formData.compensation_devices.autres.description}
                            onChange={(e) => setFormData({
                              ...formData,
                              compensation_devices: {
                                ...formData.compensation_devices,
                                autres: { ...formData.compensation_devices.autres, description: e.target.value }
                              }
                            })}
                            placeholder="Précisez le dispositif..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employees_ratio">Ratio des salariés concernés par ces dispositifs</Label>
                    <Input
                      id="employees_ratio"
                      value={formData.compensation_devices.employees_ratio}
                      onChange={(e) => setFormData({
                        ...formData,
                        compensation_devices: { ...formData.compensation_devices, employees_ratio: e.target.value }
                      })}
                      placeholder="Ex: 80% des cadres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fréquence des rémunérations variables</Label>
                    <p className="text-sm text-muted-foreground mb-2">Plusieurs choix possibles</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["mensuel", "trimestriel", "semestriel", "annuel"].map((freq) => (
                        <div key={freq} className="flex items-center space-x-2">
                          <Checkbox
                            id={`freq_${freq}`}
                            checked={formData.compensation_devices.variable_compensation_frequency.includes(freq)}
                            onCheckedChange={(checked) => {
                              const current = formData.compensation_devices.variable_compensation_frequency;
                              const updated = checked
                                ? [...current, freq]
                                : current.filter(f => f !== freq);
                              setFormData({
                                ...formData,
                                compensation_devices: { ...formData.compensation_devices, variable_compensation_frequency: updated }
                              });
                            }}
                          />
                          <Label htmlFor={`freq_${freq}`} className="capitalize">{freq}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hr" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Défis RH et initiatives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-medium">Défis identifiés</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="financial_anxiety"
                        checked={formData.hr_challenges.financial_anxiety}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          hr_challenges: { ...formData.hr_challenges, financial_anxiety: checked === true }
                        })}
                      />
                      <Label htmlFor="financial_anxiety">Anxiété financière des salariés</Label>
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
                      <Label htmlFor="tax_optimization_interest">Intérêt pour l'optimisation fiscale</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary_frustrations">Frustrations salariales</Label>
                      <Textarea
                        id="salary_frustrations"
                        value={formData.hr_challenges.salary_frustrations}
                        onChange={(e) => setFormData({
                          ...formData,
                          hr_challenges: { ...formData.hr_challenges, salary_frustrations: e.target.value }
                        })}
                        placeholder="Décrivez les principales frustrations..."
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Initiatives internes</h3>
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
                      <Label htmlFor="internal_webinars">Webinaires internes</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="satisfaction_level">Niveau de satisfaction</Label>
                      <Input
                        id="satisfaction_level"
                        value={formData.internal_initiatives.satisfaction_level}
                        onChange={(e) => setFormData({
                          ...formData,
                          internal_initiatives: { ...formData.internal_initiatives, satisfaction_level: e.target.value }
                        })}
                        placeholder="Ex: Élevé, moyen, faible"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contacts référents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div>
                          <div className="font-medium">{contact.nom}</div>
                          <div className="text-sm text-muted-foreground">{contact.email}</div>
                          {contact.telephone && (
                            <div className="text-sm text-muted-foreground">{contact.telephone}</div>
                          )}
                          {contact.role_contact && (
                            <div className="text-sm text-muted-foreground">{contact.role_contact}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(contact.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Ajouter un contact</h3>
                    <div className="space-y-3">
                      <Input
                        value={newContact.nom}
                        onChange={(e) => setNewContact({ ...newContact, nom: e.target.value })}
                        placeholder="Nom *"
                      />
                      <Input
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        placeholder="Email *"
                        type="email"
                      />
                      <Input
                        value={newContact.telephone}
                        onChange={(e) => setNewContact({ ...newContact, telephone: e.target.value })}
                        placeholder="Téléphone"
                      />
                      <Input
                        value={newContact.role_contact}
                        onChange={(e) => setNewContact({ ...newContact, role_contact: e.target.value })}
                        placeholder="Rôle"
                      />
                      <Button onClick={addContact} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter le contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/company/${id}`)}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
