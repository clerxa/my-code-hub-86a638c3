import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RotateCcw, AlertTriangle } from "lucide-react";

interface UserResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onReset: () => void;
  bulkUserIds?: string[];
}

export function UserResetDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onReset,
  bulkUserIds,
}: UserResetDialogProps) {
  const [resetting, setResetting] = useState(false);

  const isBulk = bulkUserIds && bulkUserIds.length > 1;
  const userIds = isBulk ? bulkUserIds : [userId];

  const handleReset = async () => {
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-user-data", {
        body: { userIds },
      });

      if (error) throw error;

      const summary = data?.summary;
      if (summary?.failed > 0) {
        toast.error(`${summary.failed} réinitialisation(s) en échec`);
      } else {
        toast.success(
          isBulk
            ? `${userIds.length} utilisateurs réinitialisés — profils vierges`
            : `${userName} réinitialisé — profil vierge`
        );
      }

      onOpenChange(false);
      onReset();
    } catch (error) {
      console.error("Error resetting user:", error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setResetting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Réinitialiser {isBulk ? `${userIds.length} utilisateurs` : userName}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Cette action supprimera <strong>toutes les données</strong> de{" "}
              {isBulk ? "ces utilisateurs" : "cet utilisateur"} pour en faire un profil vierge.
            </p>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive mb-2">Données supprimées :</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-xs">
                <li>Points, badges et progression</li>
                <li>Parcours et modules validés</li>
                <li>Toutes les simulations</li>
                <li>Analyse ATLAS (avis d'imposition)</li>
                <li>Profil financier et patrimonial</li>
                <li>Profil de risque et diagnostic</li>
                <li>Rendez-vous et réservations</li>
                <li>Publications forum</li>
                <li>Notifications et historique</li>
              </ul>
            </div>
            <p className="text-xs">
              <strong>Conservés :</strong> prénom, nom, email, entreprise.
            </p>
            <p className="font-semibold text-destructive text-sm">
              Cette action est irréversible.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={resetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Réinitialisation en cours…" : "Confirmer la réinitialisation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
