import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { ZenithIntroScreen } from "@/components/simulators/budget/ZenithIntroScreen";
import { BudgetSimulator } from "@/components/simulators/BudgetSimulator";
import { SimulatorDisclaimer } from "@/components/simulators/SimulatorDisclaimer";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export default function BudgetPage() {
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Check if user has a saved budget simulation
  const { data: savedSim, isLoading } = useQuery({
    queryKey: ['budget-saved-sim', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('simulations')
        .select('id, data, name, created_at')
        .eq('user_id', user.id)
        .eq('type', 'budget')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // If saved sim exists, skip intro and show results
  useEffect(() => {
    if (!isLoading && savedSim) {
      setShowIntro(false);
    }
  }, [isLoading, savedSim]);

  return (
    <EmployeeLayout activeSection="budget">
      <div className="max-w-3xl mx-auto py-4">
        <AnimatePresence mode="wait">
          {showIntro && !savedSim ? (
            <ZenithIntroScreen key="intro" onStart={() => setShowIntro(false)} />
          ) : (
            <div key="simulator" className="space-y-8">
              <BudgetSimulator
                savedData={savedSim?.data as Record<string, any> | undefined}
                savedSimId={savedSim?.id}
                startInResults={!!savedSim && !editMode}
                onEdit={() => setEditMode(true)}
              />
              <SimulatorDisclaimer />
            </div>
          )}
        </AnimatePresence>
      </div>
    </EmployeeLayout>
  );
}
