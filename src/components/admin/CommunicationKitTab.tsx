import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Copy, Mail, MessageSquare, FileText, Wand2, Calendar } from "lucide-react";

interface Module {
  id: number;
  title: string;
  description: string;
  type: string;
}

interface WebinarSession {
  id: string;
  session_date: string;
  registration_url: string | null;
  livestorm_session_id: string | null;
  module_id: number;
}

interface Company {
  id: string;
  name: string;
  partnership_type: string | null;
  rang: number | null;
}

interface CompanyContact {
  id: string;
  nom: string;
  role_contact: string | null;
  created_at: string;
}

const communicationTypes = [
  { value: "email", label: "Email", icon: Mail },
  { value: "intranet", label: "Article Intranet", icon: FileText },
  { value: "slack", label: "Message Slack", icon: MessageSquare },
  { value: "teams", label: "Message Teams", icon: MessageSquare },
];

const deadlines = [
  { value: "j-30", label: "J-30 (1 mois avant)" },
  { value: "j-14", label: "J-14 (2 semaines avant)" },
  { value: "j-7", label: "J-7 (1 semaine avant)" },
  { value: "j-3", label: "J-3 (3 jours avant)" },
  { value: "j-1", label: "J-1 (veille)" },
  { value: "jour-j", label: "Jour J (jour même)" },
  { value: "today", label: "Date du jour (calcul automatique)" },
];

interface CommunicationKitTabProps {
  preselectedModuleId?: number;
  preselectedCompanyId?: string;
  preselectedSessionId?: string;
  companyId?: string; // Used when accessed from company dashboard
}

