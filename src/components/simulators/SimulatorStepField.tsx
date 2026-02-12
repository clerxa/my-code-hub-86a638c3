import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SimulatorStepFieldProps {
  label: string;
  tooltip?: string;
  value?: number | string;
  onChange?: (value: number) => void;
  onStringChange?: (value: string) => void;
  type?: "number" | "slider" | "currency" | "percent" | "custom";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  suffix?: string;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  delay?: number;
  showSlider?: boolean;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  formatDisplay?: (value: number) => string;
  highlight?: boolean;
  icon?: LucideIcon;
}

/**
 * Champ de formulaire animé pour les simulateurs
 * Apparaît progressivement avec animation
 */
export function SimulatorStepField({
  label,
  tooltip,
  value,
  onChange,
  onStringChange,
  type = "number",
  min = 0,
  max = 1000000,
  step = 1,
  unit,
  suffix,
  placeholder,
  children,
  className,
  delay = 0,
  showSlider = false,
  sliderMin,
  sliderMax,
  sliderStep,
  formatDisplay,
  highlight = false,
  icon: Icon,
}: SimulatorStepFieldProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
  
  const displayValue = formatDisplay 
    ? formatDisplay(numericValue)
    : type === "currency"
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(numericValue)
    : type === "percent"
    ? `${numericValue}%`
    : suffix 
    ? `${numericValue.toLocaleString('fr-FR')}${suffix}`
    : numericValue.toLocaleString('fr-FR');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.1 }}
      className={cn(
        "space-y-3",
        highlight && "p-4 rounded-lg bg-primary/5 border border-primary/20",
        className
      )}
    >
      {/* Header avec label et valeur */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
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
        {(type === "slider" || showSlider) && (
          <span className="text-lg font-bold text-primary">
            {displayValue}
          </span>
        )}
      </div>

      {/* Input selon le type */}
      {type === "custom" ? (
        children
      ) : type === "slider" ? (
        <Slider
          value={[numericValue]}
          onValueChange={(values) => onChange?.(values[0])}
          min={min}
          max={max}
          step={step}
          className="py-2"
        />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              className={cn(
                "text-lg font-semibold",
                unit && "pr-12"
              )}
            />
            {unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          
          {showSlider && (
            <Slider
              value={[numericValue]}
              onValueChange={(values) => onChange?.(values[0])}
              min={sliderMin ?? min}
              max={sliderMax ?? max}
              step={sliderStep ?? step}
              className="py-2"
            />
          )}
        </div>
      )}
    </motion.div>
  );
}
