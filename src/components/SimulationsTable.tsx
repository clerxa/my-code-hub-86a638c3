import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, TrendingUp, ArrowUpDown, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ESPPPlan } from "@/types/espp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SimulationsTableProps {
  userId: string;
}

interface TaxSimulation {
  id: string;
  nom_simulation: string;
  created_at: string;
  revenu_imposable: number;
  impot_net: number;
}

type SimulationType = 'ESPP' | 'Impôts' | 'Optimisation' | 'PER' | 'Épargne' | 'Capacité' | 'Prêt' | 'LMNP';

type UnifiedSimulation = {
  id: string;
  type: SimulationType;
  name: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  details?: string;
  tableName: string;
  editUrl: string;
  viewUrl: string;
};

type SortField = 'name' | 'company' | 'created_at' | 'type';
type SortOrder = 'asc' | 'desc';

export const SimulationsTable = ({ userId }: SimulationsTableProps) => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<UnifiedSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [simulationToDelete, setSimulationToDelete] = useState<UnifiedSimulation | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    loadSimulations();
  }, [userId]);

  const loadSimulations = async () => {
    try {
      // Charger toutes les simulations en parallèle
      const [esppRes, taxRes, optRes, perRes, epargneRes, capaciteRes, pretRes, lmnpRes] = await Promise.all([
        supabase.from('espp_plans').select('*').eq('user_id', userId),
        supabase.from('simulations_impots').select('*').eq('user_id', userId),
        supabase.from('optimisation_fiscale_simulations').select('*').eq('user_id', userId),
        supabase.from('per_simulations').select('*').eq('user_id', userId),
        supabase.from('epargne_precaution_simulations').select('*').eq('user_id', userId),
        supabase.from('capacite_emprunt_simulations').select('*').eq('user_id', userId),
        supabase.from('pret_immobilier_simulations').select('*').eq('user_id', userId),
        supabase.from('lmnp_simulations').select('*').eq('user_id', userId),
      ]);

      const allSimulations: UnifiedSimulation[] = [];

      // ESPP
      (esppRes.data || []).forEach(plan => {
        allSimulations.push({
          id: plan.id,
          type: 'ESPP',
          name: plan.nom_plan,
          company: plan.entreprise,
          startDate: plan.date_debut,
          endDate: plan.date_fin,
          createdAt: plan.created_at || '',
          tableName: 'espp_plans',
          editUrl: `/simulateur-espp?plan=${plan.id}`,
          viewUrl: `/simulateur-espp?plan=${plan.id}&step=resultats`,
        });
      });

      // Impôts
      (taxRes.data || []).forEach(sim => {
        allSimulations.push({
          id: sim.id,
          type: 'Impôts',
          name: sim.nom_simulation,
          createdAt: sim.created_at || '',
          details: `Revenu: ${sim.revenu_imposable?.toLocaleString('fr-FR') || 0} € - Impôt: ${sim.impot_net?.toLocaleString('fr-FR') || 0} €`,
          tableName: 'simulations_impots',
          editUrl: `/simulateur-impots?sim=${sim.id}`,
          viewUrl: `/simulateur-impots?sim=${sim.id}`,
        });
      });

      // Optimisation fiscale
      (optRes.data || []).forEach(sim => {
        allSimulations.push({
          id: sim.id,
          type: 'Optimisation',
          name: sim.nom_simulation,
          createdAt: sim.created_at || '',
          details: `Économie: ${sim.economie_totale?.toLocaleString('fr-FR') || 0} €`,
          tableName: 'optimisation_fiscale_simulations',
          editUrl: `/optimisation-fiscale?sim=${sim.id}`,
          viewUrl: `/optimisation-fiscale?sim=${sim.id}&step=resultats`,
        });
      });

      // PER
      (perRes.data || []).forEach(sim => {
        allSimulations.push({
          id: sim.id,
          type: 'PER',
          name: sim.nom_simulation,
          createdAt: sim.created_at || '',
          details: `Économie: ${sim.economie_impots?.toLocaleString('fr-FR') || 0} € - Capital: ${sim.capital_futur?.toLocaleString('fr-FR') || 0} €`,
          tableName: 'per_simulations',
          editUrl: `/simulateur-per?sim=${sim.id}`,
          viewUrl: `/simulateur-per?sim=${sim.id}`,
        });
      });

      // Épargne de précaution
      (epargneRes.data || []).forEach(sim => {
        allSimulations.push({
          id: sim.id,
          type: 'Épargne',
          name: sim.nom_simulation,
          createdAt: sim.created_at || '',
          details: `Objectif: ${sim.epargne_recommandee?.toLocaleString('fr-FR') || 0} € - Actuel: ${sim.epargne_actuelle?.toLocaleString('fr-FR') || 0} €`,
          tableName: 'epargne_precaution_simulations',
          editUrl: `/simulateur-epargne-precaution?sim=${sim.id}`,
          viewUrl: `/simulateur-epargne-precaution?sim=${sim.id}`,
        });
      });

      // Capacité d'emprunt
      (capaciteRes.data || []).forEach(sim => {
        allSimulations.push({
          id: sim.id,
          type: 'Capacité',
          name: sim.nom_simulation,
          createdAt: sim.created_at || '',
          details: `Capacité: ${sim.capacite_emprunt?.toLocaleString('fr-FR') || 0} €`,
          tableName: 'capacite_emprunt_simulations',
          editUrl: `/simulateur-capacite-emprunt?sim=${sim.id}`,
          viewUrl: `/simulateur-capacite-emprunt?sim=${sim.id}`,
        });
      });

      // Prêt immobilier
      (pretRes.data || []).forEach(sim => {
        allSimulations.push({
          id: sim.id,
          type: 'Prêt',
          name: sim.nom_simulation,
          createdAt: sim.created_at || '',
          details: `Montant: ${sim.montant_emprunte?.toLocaleString('fr-FR') || 0} € - Mensualité: ${sim.mensualite_totale?.toLocaleString('fr-FR') || 0} €`,
          tableName: 'pret_immobilier_simulations',
          editUrl: `/simulateur-pret-immobilier?sim=${sim.id}`,
          viewUrl: `/simulateur-pret-immobilier?sim=${sim.id}`,
        });
      });

      // LMNP
      (lmnpRes.data || []).forEach(sim => {
        allSimulations.push({
          id: sim.id,
          type: 'LMNP',
          name: sim.nom_simulation,
          createdAt: sim.created_at || '',
          details: `Régime: ${sim.meilleur_regime || 'N/A'} - Économie: ${((sim.fiscalite_totale_micro || 0) - (sim.fiscalite_totale_reel || 0)).toLocaleString('fr-FR')} €`,
          tableName: 'lmnp_simulations',
          editUrl: `/simulateur-lmnp?sim=${sim.id}`,
          viewUrl: `/simulateur-lmnp?sim=${sim.id}`,
        });
      });

      setSimulations(allSimulations);
    } catch (error) {
      console.error('Error loading simulations:', error);
      toast.error("Erreur lors du chargement des simulations");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedSimulations = [...simulations].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'company':
        aVal = (a.company || '').toLowerCase();
        bVal = (b.company || '').toLowerCase();
        break;
      case 'created_at':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'type':
        aVal = a.type;
        bVal = b.type;
        break;
      default:
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleEditSimulation = (simulation: UnifiedSimulation) => {
    navigate(simulation.editUrl);
  };

  const handleViewResults = (simulation: UnifiedSimulation) => {
    navigate(simulation.viewUrl);
  };

  const handleDeleteSimulation = async (simulation: UnifiedSimulation) => {
    try {
      const { error } = await supabase
        .from(simulation.tableName as any)
        .delete()
        .eq('id', simulation.id);
      
      if (error) throw error;
      
      toast.success("Simulation supprimée avec succès");
      setSimulationToDelete(null);
      loadSimulations();
      
      // Ajuster la page si nécessaire
      const newTotal = simulations.length - 1;
      const maxPage = Math.ceil(newTotal / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
    } catch (error) {
      console.error('Error deleting simulation:', error);
      toast.error("Erreur lors de la suppression de la simulation");
    }
  };

  // Pagination
  const totalPages = Math.ceil(sortedSimulations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSimulations = sortedSimulations.slice(startIndex, endIndex);

  const getTypeBadgeColor = (type: SimulationType) => {
    const colors: Record<SimulationType, string> = {
      'ESPP': "bg-primary/10 text-primary border-primary/20",
      'Impôts': "bg-orange-500/10 text-orange-500 border-orange-500/20",
      'Optimisation': "bg-green-500/10 text-green-500 border-green-500/20",
      'PER': "bg-blue-500/10 text-blue-500 border-blue-500/20",
      'Épargne': "bg-purple-500/10 text-purple-500 border-purple-500/20",
      'Capacité': "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      'Prêt': "bg-pink-500/10 text-pink-500 border-pink-500/20",
      'LMNP': "bg-amber-500/10 text-amber-500 border-amber-500/20",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mes Simulations
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (simulations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucune simulation réalisée pour le moment</p>
      </div>
    );
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {simulations.length} simulation{simulations.length > 1 ? 's' : ''} au total
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} sur {totalPages}
            </span>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="name">Nom</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="company">Entreprise / Détails</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="type">Type</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="created_at">Date</SortButton>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSimulations.map((simulation) => (
                <TableRow key={simulation.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {simulation.name}
                  </TableCell>
                  <TableCell>
                    {simulation.type === 'ESPP' ? (
                      <>
                        <div className="font-medium">{simulation.company}</div>
                        {simulation.startDate && simulation.endDate && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(simulation.startDate).toLocaleDateString('fr-FR')} → {new Date(simulation.endDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">{simulation.details}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getTypeBadgeColor(simulation.type)}
                    >
                      {simulation.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(simulation.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewResults(simulation)}
                        className="hover:bg-accent/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSimulation(simulation)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSimulationToDelete(simulation)}
                        className="hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!simulationToDelete} onOpenChange={() => setSimulationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la simulation "{simulationToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => simulationToDelete && handleDeleteSimulation(simulationToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
