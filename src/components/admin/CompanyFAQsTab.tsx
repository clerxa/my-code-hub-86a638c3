import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Plus, Trash2, Edit, HelpCircle } from "lucide-react";

interface CompanyFAQ {
  id: string;
  company_id: string | null;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export function CompanyFAQsTab() {
  const [faqs, setFaqs] = useState<CompanyFAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<CompanyFAQ | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    display_order: 0,
    is_active: true
  });

  const categories = [
    { value: "general", label: "Général" },
    { value: "avantages", label: "Avantages salariaux" },
    { value: "fiscalite", label: "Fiscalité" },
    { value: "epargne", label: "Épargne" },
    { value: "investissement", label: "Investissement" },
    { value: "retraite", label: "Retraite" },
    { value: "immobilier", label: "Immobilier" },
    { value: "accompagnement", label: "Accompagnement" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data } = await supabase
      .from("company_faqs")
      .select("*")
      .is("company_id", null)
      .order("display_order", { ascending: true });

    if (data) setFaqs(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question || !formData.answer) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        company_id: null // Global pour toutes les entreprises
      };

      if (editingFAQ) {
        const { error } = await supabase
          .from("company_faqs")
          .update(dataToSave)
          .eq("id", editingFAQ.id);
        
        if (error) throw error;
        toast.success("FAQ mise à jour");
      } else {
        // Get max display_order
        const maxOrder = faqs.reduce((max, f) => Math.max(max, f.display_order), -1);
        
        const { error } = await supabase
          .from("company_faqs")
          .insert({ ...dataToSave, display_order: maxOrder + 1 });
        
        if (error) throw error;
        toast.success("FAQ ajoutée");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette FAQ ?")) return;
    
    try {
      const { error } = await supabase
        .from("company_faqs")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("FAQ supprimée");
      fetchData();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleActive = async (faq: CompanyFAQ) => {
    try {
      const { error } = await supabase
        .from("company_faqs")
        .update({ is_active: !faq.is_active })
        .eq("id", faq.id);
      
      if (error) throw error;
      toast.success(faq.is_active ? "FAQ désactivée" : "FAQ activée");
      fetchData();
    } catch (error) {
      console.error("Error toggling FAQ:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const openEditDialog = (faq: CompanyFAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      display_order: faq.display_order,
      is_active: faq.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      display_order: 0,
      is_active: true
    });
    setEditingFAQ(null);
  };

  const filteredFAQs = selectedCategoryFilter === "all" 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategoryFilter);

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  // Group FAQs by category
  const faqsByCategory = filteredFAQs.reduce((acc, faq) => {
    const cat = faq.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {} as Record<string, CompanyFAQ[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Questions fréquentes
            </CardTitle>
            <CardDescription>
              FAQ disponibles pour toutes les entreprises
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingFAQ ? "Modifier la FAQ" : "Nouvelle question fréquente"}
                </DialogTitle>
                <DialogDescription>
                  Cette FAQ sera disponible pour toutes les entreprises
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question">Question *</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Ex: Comment puis-je accéder à MyFinCare ?"
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">Réponse *</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Réponse détaillée à fournir aux salariés..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Activer cette FAQ</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingFAQ ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label>Filtrer par catégorie</Label>
          <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
            <SelectTrigger className="w-[250px] mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune FAQ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
              <div key={category} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">{getCategoryLabel(category)}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <div className="flex items-center gap-2">
                        <AccordionTrigger className="flex-1 text-left">
                          <span className={!faq.is_active ? "opacity-50" : ""}>
                            {faq.question}
                          </span>
                          {!faq.is_active && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                              Désactivée
                            </span>
                          )}
                        </AccordionTrigger>
                        <div className="flex gap-1 mr-4">
                          <Switch
                            checked={faq.is_active}
                            onCheckedChange={() => toggleActive(faq)}
                            className="data-[state=checked]:bg-primary"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(faq)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(faq.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <AccordionContent>
                        <div className="prose prose-sm max-w-none text-muted-foreground pl-4 border-l-2 border-primary/20">
                          {faq.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}