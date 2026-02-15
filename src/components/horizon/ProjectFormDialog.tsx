import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AVAILABLE_ICONS, getProjectIcon } from "./projectIcons";
import type { HorizonProject, ProjectFormData } from "@/hooks/useHorizonProjects";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject?: HorizonProject;
  availableCapital: number;
  availableMonthly: number;
  onSave: (data: ProjectFormData) => Promise<void>;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  target_return: string | null;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function ProjectFormDialog({ open, onOpenChange, editingProject, availableCapital, availableMonthly, onSave }: ProjectFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Target");
  const [categoryId, setCategoryId] = useState<string>("custom");
  const [customCategory, setCustomCategory] = useState("");
  const [apport, setApport] = useState("");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("120");
  const [productId, setProductId] = useState<string>("none");
  const [annualReturnRate, setAnnualReturnRate] = useState("0");
  const [notes, setNotes] = useState("");

  // Fetch categories and products
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from("horizon_project_categories").select("id, name, icon, color").eq("is_active", true).order("display_order"),
        supabase.from("financial_products").select("id, name, target_return").eq("is_active", true).order("display_order"),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
    };
    fetchData();
  }, [open]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setIcon(editingProject.icon);
      setCategoryId(editingProject.category_id || "custom");
      setCustomCategory(editingProject.custom_category || "");
      setApport(String(editingProject.apport));
      setMonthlyAllocation(String(editingProject.monthly_allocation));
      setTargetAmount(String(editingProject.target_amount));
      setDurationMonths(String(editingProject.duration_months || 120));
      setProductId(editingProject.placement_product_id || "none");
      setAnnualReturnRate(String(editingProject.annual_return_rate || 0));
      setNotes(editingProject.notes || "");
    } else {
      setName("");
      setIcon("Target");
      setCategoryId("custom");
      setCustomCategory("");
      setApport("");
      setMonthlyAllocation("");
      setTargetAmount("");
      setDurationMonths("120");
      setProductId("none");
      setAnnualReturnRate("0");
      setNotes("");
    }
  }, [editingProject, open]);

  // When category changes, update icon
  useEffect(() => {
    if (categoryId !== "custom") {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) setIcon(cat.icon);
    }
  }, [categoryId, categories]);

  // When product changes, try to parse return rate
  useEffect(() => {
    if (productId !== "none") {
      const prod = products.find(p => p.id === productId);
      if (prod?.target_return) {
        const match = prod.target_return.match(/(\d+(?:[.,]\d+)?)/);
        if (match) setAnnualReturnRate(match[1].replace(',', '.'));
      }
    }
  }, [productId, products]);

  const apportNum = Number(apport) || 0;
  const monthlyNum = Number(monthlyAllocation) || 0;
  const capitalError = apportNum > availableCapital;
  const monthlyError = monthlyNum > availableMonthly;

  const canSave = name.trim() && !capitalError && !monthlyError && !saving;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name: name.trim(),
      icon,
      category_id: categoryId !== "custom" ? categoryId : null,
      custom_category: categoryId === "custom" ? customCategory.trim() || null : null,
      apport: apportNum,
      monthly_allocation: monthlyNum,
      target_amount: Number(targetAmount) || 0,
      target_date: null,
      duration_months: Number(durationMonths) || 120,
      placement_product_id: productId !== "none" ? productId : null,
      annual_return_rate: Number(annualReturnRate) || 0,
      notes: notes.trim() || null,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProject ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
                <SelectItem value="custom">✏️ Projet personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {categoryId === "custom" && (
            <div className="space-y-2">
              <Label>Nom de la catégorie personnalisée</Label>
              <Input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Ex: Entreprise, Crypto..." />
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label>Nom du projet *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maison principale, Vacances 2027..." />
          </div>

          {/* Icon picker (simple) */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map(iconName => {
                const IconComp = getProjectIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`p-2 rounded-lg border transition-colors ${icon === iconName ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget allocation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Apport (€)</Label>
              <Input
                type="number"
                min="0"
                value={apport}
                onChange={e => setApport(e.target.value)}
                placeholder="20 000"
              />
              {capitalError && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Capital insuffisant (Reste disponible : {fmt(availableCapital)})
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="space-y-2">
              <Label>Mensualité (€/mois)</Label>
              <Input
                type="number"
                min="0"
                value={monthlyAllocation}
                onChange={e => setMonthlyAllocation(e.target.value)}
                placeholder="500"
              />
              {monthlyError && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Capacité d'épargne mensuelle insuffisante (Reste disponible : {fmt(availableMonthly)})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Target */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Montant cible (€)</Label>
              <Input
                type="number"
                min="0"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="250 000"
              />
            </div>
            <div className="space-y-2">
              <Label>Durée (mois)</Label>
              <Input
                type="number"
                min="1"
                value={durationMonths}
                onChange={e => setDurationMonths(e.target.value)}
                placeholder="120"
              />
            </div>
          </div>

          {/* Placement / Rendement */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type de placement</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun / Manuel</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rendement annuel (%)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={annualReturnRate}
                onChange={e => setAnnualReturnRate(e.target.value)}
                placeholder="4"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Détails, rappels..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {editingProject ? "Mettre à jour" : "Créer le projet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
