import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { AtlasIntroScreen } from "@/components/atlas/AtlasIntroScreen";
import OcrAvisImposition from "@/components/OcrAvisImposition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export default function AtlasPage() {
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

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
      <div className="max-w-3xl mx-auto py-4">
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
