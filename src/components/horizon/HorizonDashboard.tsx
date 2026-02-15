import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useHorizonBudget } from "@/hooks/useHorizonBudget";
import { useHorizonProjects } from "@/hooks/useHorizonProjects";
import { HorizonHeader } from "./HorizonHeader";
import { BudgetOverview } from "./BudgetOverview";
import { BudgetSetup } from "./BudgetSetup";
import { ProjectsList } from "./ProjectsList";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function HorizonDashboard() {
  const { user } = useAuth();
  const { budget, loading: budgetLoading, saveBudget } = useHorizonBudget(user?.id);
  const { projects, loading: projectsLoading, addProject, updateProject, deleteProject } = useHorizonProjects(user?.id);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  const loading = budgetLoading || projectsLoading;

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

  return (
    <div className="space-y-6">
      <HorizonHeader />

      <Alert variant="default" className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
          Simulation non contractuelle. L'adéquation d'un produit à votre situation réelle nécessite l'analyse d'un expert certifié. Les projections sont indicatives et ne garantissent aucun résultat.
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
