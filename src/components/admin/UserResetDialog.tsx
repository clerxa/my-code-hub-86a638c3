import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RotateCcw, Trophy, GraduationCap, Calculator, Calendar, AlertTriangle } from "lucide-react";

interface UserResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onReset: () => void;
  bulkUserIds?: string[];
}

interface ResetOptions {
  resetPoints: boolean;
  resetModules: boolean;
  resetSimulations: boolean;
  resetAppointments: boolean;
}

export function UserResetDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onReset,
  bulkUserIds,
}: UserResetDialogProps) {
  const [options, setOptions] = useState<ResetOptions>({
    resetPoints: false,
    resetModules: false,
    resetSimulations: false,
    resetAppointments: false,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isBulk = bulkUserIds && bulkUserIds.length > 1;
  const userIds = isBulk ? bulkUserIds : [userId];

  const handleReset = async () => {
    if (!Object.values(options).some(Boolean)) {
      toast.error("Sélectionnez au moins une option à réinitialiser");
      return;
    }

    setResetting(true);
    try {
      let hasError = false;

      if (options.resetPoints) {
        const { error: pointsError } = await supabase
          .from('profiles')
          .update({ total_points: 0 })
          .in('id', userIds);
        
        if (pointsError) {
          console.error('Error resetting points:', pointsError);
          hasError = true;
        }

        // Also reset daily logins
        const { error: loginsError } = await supabase
          .from('daily_logins')
          .delete()
          .in('user_id', userIds);
        
        if (loginsError) {
          console.error('Error resetting daily logins:', loginsError);
        }
      }

      if (options.resetModules) {
        const { error: modulesError } = await supabase
          .from('profiles')
          .update({ completed_modules: [] })
          .in('id', userIds);
        
        if (modulesError) {
          console.error('Error resetting completed modules:', modulesError);
          hasError = true;
        }

        // Delete module validations
        const { error: validationsError } = await supabase
          .from('module_validations')
          .delete()
          .in('user_id', userIds);
        
        if (validationsError) {
          console.error('Error deleting module validations:', validationsError);
        }

        // Delete parcours progress
        const { error: progressError } = await (supabase as any)
          .from('parcours_progress')
          .delete()
          .in('user_id', userIds);
        
        if (progressError) {
          console.error('Error deleting parcours progress:', progressError);
        }
      }

      if (options.resetSimulations) {
        // Delete all simulation logs
        const { error: logsError } = await supabase
          .from('simulation_logs')
          .delete()
          .in('user_id', userIds);
        
        if (logsError) {
          console.error('Error deleting simulation logs:', logsError);
        }

        // Delete saved simulations for each type
        const { error: capaciteError } = await supabase
          .from('capacite_emprunt_simulations')
          .delete()
          .in('user_id', userIds);
        
        if (capaciteError) {
          console.error('Error deleting capacite simulations:', capaciteError);
        }

        const { error: epargneError } = await supabase
          .from('epargne_precaution_simulations')
          .delete()
          .in('user_id', userIds);
        
        if (epargneError) {
          console.error('Error deleting epargne simulations:', epargneError);
        }
      }

      if (options.resetAppointments) {
        const { error: appointmentsError } = await supabase
          .from('appointments')
          .delete()
          .in('user_id', userIds);
        
        if (appointmentsError) {
          console.error('Error deleting appointments:', appointmentsError);
          hasError = true;
        }
      }

      if (hasError) {
        toast.error("Certaines réinitialisations ont échoué");
      } else {
        toast.success(
          isBulk 
            ? `${userIds.length} utilisateurs réinitialisés avec succès`
            : "Utilisateur réinitialisé avec succès"
        );
      }

      setConfirmOpen(false);
      onOpenChange(false);
      onReset();

      // Reset form
      setOptions({
        resetPoints: false,
        resetModules: false,
        resetSimulations: false,
        resetAppointments: false,
      });
    } catch (error) {
      console.error('Error resetting user:', error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setResetting(false);
    }
  };

  const resetOptionsList = [
    {
      key: 'resetPoints' as const,
      label: 'Points',
      description: 'Remettre les points à zéro',
      icon: Trophy,
    },
    {
      key: 'resetModules' as const,
      label: 'Parcours & Modules',
      description: 'Supprimer la progression des modules et parcours',
      icon: GraduationCap,
    },
    {
      key: 'resetSimulations' as const,
      label: 'Simulations',
      description: 'Supprimer toutes les simulations sauvegardées',
      icon: Calculator,
    },
    {
      key: 'resetAppointments' as const,
      label: 'Rendez-vous',
      description: 'Supprimer tous les rendez-vous',
      icon: Calendar,
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Réinitialiser {isBulk ? `${userIds.length} utilisateurs` : userName}
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les données à réinitialiser. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resetOptionsList.map(({ key, label, description, icon: Icon }) => (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setOptions(prev => ({ ...prev, [key]: !prev[key] }))}
              >
                <Checkbox
                  checked={options[key]}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, [key]: checked as boolean }))
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium cursor-pointer">{label}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={!Object.values(options).some(Boolean)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la réinitialisation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de réinitialiser{" "}
              {isBulk ? `${userIds.length} utilisateurs` : userName}.
              <br /><br />
              <strong>Données qui seront supprimées :</strong>
              <ul className="list-disc list-inside mt-2">
                {options.resetPoints && <li>Points (remis à 0)</li>}
                {options.resetModules && <li>Progression des parcours et modules</li>}
                {options.resetSimulations && <li>Simulations sauvegardées</li>}
                {options.resetAppointments && <li>Rendez-vous</li>}
              </ul>
              <br />
              <strong className="text-destructive">Cette action est irréversible.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? "Réinitialisation..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
