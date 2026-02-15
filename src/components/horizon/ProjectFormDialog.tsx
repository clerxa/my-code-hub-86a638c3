import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
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
  horizon_min_years: number | null;
  horizon_max_years: number | null;
}

interface RateTier {
  id: string;
  product_id: string;
  horizon_min_years: number;
  horizon_max_years: number;
  annual_rate: number;
  label: string | null;
}

interface ProductCategoryLink {
  product_id: string;
  category_id: string;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function horizonLabel(years: number): string {
  if (years === 1) return "1 an";
  return `${years} ans`;
}

export function ProjectFormDialog({ open, onOpenChange, editingProject, availableCapital, availableMonthly, onSave }: ProjectFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [rateTiers, setRateTiers] = useState<RateTier[]>([]);
  const [productCategoryLinks, setProductCategoryLinks] = useState<ProductCategoryLink[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Target");
  const [categoryId, setCategoryId] = useState<string>("");
  const [apport, setApport] = useState("");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [horizonYears, setHorizonYears] = useState(10);
  const [productId, setProductId] = useState<string>("none");
  const [notes, setNotes] = useState("");

  // Fetch reference data
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      const [{ data: cats }, { data: prods }, { data: tiers }, { data: links }] = await Promise.all([
        supabase.from("horizon_project_categories").select("id, name, icon, color").eq("is_active", true).order("display_order"),
        supabase.from("financial_products").select("id, name, target_return, horizon_min_years, horizon_max_years").eq("is_active", true).order("display_order"),
        supabase.from("product_rate_tiers").select("*").order("horizon_min_years"),
        supabase.from("product_category_links").select("product_id, category_id"),
      ]);
      setCategories(cats || []);
      setAllProducts(prods || []);
      setRateTiers(tiers || []);
      setProductCategoryLinks(links || []);
    };
    fetchData();
  }, [open]);

  // Pre-fill form
  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setIcon(editingProject.icon);
      setCategoryId(editingProject.category_id || "");
      setApport(String(editingProject.apport));
      setMonthlyAllocation(String(editingProject.monthly_allocation));
      setTargetAmount(String(editingProject.target_amount));
      setHorizonYears(Math.round((editingProject.duration_months || 120) / 12));
      setProductId(editingProject.placement_product_id || "none");
      setNotes(editingProject.notes || "");
    } else {
      setName("");
      setIcon("Target");
      setCategoryId("");
      setApport("");
      setMonthlyAllocation("");
      setTargetAmount("");
      setHorizonYears(10);
      setProductId("none");
      setNotes("");
    }
  }, [editingProject, open]);

  // When category changes, update icon and reset product
  useEffect(() => {
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) setIcon(cat.icon);
      setProductId("none");
    }
  }, [categoryId, categories]);

  // Filter products by category + horizon
  const filteredProducts = useMemo(() => {
    if (!categoryId) return [];
    
    // Get product IDs linked to this category
    const linkedProductIds = productCategoryLinks
      .filter(l => l.category_id === categoryId)
      .map(l => l.product_id);

    return allProducts.filter(p => {
      // Must be linked to the category (if links exist for this category)
      const hasLinks = productCategoryLinks.some(l => l.category_id === categoryId);
      if (hasLinks && !linkedProductIds.includes(p.id)) return false;

      // Must match horizon range
      const minY = p.horizon_min_years ?? 1;
      const maxY = p.horizon_max_years ?? 40;
      return horizonYears >= minY && horizonYears <= maxY;
    });
  }, [allProducts, categoryId, horizonYears, productCategoryLinks]);

  // Compute the rate for the selected product + horizon
  const computedRate = useMemo(() => {
    if (productId === "none") return 0;
    
    // Find matching rate tier
    const tier = rateTiers.find(t => 
      t.product_id === productId &&
      horizonYears >= t.horizon_min_years &&
      horizonYears <= t.horizon_max_years
    );
    
    if (tier) return Number(tier.annual_rate);

    // Fallback: parse from product target_return
    const prod = allProducts.find(p => p.id === productId);
    if (prod?.target_return) {
      const match = prod.target_return.match(/(\d+(?:[.,]\d+)?)/);
      if (match) return Number(match[1].replace(',', '.'));
    }
    return 0;
  }, [productId, horizonYears, rateTiers, allProducts]);

  // Reset product if it's no longer in filtered list
  useEffect(() => {
    if (productId !== "none" && !filteredProducts.find(p => p.id === productId)) {
      setProductId("none");
    }
  }, [filteredProducts, productId]);

  const apportNum = Number(apport) || 0;
  const monthlyNum = Number(monthlyAllocation) || 0;
  const targetNum = Number(targetAmount) || 0;
  const capitalError = apportNum > availableCapital;
  const monthlyError = monthlyNum > availableMonthly;
  const durationMonths = horizonYears * 12;

  // Projection calculation
  const projection = useMemo(() => {
    const rate = computedRate / 100;
    const monthlyRate = rate / 12;
    const months = durationMonths;

    let projected: number;
    if (monthlyRate > 0) {
      projected = apportNum * Math.pow(1 + monthlyRate, months) +
        monthlyNum * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    } else {
      projected = apportNum + monthlyNum * months;
    }

    const gap = targetNum > 0 ? targetNum - projected : 0;
    const pct = targetNum > 0 ? Math.min(100, Math.round((projected / targetNum) * 100)) : 0;
    return { projected, gap, pct };
  }, [apportNum, monthlyNum, computedRate, durationMonths, targetNum]);

  const canSave = name.trim() && categoryId && !capitalError && !monthlyError && !saving;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name: name.trim(),
      icon,
      category_id: categoryId || null,
      custom_category: null,
      apport: apportNum,
      monthly_allocation: monthlyNum,
      target_amount: targetNum,
      target_date: null,
      duration_months: durationMonths,
      placement_product_id: productId !== "none" ? productId : null,
      annual_return_rate: computedRate,
      notes: notes.trim() || null,
    });
    setSaving(false);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProject ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Objectif (Category) */}
          <div className="space-y-2">
            <Label>Objectif *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un objectif..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => {
                  const CatIcon = getProjectIcon(cat.icon);
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <CatIcon className="h-4 w-4" style={{ color: cat.color }} />
                        {cat.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Nom du projet *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maison principale, Vacances 2027..." />
          </div>

          {/* Icon picker */}
          {selectedCategory && (
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
          )}

          {/* Horizon de placement - Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Horizon de placement</Label>
              <span className="text-sm font-semibold text-primary">{horizonLabel(horizonYears)}</span>
            </div>
            <Slider
              value={[horizonYears]}
              onValueChange={([v]) => setHorizonYears(v)}
              min={1}
              max={40}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 an</span>
              <span>10 ans</span>
              <span>20 ans</span>
              <span>30 ans</span>
              <span>40 ans</span>
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
                    Capital insuffisant (Reste : {fmt(availableCapital)})
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
                    Capacité insuffisante (Reste : {fmt(availableMonthly)})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Target */}
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

          {/* Placement recommendation */}
          {categoryId && (
            <div className="space-y-2">
              <Label>Type de placement recommandé</Label>
              {filteredProducts.length === 0 ? (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Info className="h-4 w-4 inline mr-1" />
                  Aucun produit disponible pour cet objectif et cet horizon de placement.
                </div>
              ) : (
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un placement..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun placement</SelectItem>
                    {filteredProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {productId !== "none" && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                  Taux estimé pour un horizon de {horizonLabel(horizonYears)} : <strong className="text-foreground">{computedRate}% / an</strong>
                </div>
              )}
            </div>
          )}

          {/* Projection preview */}
          {targetNum > 0 && (apportNum > 0 || monthlyNum > 0) && (
            <div className={`rounded-lg p-4 space-y-2 border ${
              projection.pct >= 100 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50' 
                : projection.pct >= 80 
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50'
            }`}>
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Projection à {horizonLabel(horizonYears)}</span>
                <span className={projection.pct >= 100 ? 'text-green-700 dark:text-green-400' : projection.pct >= 80 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}>
                  {projection.pct >= 100 ? "✅" : projection.pct >= 80 ? "🟠" : "🔴"} {projection.pct}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Capital projeté : </span>
                <strong>{fmt(projection.projected)}</strong>
                <span className="text-muted-foreground"> / Cible : </span>
                <strong>{fmt(targetNum)}</strong>
              </div>
              {projection.gap > 0 && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Gap de {fmt(projection.gap)}. Augmentez votre épargne mensuelle ou rallongez l'horizon.
                </p>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-[10px] text-muted-foreground italic leading-tight">
            Simulation non contractuelle. L'adéquation d'un produit à votre situation réelle nécessite l'analyse d'un expert certifié.
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {editingProject ? "Mettre à jour" : "Créer le projet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
