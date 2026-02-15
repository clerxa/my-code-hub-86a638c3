import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Info, Loader2, Sparkles } from "lucide-react";
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
  risk_level: number | null;
  liquidity_type: string | null;
  disclaimer_specific: string | null;
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

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function horizonLabel(years: number): string {
  return years === 1 ? "1 an" : `${years} ans`;
}

const STEPS = [
  { key: "objective", label: "Objectif" },
  { key: "horizon", label: "Horizon" },
  { key: "target", label: "Cible" },
  { key: "budget", label: "Budget" },
  { key: "placement", label: "Placement" },
  { key: "confirm", label: "Confirmer" },
] as const;

export function ProjectFormDialog({
  open,
  onOpenChange,
  editingProject,
  availableCapital,
  availableMonthly,
  onSave,
}: ProjectFormDialogProps) {
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [rateTiers, setRateTiers] = useState<RateTier[]>([]);
  const [productCategoryLinks, setProductCategoryLinks] = useState<ProductCategoryLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Target");
  const [categoryId, setCategoryId] = useState("");
  const [apport, setApport] = useState("");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [horizonYears, setHorizonYears] = useState(10);
  const [productId, setProductId] = useState("none");
  const [notes, setNotes] = useState("");

  // Fetch reference data
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      const [{ data: cats }, { data: prods }, { data: tiers }, { data: links }] = await Promise.all([
        supabase.from("horizon_project_categories").select("id, name, icon, color").eq("is_active", true).order("display_order"),
        supabase.from("financial_products").select("id, name, target_return, horizon_min_years, horizon_max_years, risk_level, liquidity_type, disclaimer_specific").eq("is_active", true).order("display_order"),
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

  // Pre-fill or reset
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
      setStep(0);
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
      setStep(0);
    }
  }, [editingProject, open]);

  // Filter products by category + horizon
  const filteredProducts = useMemo(() => {
    if (!categoryId) return [];
    const linkedIds = productCategoryLinks.filter(l => l.category_id === categoryId).map(l => l.product_id);
    const hasLinks = productCategoryLinks.some(l => l.category_id === categoryId);

    return allProducts.filter(p => {
      if (hasLinks && !linkedIds.includes(p.id)) return false;
      const minY = p.horizon_min_years ?? 1;
      const maxY = p.horizon_max_years ?? 40;
      return horizonYears >= minY && horizonYears <= maxY;
    });
  }, [allProducts, categoryId, horizonYears, productCategoryLinks]);

  // Products locked by horizon (for hint message)
  const lockedByHorizon = useMemo(() => {
    if (!categoryId) return [];
    const linkedIds = productCategoryLinks.filter(l => l.category_id === categoryId).map(l => l.product_id);
    const hasLinks = productCategoryLinks.some(l => l.category_id === categoryId);

    return allProducts.filter(p => {
      if (hasLinks && !linkedIds.includes(p.id)) return false;
      const minY = p.horizon_min_years ?? 1;
      return horizonYears < minY;
    });
  }, [allProducts, categoryId, horizonYears, productCategoryLinks]);

  // Compute rate for selected product + horizon
  const computedRate = useMemo(() => {
    if (productId === "none") return 0;
    const tier = rateTiers.find(
      t => t.product_id === productId && horizonYears >= t.horizon_min_years && horizonYears <= t.horizon_max_years
    );
    if (tier) return Number(tier.annual_rate);
    const prod = allProducts.find(p => p.id === productId);
    if (prod?.target_return) {
      const match = prod.target_return.match(/(\d+(?:[.,]\d+)?)/);
      if (match) return Number(match[1].replace(",", "."));
    }
    return 0;
  }, [productId, horizonYears, rateTiers, allProducts]);

  // Reset product when it leaves filtered list
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

  // Projection
  const projection = useMemo(() => {
    const rate = computedRate / 100;
    const mr = rate / 12;
    const m = durationMonths;
    let projected = mr > 0
      ? apportNum * Math.pow(1 + mr, m) + monthlyNum * ((Math.pow(1 + mr, m) - 1) / mr)
      : apportNum + monthlyNum * m;
    const gap = targetNum > 0 ? targetNum - projected : 0;
    const pct = targetNum > 0 ? Math.min(100, Math.round((projected / targetNum) * 100)) : 0;
    return { projected, gap, pct };
  }, [apportNum, monthlyNum, computedRate, durationMonths, targetNum]);

  // Step validation
  const canNext = useMemo(() => {
    switch (step) {
      case 0: return !!categoryId && !!name.trim();
      case 1: return true; // slider always valid
      case 2: return targetNum > 0;
      case 3: return (apportNum > 0 || monthlyNum > 0) && !capitalError && !monthlyError;
      case 4: return true; // placement is optional
      case 5: return true;
      default: return false;
    }
  }, [step, categoryId, name, targetNum, apportNum, monthlyNum, capitalError, monthlyError]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  // Fake analysis animation on step 4 entry
  const goToStep = useCallback((target: number) => {
    if (target === 4 && step === 3) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setStep(4);
      }, 1800);
    } else {
      setStep(target);
    }
  }, [step]);

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

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Progress bar */}
        <div className="px-6 pt-6 pb-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Étape {step + 1} / {STEPS.length}</span>
            <span>{STEPS[step].label}</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Analyzing overlay */}
        {analyzing ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="relative">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground">Analyse en cours…</p>
              <p className="text-sm text-muted-foreground">
                Recherche des placements adaptés à votre objectif et horizon.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 min-h-[280px]">
            {/* ── Step 0: Objectif + Nom + Icône ── */}
            {step === 0 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Quel est votre objectif ?</h3>
                  <p className="text-sm text-muted-foreground">Choisissez un type de projet et donnez-lui un nom.</p>
                </div>

                {/* Category grid */}
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => {
                    const CatIcon = getProjectIcon(cat.icon);
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(cat.id);
                          setIcon(cat.icon);
                          if (!name.trim()) setName(cat.name);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <div className="p-2 rounded-lg" style={{ backgroundColor: cat.color + "20" }}>
                          <CatIcon className="h-5 w-5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label>Nom du projet</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Maison principale, Vacances 2027…"
                  />
                </div>

                {/* Icon picker */}
                {selectedCategory && (
                  <div className="space-y-2">
                    <Label>Icône</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_ICONS.map(iconName => {
                        const IconComp = getProjectIcon(iconName);
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setIcon(iconName)}
                            className={`p-2 rounded-lg border transition-colors ${
                              icon === iconName
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <IconComp className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 1: Horizon de placement ── */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Horizon de placement</h3>
                  <p className="text-sm text-muted-foreground">
                    Sur combien de temps souhaitez-vous investir pour « {name} » ?
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-primary">{horizonYears}</span>
                    <span className="text-lg text-muted-foreground ml-2">an{horizonYears > 1 ? "s" : ""}</span>
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
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40 ans</span>
                  </div>
                </div>

                <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 inline mr-1" />
                  Un horizon plus long permet généralement d'accéder à des placements plus performants, mais aussi plus volatils.
                </div>
              </div>
            )}

            {/* ── Step 2: Montant cible ── */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Montant cible</h3>
                  <p className="text-sm text-muted-foreground">
                    Quel montant souhaitez-vous atteindre dans {horizonLabel(horizonYears)} ?
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Montant souhaité (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    placeholder="250 000"
                    className="text-lg h-12"
                    autoFocus
                  />
                </div>

                {targetNum > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Objectif : atteindre <strong className="text-foreground">{fmt(targetNum)}</strong> sur{" "}
                    <strong className="text-foreground">{horizonLabel(horizonYears)}</strong>.
                  </p>
                )}
              </div>
            )}

            {/* ── Step 3: Budget ── */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Budget alloué</h3>
                  <p className="text-sm text-muted-foreground">
                    Combien pouvez-vous investir dans ce projet ?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Apport initial (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={apport}
                      onChange={e => setApport(e.target.value)}
                      placeholder="20 000"
                    />
                    <p className="text-xs text-muted-foreground">Disponible : {fmt(availableCapital)}</p>
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
                    <p className="text-xs text-muted-foreground">Disponible : {fmt(availableMonthly)}/mois</p>
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

                {/* Quick projection preview */}
                {(apportNum > 0 || monthlyNum > 0) && targetNum > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 text-sm">
                    Sans placement, vous accumulerez <strong>{fmt(apportNum + monthlyNum * durationMonths)}</strong> sur {horizonLabel(horizonYears)}.
                    {apportNum + monthlyNum * durationMonths < targetNum && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {" "}Un placement peut vous aider à combler l'écart.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4: Placement recommandé ── */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Placement recommandé</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredProducts.length > 0
                      ? `${filteredProducts.length} produit${filteredProducts.length > 1 ? "s" : ""} adapté${filteredProducts.length > 1 ? "s" : ""} à votre profil.`
                      : "Aucun produit disponible pour cette configuration."}
                  </p>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground space-y-2">
                    <Info className="h-8 w-8 mx-auto opacity-40" />
                    <p className="text-sm">Aucun placement ne correspond à cet objectif et horizon.</p>
                    <p className="text-xs">Vous pouvez continuer sans placement.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* No placement option */}
                    <button
                      type="button"
                      onClick={() => setProductId("none")}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        productId === "none"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-muted">
                        <Info className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Sans placement</p>
                        <p className="text-xs text-muted-foreground">Épargne simple, pas de rendement</p>
                      </div>
                    </button>

                    {filteredProducts.map(p => {
                      const isSelected = productId === p.id;
                      const tier = rateTiers.find(
                        t => t.product_id === p.id && horizonYears >= t.horizon_min_years && horizonYears <= t.horizon_max_years
                      );
                      const rate = tier ? Number(tier.annual_rate) : (() => {
                        if (p.target_return) {
                          const m = p.target_return.match(/(\d+(?:[.,]\d+)?)/);
                          return m ? Number(m[1].replace(",", ".")) : 0;
                        }
                        return 0;
                      })();

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProductId(p.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                              {p.risk_level != null && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  Risque {p.risk_level}/7
                                </span>
                              )}
                              {p.liquidity_type && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  Liquidité : {p.liquidity_type}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-primary">{rate}%</p>
                            <p className="text-[10px] text-muted-foreground">/ an</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Locked products hint */}
                {lockedByHorizon.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      Augmentez votre horizon pour débloquer des placements plus performants ({lockedByHorizon.map(p => p.name).join(", ")}).
                    </span>
                  </div>
                )}

                {productId !== "none" && (
                  <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <p>
                      <Info className="h-3.5 w-3.5 inline mr-1" />
                      Taux estimé pour un horizon de {horizonLabel(horizonYears)} :{" "}
                      <strong className="text-foreground">{computedRate}% / an</strong>
                    </p>
                    {(() => {
                      const selected = allProducts.find(p => p.id === productId);
                      return selected?.disclaimer_specific ? (
                        <p className="italic text-[10px] leading-tight mt-1">{selected.disclaimer_specific}</p>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 5: Confirmation / Récapitulatif ── */}
            {step === 5 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Récapitulatif</h3>
                  <p className="text-sm text-muted-foreground">Vérifiez les détails avant de créer votre projet.</p>
                </div>

                {/* Summary card */}
                <div className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const IconComp = getProjectIcon(icon);
                      return (
                        <div className="p-2 rounded-lg" style={{ backgroundColor: (selectedCategory?.color || "#3B82F6") + "20" }}>
                          <IconComp className="h-6 w-6" style={{ color: selectedCategory?.color || "#3B82F6" }} />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{selectedCategory?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Horizon</span>
                      <p className="font-medium">{horizonLabel(horizonYears)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Cible</span>
                      <p className="font-medium">{fmt(targetNum)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Apport</span>
                      <p className="font-medium">{fmt(apportNum)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Mensualité</span>
                      <p className="font-medium">{fmt(monthlyNum)}/mois</p>
                    </div>
                  </div>

                  {productId !== "none" && (
                    <div className="text-sm border-t pt-2">
                      <span className="text-xs text-muted-foreground">Placement</span>
                      <p className="font-medium">
                        {allProducts.find(p => p.id === productId)?.name} · {computedRate}% / an
                      </p>
                    </div>
                  )}
                </div>

                {/* Projection */}
                <div
                  className={`rounded-lg p-4 space-y-2 border ${
                    projection.pct >= 100
                      ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50"
                      : projection.pct >= 80
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                        : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Projection</span>
                    <span
                      className={
                        projection.pct >= 100
                          ? "text-green-700 dark:text-green-400"
                          : projection.pct >= 80
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-red-700 dark:text-red-400"
                      }
                    >
                      {projection.pct >= 100 ? "✅" : projection.pct >= 80 ? "🟠" : "🔴"} {projection.pct}%
                    </span>
                  </div>
                  <p className="text-sm">
                    Capital projeté : <strong>{fmt(projection.projected)}</strong>
                  </p>
                  {projection.gap > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      Gap : {fmt(projection.gap)}
                    </p>
                  )}
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-muted-foreground italic leading-tight">
                  Outil pédagogique uniquement. Les projections sont indicatives et ne constituent pas un conseil en investissement.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation footer */}
        {!analyzing && (
          <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? "Annuler" : "Retour"}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button size="sm" disabled={!canNext} onClick={() => goToStep(step + 1)} className="gap-1">
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" disabled={saving} onClick={handleSave} className="gap-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingProject ? "Mettre à jour" : "Créer le projet"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
