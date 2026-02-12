import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface WebinarCompanyAssignmentProps {
  moduleId: number | null;
  onAssignmentChange?: (companyIds: string[]) => void;
}

export const WebinarCompanyAssignment = ({ 
  moduleId, 
  onAssignmentChange 
}: WebinarCompanyAssignmentProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanies();
    if (moduleId) {
      fetchAssignments();
    }
  }, [moduleId]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    if (!moduleId) return;
    
    try {
      const { data, error } = await supabase
        .from("company_webinars")
        .select("company_id")
        .eq("module_id", moduleId);

      if (error) throw error;
      
      const assignedIds = data?.map(d => d.company_id) || [];
      setSelectedCompanies(assignedIds);
      
      // Check if all companies are selected
      if (assignedIds.length > 0 && companies.length > 0) {
        setAllSelected(assignedIds.length === companies.length);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  useEffect(() => {
    if (companies.length > 0 && moduleId) {
      fetchAssignments();
    }
  }, [companies]);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedCompanies([]);
      setAllSelected(false);
    } else {
      setSelectedCompanies(companies.map(c => c.id));
      setAllSelected(true);
    }
    onAssignmentChange?.(allSelected ? [] : companies.map(c => c.id));
  };

  const handleToggleCompany = (companyId: string) => {
    let newSelection: string[];
    if (selectedCompanies.includes(companyId)) {
      newSelection = selectedCompanies.filter(id => id !== companyId);
    } else {
      newSelection = [...selectedCompanies, companyId];
    }
    setSelectedCompanies(newSelection);
    setAllSelected(newSelection.length === companies.length);
    onAssignmentChange?.(newSelection);
  };

  const saveAssignments = async () => {
    if (!moduleId) return;
    
    setSaving(true);
    try {
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from("company_webinars")
        .delete()
        .eq("module_id", moduleId);

      if (deleteError) throw deleteError;

      // Insert new assignments
      if (selectedCompanies.length > 0) {
        const { error: insertError } = await supabase
          .from("company_webinars")
          .insert(
            selectedCompanies.map(companyId => ({
              company_id: companyId,
              module_id: moduleId
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success("Attribution des entreprises enregistrée");
    } catch (error: any) {
      console.error("Error saving assignments:", error);
      toast.error("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Chargement des entreprises...
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-medium">Attribution aux entreprises</Label>
        </div>
        <Badge variant={selectedCompanies.length > 0 ? "default" : "secondary"}>
          {selectedCompanies.length === companies.length 
            ? "Toutes" 
            : `${selectedCompanies.length} entreprise${selectedCompanies.length > 1 ? 's' : ''}`
          }
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Sélectionnez les entreprises qui auront accès à ce webinaire (en plus de celles ayant le parcours correspondant)
      </p>

      <div className="flex items-center gap-2 pb-2 border-b">
        <Checkbox
          id="select-all"
          checked={allSelected}
          onCheckedChange={handleSelectAll}
        />
        <Label htmlFor="select-all" className="cursor-pointer font-medium">
          Toutes les entreprises
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
        {companies.map(company => (
          <div key={company.id} className="flex items-center gap-2">
            <Checkbox
              id={`company-${company.id}`}
              checked={selectedCompanies.includes(company.id)}
              onCheckedChange={() => handleToggleCompany(company.id)}
            />
            <Label 
              htmlFor={`company-${company.id}`} 
              className="cursor-pointer text-sm truncate flex-1"
            >
              {company.name}
            </Label>
          </div>
        ))}
      </div>

      {moduleId && (
        <Button 
          onClick={saveAssignments} 
          disabled={saving}
          size="sm"
          className="w-full"
        >
          {saving ? "Enregistrement..." : "Enregistrer l'attribution"}
        </Button>
      )}
      
      {!moduleId && (
        <p className="text-xs text-muted-foreground text-center">
          💡 L'attribution sera sauvegardée après la création du webinaire
        </p>
      )}
    </div>
  );
};
