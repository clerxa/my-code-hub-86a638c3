import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Plus, Pencil, Trash2, Eye, Copy, Search, 
  Wallet, ArrowUpDown, GripVertical, ExternalLink, Handshake 
} from "lucide-react";
import { ProductPartnersEditor } from "./ProductPartnersEditor";
import { IconSelector, getIconByName } from "./IconSelector";
import { ColorPicker } from "./ColorPicker";
import { ImageUpload } from "./ImageUpload";
import { 
  FinancialProduct, 
  FinancialProductBenefit, 
  PRODUCT_CATEGORIES, 
  DEFAULT_PRODUCT 
} from "@/types/financial-products";
import { ProductOnePager } from "@/components/products/ProductOnePager";
import { cn } from "@/lib/utils";

type FormData = Omit<FinancialProduct, 'id' | 'created_at' | 'updated_at'>;

const initialFormData: FormData = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  tags: [],
  category: '',
  availability: '',
  availability_icon: 'Clock',
  risk_level: 1,
  risk_label: '',
  max_amount: '',
  max_amount_label: 'Plafond',
  target_return: '',
  target_return_label: 'Rendement cible',
  benefits: [],
  fiscal_comparison_enabled: true,
  fiscal_explanation: '',
  fiscal_before_label: 'Sans ce produit',
  fiscal_before_value: '',
  fiscal_after_label: 'Avec ce produit',
  fiscal_after_value: '',
  fiscal_savings_label: 'Économie',
  fiscal_savings_value: '',
  expert_tip_title: "Conseil d'Expert",
  expert_tip_content: '',
  expert_tip_icon: 'Lightbulb',
  cta_text: 'En savoir plus',
  cta_url: '',
  cta_secondary_text: '',
  cta_secondary_url: '',
  hero_image_url: '',
  icon: 'Wallet',
  gradient_start: '217 91% 60%',
  gradient_end: '262 83% 58%',
  is_active: true,
  display_order: 0,
};

