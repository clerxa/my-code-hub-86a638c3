import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { AtlasIntroScreen } from "@/components/atlas/AtlasIntroScreen";
import OcrAvisImposition from "@/components/OcrAvisImposition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export default function AtlasPage() {
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromPanorama = searchParams.get("from") === "panorama";

  // Check if user already has a saved analysis → skip intro
  useEffect(() => {
    if (!user?.id) {
      setShowIntro(true);
      return;
    }
    const check = async () => {
      const { count } = await supabase
        .from("ocr_avis_imposition_analyses" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setShowIntro(!count || count === 0);
    };
    check();
  }, [user?.id]);

  if (showIntro === null) {
    return (
      <EmployeeLayout activeSection="atlas">
        <div className="max-w-3xl mx-auto py-4 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout activeSection="atlas">
      <div className="max-w-3xl mx-auto py-4 space-y-4">
        {/* Banner to return to PANORAMA after analysis */}
        {fromPanorama && !showIntro && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm text-primary font-medium">
              Analyse terminée ? Votre tableau de bord PANORAMA est prêt.
            </p>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => navigate("/panorama")}>
              <LayoutDashboard className="h-4 w-4" />
              Voir PANORAMA
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showIntro ? (
            <AtlasIntroScreen key="intro" onStart={() => setShowIntro(false)} />
          ) : (
            <div key="atlas-content">
              <OcrAvisImposition />
            </div>
          )}
        </AnimatePresence>
      </div>
    </EmployeeLayout>
  );
}
