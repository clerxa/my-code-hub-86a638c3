import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SimulatorResultCardProps {
  /**
   * Titre de la carte
   */
  title: string;
  
  /**
   * Valeur principale à afficher
   */
  value: string | number;
  
  /**
   * Description ou label secondaire
   */
  description?: string;
  
  /**
   * Icône à afficher
   */
  icon?: LucideIcon;
  
  /**
   * Couleur du badge/icône (green, red, blue, etc.)
   */
  variant?: "default" | "success" | "warning" | "destructive";
  
  /**
   * Badge à afficher
   */
  badge?: string;
  
  /**
   * Contenu supplémentaire
   */
  children?: ReactNode;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  
  /**
   * Unité de la valeur (€, %, ans, etc.)
   */
  unit?: string;
  
  /**
   * Formater la valeur comme monnaie
   */
  isCurrency?: boolean;
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const iconVariantStyles = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  destructive: "text-red-600 dark:text-red-400",
};

/**
 * Carte de résultat réutilisable pour les simulateurs
 * 
 * @example
 * ```tsx
 * <SimulatorResultCard
 *   title="Économie d'impôts"
 *   value={2500}
 *   isCurrency
 *   variant="success"
 *   icon={TrendingUp}
 *   description="Par an"
 * />
 * ```
 */
export function SimulatorResultCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  badge,
  children,
  className = "",
  unit,
  isCurrency = false,
}: SimulatorResultCardProps) {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(value))
    : typeof value === "number"
    ? value.toLocaleString("fr-FR")
    : value;

  const displayValue = unit && !isCurrency ? `${formattedValue} ${unit}` : formattedValue;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <Icon className={`h-5 w-5 ${iconVariantStyles[variant]}`} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{displayValue}</span>
          {badge && (
            <Badge className={variantStyles[variant]}>{badge}</Badge>
          )}
        </div>
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
