import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  Building2, 
  Palette, 
  Mail, 
  Trophy, 
  Save, 
  Plus, 
  X,
  Loader2,
  Users,
  Briefcase,
  UserCircle,
  DollarSign,
  HeartHandshake,
  Info
} from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

const InfoTooltip = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1 inline-block" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface CompanyConfigurationTabProps {
  companyId: string;
}

interface CompanyContact {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role_contact: string | null;
}

interface FormData {
  name: string;
  logo_url: string;
  cover_url: string;
  primary_color: string;
  secondary_color: string;
  email_domains: string[];
  partnership_type: string;
  referral_typeform_url: string;
  expert_booking_url: string;
  expert_booking_hubspot_embed: string;
  enable_points_ranking: boolean;
  company_size: number | null;
  has_foreign_employees: boolean;
  compensation_devices: {
    rsu: boolean;
    espp: boolean;
    stock_options: boolean;
    bspce: boolean;
    aga: boolean;
    pee: boolean;
    perco: boolean;
    pero: boolean;
    autres: { enabled: boolean; description: string };
  };
  internal_communications: {
    channels: string[];
    employee_engagement_level: string;
    communication_capacity: string;
  };
}

export function CompanyConfigurationTab({ companyId }: CompanyConfigurationTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmailDomain, setNewEmailDomain] = useState("");
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [newContact, setNewContact] = useState({ nom: '', email: '', telephone: '', role_contact: '' });
  
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    logo_url: "",
    cover_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
    email_domains: [],
    partnership_type: "",
    referral_typeform_url: "",
    expert_booking_url: "",
    expert_booking_hubspot_embed: "",
    enable_points_ranking: false,
    
    company_size: null,
    has_foreign_employees: false,
    compensation_devices: {
      rsu: false,
      espp: false,
      stock_options: false,
      bspce: false,
      aga: false,
      pee: false,
      perco: false,
      pero: false,
      autres: { enabled: false, description: "" }
    },
    internal_communications: {
      channels: [],
      employee_engagement_level: "",
      communication_capacity: ""
    }
  });

  useEffect(() => {
    fetchCompanyData();
    fetchContacts();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;

      const defaultCompensation = {
        rsu: false,
        espp: false,
        stock_options: false,
        bspce: false,
        pee: false,
        perco: false,
        pero: false,
        autres: { enabled: false, description: "" }
      };
      
      const defaultCommunications = {
        channels: [],
        employee_engagement_level: "",
        communication_capacity: ""
      };

      const companyCompensation = data.compensation_devices as any;
      const companyCommunications = data.internal_communications as any;

      setFormData({
        name: data.name || "",
        logo_url: data.logo_url || "",
        cover_url: data.cover_url || "",
        primary_color: data.primary_color || "#3b82f6",
        secondary_color: data.secondary_color || "#8b5cf6",
        email_domains: data.email_domains || [],
        partnership_type: data.partnership_type || "",
        referral_typeform_url: data.referral_typeform_url || "",
        expert_booking_url: data.expert_booking_url || "",
        expert_booking_hubspot_embed: data.expert_booking_hubspot_embed || "",
        enable_points_ranking: data.enable_points_ranking || false,
        
        company_size: data.company_size || null,
        has_foreign_employees: data.has_foreign_employees || false,
        compensation_devices: {
          ...defaultCompensation,
          ...(companyCompensation || {}),
          autres: {
            ...defaultCompensation.autres,
            ...(companyCompensation?.autres || {})
          }
        },
        internal_communications: {
          ...defaultCommunications,
          ...(companyCommunications || {})
        }
      });
    } catch (error) {
      console.error("Error fetching company:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", companyId);

      if (error) throw error;
      if (data) setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: formData.name,
          logo_url: formData.logo_url || null,
          cover_url: formData.cover_url || null,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          email_domains: formData.email_domains,
          partnership_type: formData.partnership_type || null,
          referral_typeform_url: formData.referral_typeform_url || null,
          expert_booking_url: formData.expert_booking_url || null,
          expert_booking_hubspot_embed: formData.expert_booking_hubspot_embed || null,
          enable_points_ranking: formData.enable_points_ranking,
          company_size: formData.company_size,
          has_foreign_employees: formData.has_foreign_employees,
          compensation_devices: formData.compensation_devices,
          internal_communications: formData.internal_communications
        })
        .eq("id", companyId);

      if (error) throw error;
      toast.success("Configuration enregistrée avec succès");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const addEmailDomain = () => {
    if (newEmailDomain.trim()) {
      setFormData({
        ...formData,
        email_domains: [...formData.email_domains, newEmailDomain.trim()],
      });
      setNewEmailDomain("");
    }
  };

  const removeEmailDomain = (index: number) => {
    setFormData({
      ...formData,
      email_domains: formData.email_domains.filter((_, i) => i !== index),
    });
  };

  const addContact = async () => {
    if (!newContact.nom || !newContact.email) return;

    try {
      const { error } = await supabase
        .from("company_contacts")
        .insert([{ ...newContact, company_id: companyId }]);

      if (error) throw error;

      toast.success("Contact ajouté");
      setNewContact({ nom: '', email: '', telephone: '', role_contact: '' });
      fetchContacts();
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="general" className="flex items-center gap-2 py-3">
            <Building2 className="h-4 w-4" />
            <span className="hidden md:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2 py-3">
            <Briefcase className="h-4 w-4" />
            <span className="hidden md:inline">Détails</span>
          </TabsTrigger>
          <TabsTrigger value="compensation" className="flex items-center gap-2 py-3">
            <DollarSign className="h-4 w-4" />
            <span className="hidden md:inline">Rémunération</span>
          </TabsTrigger>
          <TabsTrigger value="hr" className="flex items-center gap-2 py-3">
            <HeartHandshake className="h-4 w-4" />
            <span className="hidden md:inline">RH</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2 py-3">
            <UserCircle className="h-4 w-4" />
            <span className="hidden md:inline">Contacts</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Configurez les informations de base de votre entreprise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center">
                    Nom de l'entreprise
                    <InfoTooltip content="Nom d'usage de l'entreprise tel qu'il sera affiché pour vos collaborateurs." />
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnership_type" className="flex items-center">
                    Entité en charge du partenariat
                    <InfoTooltip content="L'entité de votre entreprise qui gère le partenariat avec MyFinCare." />
                  </Label>
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

                <div className="space-y-2">
                  <Label className="flex items-center">
                    Domaines email autorisés
                    <InfoTooltip content="Indiquez les extensions email professionnelles de vos collaborateurs (ex: @entreprise.com). N'oubliez pas les sous-domaines (@filiale.entreprise.com) afin que tous les utilisateurs soient correctement rattachés à votre entreprise." />
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newEmailDomain}
                      onChange={(e) => setNewEmailDomain(e.target.value)}
                      placeholder="@exemple.com"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEmailDomain())}
                    />
                    <Button type="button" onClick={addEmailDomain} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.email_domains.map((domain, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="font-mono">{domain}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeEmailDomain(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-secondary" />
                  Apparence
                </CardTitle>
                <CardDescription>
                  Personnalisez l'identité visuelle de votre espace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  label="Logo de l'entreprise"
                  hint="Format recommandé : image carrée (ex: 200x200px). Taille max : 5MB."
                  value={formData.logo_url}
                  onChange={(url) => setFormData({ ...formData, logo_url: url })}
                  bucketName="landing-images"
                />

                <ImageUpload
                  label="Image de couverture"
                  hint="Format recommandé : 1920 × 256 px (ratio 7.5:1). Taille max : 10MB."
                  value={formData.cover_url}
                  onChange={(url) => setFormData({ ...formData, cover_url: url })}
                  bucketName="company-covers"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Couleur principale
                      <InfoTooltip content="Couleur utilisée pour les éléments principaux de votre espace personnalisé (boutons, accents). Non utilisée actuellement." />
                    </Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer shadow-sm flex-shrink-0"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        <input
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        placeholder="#3b82f6"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Couleur secondaire
                      <InfoTooltip content="Couleur utilisée pour les éléments secondaires. Non utilisée actuellement." />
                    </Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer shadow-sm flex-shrink-0"
                        style={{ backgroundColor: formData.secondary_color }}
                      >
                        <input
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        placeholder="#8b5cf6"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Gamification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-1">
                  <Label className="font-medium">Points et classement</Label>
                  <p className="text-sm text-muted-foreground">
                    Les employés accumulent des points et sont classés entre eux
                  </p>
                </div>
                <Switch
                  checked={formData.enable_points_ranking}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enable_points_ranking: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Détails de l'entreprise
              </CardTitle>
              <CardDescription>
                Informations sur la structure et les effectifs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company_size" className="flex items-center">
                  Effectif
                  <InfoTooltip content="Effectif total ou nombre de salariés encadrés par le CSE." />
                </Label>
                <Input
                  id="company_size"
                  type="number"
                  value={formData.company_size || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    company_size: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Ex: 250"
                  className="max-w-xs"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/30">
                <Checkbox
                  id="has_foreign_employees"
                  checked={formData.has_foreign_employees}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    has_foreign_employees: checked === true 
                  })}
                />
                <div className="space-y-1">
                  <Label htmlFor="has_foreign_employees" className="font-medium flex items-center">
                    Présence de salariés étrangers
                    <InfoTooltip content="Information utile pour identifier les salariés éligibles au régime fiscal des impatriés, qui bénéficient de parcours dédiés." />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Cochez si vous avez des employés venant de l'étranger
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compensation Tab */}
        <TabsContent value="compensation" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Dispositifs de rémunération
              </CardTitle>
              <CardDescription className="flex items-center">
                Cochez les dispositifs actifs dans votre entreprise
                <InfoTooltip content="Ces informations permettent d'affecter des parcours de formation spécifiques à vos salariés." />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { key: 'rsu', label: 'RSU (Actions gratuites)' },
                  { key: 'espp', label: 'ESPP (Plan d\'achat d\'actions)' },
                  { key: 'stock_options', label: 'Stock Options' },
                  { key: 'bspce', label: 'BSPCE' },
                  { key: 'aga', label: 'AGA (Attribution Gratuite d\'Actions)' },
                  { key: 'pee', label: 'PEE (Plan Épargne Entreprise)' },
                  { key: 'perco', label: 'PERCO' },
                  { key: 'pero', label: 'PERO' },
                ].map((device) => (
                  <div key={device.key} className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={device.key}
                      checked={(formData.compensation_devices as any)[device.key]}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        compensation_devices: { 
                          ...formData.compensation_devices, 
                          [device.key]: checked === true 
                        }
                      })}
                    />
                    <Label htmlFor={device.key} className="cursor-pointer flex-1">
                      {device.label}
                    </Label>
                  </div>
                ))}
                
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center space-x-3">
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
                    <Label htmlFor="autres" className="cursor-pointer">Autres</Label>
                  </div>
                  {formData.compensation_devices.autres.enabled && (
                    <Input
                      className="mt-2"
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
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HR Tab */}
        <TabsContent value="hr" className="space-y-4 mt-6">
          <p className="text-muted-foreground text-sm">Aucun champ RH à configurer pour le moment.</p>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Contacts référents
              </CardTitle>
              <CardDescription className="flex items-center">
                Gérez les contacts de votre entreprise
                <InfoTooltip content="Contacts de l'entreprise qui auront accès au dashboard entreprise pour suivre les statistiques et gérer les collaborateurs." />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {contacts.length > 0 && (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{contact.nom}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                        {contact.telephone && (
                          <div className="text-sm text-muted-foreground">{contact.telephone}</div>
                        )}
                        {contact.role_contact && (
                          <div className="text-xs px-2 py-1 bg-muted rounded-full inline-block">
                            {contact.role_contact}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeContact(contact.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un contact
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
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
                </div>
                <Button onClick={addContact} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}