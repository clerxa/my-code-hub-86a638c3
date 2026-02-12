import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, LucideIcon } from "lucide-react";

interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
  description?: string;
}

interface ResultsChartProps {
  /**
   * Titre du graphique
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
   * Données à afficher
   */
  data: ChartDataItem[];
  
  /**
   * Type de graphique
   */
  type?: "bar" | "comparison" | "progress";
  
  /**
   * Tooltip d'aide optionnel
   */
  tooltip?: string;
  
  /**
   * Badge optionnel
   */
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  
  /**
   * Afficher les valeurs en pourcentage
   */
  showPercentage?: boolean;
  
  /**
   * Fonction de formatage des valeurs
   */
  formatValue?: (value: number) => string;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Composant de graphique réutilisable pour afficher des comparaisons ou progressions
 * 
 * @example
 * ```tsx
 * <ResultsChart
 *   title="Comparaison avant/après"
 *   icon={TrendingUp}
 *   type="comparison"
 *   data={[
 *     { label: "Impôt sans PER", value: 15000, color: "bg-red-500" },
 *     { label: "Impôt avec PER", value: 12000, color: "bg-green-500" }
 *   ]}
 *   formatValue={(v) => `${v.toLocaleString()} €`}
 * />
 * ```
 */
export function ResultsChart({
  title,
  description,
  icon: Icon,
  data,
  type = "bar",
  tooltip,
  badge,
  showPercentage = false,
  formatValue = (v) => v.toLocaleString(),
  className = "",
}: ResultsChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  const renderBar = (item: ChartDataItem, index: number) => {
    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
    const bgColor = item.color || (index === 0 ? "bg-primary" : "bg-secondary");

    return (
      <div key={item.label} className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{item.label}</span>
          <span className="text-muted-foreground">
            {formatValue(item.value)}
            {showPercentage && ` (${percentage.toFixed(1)}%)`}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (data.length !== 2) return <p className="text-sm text-muted-foreground">Deux valeurs requises pour la comparaison</p>;
    
    const [before, after] = data;
    const difference = before.value - after.value;
    const percentageChange = before.value > 0 ? (difference / before.value) * 100 : 0;
    const isPositive = difference > 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <p className="text-sm text-muted-foreground mb-1">{before.label}</p>
            <p className="text-2xl font-bold">{formatValue(before.value)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <p className="text-sm text-muted-foreground mb-1">{after.label}</p>
            <p className="text-2xl font-bold">{formatValue(after.value)}</p>
          </div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {isPositive ? "Économie" : "Surcoût"}
          </p>
          <p className={`text-3xl font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isPositive && "+"}{formatValue(Math.abs(difference))}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isPositive ? "-" : "+"}{Math.abs(percentageChange).toFixed(1)}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
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
        {type === "comparison" ? renderComparison() : (
          <div className="space-y-4">
            {data.map((item, index) => renderBar(item, index))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
