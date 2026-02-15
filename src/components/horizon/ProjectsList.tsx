import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Pencil, TrendingUp, AlertTriangle, MessageCircle } from "lucide-react";
import { getProjectIcon } from "./projectIcons";
import { ProjectProjection } from "./ProjectProjection";
import type { HorizonProject } from "@/hooks/useHorizonProjects";
import type { HorizonBudget } from "@/hooks/useHorizonBudget";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface ProjectsListProps {
  projects: HorizonProject[];
  budget: HorizonBudget;
  availableCapital: number;
  availableMonthly: number;
  onAddProject: () => void;
  onEditProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function computeFeasibility(project: HorizonProject): { projected: number; pct: number; months: number; gap: number } {
  const rate = Number(project.annual_return_rate || 0) / 100;
  const monthlyRate = rate / 12;
  const months = project.duration_months || 120;
  const apport = Number(project.apport);
  const monthly = Number(project.monthly_allocation);

  let projected: number;
  if (monthlyRate > 0) {
    projected = apport * Math.pow(1 + monthlyRate, months) +
      monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    projected = apport + monthly * months;
  }

  const target = Number(project.target_amount) || 1;
  const pct = Math.min(100, Math.round((projected / target) * 100));
  const gap = Math.max(0, target - projected);
  return { projected, pct, months, gap };
}

export function ProjectsList({ projects, budget, availableCapital, availableMonthly, onAddProject, onEditProject, onDeleteProject }: ProjectsListProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Mes Projets</CardTitle>
        <Button size="sm" onClick={onAddProject} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </CardHeader>
      <CardContent>
        {activeProjects.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">🎯</div>
            <p className="text-muted-foreground">Aucun projet pour le moment</p>
            <Button variant="outline" onClick={onAddProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer mon premier projet
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project) => {
              const { projected, pct, months, gap } = computeFeasibility(project);
              const Icon = getProjectIcon(project.icon);
              const isExpanded = expandedProject === project.id;
              const horizonYears = Math.round(months / 12);

              return (
                <div key={project.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: (project.category_color || '#3B82F6') + '20' }}
                        >
                          <Icon className="h-5 w-5" style={{ color: project.category_color || '#3B82F6' }} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{project.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {project.category_name || 'Projet personnel'}
                            {project.product_name && ` · ${project.product_name}`}
                            {' · '}{horizonYears} an{horizonYears > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditProject(project.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le budget sera réalloué à votre capital disponible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteProject(project.id)}>Supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Budget allocation */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Apport</span>
                        <p className="font-medium">{fmt(Number(project.apport))}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Mensuel</span>
                        <p className="font-medium">{fmt(Number(project.monthly_allocation))}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Cible</span>
                        <p className="font-medium">{fmt(Number(project.target_amount))}</p>
                      </div>
                    </div>

                    {/* Feasibility + Gap */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Faisabilité à {horizonYears} an{horizonYears > 1 ? 's' : ''}</span>
                        <Badge variant={pct >= 100 ? "default" : pct >= 80 ? "secondary" : "destructive"} className="text-xs">
                          {pct >= 100 ? "✅" : pct >= 80 ? "🟠" : "🔴"} {pct}%
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Projeté : {fmt(projected)}</span>
                        {gap > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Gap : {fmt(gap)}</span>
                        )}
                      </div>
                      {pct < 100 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          Avec votre budget actuel, vous atteindrez {pct}% de votre objectif. Augmentez l'épargne ou l'horizon.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        {isExpanded ? "Masquer" : "Projection"}
                      </Button>
                      {pct < 100 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 text-xs"
                          onClick={() => {
                            // Scroll to booking or open booking link
                            window.open('#contact-expert', '_blank');
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Vérifier avec un conseiller
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4 bg-muted/30">
                      <ProjectProjection project={project} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Available budget summary row */}
            <div className="border rounded-lg p-4 bg-muted/20 border-dashed">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Capital disponible</span>
                  <p className="font-semibold text-primary">{fmt(availableCapital)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Mensuel disponible</span>
                  <p className="font-semibold text-primary">{fmt(availableMonthly)}</p>
                </div>
                <div className="flex items-end">
                  <span className="text-xs text-muted-foreground italic">Libre pour nouveau projet</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
