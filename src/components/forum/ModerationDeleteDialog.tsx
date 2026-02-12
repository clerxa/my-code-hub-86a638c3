/**
 * ===========================================================
 * 📄 File: ModerationDeleteDialog.tsx
 * 📌 Rôle : Dialog de suppression avec choix de raison pour modérateurs
 * ===========================================================
 */

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";

interface ModerationReason {
  id: string;
  label: string;
  description: string | null;
}

interface ModerationDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "comment";
  targetId: string;
  onDeleted: () => void;
}

export function ModerationDeleteDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  onDeleted,
}: ModerationDeleteDialogProps) {
  const [reasons, setReasons] = useState<ModerationReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchReasons();
    }
  }, [open]);

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("forum_moderation_reasons")
        .select("id, label, description")
        .eq("is_active", true)
        .order("order_num");

      if (error) throw error;
      setReasons(data || []);
      if (data && data.length > 0) {
        setSelectedReasonId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching moderation reasons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReasonId) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Soft delete the target
      const table = targetType === "post" ? "forum_posts" : "forum_comments";
      const { error: updateError } = await supabase
        .from(table)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          deletion_reason_id: selectedReasonId,
        })
        .eq("id", targetId);

      if (updateError) throw updateError;

      // Log the moderation action
      const { error: logError } = await supabase
        .from("forum_moderation_logs")
        .insert({
          moderator_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reason_id: selectedReasonId,
          action: "delete",
        });

      if (logError) {
        console.error("Error logging moderation action:", logError);
      }

      toast.success(
        targetType === "post"
          ? "Publication supprimée avec succès"
          : "Commentaire supprimé avec succès"
      );
      
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>
              Supprimer {targetType === "post" ? "cette publication" : "ce commentaire"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left pt-2">
            Sélectionnez la raison de la suppression. Cette action sera enregistrée dans les logs de modération.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            </div>
          ) : (
            <RadioGroup
              value={selectedReasonId}
              onValueChange={setSelectedReasonId}
              className="space-y-3"
            >
              {reasons.map((reason) => (
                <div
                  key={reason.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReasonId(reason.id)}
                >
                  <RadioGroupItem value={reason.id} id={reason.id} className="mt-0.5" />
                  <Label htmlFor={reason.id} className="flex-1 cursor-pointer">
                    <span className="font-medium">{reason.label}</span>
                    {reason.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {reason.description}
                      </p>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !selectedReasonId}
            className="gap-2"
          >
            {deleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Supprimer
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
