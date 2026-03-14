import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EmployeeSidebar } from "@/components/employee/EmployeeSidebar";
import { MobileEmployeeNav } from "@/components/employee/MobileEmployeeNav";
import { OnboardingGuide } from "@/components/employee/OnboardingGuide";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { hasActivePartnership } from "@/lib/partnership";
import { hasEquityDevices as hasEquityDevicesFn } from "@/lib/equityDevices";

interface EmployeeLayoutProps {
  children: ReactNode;
  activeSection: string;
}

export function EmployeeLayout({ children, activeSection }: EmployeeLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [hasPartnership, setHasPartnership] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string | undefined>(undefined);
  const [hasEquityDevicesState, setHasEquityDevicesState] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        
        const { data: company } = await supabase
          .from("companies")
          .select("partnership_type, primary_color, compensation_devices")
          .eq("id", profile.company_id)
          .maybeSingle();
        
        setHasPartnership(hasActivePartnership(company?.partnership_type));
        setPrimaryColor(company?.primary_color || undefined);
        setHasEquityDevicesState(hasEquityDevicesFn(company?.compensation_devices));
      }
    };

    fetchCompanyInfo();
  }, [user]);

  const handleSectionChange = (section: string) => {
    if (section === "dashboard") {
      navigate("/employee");
    } else if (section === "horizon") {
      navigate("/employee/horizon");
    } else if (section === "budget") {
      navigate("/employee/budget");
    } else if (section === "atlas") {
      navigate("/employee/atlas");
    } else if (["profile-info", "progression", "leaderboard", "invitations", "contacts", "appointments", "webinars"].includes(section)) {
      navigate(`/employee?section=${section}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {/* Mobile navigation - Sticky below header */}
      <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <MobileEmployeeNav
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            companyId={companyId}
            hasPartnership={hasPartnership}
            primaryColor={primaryColor}
            hasEquityDevices={hasEquityDevicesState}
          />
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-4 md:py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sidebar - Hidden on mobile, visible on md+ */}
          <div className="hidden md:block">
            <EmployeeSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              companyId={companyId}
              hasPartnership={hasPartnership}
              primaryColor={primaryColor}
              onShowGuide={() => setShowGuide(true)}
              hasEquityDevices={hasEquityDevicesState}
            />
          </div>
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
      <Footer />
      {/* Onboarding Guide */}
      <OnboardingGuide forceShow={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
