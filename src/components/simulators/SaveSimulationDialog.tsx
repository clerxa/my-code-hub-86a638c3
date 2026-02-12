import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KeyboardEvent, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

interface SaveSimulationDialogProps {
  /**
   * Contrôle l'ouverture du dialog
   */
  open: boolean;
  
  /**
   * Callback de fermeture
   */
  onOpenChange: (open: boolean) => void;
  
  /**
   * Nom de la simulation
   */
  simulationName: string;
  
  /**
   * Callback de changement de nom
   */
  onSimulationNameChange: (name: string) => void;
  
  /**
   * Callback de sauvegarde
   */
  onSave: () => void;
  
  /**
   * État de sauvegarde en cours
   */
  isSaving?: boolean;
  
  /**
   * Titre du dialog
   */
  title?: string;
  
  /**
   * Description du dialog
   */
  description?: string;
  
  /**
   * Placeholder du champ de nom
   */
  placeholder?: string;
}

/**
 * Dialog réutilisable pour sauvegarder une simulation
 * 
 * @example
 * ```tsx
 * <SaveSimulationDialog
 *   open={showSaveDialog}
 *   onOpenChange={setShowSaveDialog}
 *   simulationName={nomSimulation}
 *   onSimulationNameChange={setNomSimulation}
 *   onSave={handleSave}
 *   isSaving={isSaving}
 * />
 * ```
 */
export function SaveSimulationDialog({
  open,
  onOpenChange,
  simulationName,
  onSimulationNameChange,
  onSave,
  isSaving = false,
  title = "Sauvegarder la simulation",
  description = "Donnez un nom à votre simulation pour la retrouver facilement",
  placeholder = "Ma simulation",
}: SaveSimulationDialogProps) {
  const handleCancelClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Par sécurité: empêcher toute soumission HTML parent (si jamais un <form> existe au-dessus)
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
  };

  const handleSaveClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Par sécurité: empêcher toute soumission HTML parent (si jamais un <form> existe au-dessus)
    e.preventDefault();
    e.stopPropagation();
    onSave();
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && simulationName.trim()) {
      // Empêche une soumission HTML d'un éventuel <form> parent
      e.preventDefault();
      e.stopPropagation();
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="simulation-name">Nom de la simulation</Label>
            <Input
              id="simulation-name"
              value={simulationName}
              onChange={(e) => onSimulationNameChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
              onKeyDown={handleNameKeyDown}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSaveClick}
            disabled={!simulationName.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
