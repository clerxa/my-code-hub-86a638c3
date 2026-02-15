import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link2, Unlink, Info } from "lucide-react";
import { getIconByName } from "./IconSelector";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
  horizon_min_years: number | null;
  horizon_max_years: number | null;
  risk_level: number | null;
  liquidity_type: string | null;
}

interface CategoryLink {
  product_id: string;
  category_id: string;
}

export function ProductObjectiveMatrixTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [links, setLinks] = useState<CategoryLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [{ data: cats }, { data: prods }, { data: lnks }] = await Promise.all([
        supabase.from("horizon_project_categories").select("id, name, icon, color, is_active").order("display_order"),
        supabase.from("financial_products").select("id, name, slug, icon, is_active, horizon_min_years, horizon_max_years, risk_level, liquidity_type").eq("is_active", true).order("display_order"),
        supabase.from("product_category_links").select("product_id, category_id"),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setLinks(lnks || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const isLinked = (productId: string, categoryId: string) =>
    links.some(l => l.product_id === productId && l.category_id === categoryId);

  const toggleLink = async (productId: string, categoryId: string) => {
    const key = `${productId}-${categoryId}`;
    setSaving(key);
    try {
      if (isLinked(productId, categoryId)) {
        const { error } = await supabase
          .from("product_category_links")
          .delete()
          .eq("product_id", productId)
          .eq("category_id", categoryId);
        if (error) throw error;
        setLinks(prev => prev.filter(l => !(l.product_id === productId && l.category_id === categoryId)));
        toast.success("Lien supprimé");
      } else {
        const { error } = await supabase
          .from("product_category_links")
          .insert({ product_id: productId, category_id: categoryId });
        if (error) throw error;
        setLinks(prev => [...prev, { product_id: productId, category_id: categoryId }]);
        toast.success("Lien créé");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(null);
    }
  };

  const linkCountByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    links.forEach(l => { map[l.product_id] = (map[l.product_id] || 0) + 1; });
    return map;
  }, [links]);

  const linkCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    links.forEach(l => { map[l.category_id] = (map[l.category_id] || 0) + 1; });
    return map;
  }, [links]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Matrice Objectifs × Produits</h2>
        <p className="text-muted-foreground">
          Configurez quels produits financiers sont recommandés pour chaque objectif du module Horizon.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            Activez un produit pour un objectif en cliquant sur le toggle. Les produits seront filtrés 
            dans le wizard de création de projet selon <strong>l'objectif choisi</strong> ET <strong>l'horizon de placement</strong> 
            (horizon ≥ horizon minimum du produit).
          </p>
          <p>
            Si aucun produit n'est lié à un objectif, <strong>tous les produits actifs</strong> seront proposés (filtrage par horizon uniquement).
          </p>
        </div>
      </div>

      {/* Matrix */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground sticky left-0 bg-card z-10 min-w-[220px]">
                    Produit
                  </th>
                  {categories.map(cat => {
                    const CatIcon = getIconByName(cat.icon);
                    return (
                      <th key={cat.id} className="p-3 text-center min-w-[140px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            {CatIcon && <CatIcon className="h-4 w-4" />}
                          </div>
                          <span className="text-xs font-medium text-foreground leading-tight max-w-[120px]">
                            {cat.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {linkCountByCategory[cat.id] || 0} produit{(linkCountByCategory[cat.id] || 0) > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const ProdIcon = getIconByName(product.icon);
                  return (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            {ProdIcon && <ProdIcon className="h-4 w-4 text-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Min {product.horizon_min_years ?? 1} an{(product.horizon_min_years ?? 1) > 1 ? 's' : ''}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Risque {product.risk_level ?? '?'}/7
                              </Badge>
                              {product.liquidity_type && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {product.liquidity_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {categories.map(cat => {
                        const linked = isLinked(product.id, cat.id);
                        const key = `${product.id}-${cat.id}`;
                        const isSaving = saving === key;
                        return (
                          <td key={cat.id} className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Switch
                                checked={linked}
                                onCheckedChange={() => toggleLink(product.id, cat.id)}
                                disabled={isSaving}
                                className={cn(
                                  "data-[state=checked]:bg-primary",
                                  isSaving && "opacity-50"
                                )}
                              />
                              {linked ? (
                                <Link2 className="h-3 w-3 text-primary" />
                              ) : (
                                <Unlink className="h-3 w-3 text-muted-foreground/30" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
            <p className="text-xs text-muted-foreground">Produits actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Objectifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">{links.length}</p>
            <p className="text-xs text-muted-foreground">Liens actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {products.filter(p => !linkCountByProduct[p.id]).length}
            </p>
            <p className="text-xs text-muted-foreground">Produits non liés</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
