import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "./ImageUpload";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Partner {
  id: string;
  product_id: string;
  name: string;
  logo_url: string | null;
  display_order: number;
}

interface ProductPartnersEditorProps {
  productId: string | null; // null when creating a new product
}

export function ProductPartnersEditor({ productId }: ProductPartnersEditorProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (productId) fetchPartners();
    else setPartners([]);
  }, [productId]);

  const fetchPartners = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("financial_product_partners")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPartner = async () => {
    if (!productId) {
      toast.error("Veuillez d'abord sauvegarder le produit avant d'ajouter des partenaires");
      return;
    }
    if (!newName.trim()) return;

    try {
      const { error } = await supabase
        .from("financial_product_partners")
        .insert({
          product_id: productId,
          name: newName.trim(),
          display_order: partners.length,
        });

      if (error) throw error;
      setNewName("");
      fetchPartners();
      toast.success("Partenaire ajouté");
    } catch (error: any) {
      console.error("Error adding partner:", error);
      toast.error(error.message || "Erreur lors de l'ajout");
    }
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    try {
      const { error } = await supabase
        .from("financial_product_partners")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      setPartners(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    } catch (error: any) {
      console.error("Error updating partner:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const deletePartner = async (id: string) => {
    try {
      const { error } = await supabase
        .from("financial_product_partners")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setPartners(prev => prev.filter(p => p.id !== id));
      toast.success("Partenaire supprimé");
    } catch (error: any) {
      console.error("Error deleting partner:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  if (!productId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Sauvegardez d'abord le produit pour ajouter des partenaires.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ajouter un partenaire</Label>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du partenaire..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPartner())}
          />
          <Button type="button" variant="outline" onClick={addPartner}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {partners.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun partenaire ajouté
          </p>
        ) : (
          partners.map((partner) => (
            <Card key={partner.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-48">
                  <Label className="text-xs mb-1 block">Logo</Label>
                  <ImageUpload
                    label=""
                    value={partner.logo_url || ""}
                    onChange={(url) => updatePartner(partner.id, { logo_url: url })}
                    bucketName="company-assets"
                    maxWidth="max-w-[180px]"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Nom</Label>
                  <Input
                    value={partner.name}
                    onChange={(e) => updatePartner(partner.id, { name: e.target.value })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-5"
                  onClick={() => deletePartner(partner.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
