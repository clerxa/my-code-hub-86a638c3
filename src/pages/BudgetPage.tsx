import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { ZenithIntroScreen } from "@/components/simulators/budget/ZenithIntroScreen";
import { BudgetSimulator } from "@/components/simulators/BudgetSimulator";
import { SimulatorDisclaimer } from "@/components/simulators/SimulatorDisclaimer";

export default function BudgetPage() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <EmployeeLayout activeSection="budget">
      <div className="max-w-3xl mx-auto py-4">
        <AnimatePresence mode="wait">
          {showIntro ? (
            <ZenithIntroScreen key="intro" onStart={() => setShowIntro(false)} />
          ) : (
            <div key="simulator" className="space-y-8">
              <BudgetSimulator />
              <SimulatorDisclaimer />
            </div>
          )}
        </AnimatePresence>
      </div>
    </EmployeeLayout>
  );
}
