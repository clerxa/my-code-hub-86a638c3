import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, List, ArrowUp, ArrowDown, Eye, ArrowUpDown, Star, Pin, Search, Filter, X, Check, CircleDashed, GripVertical, Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { stripHtml } from "@/components/ui/rich-text";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Parcours, Company } from "@/types/database";

interface Module {
  id: number;
  title: string;
  order_num: number;
  description: string;
  points: number;
  type?: string;
}

interface SelectedModuleConfig {
  id: number;
  is_optional: boolean;
}

interface ParcoursWithRelations extends Parcours {
  modules?: Array<{
    id: string;
    module_id: number;
    order_num: number;
    is_optional?: boolean;
    module?: Module;
  }>;
  companies?: Array<{
    id: string;
    company_id: string;
    is_pinned?: boolean;
  }>;
  display_order?: number;
}

interface ParcoursTabProps {
  parcours: ParcoursWithRelations[];
  companies: Company[];
  modules: Module[];
  onRefresh: () => void;
}

// Sortable row component for default parcours ordering
const SortableParcoursRow = ({ parcours: p, onEdit, onDelete, onOpenModules, onNavigate, getCompanyNames }: {
  parcours: ParcoursWithRelations;
  onEdit: (p: ParcoursWithRelations) => void;
  onDelete: (id: string) => void;
  onOpenModules: (id: string) => void;
  onNavigate: (path: string) => void;
  getCompanyNames: (p: ParcoursWithRelations) => string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono text-xs">
          {(p as any).display_order || 0}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{p.title}</TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="ghost" size="icon" onClick={() => onNavigate(`/admin/parcours/${p.id}/preview`)} title="Prévisualiser">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onOpenModules(p.id)} title="Modules">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(p)} title="Modifier">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)} title="Supprimer">
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export const ParcoursTab = ({ parcours, companies, modules, onRefresh }: ParcoursTabProps) => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingParcours, setEditingParcours] = useState<Parcours | null>(null);
  const [selectedParcours, setSelectedParcours] = useState<string | null>(null);
  const [selectedModulesConfig, setSelectedModulesConfig] = useState<SelectedModuleConfig[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [pinnedCompanies, setPinnedCompanies] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof ParcoursWithRelations | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modules dialog state
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleTypeFilter, setModuleTypeFilter] = useState<string>("all");
  const [moduleSortBy, setModuleSortBy] = useState<"title" | "points" | "order_num">("order_num");
  const [moduleSortOrder, setModuleSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_default: false,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get default parcours sorted by display_order
  const defaultParcours = useMemo(() => {
    return parcours
      .filter((p: any) => p.is_default)
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
  }, [parcours]);

  const resetForm = () => {
    setFormData({ title: "", description: "", is_default: false });
    setSelectedCompanies([]);
    setPinnedCompanies([]);
    setEditingParcours(null);
  };

  const handleSort = (field: keyof ParcoursWithRelations) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedParcours = [...parcours].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const SortButton = ({ field, children }: { field: keyof ParcoursWithRelations; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleSort(field)}>
      {children}
      {sortField === field ? (
        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </div>
  );

  const openEditDialog = async (p: ParcoursWithRelations) => {
    setEditingParcours(p);
    setFormData({
      title: p.title,
      description: p.description || "",
      is_default: (p as any).is_default || false,
    });
    
    // Charger les entreprises associées avec info épinglage
    const { data } = await (supabase as any)
      .from("parcours_companies")
      .select("company_id, is_pinned")
      .eq("parcours_id", p.id);
    
    setSelectedCompanies(data?.map((pc: any) => pc.company_id) || []);
    setPinnedCompanies(data?.filter((pc: any) => pc.is_pinned).map((pc: any) => pc.company_id) || []);
    setIsDialogOpen(true);
  };

  const openModulesDialog = async (parcoursId: string) => {
    setSelectedParcours(parcoursId);
    setModuleSearch("");
    setModuleTypeFilter("all");
    
    // Charger les modules du parcours avec is_optional
    const { data, error } = await (supabase as any)
      .from("parcours_modules")
      .select("module_id, is_optional, order_num")
      .eq("parcours_id", parcoursId)
      .order("order_num");

    if (error) {
      toast.error("Erreur lors du chargement des modules");
      return;
    }

    setSelectedModulesConfig(data.map((pm: any) => ({
      id: pm.module_id,
      is_optional: pm.is_optional || false,
    })));
    setIsModulesDialogOpen(true);
  };

  // Get unique module types for filter
  const moduleTypes = useMemo(() => {
    const types = new Set(modules.map(m => m.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [modules]);

  // Filtered and sorted modules for dialog
  const filteredModules = useMemo(() => {
    let result = [...modules];
    
    // Search filter
    if (moduleSearch) {
      const search = moduleSearch.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(search) || 
        stripHtml(m.description).toLowerCase().includes(search)
      );
    }
    
    // Type filter
    if (moduleTypeFilter !== "all") {
      result = result.filter(m => m.type === moduleTypeFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (moduleSortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "points":
          comparison = (a.points || 0) - (b.points || 0);
          break;
        case "order_num":
          comparison = a.order_num - b.order_num;
          break;
      }
      return moduleSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [modules, moduleSearch, moduleTypeFilter, moduleSortBy, moduleSortOrder]);

  const selectedModuleIds = selectedModulesConfig.map(m => m.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      let parcoursId: string;

      if (editingParcours) {
        const { error } = await (supabase as any)
          .from("parcours")
          .update({
            title: formData.title,
            description: formData.description || null,
            is_default: formData.is_default,
          })
          .eq("id", editingParcours.id);

        if (error) throw error;
        parcoursId = editingParcours.id;
        toast.success("Parcours mis à jour");
      } else {
        const { data, error } = await (supabase as any)
          .from("parcours")
          .insert({
            title: formData.title,
            description: formData.description || null,
            is_default: formData.is_default,
          })
          .select()
          .single();

        if (error) throw error;
        parcoursId = data.id;
        toast.success("Parcours créé");
      }

      // Gérer les entreprises associées
      // Supprimer les anciennes associations
      await (supabase as any)
        .from("parcours_companies")
        .delete()
        .eq("parcours_id", parcoursId);

      // Ajouter les nouvelles associations avec info épinglage
      if (selectedCompanies.length > 0) {
        const companiesToInsert = selectedCompanies.map(companyId => ({
          parcours_id: parcoursId,
          company_id: companyId,
          is_pinned: pinnedCompanies.includes(companyId),
        }));

        const { error } = await (supabase as any)
          .from("parcours_companies")
          .insert(companiesToInsert);

        if (error) throw error;
      }

      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur", { description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce parcours ?")) return;

    try {
      const { error } = await (supabase as any)
        .from("parcours")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Parcours supprimé");
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur", { description: error.message });
    }
  };

  const handleSaveModules = async () => {
    if (!selectedParcours) return;

    try {
      // Supprimer les anciens modules
      await (supabase as any)
        .from("parcours_modules")
        .delete()
        .eq("parcours_id", selectedParcours);

      // Ajouter les nouveaux modules avec ordre et is_optional
      if (selectedModulesConfig.length > 0) {
        const modulesToInsert = selectedModulesConfig.map((config, index) => ({
          parcours_id: selectedParcours,
          module_id: config.id,
          order_num: index + 1,
          is_optional: config.is_optional,
        }));

        const { error } = await (supabase as any)
          .from("parcours_modules")
          .insert(modulesToInsert);

        if (error) throw error;
      }

      toast.success("Modules du parcours mis à jour");
      setIsModulesDialogOpen(false);
      setSelectedParcours(null);
      setSelectedModulesConfig([]);
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur", { description: error.message });
    }
  };

  const toggleModule = (moduleId: number) => {
    setSelectedModulesConfig(prev => {
      const exists = prev.find(m => m.id === moduleId);
      if (exists) {
        return prev.filter(m => m.id !== moduleId);
      }
      return [...prev, { id: moduleId, is_optional: false }];
    });
  };

  const toggleModuleOptional = (moduleId: number) => {
    setSelectedModulesConfig(prev => 
      prev.map(m => m.id === moduleId ? { ...m, is_optional: !m.is_optional } : m)
    );
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        // Si on désélectionne, on retire aussi de pinnedCompanies
        setPinnedCompanies(pinned => pinned.filter(id => id !== companyId));
        return prev.filter(id => id !== companyId);
      }
      return [...prev, companyId];
    });
  };

  const togglePinned = (companyId: string) => {
    setPinnedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const newModules = [...selectedModulesConfig];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newModules.length) return;
    
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];
    setSelectedModulesConfig(newModules);
  };

  const getModuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video: "Vidéo",
      quiz: "Quiz",
      webinar: "Webinaire",
      guide: "Guide",
      meeting: "Rendez-vous",
      simulator: "Simulateur",
    };
    return labels[type] || type;
  };

  const getCompanyNames = (p: ParcoursWithRelations) => {
    if (!p.companies || p.companies.length === 0) return "Toutes";
    const names = p.companies
      .map(pc => companies.find(c => c.id === pc.company_id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Toutes";
  };

  // Handle drag end for reordering default parcours
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = defaultParcours.findIndex(p => p.id === active.id);
    const newIndex = defaultParcours.findIndex(p => p.id === over.id);
    
    const reordered = arrayMove(defaultParcours, oldIndex, newIndex);
    
    // Update display_order in database
    try {
      const updates = reordered.map((p, index) => ({
        id: p.id,
        display_order: index + 1,
      }));
      
      for (const update of updates) {
        await (supabase as any)
          .from("parcours")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }
      
      toast.success("Ordre mis à jour");
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour de l'ordre");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Parcours de formation</CardTitle>
        <div className="flex gap-2">
          {defaultParcours.length > 1 && (
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Ordre d'affichage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ordre d'affichage des parcours par défaut</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">
                  Glissez-déposez pour réorganiser l'ordre d'apparition des parcours par défaut pour vos utilisateurs.
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={defaultParcours.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead className="w-16">Ordre</TableHead>
                          <TableHead>Titre</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {defaultParcours.map((p) => (
                          <SortableParcoursRow
                            key={p.id}
                            parcours={p}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                            onOpenModules={openModulesDialog}
                            onNavigate={navigate}
                            getCompanyNames={getCompanyNames}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </SortableContext>
                </DndContext>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau parcours
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingParcours ? "Modifier le parcours" : "Nouveau parcours"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded bg-muted/50">
                <Checkbox
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked === true })}
                />
                <div className="space-y-1">
                  <Label htmlFor="is_default" className="cursor-pointer font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Parcours par défaut
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ce parcours sera automatiquement attribué à tous les nouveaux utilisateurs dès leur première connexion
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Entreprises</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Sélectionnez les entreprises (ou laissez vide pour toutes). Cliquez sur l'épingle pour mettre en avant le parcours.
                </div>
                <div className="border rounded p-4 max-h-60 overflow-y-auto space-y-2">
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                      />
                      <Label className="cursor-pointer flex-1">
                        {company.name}
                      </Label>
                      {selectedCompanies.includes(company.id) && (
                        <Button
                          type="button"
                          variant={pinnedCompanies.includes(company.id) ? "default" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => togglePinned(company.id)}
                          title={pinnedCompanies.includes(company.id) ? "Désépingler" : "Épingler pour cette entreprise"}
                        >
                          <Pin className={`h-4 w-4 ${pinnedCompanies.includes(company.id) ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Aucune entreprise disponible
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingParcours ? "Mettre à jour" : "Créer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortButton field="title">Titre</SortButton></TableHead>
              <TableHead><SortButton field="description">Description</SortButton></TableHead>
              <TableHead>Par défaut</TableHead>
              <TableHead>Entreprises</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedParcours.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.description || "-"}</TableCell>
                <TableCell>
                  {(p as any).is_default ? (
                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                      <Star className="h-3 w-3 mr-1" />
                      Par défaut
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{getCompanyNames(p)}</TableCell>
                <TableCell>
                  {p.modules?.length || 0} module(s)
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/admin/parcours/${p.id}/preview`)}
                    title="Prévisualiser le parcours"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openModulesDialog(p.id)}
                    title="Gérer les modules"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(p)}
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(p.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sortedParcours.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun parcours créé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Dialog pour gérer les modules */}
        <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Gérer les modules du parcours</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              {/* Filters and Search */}
              <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un module..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="pl-9"
                  />
                  {moduleSearch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setModuleSearch("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <Select value={moduleTypeFilter} onValueChange={setModuleTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {moduleTypes.map(type => (
                      <SelectItem key={type} value={type}>{getModuleTypeLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={moduleSortBy} onValueChange={(v) => setModuleSortBy(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_num">Ordre</SelectItem>
                    <SelectItem value="title">Titre</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setModuleSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                >
                  {moduleSortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <Badge variant="outline">
                  {filteredModules.length} module(s) affiché(s)
                </Badge>
                <Badge variant="secondary">
                  <Check className="h-3 w-3 mr-1" />
                  {selectedModulesConfig.length} sélectionné(s)
                </Badge>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  <CircleDashed className="h-3 w-3 mr-1" />
                  {selectedModulesConfig.filter(m => m.is_optional).length} optionnel(s)
                </Badge>
              </div>

              {/* Two columns layout */}
              <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
                {/* Available modules */}
                <div className="flex flex-col overflow-hidden border rounded-lg">
                  <div className="p-3 bg-muted/30 border-b">
                    <Label className="font-semibold">Modules disponibles</Label>
                    <p className="text-xs text-muted-foreground">Cliquez pour ajouter au parcours</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredModules.map((module) => {
                      const isSelected = selectedModuleIds.includes(module.id);
                      return (
                        <div 
                          key={module.id} 
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'hover:bg-muted border border-transparent'
                          }`}
                          onClick={() => toggleModule(module.id)}
                        >
                          <Checkbox checked={isSelected} className="pointer-events-none" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{module.title}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {module.type && (
                                <Badge variant="outline" className="text-xs py-0">
                                  {getModuleTypeLabel(module.type)}
                                </Badge>
                              )}
                              <span>{module.points} pts</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredModules.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Aucun module trouvé
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected modules with order and optional toggle */}
                <div className="flex flex-col overflow-hidden border rounded-lg">
                  <div className="p-3 bg-muted/30 border-b">
                    <Label className="font-semibold">Modules du parcours</Label>
                    <p className="text-xs text-muted-foreground">Réorganisez et définissez les modules optionnels</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {selectedModulesConfig.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Aucun module sélectionné
                      </div>
                    ) : (
                      selectedModulesConfig.map((config, index) => {
                        const module = modules.find(m => m.id === config.id);
                        if (!module) return null;
                        return (
                          <div 
                            key={config.id} 
                            className={`flex items-center gap-2 p-2 rounded border ${
                              config.is_optional ? 'border-dashed border-orange-300 bg-orange-50' : 'bg-muted/30'
                            }`}
                          >
                            <span className="font-mono text-xs text-muted-foreground w-6">{index + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{module.title}</div>
                              {module.type && (
                                <Badge variant="outline" className="text-xs py-0">
                                  {getModuleTypeLabel(module.type)}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Optional toggle */}
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Label className="text-xs text-muted-foreground cursor-pointer">Optionnel</Label>
                              <Switch
                                checked={config.is_optional}
                                onCheckedChange={() => toggleModuleOptional(config.id)}
                              />
                            </div>
                            
                            {/* Move buttons */}
                            <div className="flex">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); moveModule(index, 'up'); }}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); moveModule(index, 'down'); }}
                                disabled={index === selectedModulesConfig.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* Remove button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); toggleModule(config.id); }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={handleSaveModules} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer ({selectedModulesConfig.length} modules)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModulesDialogOpen(false);
                    setSelectedParcours(null);
                    setSelectedModulesConfig([]);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
