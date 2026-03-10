import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, X, Building2 } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { TaxPermanenceConfigEditor } from "./TaxPermanenceConfigEditor";
import type { TaxPermanenceConfig } from "@/types/tax-declaration";

interface CompanyContact {
  id?: string;
  nom: string;
  email: string;
  telephone: string;
  role_contact: string;
  photo_url?: string;
}

export const AdminCompanyEditPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  const [newContact, setNewContact] = useState<Partial<CompanyContact>>({
    nom: '', email: '', telephone: '', role_contact: '', photo_url: ''
  });
  const [newEmailDomain, setNewEmailDomain] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
    rang: null as number | null,
    partnership_type: "",
    email_domains: [] as string[],
    company_size: null as number | null,
    ticker: "",
    company_description: "",
    partnership_details: "",
    info_sections_config: { stock_price: true, general_info: true, partnership: true, hr_devices: true, description: true } as Record<string, boolean>,
    compensation_devices: {
      rsu: { enabled: false, qualified: false },
      espp: false,
      stock_options: false,
      bspce: false,
      pee: false,
      perco: false,
      pero: false,
    } as any,
    hr_challenges: {
      financial_anxiety: false,
    } as any,
    internal_initiatives: {
      financial_education_service: false,
      internal_webinars: false,
      pee_perco_rsu_program: false,
      satisfaction_level: "",
      missing_elements: ""
    } as any,
    internal_communications: {
      channels: [] as string[],
      employee_engagement_level: "",
      communication_capacity: ""
    } as any,
    tax_declaration_help_enabled: false,
    tax_permanence_config: null as TaxPermanenceConfig | null,
    max_tax_declarations: 100,
  });

  useEffect(() => {
    if (companyId) loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const { data: company, error } = await (supabase as any)
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;

      const { data: contacts } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_id', companyId!);

      setCompanyContacts(contacts || []);

      const defaultCompensation = {
        rsu: { enabled: false, qualified: false },
        espp: false, stock_options: false, bspce: false,
        pee: false, perco: false, pero: false,
      };

      setFormData({
        name: company.name,
        logo_url: company.logo_url || "",
        primary_color: company.primary_color || "#3b82f6",
        secondary_color: company.secondary_color || "#8b5cf6",
        rang: company.rang || null,
        partnership_type: company.partnership_type || "",
        email_domains: company.email_domains || [],
        company_size: company.company_size || null,
        ticker: company.ticker || "",
        company_description: company.company_description || "",
        partnership_details: company.partnership_details || "",
        info_sections_config: company.info_sections_config || { stock_price: true, general_info: true, partnership: true, hr_devices: true, description: true },
        compensation_devices: {
          ...defaultCompensation,
          ...(company.compensation_devices || {}),
          rsu: { ...defaultCompensation.rsu, ...(company.compensation_devices?.rsu || {}) }
        },
        hr_challenges: { financial_anxiety: false, ...(company.hr_challenges || {}) },
        internal_initiatives: {
          financial_education_service: false,
          internal_webinars: false,
          pee_perco_rsu_program: false,
          satisfaction_level: "",
          missing_elements: "",
          ...(company.internal_initiatives || {})
        },
        internal_communications: {
          channels: [],
          employee_engagement_level: "",
          communication_capacity: "",
          ...(company.internal_communications || {})
        },
        tax_declaration_help_enabled: company.tax_declaration_help_enabled || false,
        tax_permanence_config: company.tax_permanence_config || null,
        max_tax_declarations: company.max_tax_declarations || 100,
      });
    } catch (error) {
      console.error("Error loading company:", error);
      toast.error("Erreur lors du chargement de l'entreprise");
      navigate("/admin/companies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("companies")
        .update({
          name: formData.name,
          logo_url: formData.logo_url || null,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          rang: formData.rang,
          partnership_type: formData.partnership_type || null,
          email_domains: formData.email_domains.length > 0 ? formData.email_domains : null,
          company_size: formData.company_size,
          ticker: formData.ticker || null,
          company_description: formData.company_description || null,
          partnership_details: formData.partnership_details || null,
          info_sections_config: formData.info_sections_config,
          compensation_devices: formData.compensation_devices,
          hr_challenges: formData.hr_challenges,
          internal_initiatives: formData.internal_initiatives,
          internal_communications: formData.internal_communications,
          tax_declaration_help_enabled: formData.tax_declaration_help_enabled,
          tax_permanence_config: formData.tax_permanence_config,
          max_tax_declarations: formData.max_tax_declarations,
        })
        .eq("id", companyId);

      if (error) throw error;
      toast.success("Entreprise mise à jour avec succès");
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const addEmailDomain = () => {
    if (newEmailDomain.trim()) {
      const domain = newEmailDomain.trim().startsWith('@') ? newEmailDomain.trim() : `@${newEmailDomain.trim()}`;
      setFormData(prev => ({ ...prev, email_domains: [...prev.email_domains, domain] }));
      setNewEmailDomain("");
    }
  };

  const removeEmailDomain = (index: number) => {
    setFormData(prev => ({ ...prev, email_domains: prev.email_domains.filter((_, i) => i !== index) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/companies")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {formData.name || "Nouvelle entreprise"}
            </h1>
            <p className="text-sm text-muted-foreground">Configuration de l'entreprise</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      {/* Identité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identité</CardTitle>
          <CardDescription>Informations principales de l'entreprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_size">Effectif</Label>
              <Input id="company_size" type="number" value={formData.company_size || ""} onChange={(e) => setFormData(prev => ({ ...prev, company_size: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Ex: 250" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entité en charge du partenariat</Label>
              <Select value={formData.partnership_type || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, partnership_type: v }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
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
            </div>
            <div className="space-y-2">
              <Label>Rang</Label>
              <Select value={formData.rang?.toString() || 'none'} onValueChange={(v) => setFormData(prev => ({ ...prev, rang: v === 'none' ? null : parseInt(v) }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Rang" /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="1">Rang 1</SelectItem>
                  <SelectItem value="2">Rang 2</SelectItem>
                  <SelectItem value="3">Rang 3</SelectItem>
                  <SelectItem value="4">Rang 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ImageUpload label="Logo" value={formData.logo_url || ""} onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))} bucketName="landing-images" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Couleur primaire</Label>
              <Input type="color" value={formData.primary_color} onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Couleur secondaire</Label>
              <Input type="color" value={formData.secondary_color} onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Domaines de messagerie autorisés</Label>
            <div className="flex gap-2">
              <Input value={newEmailDomain} onChange={(e) => setNewEmailDomain(e.target.value)} placeholder="@exemple.com" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmailDomain())} />
              <Button type="button" onClick={addEmailDomain} variant="secondary">Ajouter</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.email_domains.map((domain, index) => (
                <div key={index} className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm">
                  <span className="font-mono">{domain}</span>
                  <button type="button" onClick={() => removeEmailDomain(index)} className="ml-1 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Informations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Informations</CardTitle>
          <CardDescription>Configurez ce qui est affiché sur la page entreprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ticker boursier</Label>
              <Input value={formData.ticker} onChange={(e) => setFormData(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))} placeholder="Ex: AAPL, MSFT" className="font-mono" />
              <p className="text-xs text-muted-foreground">Symbole pour afficher le cours de bourse</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Détail du partenariat</Label>
            <Textarea value={formData.partnership_details} onChange={(e) => setFormData(prev => ({ ...prev, partnership_details: e.target.value }))} placeholder="Détails sur le partenariat, conditions, historique..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Description de l'entreprise</Label>
            <Textarea value={formData.company_description} onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))} placeholder="Description visible par les employés..." rows={3} />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Sections visibles</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "stock_price", label: "Cours de bourse" },
                { key: "general_info", label: "Informations générales" },
                { key: "partnership", label: "Détail du partenariat" },
                { key: "hr_devices", label: "Dispositifs de rémunération" },
                { key: "description", label: "Description libre" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={`info-${key}`}
                    checked={formData.info_sections_config[key] !== false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      info_sections_config: { ...prev.info_sections_config, [key]: checked }
                    }))}
                  />
                  <Label htmlFor={`info-${key}`} className="text-sm cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispositifs de rémunération */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dispositifs de rémunération</CardTitle>
          <CardDescription>Plans d'actionnariat et épargne salariale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "rsu", label: "RSU" },
              { key: "espp", label: "ESPP" },
              { key: "stock_options", label: "Stock-Options" },
              { key: "bspce", label: "BSPCE" },
              { key: "aga", label: "AGA" },
              { key: "pee", label: "PEE" },
              { key: "perco", label: "PERCO" },
              { key: "pero", label: "PERO" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox id={key} checked={key === 'rsu' ? formData.compensation_devices.rsu?.enabled : formData.compensation_devices[key]}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    compensation_devices: {
                      ...prev.compensation_devices,
                      [key]: key === 'rsu' ? { enabled: checked === true, qualified: false } : checked === true
                    }
                  }))} />
                <Label htmlFor={key}>{label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Initiatives & Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Initiatives & Communication</CardTitle>
          <CardDescription>Initiatives internes et canaux de communication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "financial_education_service", label: "Service d'éducation financière" },
              { key: "internal_webinars", label: "Webinars internes" },
              { key: "pee_perco_rsu_program", label: "Programme PEE/PERCO/RSU" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox id={key} checked={formData.internal_initiatives[key]}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    internal_initiatives: { ...prev.internal_initiatives, [key]: checked === true }
                  }))} />
                <Label htmlFor={key}>{label}</Label>
              </div>
            ))}
          </div>

          {(formData.internal_initiatives.financial_education_service || formData.internal_initiatives.internal_webinars || formData.internal_initiatives.pee_perco_rsu_program) && (
            <div className="space-y-2">
              <Label>Acteur de l'initiative</Label>
              <Input value={formData.internal_initiatives.initiative_actor || ''} onChange={(e) => setFormData(prev => ({ ...prev, internal_initiatives: { ...prev.internal_initiatives, initiative_actor: e.target.value } }))} placeholder="Ex: DRH, CSE, Prestataire externe..." />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Niveau de satisfaction</Label>
              <Select value={formData.internal_initiatives.satisfaction_level || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, internal_initiatives: { ...prev.internal_initiatives, satisfaction_level: v } }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="très_insatisfait">Très insatisfait</SelectItem>
                  <SelectItem value="insatisfait">Insatisfait</SelectItem>
                  <SelectItem value="neutre">Neutre</SelectItem>
                  <SelectItem value="satisfait">Satisfait</SelectItem>
                  <SelectItem value="très_satisfait">Très satisfait</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau d'engagement</Label>
              <Select value={formData.internal_communications.employee_engagement_level || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, internal_communications: { ...prev.internal_communications, employee_engagement_level: v } }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="très_faible">Très faible</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="élevé">Élevé</SelectItem>
                  <SelectItem value="très_élevé">Très élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ce qui manque aujourd'hui</Label>
            <Textarea value={formData.internal_initiatives.missing_elements} onChange={(e) => setFormData(prev => ({ ...prev, internal_initiatives: { ...prev.internal_initiatives, missing_elements: e.target.value } }))} placeholder="Ex: Formations fiscalité, accompagnement personnalisé..." rows={3} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Canaux de communication</Label>
            <div className="flex flex-wrap gap-3">
              {['Slack', 'Teams', 'Email', 'Intranet', 'Autres'].map((channel) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox id={`ch_${channel}`} checked={formData.internal_communications.channels?.includes(channel)}
                    onCheckedChange={(checked) => {
                      const newChannels = checked
                        ? [...(formData.internal_communications.channels || []), channel]
                        : (formData.internal_communications.channels || []).filter((c: string) => c !== channel);
                      setFormData(prev => ({ ...prev, internal_communications: { ...prev.internal_communications, channels: newChannels } }));
                    }} />
                  <Label htmlFor={`ch_${channel}`}>{channel}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capacité de communication</Label>
            <Input value={formData.internal_communications.communication_capacity} onChange={(e) => setFormData(prev => ({ ...prev, internal_communications: { ...prev.internal_communications, communication_capacity: e.target.value } }))} placeholder="Ex: 2-3 push par mois, newsletter hebdo..." />
          </div>
        </CardContent>
      </Card>

      {/* Contacts référents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contacts référents</CardTitle>
          <CardDescription>Contacts RH / Finance de l'entreprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {companyContacts.length > 0 && (
            <div className="space-y-2">
              {companyContacts.map((contact, index) => (
                <div key={contact.id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {contact.photo_url ? (
                      <img src={contact.photo_url} alt={contact.nom} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {contact.nom.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{contact.nom}</p>
                      <p className="text-xs text-muted-foreground">{contact.email} {contact.role_contact && `• ${contact.role_contact}`}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon"
                    onClick={async () => {
                      if (contact.id) {
                        await supabase.from('company_contacts').delete().eq('id', contact.id);
                        setCompanyContacts(prev => prev.filter(c => c.id !== contact.id));
                        toast.success('Contact supprimé');
                      }
                    }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border rounded-lg space-y-3">
            <Label className="text-sm font-medium">Ajouter un contact</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nom" value={newContact.nom || ''} onChange={(e) => setNewContact(prev => ({ ...prev, nom: e.target.value }))} />
              <Input placeholder="Email" type="email" value={newContact.email || ''} onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))} />
              <Input placeholder="Téléphone" value={newContact.telephone || ''} onChange={(e) => setNewContact(prev => ({ ...prev, telephone: e.target.value }))} />
              <Input placeholder="Rôle (ex: DRH)" value={newContact.role_contact || ''} onChange={(e) => setNewContact(prev => ({ ...prev, role_contact: e.target.value }))} />
            </div>
            <ImageUpload label="Photo" value={newContact.photo_url || ""} onChange={(url) => setNewContact(prev => ({ ...prev, photo_url: url }))} bucketName="landing-images" />
            <Button type="button" variant="secondary"
              onClick={async () => {
                if (companyId && newContact.nom && newContact.email) {
                  const { data, error } = await supabase
                    .from('company_contacts')
                    .insert({
                      company_id: companyId,
                      nom: newContact.nom,
                      email: newContact.email,
                      telephone: newContact.telephone || '',
                      role_contact: newContact.role_contact || '',
                      photo_url: newContact.photo_url || null
                    })
                    .select()
                    .single();
                  if (!error && data) {
                    setCompanyContacts(prev => [...prev, data]);
                    setNewContact({ nom: '', email: '', telephone: '', role_contact: '', photo_url: '' });
                    toast.success('Contact ajouté');
                  } else {
                    toast.error("Erreur lors de l'ajout");
                  }
                } else {
                  toast.error('Nom et email obligatoires');
                }
              }}>
              Ajouter le contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aide fiscale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Aide à la déclaration fiscale</CardTitle>
              <CardDescription>Accompagnement fiscal pour les collaborateurs</CardDescription>
            </div>
            <Switch checked={formData.tax_declaration_help_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tax_declaration_help_enabled: checked }))} />
          </div>
        </CardHeader>
        {formData.tax_declaration_help_enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre maximum d'accompagnements</Label>
              <Input type="number" value={formData.max_tax_declarations} onChange={(e) => setFormData(prev => ({ ...prev, max_tax_declarations: parseInt(e.target.value) || 100 }))} className="w-32" />
            </div>
            <TaxPermanenceConfigEditor config={formData.tax_permanence_config} onChange={(config) => setFormData(prev => ({ ...prev, tax_permanence_config: config }))} />
          </CardContent>
        )}
      </Card>

      {/* Bottom save button */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSubmit} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
};
