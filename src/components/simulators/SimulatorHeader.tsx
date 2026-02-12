import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, List } from "lucide-react";

interface SimulatorHeaderProps {
  /**
   * Titre du simulateur
   */
  title: string;
  
  /**
   * Description optionnelle
   */
  description?: string;
  
  /**
   * Callback pour retour arrière
   */
  onBack?: () => void;
  
  /**
   * Callback pour ouvrir le dialog de sauvegarde
   */
  onSave?: () => void;
  
  /**
   * Callback pour voir les simulations
   */
  onViewSimulations?: () => void;
  
  /**
   * Texte du bouton retour
   */
  backLabel?: string;
  
  /**
   * Actions supplémentaires à afficher
   */
  actions?: ReactNode;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Header réutilisable pour les simulateurs avec navigation et actions
 * 
 * @example
 * ```tsx
 * <SimulatorHeader
 *   title="Simulateur PER"
 *   description="Calculez votre économie d'impôts"
 *   onBack={() => navigate(-1)}
 *   onSave={() => setShowSaveDialog(true)}
 *   onViewSimulations={() => navigate('/employee/simulations')}
 * />
 * ```
 */
export function SimulatorHeader({
  title,
  description,
  onBack,
  onSave,
  onViewSimulations,
  backLabel = "Retour",
  actions,
  className = "",
}: SimulatorHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {onViewSimulations && (
            <Button variant="outline" onClick={onViewSimulations} className="gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Mes simulations</span>
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} className="gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </Button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