export function FinancialProductsTab() {
  const [products, setProducts] = useState<FinancialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FinancialProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<FinancialProduct | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      const typedProducts: FinancialProduct[] = (data || []).map(p => ({
        ...p,
        tags: p.tags || [],
        benefits: (p.benefits as unknown as FinancialProductBenefit[]) || [],
      }));
      
      setProducts(typedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingProduct ? generateSlug(name) : prev.slug,
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      const benefit: FinancialProductBenefit = {
        id: crypto.randomUUID(),
        text: newBenefit.trim(),
        icon: 'Check',
      };
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefit],
      }));
      setNewBenefit('');
    }
  };

  const updateBenefit = (id: string, updates: Partial<FinancialProductBenefit>) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  };

  const removeBenefit = (id: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b.id !== id),
    }));
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: FinancialProduct) => {
    setEditingProduct(product);
    setFormData({
      slug: product.slug,
      name: product.name,
      tagline: product.tagline || '',
      description: product.description || '',
      tags: product.tags || [],
      category: product.category || '',
      availability: product.availability || '',
      availability_icon: product.availability_icon,
      risk_level: product.risk_level,
      risk_label: product.risk_label || '',
      max_amount: product.max_amount || '',
      max_amount_label: product.max_amount_label,
      target_return: product.target_return || '',
      target_return_label: product.target_return_label,
      benefits: product.benefits || [],
      fiscal_comparison_enabled: product.fiscal_comparison_enabled,
      fiscal_explanation: product.fiscal_explanation || '',
      fiscal_before_label: product.fiscal_before_label,
      fiscal_before_value: product.fiscal_before_value || '',
      fiscal_after_label: product.fiscal_after_label,
      fiscal_after_value: product.fiscal_after_value || '',
      fiscal_savings_label: product.fiscal_savings_label,
      fiscal_savings_value: product.fiscal_savings_value || '',
      expert_tip_title: product.expert_tip_title,
      expert_tip_content: product.expert_tip_content || '',
      expert_tip_icon: product.expert_tip_icon,
      cta_text: product.cta_text,
      cta_url: product.cta_url || '',
      cta_secondary_text: product.cta_secondary_text || '',
      cta_secondary_url: product.cta_secondary_url || '',
      hero_image_url: product.hero_image_url || '',
      icon: product.icon,
      gradient_start: product.gradient_start,
      gradient_end: product.gradient_end,
      is_active: product.is_active,
      display_order: product.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Le nom et le slug sont requis');
      return;
    }

    try {
      const payload: any = {
        ...formData,
        benefits: JSON.parse(JSON.stringify(formData.benefits)),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('financial_products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produit mis à jour');
      } else {
        const { error } = await supabase
          .from('financial_products')
          .insert([payload]);

        if (error) throw error;
        toast.success('Produit créé');
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (product: FinancialProduct) => {
    if (!confirm(`Supprimer "${product.name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('financial_products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;
      toast.success('Produit supprimé');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDuplicate = async (product: FinancialProduct) => {
    try {
      const { id, created_at, updated_at, ...rest } = product;
      const newSlug = `${rest.slug}-copy-${Date.now()}`;
      const payload: any = { ...rest, slug: newSlug, name: `${rest.name} (copie)`, benefits: JSON.parse(JSON.stringify(rest.benefits)) };
      
      const { error } = await supabase
        .from('financial_products')
        .insert([payload]);

      if (error) throw error;
      toast.success('Produit dupliqué');
      fetchProducts();
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ProductIcon = getIconByName(formData.icon) || Wallet;

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fiches Produits</h2>
          <p className="text-muted-foreground">Gérez vos OnePagers de produits financiers</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau produit
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit créé'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const Icon = getIconByName(product.icon) || Wallet;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, hsl(${product.gradient_start}), hsl(${product.gradient_end}))` 
                        }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category && (
                        <Badge variant="outline">
                          {PRODUCT_CATEGORIES.find(c => c.value === product.category)?.label || product.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {product.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPreviewProduct(product);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(product)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
              <TabsTrigger value="benefits">Bénéfices</TabsTrigger>
              <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
              <TabsTrigger value="partners">Partenaires</TabsTrigger>
              <TabsTrigger value="cta">CTA & Visuel</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du produit *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: PEA - Plan d'Épargne en Actions"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL) *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="pea-plan-epargne-actions"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slogan / Accroche</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Investissez en bourse avec des avantages fiscaux"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée du produit..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ordre d'affichage</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label>Produit actif</Label>
              </div>
            </TabsContent>

            {/* Snapshot Tab */}
            <TabsContent value="snapshot" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Disponibilité</Label>
                  <Input
                    value={formData.availability}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                    placeholder="Ex: Immédiate, 5 ans..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icône disponibilité</Label>
                  <IconSelector
                    value={formData.availability_icon}
                    onChange={(v) => setFormData(prev => ({ ...prev, availability_icon: v || 'Clock' }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Niveau de risque (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.risk_level}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      risk_level: Math.min(5, Math.max(1, parseInt(e.target.value) || 1))
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label du risque</Label>
                  <Input
                    value={formData.risk_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, risk_label: e.target.value }))}
                    placeholder="Ex: Modéré, Faible..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plafond / Montant max</Label>
                  <Input
                    value={formData.max_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_amount: e.target.value }))}
                    placeholder="Ex: 150 000 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label plafond</Label>
                  <Input
                    value={formData.max_amount_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_amount_label: e.target.value }))}
                    placeholder="Plafond"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rendement cible</Label>
                  <Input
                    value={formData.target_return}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_return: e.target.value }))}
                    placeholder="Ex: 5-8% / an"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label rendement</Label>
                  <Input
                    value={formData.target_return_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_return_label: e.target.value }))}
                    placeholder="Rendement cible"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Benefits Tab */}
            <TabsContent value="benefits" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Ajouter un bénéfice</Label>
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Décrivez un avantage..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  />
                  <Button type="button" variant="outline" onClick={addBenefit}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {formData.benefits.map((benefit, index) => (
                  <Card key={benefit.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-24">
                        <Label className="text-xs">Icône</Label>
                        <IconSelector
                          value={benefit.icon || 'Check'}
                          onChange={(v) => updateBenefit(benefit.id, { icon: v || 'Check' })}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Texte</Label>
                        <Input
                          value={benefit.text}
                          onChange={(e) => updateBenefit(benefit.id, { text: e.target.value })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5"
                        onClick={() => removeBenefit(benefit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Expert Tip */}
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-4">Conseil d'Expert</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={formData.expert_tip_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, expert_tip_title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icône</Label>
                    <IconSelector
                      value={formData.expert_tip_icon}
                      onChange={(v) => setFormData(prev => ({ ...prev, expert_tip_icon: v || 'Lightbulb' }))}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Contenu du conseil</Label>
                  <Textarea
                    value={formData.expert_tip_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, expert_tip_content: e.target.value }))}
                    placeholder="Partagez une règle d'or ou un conseil pratique..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Fiscal Tab */}
            <TabsContent value="fiscal" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Switch
                  checked={formData.fiscal_comparison_enabled}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, fiscal_comparison_enabled: v }))}
                />
                <Label>Activer le comparatif fiscal</Label>
              </div>

              {formData.fiscal_comparison_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Phrase d'explication fiscale</Label>
                    <Input
                      value={formData.fiscal_explanation}
                      onChange={(e) => setFormData(prev => ({ ...prev, fiscal_explanation: e.target.value }))}
                      placeholder="Ex: Grâce au PER, vos versements sont déductibles de votre revenu imposable"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Label "Avant"</Label>
                      <Input
                        value={formData.fiscal_before_label}
                        onChange={(e) => setFormData(prev => ({ ...prev, fiscal_before_label: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valeur "Avant"</Label>
                      <Input
                        value={formData.fiscal_before_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, fiscal_before_value: e.target.value }))}
                        placeholder="Ex: 5 000 € d'impôts"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Label "Après"</Label>
                      <Input
                        value={formData.fiscal_after_label}
                        onChange={(e) => setFormData(prev => ({ ...prev, fiscal_after_label: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valeur "Après"</Label>
                      <Input
                        value={formData.fiscal_after_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, fiscal_after_value: e.target.value }))}
                        placeholder="Ex: 3 500 € d'impôts"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Label économie</Label>
                      <Input
                        value={formData.fiscal_savings_label}
                        onChange={(e) => setFormData(prev => ({ ...prev, fiscal_savings_label: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valeur économie</Label>
                      <Input
                        value={formData.fiscal_savings_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, fiscal_savings_value: e.target.value }))}
                        placeholder="Ex: 1 500 € économisés"
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* CTA & Visual Tab */}
            <TabsContent value="cta" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icône du produit</Label>
                  <IconSelector
                    value={formData.icon}
                    onChange={(v) => setFormData(prev => ({ ...prev, icon: v || 'Wallet' }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aperçu</Label>
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, hsl(${formData.gradient_start}), hsl(${formData.gradient_end}))` 
                    }}
                  >
                    <ProductIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Couleur dégradé début</Label>
                  <ColorPicker
                    label=""
                    value={formData.gradient_start}
                    onChange={(v) => setFormData(prev => ({ ...prev, gradient_start: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Couleur dégradé fin</Label>
                  <ColorPicker
                    label=""
                    value={formData.gradient_end}
                    onChange={(v) => setFormData(prev => ({ ...prev, gradient_end: v }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image Hero (optionnel)</Label>
                <ImageUpload
                  label="Image Hero"
                  value={formData.hero_image_url}
                  onChange={(v) => setFormData(prev => ({ ...prev, hero_image_url: v }))}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-4">Call to Action</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Texte CTA principal</Label>
                    <Input
                      value={formData.cta_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL CTA principal</Label>
                    <Input
                      value={formData.cta_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, cta_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Texte CTA secondaire</Label>
                    <Input
                      value={formData.cta_secondary_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, cta_secondary_text: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL CTA secondaire</Label>
                    <Input
                      value={formData.cta_secondary_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, cta_secondary_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partners" className="mt-4">
              <ProductPartnersEditor productId={editingProduct?.id || null} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const previewData: FinancialProduct = {
                  ...formData,
                  id: editingProduct?.id || 'preview',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                setPreviewProduct(previewData);
                setIsPreviewOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Aperçu
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Aperçu du OnePager</DialogTitle>
          </DialogHeader>
          {previewProduct && (
            <ProductOnePager product={previewProduct} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
