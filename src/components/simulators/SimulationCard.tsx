import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SimulationCardProps {
  /**
   * Titre de la carte
   */
  title: string;
  
  /**
   * Description optionnelle
   */
  description?: string;
  
  /**
   * Icône à afficher à côté du titre
   */
  icon?: LucideIcon;
  
  /**
   * Couleur de l'icône (classe Tailwind)
   */
  iconColor?: string;
  
  /**
   * Badge optionnel à afficher
   */
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  
  /**
   * Tooltip d'aide optionnel
   */
  tooltip?: string;
  
  /**
   * Valeur principale à afficher (format large)
   */
  value?: string | number;
  
  /**
   * Label de la valeur principale
   */
  valueLabel?: string;
  
  /**
   * Contenu personnalisé de la carte
   */
  children?: ReactNode;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  
  /**
   * Variante visuelle
   */
  variant?: "default" | "success" | "warning" | "danger";
}

/**
 * Carte réutilisable pour afficher les résultats d'une simulation
 * 
 * @example
 * ```tsx
 * <SimulationCard
 *   title="Économie d'impôts"
 *   icon={TrendingUp}
 *   iconColor="text-green-500"
 *   badge={{ text: "Optimal", variant: "default" }}
 *   tooltip="Montant total économisé grâce au PER"
 *   value="5 420 €"
 *   valueLabel="Économie annuelle"
 *   variant="success"
 * />
 * ```
 */
export function SimulationCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  badge,
  tooltip,
  value,
  valueLabel,
  children,
  className = "",
  variant = "default",
}: SimulationCardProps) {
  const variantClasses = {
    default: "",
    success: "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20",
    warning: "border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20",
    danger: "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20",
  };

  return (
    <Card className={`${variantClasses[variant]} ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
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
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {badge && (
            <Badge variant={badge.variant || "default"}>{badge.text}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {value !== undefined ? (
          <div className="space-y-2">
            <div className="text-3xl font-bold">{value}</div>
            {valueLabel && (
              <p className="text-sm text-muted-foreground">{valueLabel}</p>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
