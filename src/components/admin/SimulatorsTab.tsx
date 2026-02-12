import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, FolderOpen, Calculator } from 'lucide-react';
import { IconSelector } from './IconSelector';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  order_num: number;
  is_active: boolean;
}

interface Simulator {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  route: string;
  feature_key: string | null;
  duration_minutes: number;
  order_num: number;
  is_active: boolean;
  visibility_status: 'visible' | 'disabled' | 'hidden';
}

export function SimulatorsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('categories');
  
  // Category state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'folder',
    order_num: 0,
    is_active: true,
  });
  
  // Simulator state
  const [simulatorDialogOpen, setSimulatorDialogOpen] = useState(false);
  const [editingSimulator, setEditingSimulator] = useState<Simulator | null>(null);
  const [simulatorForm, setSimulatorForm] = useState({
    category_id: '',
    name: '',
    slug: '',
    description: '',
    icon: 'calculator',
    route: '',
    feature_key: '',
    duration_minutes: 5,
    order_num: 0,
    is_active: true,
    visibility_status: 'visible' as 'visible' | 'disabled' | 'hidden',
  });

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['admin-simulator-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_categories')
        .select('*')
        .order('order_num');
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch simulators
  const { data: simulators, isLoading: loadingSimulators } = useQuery({
    queryKey: ['admin-simulators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulators')
        .select('*')
        .order('order_num');
      if (error) throw error;
      return data as Simulator[];
    },
  });

  // Category handlers
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon,
        order_num: category.order_num,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        icon: 'folder',
        order_num: (categories?.length || 0) + 1,
        is_active: true,
      });
    }
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('simulator_categories')
          .update(categoryForm)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: 'Catégorie mise à jour' });
      } else {
        const { error } = await supabase
          .from('simulator_categories')
          .insert(categoryForm);
        if (error) throw error;
        toast({ title: 'Catégorie créée' });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-simulator-categories'] });
      setCategoryDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      const { error } = await supabase.from('simulator_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Catégorie supprimée' });
      queryClient.invalidateQueries({ queryKey: ['admin-simulator-categories'] });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  // Simulator handlers
  const openSimulatorDialog = (simulator?: Simulator) => {
    if (simulator) {
      setEditingSimulator(simulator);
      setSimulatorForm({
        category_id: simulator.category_id || '',
        name: simulator.name,
        slug: simulator.slug,
        description: simulator.description || '',
        icon: simulator.icon,
        route: simulator.route,
        feature_key: simulator.feature_key || '',
        duration_minutes: simulator.duration_minutes,
        order_num: simulator.order_num,
        is_active: simulator.is_active,
        visibility_status: simulator.visibility_status || 'visible',
      });
    } else {
      setEditingSimulator(null);
      setSimulatorForm({
        category_id: categories?.[0]?.id || '',
        name: '',
        slug: '',
        description: '',
        icon: 'calculator',
        route: '',
        feature_key: '',
        duration_minutes: 5,
        order_num: (simulators?.length || 0) + 1,
        is_active: true,
        visibility_status: 'visible',
      });
    }
    setSimulatorDialogOpen(true);
  };

  const saveSimulator = async () => {
    try {
      const payload = {
        ...simulatorForm,
        category_id: simulatorForm.category_id || null,
        feature_key: simulatorForm.feature_key || null,
      };
      
      if (editingSimulator) {
        const { error } = await supabase
          .from('simulators')
          .update(payload)
          .eq('id', editingSimulator.id);
        if (error) throw error;
        toast({ title: 'Simulateur mis à jour' });
      } else {
        const { error } = await supabase
          .from('simulators')
          .insert(payload);
        if (error) throw error;
        toast({ title: 'Simulateur créé' });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-simulators'] });
      setSimulatorDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const deleteSimulator = async (id: string) => {
    if (!confirm('Supprimer ce simulateur ?')) return;
    try {
      const { error } = await supabase.from('simulators').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Simulateur supprimé' });
      queryClient.invalidateQueries({ queryKey: ['admin-simulators'] });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sans catégorie';
    return categories?.find(c => c.id === categoryId)?.name || 'Inconnue';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Simulateurs</h2>
          <p className="text-muted-foreground">Organisez les simulateurs par catégorie</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Catégories ({categories?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="simulators" className="gap-2">
            <Calculator className="h-4 w-4" />
            Simulateurs ({simulators?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Ordre</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icône</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCategories ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                    </TableRow>
                  ) : categories?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Aucune catégorie</TableCell>
                    </TableRow>
                  ) : (
                    categories?.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            {cat.order_num}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                        <TableCell>{cat.icon}</TableCell>
                        <TableCell>
                          <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                            {cat.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openCategoryDialog(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulators Tab */}
        <TabsContent value="simulators" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openSimulatorDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau simulateur
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Ordre</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSimulators ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell>
                    </TableRow>
                  ) : simulators?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Aucun simulateur</TableCell>
                    </TableRow>
                  ) : (
                    simulators?.map((sim) => (
                      <TableRow key={sim.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            {sim.order_num}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sim.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoryName(sim.category_id)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{sim.route}</TableCell>
                        <TableCell>{sim.duration_minutes} min</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={sim.is_active ? 'default' : 'secondary'}>
                              {sim.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={
                                sim.visibility_status === 'visible' 
                                  ? 'border-green-500 text-green-600' 
                                  : sim.visibility_status === 'disabled'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-muted-foreground text-muted-foreground'
                              }
                            >
                              {sim.visibility_status === 'visible' && 'Accessible'}
                              {sim.visibility_status === 'disabled' && 'En développement'}
                              {sim.visibility_status === 'hidden' && 'Masqué'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openSimulatorDialog(sim)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSimulator(sim.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
            <DialogDescription>Configurez les détails de la catégorie</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Fiscalité"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="fiscalite"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Description de la catégorie..."
              />
            </div>
            <div className="space-y-2">
              <Label>Icône</Label>
              <IconSelector
                value={categoryForm.icon}
                onChange={(value) => setCategoryForm({ ...categoryForm, icon: value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                value={categoryForm.order_num}
                onChange={(e) => setCategoryForm({ ...categoryForm, order_num: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={categoryForm.is_active}
                onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
              />
              <Label>Catégorie active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveCategory}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulator Dialog */}
      <Dialog open={simulatorDialogOpen} onOpenChange={setSimulatorDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSimulator ? 'Modifier le simulateur' : 'Nouveau simulateur'}</DialogTitle>
            <DialogDescription>Configurez les détails du simulateur</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={simulatorForm.category_id}
                onValueChange={(value) => setSimulatorForm({ ...simulatorForm, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={simulatorForm.name}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, name: e.target.value })}
                placeholder="Simulateur d'Impôts"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={simulatorForm.slug}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, slug: e.target.value })}
                placeholder="impots"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={simulatorForm.description}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, description: e.target.value })}
                placeholder="Description du simulateur..."
              />
            </div>
            <div className="space-y-2">
              <Label>Route</Label>
              <Input
                value={simulatorForm.route}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, route: e.target.value })}
                placeholder="/simulateur-impots"
              />
            </div>
            <div className="space-y-2">
              <Label>Clé fonctionnalité (feature gate)</Label>
              <Input
                value={simulatorForm.feature_key}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, feature_key: e.target.value })}
                placeholder="simulateur_impots"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <IconSelector
                  value={simulatorForm.icon}
                  onChange={(value) => setSimulatorForm({ ...simulatorForm, icon: value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée (min)</Label>
                <Input
                  type="number"
                  value={simulatorForm.duration_minutes}
                  onChange={(e) => setSimulatorForm({ ...simulatorForm, duration_minutes: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                value={simulatorForm.order_num}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, order_num: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={simulatorForm.is_active}
                onCheckedChange={(checked) => setSimulatorForm({ ...simulatorForm, is_active: checked })}
              />
              <Label>Simulateur actif</Label>
            </div>
            <div className="space-y-2">
              <Label>Visibilité</Label>
              <Select
                value={simulatorForm.visibility_status}
                onValueChange={(value: 'visible' | 'disabled' | 'hidden') => 
                  setSimulatorForm({ ...simulatorForm, visibility_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Accessible
                    </div>
                  </SelectItem>
                  <SelectItem value="disabled">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      Bientôt disponible
                    </div>
                  </SelectItem>
                  <SelectItem value="hidden">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Non visible
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {simulatorForm.visibility_status === 'visible' && "Le simulateur est accessible normalement"}
                {simulatorForm.visibility_status === 'disabled' && "Affiché mais non cliquable, avec mention \"Bientôt disponible\""}
                {simulatorForm.visibility_status === 'hidden' && "Le simulateur n'apparaît pas dans la liste"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimulatorDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveSimulator}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
