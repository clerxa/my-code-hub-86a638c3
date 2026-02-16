import { useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { PartnershipContent } from "@/components/PartnershipContent";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PageMeta } from "@/components/seo/PageMeta";
import { JsonLdOrganization, JsonLdSoftware } from "@/components/seo/JsonLd";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollProgress, isRevealing } = useScrollReveal();
  const earlyProgress = Math.min(1, scrollProgress * 3.3);

  useEffect(() => {
    // Check if this is an invitation link - redirect to onboarding with params preserved
    const invitationToken = searchParams.get("invitation");
    if (invitationToken) {
      const params = new URLSearchParams(searchParams);
      navigate(`/onboarding?${params.toString()}`, { replace: true });
      return;
    }
    
    checkExistingSession();
  }, [searchParams]);

  const checkExistingSession = async () => {
    // If the URL hash contains type=recovery, redirect to reset-password
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      navigate("/reset-password" + hash, { replace: true });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (roleData?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    }
  };

  return (
    <div className="relative">
      <PageMeta
        title="MyFinCare – L'éducation financière des salariés"
        description="L'app qui aide chaque salarié à reprendre le pouvoir sur ses finances grâce à des modules simples, ludiques et personnalisés."
        path="/"
      />
      <JsonLdOrganization />
      <JsonLdSoftware />
      {/* Main Hero Section */}
      <div
        className="min-h-screen bg-background flex flex-col"
        style={{
          opacity: 1 - scrollProgress,
          transform: `translateY(${-scrollProgress * 20}px) scale(${1 - scrollProgress * 0.03})`,
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
        }}
      >
        {/* Header with login link */}
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/login" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Déjà membre ? <span className="underline">Se connecter</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex items-center overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 items-center w-full max-w-7xl mx-auto">
            {/* Left side - Text */}
            <div className="space-y-6 md:space-y-8 order-2 lg:order-1 w-full lg:w-1/2 lg:flex-shrink-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl hero-gradient leading-tight tracking-tight">
                FinCare, le programme qui redonne aux salariés le pouvoir sur leurs finances.
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
                <Button 
                  onClick={() => navigate("/onboarding")} 
                  size="lg" 
                  className="text-base sm:text-lg whitespace-nowrap"
                >
                  Commencer l'expérience FinCare
                  <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
                </Button>
                <Button
                  onClick={() => navigate("/partenariat")}
                  variant="outline"
                  size="lg"
                  className="text-base sm:text-lg whitespace-nowrap"
                >
                  <Mail className="mr-2 h-5 w-5 flex-shrink-0" />
                  Proposer FinCare à mes salariés
                </Button>
              </div>
            </div>

            {/* Right side - Video */}
            <div className="order-1 lg:order-2 w-full lg:w-1/2 flex items-center justify-center lg:justify-end flex-shrink-0">
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full max-h-[30vh] sm:max-h-[35vh] md:max-h-[40vh] lg:max-h-[70vh] aspect-square overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                >
                  <source src="/video_index3.mp4" type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center py-6 text-muted-foreground text-xs font-medium">
          FinCare, le programme d&apos;éducation financière de Perlib
        </p>
      </div>

      {/* Partnership Content - Revealed on Scroll */}
      <div
        className="min-h-screen"
        style={{
          opacity: earlyProgress,
          transform: `translateY(${(1 - earlyProgress) * 80}px)`,
        }}
      >
        <PartnershipContent opacity={scrollProgress} />
      </div>
    </div>
  );
};

export default Index;
