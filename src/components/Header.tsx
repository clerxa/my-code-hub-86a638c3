import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, Shield, Building2, Handshake, UserPlus, FlaskConical, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { NotificationBell } from "./notifications/NotificationBell";
import { PartnershipRequestDialog } from "./PartnershipRequestDialog";
import { InviteColleagueDialog } from "./employee/InviteColleagueDialog";
import { ThemeToggle } from "./ui/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
interface Profile {
  first_name: string | null;
  avatar_url: string | null;
  total_points: number;
  company_id: string | null;
}
interface Company {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  partnership_type: string | null;
  enable_points_ranking: boolean;
}
export const Header = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompanyContact, setIsCompanyContact] = useState(false);
  const [showPartnershipDialog, setShowPartnershipDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCommunityLockedDialog, setShowCommunityLockedDialog] = useState(false);
  const [betaBadge, setBetaBadge] = useState<{ enabled: boolean; text: string; color: string }>({ enabled: false, text: 'Beta', color: '#f59e0b' });

  useEffect(() => {
    loadBetaBadgeSettings();
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
      checkAdminStatus();
      checkCompanyContactStatus();
    }
  }, [user]);
  useEffect(() => {
    if (profile?.company_id) {
      loadCompany();
    }
  }, [profile?.company_id]);

  const loadBetaBadgeSettings = async () => {
    const { data, error } = await supabase
      .from("global_settings")
      .select("key, value")
      .eq("category", "branding")
      .in("key", ["beta_badge_enabled", "beta_badge_text", "beta_badge_color"]);
    
    if (error) {
      console.error("Error loading beta badge settings:", error);
      return;
    }
    
    if (data) {
      const enabledSetting = data.find(s => s.key === "beta_badge_enabled");
      const textSetting = data.find(s => s.key === "beta_badge_text");
      const colorSetting = data.find(s => s.key === "beta_badge_color");
      
      setBetaBadge({
        enabled: enabledSetting?.value === true || enabledSetting?.value === "true" || enabledSetting?.value === 1,
        text: typeof textSetting?.value === 'string' ? textSetting.value.replace(/"/g, '') : 'Beta',
        color: typeof colorSetting?.value === 'string' ? colorSetting.value.replace(/"/g, '') : '#f59e0b'
      });
    }
  };
  const loadProfile = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("profiles").select("first_name, avatar_url, total_points, company_id").eq("id", user.id).single();
    if (error) {
      console.error("Error loading profile:", error);
      return;
    }
    setProfile(data);
  };
  const loadCompany = async () => {
    if (!profile?.company_id) return;
    const {
      data,
      error
    } = await supabase.from("companies").select("id, name, primary_color, secondary_color, partnership_type, enable_points_ranking").eq("id", profile.company_id).single();
    if (error) {
      console.error("Error loading company:", error);
      return;
    }
    setCompany(data);
  };
  const checkAdminStatus = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!error && data?.role === "admin") {
      setIsAdmin(true);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };
  if (!profile) return null;

  const hasOfficialPartnership = !!(
    company &&
    company.partnership_type &&
    company.partnership_type.toLowerCase() !== "aucun"
  );

  return <>
      {company && <>
          <PartnershipRequestDialog open={showPartnershipDialog} onOpenChange={setShowPartnershipDialog} companyId={company.id} companyName={company.name} />
          <InviteColleagueDialog open={showInviteDialog} onOpenChange={setShowInviteDialog} companyId={company.id} companyName={company.name} primaryColor={company.primary_color || undefined} />
        </>}
      
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/employee")}>
            {/* Legend gradient ring around avatar */}
            <div className="rounded-full p-[2.5px]" style={{ background: 'var(--gradient-legend)' }}>
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {profile.first_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            {betaBadge.enabled && (
              <div 
                className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full p-0.5 shadow-md"
                style={{ backgroundColor: betaBadge.color }}
                title={betaBadge.text}
              >
                <FlaskConical className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer hover:opacity-80 transition-opacity min-w-0" onClick={() => navigate("/employee")}>
            <div className="flex flex-col min-w-0 hidden sm:flex">
              <span className="text-sm font-medium text-foreground truncate">
                {profile.first_name || "Utilisateur"}
              </span>
              {company?.enable_points_ranking && (
                <span className="text-xs text-muted-foreground">
                  {profile.total_points} points
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <ThemeToggle className="mr-1 sm:mr-2" />
          <NotificationBell />

          {isAdmin && <Button size="sm" onClick={() => navigate("/admin")} className="gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 text-white h-8 sm:h-9 px-2 sm:px-3">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden lg:inline">Accès Backoffice</span>
            </Button>}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!hasOfficialPartnership) {
                setShowCommunityLockedDialog(true);
                return;
              }
              navigate("/forum");
            }}
            className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 hidden sm:flex"
          >
            {hasOfficialPartnership ? (
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            )}
            <span className="hidden lg:inline">Communauté</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden md:inline">Déconnexion</span>
          </Button>
        </div>
        </div>
      </header>

      {/* Community locked dialog for non-partner users */}
      <Dialog open={showCommunityLockedDialog} onOpenChange={setShowCommunityLockedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Communauté réservée aux partenaires</DialogTitle>
            <DialogDescription className="text-center">
              Pour accéder à la communauté et échanger avec d'autres collaborateurs,
              il faut que votre entreprise soit partenaire officiel de FinCare.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              className="w-full gap-2"
              onClick={() => {
                setShowCommunityLockedDialog(false);
                navigate("/proposer-partenariat");
              }}
            >
              <Building2 className="h-4 w-4" />
              Proposer un partenariat à mon entreprise
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCommunityLockedDialog(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};