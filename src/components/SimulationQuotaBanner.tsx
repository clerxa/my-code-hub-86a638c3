/**
 * Banner to display remaining simulations for non-partner users
 * Shows in sidebar or profile for visibility
 */

import { Calculator, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useSimulationQuota } from "@/hooks/useSimulationQuota";
import { cn } from "@/lib/utils";

interface SimulationQuotaBannerProps {
  variant?: "compact" | "full";
  className?: string;
}

export function SimulationQuotaBanner({ 
  variant = "full",
  className 
}: SimulationQuotaBannerProps) {
  const navigate = useNavigate();
  const { 
    simulationsUsed = 0, 
    simulationsRemaining = 0, 
    limit = 10, 
    hasPartnership, 
    isLoading,
    quotaLabel = 'Analyses gratuites'
  } = useSimulationQuota() || {};

  // Don't show for partner users or while loading
  if (isLoading || hasPartnership) return null;

  const progressPercent = (simulationsUsed / limit) * 100;
  const isLow = simulationsRemaining <= 3;
  const isExhausted = simulationsRemaining === 0;

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
        isExhausted 
          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" 
          : isLow 
            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
            : "bg-muted text-muted-foreground",
        className
      )}>
        <Calculator className="h-4 w-4 flex-shrink-0" />
        <span>
          {isExhausted 
            ? "0 simulation restante" 
            : `${simulationsRemaining}/${limit} simulations`
          }
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border space-y-3",
      isExhausted 
        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
        : isLow 
          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          : "bg-muted/50 border-border",
      className
    )}>
      <div className="flex items-center gap-2">
        {isExhausted || isLow ? (
          <AlertTriangle className={cn(
            "h-4 w-4",
            isExhausted ? "text-red-600" : "text-amber-600"
          )} />
        ) : (
          <Calculator className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium text-sm">
          {isExhausted 
            ? "Quota atteint" 
            : quotaLabel
          }
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Utilisées</span>
          <span className={cn(
            "font-medium",
            isExhausted ? "text-red-600" : isLow ? "text-amber-600" : ""
          )}>
            {simulationsUsed} / {limit}
          </span>
        </div>
        <Progress 
          value={progressPercent} 
          className={cn(
            "h-1.5",
            isExhausted ? "[&>div]:bg-red-500" : isLow ? "[&>div]:bg-amber-500" : ""
          )}
        />
      </div>

      {(isExhausted || isLow) && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2 text-xs"
          onClick={() => navigate('/proposer-partenariat')}
        >
          <Building2 className="h-3 w-3" />
          Débloquer l'accès illimité
        </Button>
      )}
    </div>
  );
}
