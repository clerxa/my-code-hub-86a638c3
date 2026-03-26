import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Users, BookOpen, ExternalLink, Calendar, FileText, Video, Settings, Building2, Shield, Zap, Crown, Camera, Upload, Crop, Edit2, Save, X, Mail, Handshake, UserPlus, Pin } from "lucide-react";
import { CommunicationKitTab } from "@/components/admin/CommunicationKitTab";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CoverImageCropper } from "@/components/CoverImageCropper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

import { DraggableSection } from "@/components/DraggableSection";
import { HubSpotMeetingWidget } from "@/components/HubSpotMeetingWidget";
import { PartnershipRequestDialog } from "@/components/PartnershipRequestDialog";
import { useBlockLayoutConfig } from "@/hooks/useBlockLayoutConfig";
import { UpcomingWebinars } from "@/components/UpcomingWebinars";
import { useAuth } from "@/components/AuthProvider";
import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";

import { setBookingReferrer } from "@/hooks/useBookingReferrer";

import { InviteColleagueBlock } from "@/components/company/InviteColleagueBlock";
import { CompanyInfoSection } from "@/components/company/CompanyInfoSection";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { MobileCompanyNav } from "@/components/company/MobileCompanyNav";

import { CompanyLeaderboard } from "@/components/company/CompanyLeaderboard";
import { CompanyFAQSection } from "@/components/company/CompanyFAQSection";
import { CompanyExpertAdviceSection } from "@/components/company/CompanyExpertAdviceSection";
import { CompanyBanner } from "@/components/company/CompanyBanner";
import type { Company as CompanyType } from "@/types/database";
import { ParcoursFilter, filterParcours } from "@/components/parcours/ParcoursFilter";
interface Parcours {
  id: string;
  title: string;
  description: string | null;
  modules?: any[];
  moduleIds?: number[];
  is_pinned?: boolean;
}
interface CompanyWithPartnership extends CompanyType {
  cover_url?: string;
}
const Company = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get("section") || "informations");
  const [upcomingWebinarsCount, setUpcomingWebinarsCount] = useState(0);
  const [pastWebinars, setPastWebinars] = useState<any[]>([]);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [company, setCompany] = useState<CompanyWithPartnership | null>(null);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [companyContacts, setCompanyContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompanyContact, setIsCompanyContact] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToUpload, setImageToUpload] = useState<string | null>(null);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [partnershipDialogOpen, setPartnershipDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [parcoursFilter, setParcoursFilter] = useState<import("@/components/parcours/ParcoursFilter").ParcoursFilterValue>("all");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { blocks, layoutConfig, loading: configLoading, updateBlockOrder } = useBlockLayoutConfig("company");
  const { embedCode: expertBookingEmbed, fallbackUrl: expertBookingFallback, isLoading: bookingLoading } = useExpertBookingUrl(id || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsAdmin(data?.role === "admin");
      setAdminChecked(true);
    };
    checkAdmin();
  }, [user]);

  const getPlanIcon = (niveau: string) => {
    switch (niveau) {
      case 'basic':
        return <Shield className="h-5 w-5 mr-2 inline-block" />;
      case 'premium':
        return <Crown className="h-5 w-5 mr-2 inline-block" />;
      default:
        return <Shield className="h-5 w-5 mr-2 inline-block" />;
    }
  };
  



  useEffect(() => {
    if (id) {
      fetchCompanyData();
      checkUserRole();
      fetchUserProfile();
      fetchUpcomingWebinarsCount();
      fetchPastWebinars();
    }
  }, [id]);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  const fetchUpcomingWebinarsCount = async () => {
    try {
      // Collect all module IDs from both sources
      let allModuleIds: number[] = [];

      // 1. Get webinars from parcours
      const { data: parcoursCompanies } = await supabase
        .from("parcours_companies")
        .select("parcours_id")
        .eq("company_id", id);

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
        .eq("company_id", id);

      if (directWebinars) {
        allModuleIds.push(...directWebinars.map(dw => dw.module_id));
      }

      // Remove duplicates
      allModuleIds = [...new Set(allModuleIds)];

      if (allModuleIds.length === 0) {
        setUpcomingWebinarsCount(0);
        return;
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true })
        .eq("type", "webinar")
        .in("id", allModuleIds)
        .not("webinar_date", "is", null)
        .gte("webinar_date", oneHourAgo);
      
      setUpcomingWebinarsCount(count || 0);
    } catch (error) {
      console.error("Error fetching webinars count:", error);
    }
  };

  const fetchPastWebinars = async () => {
    if (!id) return;
    try {
      // Collect all module IDs from both sources
      let allModuleIds: number[] = [];

      // 1. Get webinars from parcours
      const { data: parcoursCompanies } = await supabase
        .from("parcours_companies")
        .select("parcours_id")
        .eq("company_id", id);

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
        .eq("company_id", id);

      if (directWebinars) {
        allModuleIds.push(...directWebinars.map(dw => dw.module_id));
      }

      // Remove duplicates
      allModuleIds = [...new Set(allModuleIds)];

      if (allModuleIds.length === 0) {
        setPastWebinars([]);
        return;
      }

      // Date limite : webinars passés depuis plus d'1 heure
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Récupérer les webinaires passés
      const { data, error } = await supabase
        .from("modules")
        .select("id, title, description, webinar_date, webinar_registration_url, duration")
        .eq("type", "webinar")
        .in("id", allModuleIds)
        .not("webinar_date", "is", null)
        .lt("webinar_date", oneHourAgo)
        .order("webinar_date", { ascending: false });

      if (error) throw error;
      setPastWebinars(data || []);
    } catch (error) {
      console.error("Error fetching past webinars:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, completed_modules")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
      setCompletedModules(data.completed_modules || []);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const checkUserRole = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (!error && data) {
        const userRole = data.role;
        setIsCompanyContact(userRole === "contact_entreprise" || userRole === "admin");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };


  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 10MB for cover images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 10MB");
      return;
    }

    // Create preview URL and open cropper
    const imageUrl = URL.createObjectURL(file);
    setImageToUpload(imageUrl);
    setOptionsDialogOpen(false);
    setCropperOpen(true);
    
    // Reset input
    event.target.value = "";
  };


  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!id) return;
    
    setUploadingCover(true);
    try {
      // Delete old cover if exists
      if (company?.cover_url) {
        const oldPath = company.cover_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from("company-covers")
            .remove([`${id}/${oldPath}`]);
        }
      }

      // Upload new cover
      const fileName = `cover-${Date.now()}.jpg`;
      const filePath = `${id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("company-covers")
        .upload(filePath, croppedBlob, {
          contentType: "image/jpeg",
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("company-covers")
        .getPublicUrl(filePath);

      // Update company with new cover URL
      const { error: updateError } = await supabase
        .from("companies")
        .update({ cover_url: publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      toast.success("Cover mis à jour avec succès");
      setCropperOpen(false);
      fetchCompanyData();
    } catch (error: any) {
      console.error("Error uploading cover:", error);
      toast.error("Erreur lors de l'upload du cover");
    } finally {
      setUploadingCover(false);
      if (imageToUpload) {
        URL.revokeObjectURL(imageToUpload);
        setImageToUpload(null);
      }
    }
  };

  const handleCropperClose = () => {
    setCropperOpen(false);
    if (imageToUpload) {
      URL.revokeObjectURL(imageToUpload);
      setImageToUpload(null);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const {
        data: companyData,
        error: companyError
      } = await supabase.from("companies").select("*").eq("id", id).single();
      if (companyError) throw companyError;
      setCompany(companyData as unknown as CompanyWithPartnership);

      // Récupérer les contacts de l'entreprise
      const {
        data: contacts,
        error: contactsError
      } = await supabase.from("company_contacts").select("nom").eq("company_id", id);
      if (!contactsError && contacts) {
        setCompanyContacts(contacts.map(c => c.nom));
      }
      const {
        data: companyParcoursIds,
        error: companyParcoursError
      } = await (supabase as any).from("parcours_companies").select("parcours_id, is_pinned").eq("company_id", id);
      if (companyParcoursError) throw companyParcoursError;
      const linkedParcoursIds = companyParcoursIds?.map((pc: any) => pc.parcours_id) || [];
      const pinnedMap = new Map(companyParcoursIds?.map((pc: any) => [pc.parcours_id, pc.is_pinned]) || []);
      const {
        data: allLinkedIds,
        error: allLinkedError
      } = await (supabase as any).from("parcours_companies").select("parcours_id");
      if (allLinkedError) throw allLinkedError;
      const parcoursWithCompanies = allLinkedIds?.map((pc: any) => pc.parcours_id) || [];
      let allParcoursData: Parcours[] = [];
      if (linkedParcoursIds.length > 0) {
        const {
          data: linkedParcours,
          error: linkedError
        } = await (supabase as any).from("parcours").select(`id, title, description, modules:parcours_modules(count)`).in("id", linkedParcoursIds);
        if (linkedError) throw linkedError;
        
        // Récupérer les module_ids séparément
        const {
          data: linkedModules,
          error: linkedModulesError
        } = await (supabase as any).from("parcours_modules").select("parcours_id, module_id").in("parcours_id", linkedParcoursIds);
        
        allParcoursData = [...(linkedParcours || [])].map(p => ({
          ...p,
          moduleIds: linkedModules?.filter((m: any) => m.parcours_id === p.id).map((m: any) => m.module_id) || [],
          is_pinned: pinnedMap.get(p.id) || false
        }));
      }
      const {
        data: genericParcours,
        error: genericError
      } = await (supabase as any).from("parcours").select(`id, title, description, modules:parcours_modules(count)`);
      if (genericError) throw genericError;
      
      // Récupérer les module_ids pour les parcours génériques
      const genericParcoursIds = (genericParcours || []).filter((p: any) => !parcoursWithCompanies.includes(p.id)).map((p: any) => p.id);
      let genericModules: any[] = [];
      if (genericParcoursIds.length > 0) {
        const {
          data: modules,
          error: modulesError
        } = await (supabase as any).from("parcours_modules").select("parcours_id, module_id").in("parcours_id", genericParcoursIds);
        genericModules = modules || [];
      }
      
      // Ne pas inclure les parcours génériques dans la page entreprise
      // On affiche uniquement les parcours spécifiques à cette entreprise
      // allParcoursData reste inchangé (contient uniquement les linkedParcours)
      // Trier: épinglés en premier
      allParcoursData.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
      setParcours(allParcoursData);
    } catch (error: any) {
      console.error("Error fetching company data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      </div>;
  }
  if (!company) {
    return <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Entreprise non trouvée</p>
        </div>
      </div>;
  }
  const getParcoursStatus = (parcours: Parcours) => {
    const moduleIds = parcours.moduleIds || [];
    if (moduleIds.length === 0) return { label: "Non commencé", variant: "secondary" as const };
    
    const completedInParcours = moduleIds.filter(id => completedModules.includes(id)).length;
    
    if (completedInParcours === 0) {
      return { label: "Non commencé", variant: "secondary" as const };
    } else if (completedInParcours === moduleIds.length) {
      return { label: "Terminé", variant: "default" as const };
    } else {
      return { label: "En cours", variant: "outline" as const };
    }
  };

  const renderBlock = (blockId: string) => {
    const blockConfig = layoutConfig[blockId];
    if (blockConfig && blockConfig.visible === false) return null;

    switch (blockId) {
      case "parcours":
        const filteredParcours = filterParcours(parcours, parcoursFilter, completedModules);
        const primaryColor = company.primary_color || 'hsl(var(--primary))';
        const secondaryColor = company.secondary_color || 'hsl(var(--secondary))';
        
        return <DraggableSection key="parcours" id="parcours" isAdmin={adminChecked && isAdmin}>
            <Card className="overflow-hidden" style={{ borderTopColor: primaryColor, borderTopWidth: '3px' }}>
              <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 5%, transparent)` }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)` }}>
                      <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    {blockConfig?.title || "Les parcours proposés par mon entreprise"}
                  </CardTitle>
                  <ParcoursFilter value={parcoursFilter} onChange={setParcoursFilter} />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {parcours.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      Aucun parcours personnalisé n'est encore disponible pour votre entreprise.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Les parcours génériques restent accessibles depuis votre espace formations.
                    </p>
                  </div>
                ) : filteredParcours.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun parcours ne correspond au filtre sélectionné
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredParcours.map(p => {
                      const status = getParcoursStatus(p);
                      const getStatusStyle = () => {
                        if (status.label === "Terminé") {
                          return { backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)`, color: primaryColor, borderColor: `color-mix(in srgb, ${primaryColor} 30%, transparent)` };
                        }
                        if (status.label === "En cours") {
                          return { backgroundColor: `color-mix(in srgb, ${secondaryColor} 15%, transparent)`, color: secondaryColor, borderColor: `color-mix(in srgb, ${secondaryColor} 30%, transparent)` };
                        }
                        return {};
                      };
                      
                      return <Card 
                        key={p.id} 
                        className={`hover:shadow-lg transition-all cursor-pointer bg-background group ${p.is_pinned ? 'ring-2' : 'border-border'}`} 
                        style={{ 
                          ...(p.is_pinned ? { ringColor: `color-mix(in srgb, ${primaryColor} 50%, transparent)`, borderColor: primaryColor } : {}),
                          borderLeftWidth: '3px',
                          borderLeftColor: p.is_pinned ? primaryColor : 'transparent'
                        }}
                        onClick={() => navigate(`/parcours/${p.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg flex-1 flex items-center gap-2">
                              {p.is_pinned && <Pin className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />}
                              {p.title}
                            </CardTitle>
                            <Badge 
                              variant={status.variant} 
                              className="border"
                              style={getStatusStyle()}
                            >
                              {status.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                            __html: p.description || "Aucune description"
                          }} />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {p.modules?.[0]?.count || 0} modules
                            </span>
                            <Button 
                              size="sm" 
                              className="transition-all group-hover:shadow-md"
                              style={{ backgroundColor: primaryColor }}
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/parcours/${p.id}`);
                              }}
                            >
                              Accéder
                            </Button>
                          </div>
                        </CardContent>
                      </Card>;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </DraggableSection>;
      case "upcomingWebinars":
        return <DraggableSection key="upcomingWebinars" id="upcomingWebinars" isAdmin={adminChecked && isAdmin}>
            <UpcomingWebinars companyId={company.id} />
          </DraggableSection>;
      case "leaderboard":
        return company.enable_points_ranking ? (
          <DraggableSection key="leaderboard" id="leaderboard" isAdmin={adminChecked && isAdmin}>
            <CompanyLeaderboard 
              companyId={company.id} 
              currentUserId={user?.id}
              limit={10}
            />
          </DraggableSection>
        ) : null;
      case "referral":
        // Bloc désactivé - fonctionnalité retirée
        return null;
      case "inviteColleague":
        return (
          <DraggableSection key="inviteColleague" id="inviteColleague" isAdmin={adminChecked && isAdmin}>
            <InviteColleagueBlock
              companyId={company.id}
              companyName={company.name}
              primaryColor={company.primary_color || undefined}
              blockConfig={blockConfig}
            />
          </DraggableSection>
        );
      case "simulators":
        const simulatorMap: Record<string, {
          name: string;
          description: string;
          url: string;
        }> = {
          "simulateur_espp": {
            name: "Mes plans ESPP",
            description: "Gérez vos plans d'achat d'actions salarié (ESPP)",
            url: "/mes-plans-espp"
          },
          "simulateur-impots": {
            name: "Simulateur Impôts",
            description: "Estimez votre impôt sur le revenu en fonction de votre situation personnelle",
            url: "/simulateur-impots"
          },
          "simulateur-rsu": {
            name: "Mes plans RSU",
            description: "Gérez vos plans d'actions gratuites (RSU)",
            url: "/mes-plans-rsu"
          },
          "simulateur-bspce": {
            name: "Mes plans BSPCE",
            description: "Gérez vos bons de souscription de parts de créateur d'entreprise",
            url: "/mes-plans-bspce"
          }
        };
        const availableSimulators = company.simulators_config && Array.isArray(company.simulators_config) ? (company.simulators_config as string[]).filter(code => simulatorMap[code]).map(code => ({
          code,
          ...simulatorMap[code]
        })) : [];
        const simPrimaryColor = company.primary_color || 'hsl(var(--primary))';
        return availableSimulators.length > 0 ? <DraggableSection key="simulators" id="simulators" isAdmin={adminChecked && isAdmin}>
            <Card className="overflow-hidden" style={{ borderTopColor: simPrimaryColor, borderTopWidth: '3px' }}>
              <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${simPrimaryColor} 5%, transparent)` }}>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${simPrimaryColor} 15%, transparent)` }}>
                    <Zap className="h-5 w-5" style={{ color: simPrimaryColor }} />
                  </div>
                  {blockConfig?.title || "Simulateurs financiers"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {availableSimulators.map(simulator => <Card 
                    key={simulator.code} 
                    className="hover:shadow-lg transition-all group"
                    style={{ borderLeftWidth: '3px', borderLeftColor: simPrimaryColor }}
                  >
                      <CardHeader>
                        <CardTitle className="text-lg">{simulator.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                          __html: simulator.description
                        }} />
                        <Button 
                          asChild 
                          size="sm" 
                          className="transition-all group-hover:shadow-md"
                          style={{ backgroundColor: simPrimaryColor }}
                        >
                          <a href={simulator.url}>
                            Accéder au simulateur
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
          </DraggableSection> : null;
      case "expertBooking":
        const bookingPrimaryColor = company.primary_color || 'hsl(var(--primary))';
        return (expertBookingEmbed || expertBookingFallback) ? <DraggableSection key="expertBooking" id="expertBooking" isAdmin={adminChecked && isAdmin}>
            <Card className="overflow-hidden" style={{ borderTopColor: bookingPrimaryColor, borderTopWidth: '3px' }}>
              <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${bookingPrimaryColor} 5%, transparent)` }}>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${bookingPrimaryColor} 15%, transparent)` }}>
                    <Calendar className="h-5 w-5" style={{ color: bookingPrimaryColor }} />
                  </div>
                  {blockConfig?.title || "Réserver un rendez-vous avec un expert"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Prenez rendez-vous avec nos experts pour un accompagnement personnalisé
                </p>
                <HubSpotMeetingWidget redirectToLanding triggerText="Prendre rendez-vous" primaryColor={company.primary_color} utmCampaign="page_entreprise" />
              </CardContent>
            </Card>
          </DraggableSection> : null;
      case "documents":
        const docsPrimaryColor = company.primary_color || 'hsl(var(--primary))';
        return company.documents_resources && Array.isArray(company.documents_resources) && company.documents_resources.length > 0 ? <DraggableSection key="documents" id="documents" isAdmin={adminChecked && isAdmin}>
            <Card className="overflow-hidden" style={{ borderTopColor: docsPrimaryColor, borderTopWidth: '3px' }}>
              <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${docsPrimaryColor} 5%, transparent)` }}>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${docsPrimaryColor} 15%, transparent)` }}>
                    <FileText className="h-5 w-5" style={{ color: docsPrimaryColor }} />
                  </div>
                  {blockConfig?.title || "Documents et ressources utiles"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {(company.documents_resources as any[]).map((doc: any, index: number) => <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm"
                    style={{ borderLeftWidth: '3px', borderLeftColor: docsPrimaryColor }}
                  >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${docsPrimaryColor} 10%, transparent)` }}>
                          <FileText className="h-5 w-5" style={{ color: docsPrimaryColor }} />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          {doc.description && <div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                            __html: doc.description
                          }} />}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        style={{ borderColor: docsPrimaryColor, color: docsPrimaryColor }}
                        className="hover:bg-transparent"
                      >
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </DraggableSection> : null;
      case "webinars":
        const webinarsPrimaryColor = company.primary_color || 'hsl(var(--primary))';
        return company.webinar_replays && Array.isArray(company.webinar_replays) && company.webinar_replays.length > 0 ? <DraggableSection key="webinars" id="webinars" isAdmin={adminChecked && isAdmin}>
            <Card className="overflow-hidden" style={{ borderTopColor: webinarsPrimaryColor, borderTopWidth: '3px' }}>
              <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${webinarsPrimaryColor} 5%, transparent)` }}>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${webinarsPrimaryColor} 15%, transparent)` }}>
                    <Video className="h-5 w-5" style={{ color: webinarsPrimaryColor }} />
                  </div>
                  {blockConfig?.title || "Rediffusions de webinaires"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(company.webinar_replays as any[]).map((webinar: any, index: number) => <Card 
                    key={index} 
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    style={{ borderLeftWidth: '3px', borderLeftColor: webinarsPrimaryColor }}
                    onClick={() => window.open(webinar.url, '_blank')}
                  >
                      <CardHeader>
                        <CardTitle className="text-lg">{webinar.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {webinar.description && <div className="text-sm text-muted-foreground mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                          __html: webinar.description
                        }} />}
                        <Button 
                          size="sm" 
                          className="transition-all group-hover:shadow-md"
                          style={{ backgroundColor: webinarsPrimaryColor }}
                          onClick={e => {
                            e.stopPropagation();
                            window.open(webinar.url, '_blank');
                          }}
                        >
                          Voir la rediffusion
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
          </DraggableSection> : null;
    }
  };
  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Cover Image and Company Info Section */}
        <div>
          {/* Unified responsive banner */}
          <div style={{ marginBottom: 24 }}>
            <CompanyBanner primaryColor={company.primary_color} secondaryColor={company.secondary_color} />
          </div>
          
          {/* Company Info */}
          <div className="container mx-auto px-4" style={{ position: "relative", zIndex: 0 }}>
            <div className="max-w-6xl mx-auto">
              <div className="pb-4 sm:pb-6">
                {/* Mobile: Stack vertically | Desktop: Side by side */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
                  {/* Back button and Logo row */}
                  <div className="flex items-end gap-3 sm:gap-4">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => navigate(-1)} 
                      className="hover:bg-background/80 bg-background shadow-lg mb-2 h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Logo with colored border */}
                    {company.logo_url && (
                      <div className="relative shrink-0">
                        <div 
                          className="h-20 w-20 sm:h-32 sm:w-32 rounded-xl bg-white shadow-lg p-1.5 sm:p-2 flex items-center justify-center"
                          style={{ 
                            borderWidth: '3px', 
                            borderColor: company.primary_color || 'white',
                            boxShadow: `0 10px 25px -5px color-mix(in srgb, ${company.primary_color || 'hsl(var(--primary))'} 30%, transparent)`
                          }}
                        >
                          <img 
                            src={company.logo_url} 
                            alt={company.name} 
                            className="h-full w-full object-contain" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                
                <div 
                  className="flex-1 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 sm:p-4 border overflow-hidden min-w-0"
                  style={{
                    borderColor: `color-mix(in srgb, ${company.primary_color || 'hsl(var(--border))'} 30%, hsl(var(--border)))`,
                    borderTopWidth: '3px',
                    borderTopColor: company.primary_color || 'hsl(var(--primary))'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <h1 
                        className="text-xl sm:text-2xl md:text-3xl font-bold truncate"
                        style={{ 
                          background: `linear-gradient(135deg, ${company.primary_color || 'hsl(var(--foreground))'}, ${company.secondary_color || company.primary_color || 'hsl(var(--foreground))'})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {company.name}
                      </h1>
                    </div>
                    {(isAdmin || isCompanyContact) && (
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/company/${id}/dashboard`)}
                        className="gap-2 text-xs sm:text-sm h-8 sm:h-9 shrink-0"
                        style={{ 
                          borderColor: company.primary_color,
                          color: company.primary_color
                        }}
                      >
                        <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Configurer</span>
                        <span className="sm:hidden">Config</span>
                      </Button>
                    )}
                  </div>
                  
                  {companyContacts.length > 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                      Contacts référents : {companyContacts.join(", ")}
                    </p>
                  )}
                  
                  {(isAdmin || isCompanyContact) && (
                    <div className="mt-1 space-y-2">
                      {company.partnership_type ? (
                        <Badge 
                          className="border text-xs"
                          style={{ 
                            backgroundColor: `color-mix(in srgb, ${company.primary_color || 'hsl(var(--primary))'} 15%, transparent)`,
                            color: company.primary_color || 'hsl(var(--primary))',
                            borderColor: `color-mix(in srgb, ${company.primary_color || 'hsl(var(--primary))'} 30%, transparent)`
                          }}
                        >
                          <Handshake className="h-3 w-3 mr-1" />
                          Partenaire officiel de FinCare
                        </Badge>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPartnershipDialogOpen(true)}
                          className="gap-2 text-xs sm:text-sm h-8 sm:h-9"
                          style={{ 
                            borderColor: company.primary_color,
                            color: company.primary_color
                          }}
                        >
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Proposer un partenariat officiel</span>
                          <span className="sm:hidden">Partenariat</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden md:block">
            <CompanySidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              upcomingWebinarsCount={upcomingWebinarsCount}
              isCompanyContact={isCompanyContact}
              companyId={id}
              enablePointsRanking={company?.enable_points_ranking || false}
              primaryColor={company?.primary_color}
            />
          </div>
          {/* Mobile navigation */}
          <div className="md:hidden">
            <MobileCompanyNav
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              upcomingWebinarsCount={upcomingWebinarsCount}
              isCompanyContact={isCompanyContact}
              companyId={id}
              enablePointsRanking={company?.enable_points_ranking || false}
            />
          </div>
          <div className="flex-1 min-w-0">
            {/* Render section based on activeSection */}
            {activeSection === "webinars" && (() => {
              const webinarSectionColor = company.primary_color || 'hsl(var(--primary))';
              return (
                <Card className="overflow-hidden" style={{ borderTopColor: webinarSectionColor, borderTopWidth: '3px' }}>
                  <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${webinarSectionColor} 5%, transparent)` }}>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${webinarSectionColor} 15%, transparent)` }}>
                        <Video className="h-5 w-5" style={{ color: webinarSectionColor }} />
                      </div>
                      Webinars
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Upcoming webinars */}
                    {upcomingWebinarsCount > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: webinarSectionColor }} />
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            Prochains webinars
                          </h3>
                          <Badge 
                            className="text-xs border"
                            style={{ 
                              backgroundColor: `color-mix(in srgb, ${webinarSectionColor} 15%, transparent)`,
                              color: webinarSectionColor,
                              borderColor: `color-mix(in srgb, ${webinarSectionColor} 30%, transparent)`
                            }}
                          >
                            {upcomingWebinarsCount}
                          </Badge>
                        </div>
                        <UpcomingWebinars companyId={company.id} showCard={false} />
                      </div>
                    )}

                    {upcomingWebinarsCount === 0 && (
                      <UpcomingWebinars companyId={company.id} showCard={false} />
                    )}

                    {/* Separator */}
                    {upcomingWebinarsCount > 0 && pastWebinars.length > 0 && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Replays</span>
                        </div>
                      </div>
                    )}

                    {/* Past webinars / Replays */}
                    {pastWebinars.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            Replays
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {pastWebinars.length}
                          </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-90">
                          {pastWebinars.map((webinar: any) => (
                            <Card 
                              key={webinar.id} 
                              className="hover:shadow-lg transition-all cursor-pointer bg-background group"
                              style={{ borderLeftWidth: '3px', borderLeftColor: webinarSectionColor }}
                              onClick={() => webinar.webinar_registration_url && window.open(webinar.webinar_registration_url, '_blank')}
                            >
                              <CardHeader>
                                <CardTitle className="text-lg">{webinar.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {webinar.description && (
                                  <div className="text-sm text-muted-foreground mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: webinar.description }} />
                                )}
                                {webinar.webinar_registration_url && (
                                  <Button 
                                    size="sm" 
                                    className="transition-all group-hover:shadow-md"
                                    style={{ backgroundColor: webinarSectionColor }} 
                                    onClick={(e) => { e.stopPropagation(); window.open(webinar.webinar_registration_url, '_blank'); }}
                                  >
                                    Voir la rediffusion
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {upcomingWebinarsCount === 0 && pastWebinars.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun webinar disponible pour le moment
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
            {activeSection === "leaderboard" && renderBlock("leaderboard")}
            {activeSection === "communication-kit" && isCompanyContact && (
              <CommunicationKitTab preselectedCompanyId={id} />
            )}
            {activeSection === "informations" && company && (
              <>
                <CompanyInfoSection company={company as any} primaryColor={company.primary_color} />
                <div className="mt-6">
                  <CompanyExpertAdviceSection companyId={company.id} primaryColor={company.primary_color} />
                </div>
              </>
            )}
            {activeSection === "faq" && company && (
              <CompanyFAQSection companyId={company.id} primaryColor={company.primary_color} />
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Partnership Request Dialog */}
      {company && userProfile && (
        <PartnershipRequestDialog
          open={partnershipDialogOpen}
          onOpenChange={setPartnershipDialogOpen}
          companyId={company.id}
          companyName={company.name}
          userFirstName={userProfile.first_name}
          userLastName={userProfile.last_name}
          userEmail={userProfile.email}
        />
      )}
    </div>

    {/* Cropper Dialog */}
    {imageToUpload && (
      <CoverImageCropper
        imageUrl={imageToUpload}
        open={cropperOpen}
        onClose={handleCropperClose}
        onCropComplete={handleCropComplete}
      />
    )}
    </>
  );
};

export default Company;