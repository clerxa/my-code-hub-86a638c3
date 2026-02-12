import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Building2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  id: string;
  name: string;
  partnership_type: string | null;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company_id: string | null;
  total_points: number;
  completed_modules: number[];
}

interface CompanyTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  companies: Company[];
  onSuccess: () => void;
}

interface TransferOptions {
  transferPoints: boolean;
  transferModules: boolean;
  transferSimulations: boolean;
  transferAppointments: boolean;
}

export function CompanyTransferDialog({
  open,
  onOpenChange,
  user,
  companies,
  onSuccess,
}: CompanyTransferDialogProps) {
  const [targetCompanyId, setTargetCompanyId] = useState<string>("");
  const [transferOptions, setTransferOptions] = useState<TransferOptions>({
    transferPoints: true,
    transferModules: true,
    transferSimulations: true,
    transferAppointments: true,
  });
  const [notes, setNotes] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const currentCompany = companies.find(c => c.id === user?.company_id);
  const targetCompany = companies.find(c => c.id === targetCompanyId);
  const availableCompanies = companies.filter(c => c.id !== user?.company_id);

  const resetForm = () => {
    setTargetCompanyId("");
    setTransferOptions({
      transferPoints: true,
      transferModules: true,
      transferSimulations: true,
      transferAppointments: true,
    });
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleTransfer = async () => {
    if (!user || !targetCompanyId) {
      toast.error("Veuillez sélectionner une entreprise de destination");
      return;
    }

    setIsTransferring(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("Session expirée");
        return;
      }

      // 1. Log the transfer in company_transfers table
      // Using type assertion because the table was just created and types may not be regenerated yet
      const { error: transferLogError } = await supabase
        .from("company_transfers" as any)
        .insert({
          user_id: user.id,
          from_company_id: user.company_id,
          to_company_id: targetCompanyId,
          transferred_by: currentUser.id,
          transfer_options: transferOptions,
          notes: notes || null,
        } as any);

      if (transferLogError) {
        console.error("Error logging transfer:", transferLogError);
        throw new Error("Erreur lors de l'enregistrement du transfert");
      }

      // 2. Prepare update data based on transfer options
      const profileUpdate: Record<string, any> = {
        company_id: targetCompanyId,
      };

      // If NOT transferring, reset the data
      if (!transferOptions.transferPoints) {
        profileUpdate.total_points = 0;
      }
      if (!transferOptions.transferModules) {
        profileUpdate.completed_modules = [];
        profileUpdate.current_module = null;
      }

      // 3. Update the user's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw new Error("Erreur lors de la mise à jour du profil");
      }

      // 4. Handle simulations if not transferring (delete them)
      if (!transferOptions.transferSimulations) {
        // Delete all simulations for this user
        const simulationTables = [
          "capacite_emprunt_simulations",
          "epargne_precaution_simulations",
          "lmnp_simulations",
          "espp_plans",
        ] as const;

        for (const table of simulationTables) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq("user_id", user.id);

          if (error) {
            console.warn(`Warning: Could not delete from ${table}:`, error);
          }
        }
      }

      // 5. Handle appointments if not transferring (we'll keep them but they won't show in new company context)
      // For now, we don't delete appointments as they might be important for historical tracking

      toast.success(
        `${user.first_name || user.email} a été transféré(e) vers ${targetCompany?.name}`
      );
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du transfert");
    } finally {
      setIsTransferring(false);
    }
  };

  const isAnyOptionDisabled = !transferOptions.transferPoints || 
    !transferOptions.transferModules || 
    !transferOptions.transferSimulations || 
    !transferOptions.transferAppointments;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Transférer vers une autre entreprise
          </DialogTitle>
          <DialogDescription>
            Transférer {user.first_name} {user.last_name || user.email} vers une nouvelle entreprise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current and target company */}
          <div className="flex items-center gap-4">
            <div className="flex-1 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Entreprise actuelle</p>
              <p className="font-medium">{currentCompany?.name || "Aucune"}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <Select value={targetCompanyId} onValueChange={setTargetCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Données à transférer</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="transferPoints"
                  checked={transferOptions.transferPoints}
                  onCheckedChange={(checked) =>
                    setTransferOptions((prev) => ({ ...prev, transferPoints: !!checked }))
                  }
                />
                <Label htmlFor="transferPoints" className="text-sm font-normal cursor-pointer">
                  Points ({user.total_points} pts)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="transferModules"
                  checked={transferOptions.transferModules}
                  onCheckedChange={(checked) =>
                    setTransferOptions((prev) => ({ ...prev, transferModules: !!checked }))
                  }
                />
                <Label htmlFor="transferModules" className="text-sm font-normal cursor-pointer">
                  Modules complétés ({user.completed_modules?.length || 0} modules)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="transferSimulations"
                  checked={transferOptions.transferSimulations}
                  onCheckedChange={(checked) =>
                    setTransferOptions((prev) => ({ ...prev, transferSimulations: !!checked }))
                  }
                />
                <Label htmlFor="transferSimulations" className="text-sm font-normal cursor-pointer">
                  Simulations sauvegardées
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="transferAppointments"
                  checked={transferOptions.transferAppointments}
                  onCheckedChange={(checked) =>
                    setTransferOptions((prev) => ({ ...prev, transferAppointments: !!checked }))
                  }
                />
                <Label htmlFor="transferAppointments" className="text-sm font-normal cursor-pointer">
                  Rendez-vous & inscriptions webinaires
                </Label>
              </div>
            </div>
          </div>

          {/* Warning if data will be reset */}
          {isAnyOptionDisabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Les données non cochées seront réinitialisées à zéro. Cette action est irréversible.
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              placeholder="Raison du transfert, informations complémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isTransferring}>
            Annuler
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!targetCompanyId || isTransferring}
          >
            {isTransferring ? "Transfert en cours..." : "Transférer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
