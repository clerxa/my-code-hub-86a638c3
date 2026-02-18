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
import { PostSaveExpertPrompt } from "./PostSaveExpertPrompt";

interface SaveSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationName: string;
  onSimulationNameChange: (name: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
  /** Show expert booking prompt after save */
  showExpertPrompt?: boolean;
  /** Close expert prompt callback */
  onCloseExpertPrompt?: () => void;
}

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
  showExpertPrompt = false,
  onCloseExpertPrompt,
}: SaveSimulationDialogProps) {
  const handleCancelClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
  };

  const handleSaveClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && simulationName.trim()) {
      e.preventDefault();
      e.stopPropagation();
      onSave();
    }
  };

  return (
    <>
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

      <PostSaveExpertPrompt
        open={showExpertPrompt}
        onClose={onCloseExpertPrompt || (() => {})}
      />
    </>
  );
}
