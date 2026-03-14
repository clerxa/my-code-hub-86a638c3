import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { AtlasIntroScreen } from "@/components/atlas/AtlasIntroScreen";
import OcrAvisImposition from "@/components/OcrAvisImposition";

export default function AtlasPage() {
  const [showIntro, setShowIntro] = useState(true);

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
