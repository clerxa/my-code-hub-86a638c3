import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Settings, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Copy, Check } from "lucide-react";
import type { Company, CompanyModule } from "@/types/database";
import { ImageUpload } from "./ImageUpload";

interface Module {
  id: number;
  title: string;
}

interface CompaniesTabProps {
  companies: Company[];
  modules: Module[];
  onRefresh: () => void;
}

function SignupLinkCopy({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://myfincare.fr/join/${slug}`;
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien d'inscription copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={url}>
        /join/{slug}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copier le lien">
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}

export const CompaniesTab = ({ companies, modules, onRefresh }: CompaniesTabProps) => {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [companyStats, setCompanyStats] = useState<Record<string, { employeeCount: number; avgProgress: number }>>({});
  const [sortField, setSortField] = useState<keyof Company | 'employeeCount' | 'avgProgress' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [createFormData, setCreateFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
  });

  const handleSort = (field: keyof Company | 'employeeCount' | 'avgProgress') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === 'employeeCount') {
      const aV = companyStats[a.id]?.employeeCount || 0;
      const bV = companyStats[b.id]?.employeeCount || 0;
      return sortOrder === 'asc' ? aV - bV : bV - aV;
    }
    if (sortField === 'avgProgress') {
      const aV = companyStats[a.id]?.avgProgress || 0;
      const bV = companyStats[b.id]?.avgProgress || 0;
      return sortOrder === 'asc' ? aV - bV : bV - aV;
    }
    const aValue = a[sortField as keyof Company];
    const bValue = b[sortField as keyof Company];
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  const SortButton = ({ field, children }: { field: keyof Company | 'employeeCount' | 'avgProgress'; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleSort(field)}>
      {children}
      {sortField === field ? (
        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </div>
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await (supabase as any).from("companies").insert([createFormData]);
      if (error) throw error;
      toast.success("Entreprise créée");
      setIsCreateDialogOpen(false);
      setCreateFormData({ name: "", logo_url: "", primary_color: "#3b82f6", secondary_color: "#8b5cf6" });
      onRefresh();
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) return;
    try {
      const { data: parcours } = await supabase.from("parcours_companies").select("id").eq("company_id", id);
      if (parcours && parcours.length > 0) {
        await supabase.from("parcours_companies").delete().eq("company_id", id);
      }
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entreprise supprimée");
      onRefresh();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast.error(`Erreur: ${error.message || 'Vérifiez les dépendances'}`);
    }
  };

  const openModulesDialog = async (company: Company) => {
    setSelectedCompany(company);
    const { data, error } = await (supabase as any)
      .from("company_modules").select("module_id").eq("company_id", company.id);
    if (!error && data) {
      setSelectedModules(data.map((cm: CompanyModule) => cm.module_id));
    }
    setIsModulesDialogOpen(true);
  };

  const handleSaveModules = async () => {
    if (!selectedCompany) return;
    try {
      await (supabase as any).from("company_modules").delete().eq("company_id", selectedCompany.id);
      if (selectedModules.length > 0) {
        const modulesToInsert = selectedModules.map((moduleId, index) => ({
          company_id: selectedCompany.id, module_id: moduleId, is_active: true, custom_order: index + 1
        }));
        const { error } = await (supabase as any).from("company_modules").insert(modulesToInsert);
        if (error) throw error;
      }
      toast.success("Parcours mis à jour");
      setIsModulesDialogOpen(false);
    } catch (error) {
      console.error("Error saving modules:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const fetchCompanyStats = async () => {
    try {
      const stats: Record<string, { employeeCount: number; avgProgress: number }> = {};
      for (const company of companies) {
        const { data: profiles } = await supabase.from("profiles").select("completed_modules").eq("company_id", company.id);
        const employeeCount = profiles?.length || 0;
        const avgProgress = employeeCount > 0
          ? profiles!.reduce((sum, p) => sum + (p.completed_modules?.length || 0), 0) / employeeCount
          : 0;
        stats[company.id] = { employeeCount, avgProgress: Math.round(avgProgress * 10) / 10 };
      }
      setCompanyStats(stats);
    } catch (error) {
      console.error("Error fetching company stats:", error);
    }
  };

  useEffect(() => {
    if (companies.length > 0) fetchCompanyStats();
  }, [companies]);

  const toggleModule = (moduleId: number) => {
    setSelectedModules(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Entreprises</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Nouvelle entreprise</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle entreprise</DialogTitle>
                  <DialogDescription>Remplissez les informations essentielles</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create_name">Nom *</Label>
                    <Input id="create_name" value={createFormData.name} onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })} required placeholder="Nom de l'entreprise" />
                  </div>
                  <ImageUpload label="Logo" value={createFormData.logo_url || ""} onChange={(url) => setCreateFormData({ ...createFormData, logo_url: url })} bucketName="landing-images" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur primaire</Label>
                      <Input type="color" value={createFormData.primary_color} onChange={(e) => setCreateFormData({ ...createFormData, primary_color: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur secondaire</Label>
                      <Input type="color" value={createFormData.secondary_color} onChange={(e) => setCreateFormData({ ...createFormData, secondary_color: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Annuler</Button>
                    <Button type="submit">Créer</Button>
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
                <TableHead><SortButton field="name">Nom</SortButton></TableHead>
                <TableHead><SortButton field="partnership_type">Entité partenariat</SortButton></TableHead>
                <TableHead>Rang</TableHead>
                <TableHead className="text-center">Effectif</TableHead>
                <TableHead className="text-center"><SortButton field="employeeCount">Inscrits</SortButton></TableHead>
                <TableHead className="text-center"><SortButton field="avgProgress">Progression</SortButton></TableHead>
                <TableHead className="text-center">Aide Fiscale</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company) => (
                <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/companies/${company.id}`)}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <span className="text-sm">{company.partnership_type || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{(company as any).rang ? `Rang ${(company as any).rang}` : "—"}</span>
                  </TableCell>
                  <TableCell className="text-center">{company.company_size || "—"}</TableCell>
                  <TableCell className="text-center">{companyStats[company.id]?.employeeCount || 0}</TableCell>
                  <TableCell className="text-center">{companyStats[company.id]?.avgProgress || 0}%</TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={(company as any).tax_declaration_help_enabled || false}
                      onCheckedChange={async (checked) => {
                        const { error } = await supabase.from("companies").update({ tax_declaration_help_enabled: checked }).eq("id", company.id);
                        if (error) toast.error("Erreur");
                        else { toast.success(checked ? "Aide fiscale activée" : "Aide fiscale désactivée"); onRefresh(); }
                      }}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {(company as any).signup_slug ? <SignupLinkCopy slug={(company as any).signup_slug} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/company/${company.id}`, '_blank')} title="Voir">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openModulesDialog(company)} title="Parcours">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/companies/${company.id}`)} title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parcours — {selectedCompany?.name}</DialogTitle>
            <DialogDescription>Sélectionnez les modules disponibles</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pb-4 max-h-[60vh] overflow-y-auto">
            {modules.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Aucun module</p>
            ) : (
              modules.map((module) => (
                <div key={module.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => toggleModule(module.id)}>
                  <Checkbox id={`module-${module.id}`} checked={selectedModules.includes(module.id)} onCheckedChange={() => toggleModule(module.id)} />
                  <Label htmlFor={`module-${module.id}`} className="cursor-pointer flex-1">{module.title}</Label>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModulesDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveModules}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