export const CommunicationKitTab = ({ preselectedModuleId, preselectedCompanyId, preselectedSessionId, companyId }: CommunicationKitTabProps = {}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [sessions, setSessions] = useState<WebinarSession[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [communicationType, setCommunicationType] = useState<string>("email");
  const [selectedDeadlines, setSelectedDeadlines] = useState<string[]>(["j-7", "j-3", "j-1"]);
  const [customFields, setCustomFields] = useState({
    companyName: "",
    partnershipType: "",
    contactName: "",
  });
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [bookingUrls, setBookingUrls] = useState<Record<number, string>>({});

  // Determine if we're in company dashboard mode (companyId is provided)
  const isCompanyDashboardMode = !!companyId;
  const effectiveCompanyId = companyId || selectedCompany;

  useEffect(() => {
    fetchData();
    fetchBookingUrls();
  }, [companyId]);

  // Set company from prop if in company dashboard mode
  useEffect(() => {
    if (companyId) {
      setSelectedCompany(companyId);
    }
  }, [companyId]);

  useEffect(() => {
    if (preselectedModuleId && modules.length > 0) {
      setSelectedModule(preselectedModuleId.toString());
    }
  }, [preselectedModuleId, modules]);

  useEffect(() => {
    if (preselectedCompanyId && companies.length > 0 && !isCompanyDashboardMode) {
      setSelectedCompany(preselectedCompanyId);
    }
  }, [preselectedCompanyId, companies, isCompanyDashboardMode]);

  // Fetch sessions when selected module changes
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedModule) {
        setSessions([]);
        setSelectedSession("");
        return;
      }
      const { data, error } = await supabase
        .from("webinar_sessions")
        .select("id, session_date, registration_url, livestorm_session_id, module_id")
        .eq("module_id", parseInt(selectedModule))
        .order("session_date", { ascending: true });
      if (!error && data) {
        setSessions(data);
        // Pre-select session from prop, or first session
        if (preselectedSessionId && data.some(s => s.id === preselectedSessionId)) {
          setSelectedSession(preselectedSessionId);
        } else if (data.length > 0) {
          setSelectedSession(data[0].id);
        } else {
          setSelectedSession("");
        }
      }
    };
    fetchSessions();
  }, [selectedModule]);

  const getSelectedSession = (): WebinarSession | undefined => {
    return sessions.find(s => s.id === selectedSession);
  };

  const fetchBookingUrls = async () => {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'default_expert_booking_url',
          'expert_booking_url_rang_1',
          'expert_booking_url_rang_2',
          'expert_booking_url_rang_3',
          'expert_booking_url_rang_4'
        ]);

      if (settings) {
        const urls: Record<number, string> = {};
        settings.forEach(s => {
          try {
            const value = JSON.parse(s.value);
            if (s.key === 'default_expert_booking_url') {
              urls[0] = value;
            } else if (s.key.startsWith('expert_booking_url_rang_')) {
              const rang = parseInt(s.key.replace('expert_booking_url_rang_', ''));
              urls[rang] = value;
            }
          } catch {
            if (s.key === 'default_expert_booking_url') {
              urls[0] = s.value;
            } else if (s.key.startsWith('expert_booking_url_rang_')) {
              const rang = parseInt(s.key.replace('expert_booking_url_rang_', ''));
              urls[rang] = s.value;
            }
          }
        });
        setBookingUrls(urls);
      }
    } catch (error) {
      console.error("Error fetching booking URLs:", error);
    }
  };

  const getBookingUrlForCompany = (company: Company | undefined): string => {
    if (!company) return bookingUrls[0] || "";
    
    const rang = company.rang;
    if (rang && bookingUrls[rang]) {
      return bookingUrls[rang];
    }
    return bookingUrls[0] || "";
  };

  const fetchData = async () => {
    try {
      // Fetch companies with rang
      const companiesRes = await supabase.from("companies").select("id, name, partnership_type, rang").order("name");
      if (companiesRes.error) throw companiesRes.error;
      setCompanies(companiesRes.data || []);

      // If in company dashboard mode, filter webinars by company
      if (isCompanyDashboardMode && companyId) {
        // Collect all module IDs from both sources
        let allModuleIds: number[] = [];

        // 1. Get webinars from parcours
        const { data: parcoursCompanies } = await supabase
          .from("parcours_companies")
          .select("parcours_id")
          .eq("company_id", companyId);

        if (parcoursCompanies && parcoursCompanies.length > 0) {
          const parcoursIds = parcoursCompanies.map(pc => pc.parcours_id);

          const { data: parcoursModules } = await supabase
            .from("parcours_modules")
            .select("module_id")
            .in("parcours_id", parcoursIds);

          if (parcoursModules) {
            allModuleIds.push(...parcoursModules.map(pm => pm.module_id));
          }
        }

        // 2. Get webinars directly assigned to company
        const { data: directWebinars } = await supabase
          .from("company_webinars")
          .select("module_id")
          .eq("company_id", companyId);

        if (directWebinars) {
          allModuleIds.push(...directWebinars.map(dw => dw.module_id));
        }

        // Remove duplicates
        allModuleIds = [...new Set(allModuleIds)];

        if (allModuleIds.length === 0) {
          setModules([]);
          return;
        }

        // Get webinars that are in these modules
        const { data: webinars, error } = await supabase
          .from("modules")
          .select("*")
          .eq("type", "webinar")
          .in("id", allModuleIds)
          .order("title");

        if (error) throw error;
        setModules(webinars || []);
      } else {
        // Admin mode: fetch all webinars
        const modulesRes = await supabase
          .from("modules")
          .select("*")
          .eq("type", "webinar")
          .order("title");

        if (modulesRes.error) throw modulesRes.error;
        setModules(modulesRes.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  // Fetch company contacts when company changes
  useEffect(() => {
    const fetchContacts = async () => {
      if (!effectiveCompanyId) return;

      const { data: contacts, error } = await supabase
        .from("company_contacts")
        .select("id, nom, role_contact, created_at")
        .eq("company_id", effectiveCompanyId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching contacts:", error);
        return;
      }

      setCompanyContacts(contacts || []);
      
      // Default to first contact
      if (contacts && contacts.length > 0) {
        setSelectedContact(contacts[0].id);
      }
    };

    fetchContacts();
  }, [effectiveCompanyId]);

  // Update custom fields when company or contact changes
  useEffect(() => {
    if (effectiveCompanyId) {
      const company = companies.find((c) => c.id === effectiveCompanyId);
      if (company) {
        setCustomFields((prev) => ({
          ...prev,
          companyName: company.name,
          partnershipType: company.partnership_type || "",
        }));
      }
    }
  }, [effectiveCompanyId, companies]);

  // Update contact name when selected contact changes
  useEffect(() => {
    if (selectedContact) {
      const contact = companyContacts.find((c) => c.id === selectedContact);
      if (contact) {
        const fullName = `${contact.nom}${contact.role_contact ? `, ${contact.role_contact}` : ''}`;
        setCustomFields((prev) => ({
          ...prev,
          contactName: fullName,
        }));
      }
    }
  }, [selectedContact, companyContacts]);

  const handleDeadlineToggle = (deadline: string) => {
    setSelectedDeadlines((prev) =>
      prev.includes(deadline)
        ? prev.filter((d) => d !== deadline)
        : [...prev, deadline]
    );
  };

  const getPartnershipArticle = (partnershipType: string): string => {
    const lowerType = partnershipType.toLowerCase();
    if (lowerType === "cse") return "Le";
    if (lowerType.startsWith("direction")) return "La";
    if (lowerType.startsWith("département")) return "Le";
    return "Le/La";
  };

  const generateSignature = (): string => {
    const partnershipType = customFields.partnershipType;
    const companyName = customFields.companyName;
    
    if (partnershipType && companyName) {
      const article = getPartnershipArticle(partnershipType);
      return `${article} ${partnershipType} de ${companyName}`;
    }
    return `L'équipe ${companyName || "FinCare"}`;
  };

  // Calculate days until webinar from today
  const calculateDaysUntilWebinar = (webinarDate: string | null): { days: number; label: string } => {
    if (!webinarDate) return { days: 0, label: "Date inconnue" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const webinar = new Date(webinarDate);
    webinar.setHours(0, 0, 0, 0);
    
    const diffTime = webinar.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { days: 0, label: "Jour J" };
    if (diffDays > 0) return { days: diffDays, label: `J-${diffDays}` };
    return { days: diffDays, label: `J+${Math.abs(diffDays)} (passé)` };
  };

  const generateContent = async () => {
    if (!selectedModule || !effectiveCompanyId || selectedDeadlines.length === 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const module = modules.find((m) => m.id.toString() === selectedModule);
    if (!module) return;

    const company = companies.find((c) => c.id === effectiveCompanyId);
    const bookingUrl = getBookingUrlForCompany(company);
    const session = getSelectedSession();
    const sessionDate = session?.session_date || null;
    const sessionUrl = session?.registration_url || "";

    const formattedDate = sessionDate
      ? new Date(sessionDate).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Date à confirmer";

    // Calculate days until webinar for "today" option
    const daysInfo = calculateDaysUntilWebinar(sessionDate);
    const todayFormatted = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const variables = {
      moduleTitle: module.title,
      moduleDescription: module.description,
      webinarDate: formattedDate,
      webinar_registration_url: sessionUrl,
      companyName: customFields.companyName,
      partnershipType: customFields.partnershipType,
      contactName: customFields.contactName,
      bookingUrl: bookingUrl,
      signature: generateSignature(),
      todayDate: todayFormatted,
      daysUntilWebinar: daysInfo.label,
      daysCount: daysInfo.days.toString(),
      additionalInfo: "",
    };

    const newContent: Record<string, string> = {};
    
    // Check for custom templates in database first
    const { data: customTemplates } = await supabase
      .from("communication_templates")
      .select("*")
      .eq("communication_type", communicationType)
      .in("deadline", selectedDeadlines)
      .eq("is_active", true);

    // Import du template generator
    const { getTemplate, processTemplate } = await import("@/lib/communicationTemplates");
    
    selectedDeadlines.forEach((deadline) => {
      // Check if there's a custom template for this deadline
      const customTemplate = customTemplates?.find(t => t.deadline === deadline);
      
      if (customTemplate) {
        newContent[deadline] = processTemplate(customTemplate.template_content, variables);
      } else {
        newContent[deadline] = getTemplate(communicationType, deadline, variables);
      }
    });

    setGeneratedContent(newContent);
    toast.success("Contenus générés avec succès !");
  };

  const copyToClipboard = (htmlContent: string) => {
    try {
      // Créer un élément temporaire avec le contenu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      // Sélectionner le contenu
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Copier avec formatage
      document.execCommand('copy');
      
      // Nettoyer
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);

      toast.success("Contenu copié avec les liens !");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Erreur lors de la copie");
    }
  };

  const getDeadlineLabel = (deadline: string) => {
    if (deadline === "today") {
      const session = getSelectedSession();
      if (session?.session_date) {
        const daysInfo = calculateDaysUntilWebinar(session.session_date);
        return `Date du jour (${daysInfo.label})`;
      }
    }
    return deadlines.find((d) => d.value === deadline)?.label || deadline;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Générateur de Kit de Communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection du webinar */}
          <div className="space-y-2">
            <Label htmlFor="module">Webinar *</Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger id="module">
                <SelectValue placeholder="Sélectionner un webinar" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id.toString()}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection de la session */}
          {selectedModule && sessions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="session">Session (date) *</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger id="session">
                  <SelectValue placeholder="Sélectionner une session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {new Date(session.session_date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {session.livestorm_session_id ? " ✅" : " ⚠️"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sessions.length > 0 && !selectedSession && (
                <p className="text-xs text-destructive">Veuillez sélectionner une session</p>
              )}
            </div>
          )}
          {selectedModule && sessions.length === 0 && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              ⚠️ Aucune session configurée pour ce webinar. Ajoutez des sessions dans l'éditeur de module.
            </div>
          )}

          {/* Sélection de l'entreprise - masqué quand pré-rempli (contact entreprise ou catalogue) */}
          {!companyId && !preselectedCompanyId && (
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise *</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type de communication */}
          <div className="space-y-2">
            <Label>Type de communication *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {communicationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      communicationType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => setCommunicationType(type.value)}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Échéances */}
          <div className="space-y-2">
            <Label>Échéances de communication *</Label>
            <div className="space-y-2">
              {deadlines.map((deadline) => (
                <div key={deadline.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={deadline.value}
                    checked={selectedDeadlines.includes(deadline.value)}
                    onCheckedChange={() => handleDeadlineToggle(deadline.value)}
                  />
                  <Label htmlFor={deadline.value} className="cursor-pointer">
                    {deadline.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Info sur la date du jour si sélectionnée */}
          {selectedDeadlines.includes("today") && selectedSession && (
            <div className="bg-muted p-3 rounded-md flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {(() => {
                  const session = getSelectedSession();
                  if (session?.session_date) {
                    const daysInfo = calculateDaysUntilWebinar(session.session_date);
                    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
                    return `Aujourd'hui (${today}) = ${daysInfo.label} avant le webinar`;
                  }
                  return "Sélectionnez une session pour voir l'échéance calculée";
                })()}
              </span>
            </div>
          )}

          {/* Champs personnalisables */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Personnalisation (optionnel)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise (pré-rempli)</Label>
              <Input
                id="companyName"
                value={customFields.companyName}
                onChange={(e) =>
                  setCustomFields((prev) => ({ ...prev, companyName: e.target.value }))
                }
                placeholder="Ex: FinCare"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnershipType">Type de partenariat</Label>
              <Input
                id="partnershipType"
                value={customFields.partnershipType}
                onChange={(e) =>
                  setCustomFields((prev) => ({ ...prev, partnershipType: e.target.value }))
                }
                placeholder="Ex: Partenaire premium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Nom du contact</Label>
              {isCompanyDashboardMode && companyContacts.length > 0 ? (
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger id="contactName">
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyContacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.nom}
                        {contact.role_contact && ` - ${contact.role_contact}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="contactName"
                  value={customFields.contactName}
                  onChange={(e) =>
                    setCustomFields((prev) => ({ ...prev, contactName: e.target.value }))
                  }
                  placeholder="Ex: Marie Dupont, RH"
                />
              )}
            </div>

            {/* Preview signature */}
            <div className="space-y-2">
              <Label>Aperçu de la signature</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {generateSignature()}
              </div>
            </div>
          </div>

          {/* Bouton de génération */}
          <Button
            onClick={generateContent}
            disabled={!selectedModule || !selectedSession || !effectiveCompanyId || selectedDeadlines.length === 0}
            className="w-full"
            size="lg"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Générer les communications
          </Button>
        </CardContent>
      </Card>

      {/* Résultats générés */}
      {Object.keys(generatedContent).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Contenus générés</h2>
          {selectedDeadlines.map((deadline) => {
            const content = generatedContent[deadline];
            if (!content) return null;

            return (
              <Card key={deadline}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">{getDeadlineLabel(deadline)}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(content)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copier
                  </Button>
                </CardHeader>
                <CardContent>
                  <div 
                    className="bg-muted p-4 rounded-md prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
