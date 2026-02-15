import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, ArrowUpDown, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
import { SIMULATION_TYPE_LABELS, SIMULATION_TYPE_URLS, type SimulationType } from "@/types/simulations";

interface UnifiedSimulationsTableProps {
  userId: string;
}

interface SimulationRow {
  id: string;
  type: SimulationType;
  name: string | null;
  created_at: string;
  data: Record<string, unknown>;
}

type SortField = 'name' | 'type' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const UnifiedSimulationsTable = ({ userId }: UnifiedSimulationsTableProps) => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<SimulationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [simulationToDelete, setSimulationToDelete] = useState<SimulationRow | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    loadSimulations();
  }, [userId]);

  const loadSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, type, name, created_at, data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSimulations((data || []) as SimulationRow[]);
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
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case 'name':
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
        break;
      case 'type':
        aVal = a.type;
        bVal = b.type;
        break;
      case 'created_at':
      default:
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
    }

    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const handleEdit = (simulation: SimulationRow) => {
    const urls = SIMULATION_TYPE_URLS[simulation.type];
    // Navigation avec les données en state pour éviter un fetch supplémentaire
    navigate(`${urls.edit}?sim=${simulation.id}`, {
      state: { simulationData: simulation.data, simulationName: simulation.name }
    });
  };

  const handleView = (simulation: SimulationRow) => {
    const urls = SIMULATION_TYPE_URLS[simulation.type];
    // Navigation avec les données en state pour affichage immédiat des résultats
    navigate(`${urls.view}?sim=${simulation.id}`, {
      state: { simulationData: simulation.data, simulationName: simulation.name }
    });
  };

  const handleDelete = async (simulation: SimulationRow) => {
    try {
      const { error } = await supabase
        .from('simulations')
        .delete()
        .eq('id', simulation.id);

      if (error) throw error;

      toast.success("Simulation supprimée avec succès");
      setSimulationToDelete(null);
      loadSimulations();

      const newTotal = simulations.length - 1;
      const maxPage = Math.ceil(newTotal / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
    } catch (error) {
      console.error('Error deleting simulation:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const totalPages = Math.ceil(sortedSimulations.length / itemsPerPage);
  const paginatedSimulations = sortedSimulations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTypeBadgeColor = (type: SimulationType) => {
    const colors: Record<SimulationType, string> = {
      espp: "bg-primary/10 text-primary border-primary/20",
      impots: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      optimisation_fiscale: "bg-green-500/10 text-green-500 border-green-500/20",
      per: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      epargne_precaution: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      capacite_emprunt: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      pret_immobilier: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      lmnp: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      interets_composes: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      pvi: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      gestion_pilotee: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  const getSimulationDetails = (sim: SimulationRow): string => {
    const d = sim.data as Record<string, number | string | null>;
    switch (sim.type) {
      case 'per':
        return `Économie: ${(d.economie_impots as number)?.toLocaleString('fr-FR') || 0} €`;
      case 'lmnp':
        return `Régime: ${d.meilleur_regime || 'N/A'}`;
      case 'espp':
        return `${d.entreprise || 'N/A'}`;
      case 'impots':
        return `Impôt: ${(d.impot_net as number)?.toLocaleString('fr-FR') || 0} €`;
      case 'optimisation_fiscale':
        return `Économie: ${(d.economie_totale as number)?.toLocaleString('fr-FR') || 0} €`;
      case 'capacite_emprunt':
        return `Capacité: ${(d.capacite_emprunt as number)?.toLocaleString('fr-FR') || 0} €`;
      case 'pret_immobilier':
        return `Mensualité: ${(d.mensualite_totale as number)?.toLocaleString('fr-FR') || 0} €`;
      case 'epargne_precaution':
        return `Objectif: ${(d.epargne_recommandee as number)?.toLocaleString('fr-FR') || 0} €`;
      case 'interets_composes':
        return `Capital: ${(d.capital_final as number)?.toLocaleString('fr-FR') || 0} €`;
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (simulations.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Aucune simulation réalisée</div>;
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{simulations.length} simulation{simulations.length > 1 ? 's' : ''}</span>
          {totalPages > 1 && <span>Page {currentPage} sur {totalPages}</span>}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton field="name">Nom</SortButton></TableHead>
                <TableHead>Détails</TableHead>
                <TableHead><SortButton field="type">Type</SortButton></TableHead>
                <TableHead><SortButton field="created_at">Date</SortButton></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSimulations.map((sim) => (
                <TableRow key={sim.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{sim.name || 'Sans nom'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getSimulationDetails(sim)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeBadgeColor(sim.type)}>
                      {SIMULATION_TYPE_LABELS[sim.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(sim.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleView(sim)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(sim)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setSimulationToDelete(sim)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" />Précédent
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="min-w-[2.5rem]">
                  {page}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!simulationToDelete} onOpenChange={() => setSimulationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer "{simulationToDelete?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => simulationToDelete && handleDelete(simulationToDelete)} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
