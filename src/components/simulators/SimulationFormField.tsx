import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { ReactNode } from "react";

interface SimulationFormFieldProps {
  /**
   * Label du champ
   */
  label: string;
  
  /**
   * Tooltip d'aide optionnel
   */
  tooltip?: string;
  
  /**
   * Type de champ
   */
  type?: "number" | "slider" | "custom";
  
  /**
   * Valeur actuelle
   */
  value?: number;
  
  /**
   * Callback de changement de valeur
   */
  onChange?: (value: number) => void;
  
  /**
   * Valeur minimum (pour number et slider)
   */
  min?: number;
  
  /**
   * Valeur maximum (pour number et slider)
   */
  max?: number;
  
  /**
   * Pas (step) pour slider
   */
  step?: number;
  
  /**
   * Unité à afficher (€, %, etc.)
   */
  unit?: string;
  
  /**
   * Placeholder pour input
   */
  placeholder?: string;
  
  /**
   * Contenu personnalisé (type="custom")
   */
  children?: ReactNode;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  
  /**
   * Fonction de formatage de la valeur affichée
   */
  formatValue?: (value: number) => string;
}

/**
 * Champ de formulaire réutilisable pour les simulateurs avec label, tooltip et différents types d'input
 * 
 * @example
 * ```tsx
 * // Input numérique simple
 * <SimulationFormField
 *   label="Revenu annuel"
 *   tooltip="Votre revenu imposable total"
 *   type="number"
 *   value={50000}
 *   onChange={(v) => setRevenu(v)}
 *   unit="€"
 * />
 * 
 * // Slider
 * <SimulationFormField
 *   label="Âge"
 *   type="slider"
 *   value={35}
 *   onChange={(v) => setAge(v)}
 *   min={18}
 *   max={75}
 *   step={1}
 * />
 * 
 * // Contenu personnalisé
 * <SimulationFormField
 *   label="Situation familiale"
 *   tooltip="Votre statut marital"
 *   type="custom"
 * >
 *   <RadioGroup value={situation} onValueChange={setSituation}>
 *     <RadioGroupItem value="celibataire" />
 *     <RadioGroupItem value="marie" />
 *   </RadioGroup>
 * </SimulationFormField>
 * ```
 */
export function SimulationFormField({
  label,
  tooltip,
  type = "number",
  value,
  onChange,
  min = 0,
  max = 1000000,
  step = 1,
  unit,
  placeholder,
  children,
  className = "",
  formatValue,
}: SimulationFormFieldProps) {
  const displayValue = value !== undefined && formatValue 
    ? formatValue(value) 
    : value !== undefined 
    ? value.toLocaleString() 
    : "";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="font-medium">{label}</Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {type === "slider" && value !== undefined && (
          <span className="text-sm font-medium">
            {displayValue}
            {unit && ` ${unit}`}
          </span>
        )}
      </div>

      {type === "number" && (
        <div className="relative">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            className={unit ? "pr-12" : ""}
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      )}

      {type === "slider" && value !== undefined && (
        <Slider
          value={[value]}
          onValueChange={(values) => onChange?.(values[0])}
          min={min}
          max={max}
          step={step}
          className="py-4"
        />
      )}

      {type === "custom" && children}
    </div>
  );
}
