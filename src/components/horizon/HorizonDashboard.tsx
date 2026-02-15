import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useHorizonBudget } from "@/hooks/useHorizonBudget";
import { useHorizonProjects } from "@/hooks/useHorizonProjects";
import { useUserFinancialProfile } from "@/hooks/useUserFinancialProfile";
import { HorizonHeader } from "./HorizonHeader";
import { BudgetOverview } from "./BudgetOverview";
import { StrategyDashboard } from "./StrategyDashboard";
import { BudgetSetup } from "./BudgetSetup";
import { ProjectsList } from "./ProjectsList";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { HorizonLanding } from "./HorizonLanding";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Info, BarChart3, Sparkles, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function HorizonDashboard() {
  const { user } = useAuth();
  const { budget, loading: budgetLoading, saveBudget } = useHorizonBudget(user?.id);
  const { projects, loading: projectsLoading, addProject, updateProject, deleteProject } = useHorizonProjects(user?.id);
  const { completeness, isComplete, isLoading: profileLoading } = useUserFinancialProfile();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [generatingDashboard, setGeneratingDashboard] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true);
      const { generateHorizonReportPdf } = await import("@/utils/generateHorizonReportPdf");
      generateHorizonReportPdf({
        projects,
        budget: budget!,
        allocatedCapital,
        allocatedMonthly,
        userName: user?.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
          : user?.email || "",
      });
      toast.success("Rapport PDF téléchargé !");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const profileComplete = isComplete || completeness === 100;

  const loading = budgetLoading || projectsLoading || profileLoading;

  // Calculate allocated amounts
  const allocatedCapital = projects
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + Number(p.apport), 0);
  const allocatedMonthly = projects
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + Number(p.monthly_allocation), 0);

  const availableCapital = Math.max(0, Number(budget?.total_initial_capital || 0) - allocatedCapital);
  const availableMonthly = Math.max(0, Number(budget?.total_monthly_savings || 0) - allocatedMonthly);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  // Show landing page if user hasn't started yet (and has no budget = first time)
  if (!started && !budget) {
    return <HorizonLanding onStart={() => setStarted(true)} profileComplete={profileComplete} />;
  }

  return (
    <div className="space-y-6">
      <HorizonHeader />

      <Alert variant="default" className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
          Outil pédagogique uniquement. Horizon est un simulateur à vocation éducative et ne constitue ni un conseil en investissement, ni une recommandation personnalisée. Les projections sont purement indicatives et ne garantissent aucun résultat. Consultez un conseiller certifié avant toute décision financière.
        </AlertDescription>
      </Alert>

      {!budget ? (
        <BudgetSetup onSave={saveBudget} />
      ) : (
        <>
          <BudgetOverview
            budget={budget}
            allocatedCapital={allocatedCapital}
            allocatedMonthly={allocatedMonthly}
            onEditBudget={saveBudget}
          />

          <ProjectsList
            projects={projects}
            budget={budget}
            availableCapital={availableCapital}
            availableMonthly={availableMonthly}
            onAddProject={() => setShowProjectForm(true)}
            onEditProject={(id) => { setEditingProject(id); setShowProjectForm(true); }}
            onDeleteProject={deleteProject}
            onUpdateProject={updateProject}
          />

          <AnimatePresence mode="wait">
            {!showDashboard ? (
              <motion.div
                key="generate-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-dashed border-2 border-primary/20">
                  <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <BarChart3 className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold">Ma Stratégie Financière</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Visualisez la répartition de vos projets, vos projections de capital et votre stratégie globale.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="gap-2 mt-2"
                      disabled={generatingDashboard || projects.filter(p => p.status === 'active').length === 0}
                      onClick={() => {
                        setGeneratingDashboard(true);
                        setTimeout(() => {
                          setShowDashboard(true);
                          setGeneratingDashboard(false);
                        }, 1200);
                      }}
                    >
                      {generatingDashboard ? (
                        <>
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Générer mon dashboard
                        </>
                      )}
                    </Button>
                    {projects.filter(p => p.status === 'active').length === 0 && (
                      <p className="text-xs text-muted-foreground">Ajoutez au moins un projet pour générer votre dashboard</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <StrategyDashboard
                  projects={projects}
                  budget={budget}
                  allocatedCapital={allocatedCapital}
                  allocatedMonthly={allocatedMonthly}
                />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={generatingPdf}
                    onClick={handleDownloadPdf}
                  >
                    <FileDown className="h-4 w-4" />
                    {generatingPdf ? "Génération..." : "Télécharger le rapport PDF"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <ProjectFormDialog
        open={showProjectForm}
        onOpenChange={(open) => { setShowProjectForm(open); if (!open) setEditingProject(null); }}
        editingProject={editingProject ? projects.find(p => p.id === editingProject) : undefined}
        availableCapital={availableCapital + (editingProject ? Number(projects.find(p => p.id === editingProject)?.apport || 0) : 0)}
        availableMonthly={availableMonthly + (editingProject ? Number(projects.find(p => p.id === editingProject)?.monthly_allocation || 0) : 0)}
        onSave={async (data) => {
          if (editingProject) {
            await updateProject(editingProject, data);
          } else {
            await addProject(data);
          }
          setShowProjectForm(false);
          setEditingProject(null);
        }}
      />
    </div>
  );
}
