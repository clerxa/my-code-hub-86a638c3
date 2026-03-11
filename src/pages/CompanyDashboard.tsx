import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Settings, 
  Megaphone,
  ArrowLeft,
  Users,
  Video,
  Receipt,
  
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDashboardStats } from "@/components/company-dashboard/CompanyDashboardStats";
import { CompanyConfigurationTab } from "@/components/company-dashboard/CompanyConfigurationTab";
import { CompanyCommunicationTab } from "@/components/company-dashboard/CompanyCommunicationTab";
import { CompanyCommunityTab } from "@/components/company-dashboard/CompanyCommunityTab";
import { CompanyWebinarsTab } from "@/components/company-dashboard/CompanyWebinarsTab";
import { CompanyTaxHelpTab } from "@/components/company-dashboard/CompanyTaxHelpTab";


const CompanyDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [hasTaxHelpEnabled, setHasTaxHelpEnabled] = useState(false);

  useEffect(() => {
    if (id && user) {
      checkAuthorization();
    }
  }, [id, user]);

  const checkAuthorization = async () => {
    if (!user || !id) return;

    try {
      // Check if user is admin or company contact
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const isAdmin = roleData?.role === "admin";
      const isContact = roleData?.role === "contact_entreprise";

      if (!isAdmin && !isContact) {
        navigate(`/company/${id}`);
        return;
      }

      // If company contact, verify they belong to this company
      if (isContact && !isAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (profile?.company_id !== id) {
          navigate(`/company/${id}`);
          return;
        }
      }

      // Fetch company name and tax help status
      const { data: company } = await supabase
        .from("companies")
        .select("name, tax_declaration_help_enabled")
        .eq("id", id)
        .single();

      if (company) {
        setCompanyName(company.name);
        setHasTaxHelpEnabled((company as any).tax_declaration_help_enabled || false);
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Error checking authorization:", error);
      toast.error("Erreur lors de la vérification des autorisations");
      navigate(`/company/${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Mobile: Back button sticky */}
      <div className="lg:hidden px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/company/${id}`)}
          className="w-full justify-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'espace entreprise
        </Button>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/company/${id}`)}
            className="mb-4 hidden lg:flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'espace entreprise
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Dashboard Entreprise
              </h1>
              <p className="text-muted-foreground">{companyName}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className={`grid w-full max-w-4xl h-12 ${hasTaxHelpEnabled ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="webinars" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Webinars</span>
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Communauté</span>
            </TabsTrigger>
            {hasTaxHelpEnabled && (
              <TabsTrigger value="tax-help" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Aide Fiscale</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <CompanyDashboardStats companyId={id!} />
          </TabsContent>

          <TabsContent value="webinars">
            <CompanyWebinarsTab companyId={id!} />
          </TabsContent>


          <TabsContent value="configuration">
            <CompanyConfigurationTab companyId={id!} />
          </TabsContent>

          <TabsContent value="communication">
            <CompanyCommunicationTab companyId={id!} />
          </TabsContent>

          <TabsContent value="community">
            <CompanyCommunityTab companyId={id!} />
          </TabsContent>

          {hasTaxHelpEnabled && (
            <TabsContent value="tax-help">
              <CompanyTaxHelpTab companyId={id!} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default CompanyDashboard;
