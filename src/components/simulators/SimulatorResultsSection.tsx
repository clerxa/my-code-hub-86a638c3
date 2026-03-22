import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimulationCTASection } from "./SimulationCTASection";

interface ResultCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "highlight" | "success" | "warning";
  delay?: number;
}

export function ResultCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  delay = 0 
}: ResultCardProps) {
  const variants = {
    default: "bg-card border",
    highlight: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
    success: "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20",
    warning: "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20",
  };

  const valueColors = {
    default: "text-foreground",
    highlight: "text-primary",
    success: "text-green-600",
    warning: "text-amber-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: delay * 0.1 }}
    >
      <Card className={cn("overflow-hidden", variants[variant])}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className={cn(
                "p-2 rounded-lg",
                variant === "highlight" && "bg-primary/10 text-primary",
                variant === "success" && "bg-green-500/10 text-green-600",
                variant === "warning" && "bg-amber-500/10 text-amber-600",
                variant === "default" && "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className={cn("text-2xl font-bold", valueColors[variant])}>
                {typeof value === 'number' 
                  ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)
                  : value
                }
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SimulatorResultsSectionProps {
  children: ReactNode;
  mainResult?: {
    label?: string;
    title?: string;
    value: string | number;
    subtitle?: string;
    suffix?: string;
    badge?: string;
    icon?: LucideIcon;
  };
  ctas?: any[];
  onCTAClick?: (ctaId: string, isAppointment: boolean) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
  className?: string;
}

/**
 * Section de résultats unifiée pour tous les simulateurs
 * Affiche le résultat principal, les détails et les CTAs
 */
export function SimulatorResultsSection({
  children,
  mainResult,
  ctas,
  onCTAClick,
  onSave,
  onReset,
  isSaving = false,
  className,
}: SimulatorResultsSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Résultat principal avec effet wow */}
      {mainResult && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.1),transparent)]" />
            <CardContent className="p-8 text-center relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center mb-4"
              >
                {mainResult.icon ? <mainResult.icon className="h-8 w-8 text-primary" /> : <Sparkles className="h-8 w-8 text-primary" />}
              </motion.div>
              <p className="text-muted-foreground mb-2">{mainResult.label || mainResult.title}</p>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-4xl md:text-5xl font-bold text-primary"
              >
                {typeof mainResult.value === 'number'
                  ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(mainResult.value)
                  : mainResult.value
                }
              </motion.p>
              {mainResult.subtitle && (
                <p className="text-sm text-muted-foreground mt-2">{mainResult.subtitle}</p>
              )}
              {mainResult.badge && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Badge variant="secondary" className="mt-3">
                    {mainResult.badge}
                  </Badge>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Détails des résultats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {children}
      </motion.div>

      {/* CTAs dynamiques */}
      {ctas && ctas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <SimulationCTASection 
            ctas={ctas} 
            onCTAClick={onCTAClick}
            onSave={onSave}
          />
        </motion.div>
      )}

      {/* Action Nouvelle simulation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex justify-center pt-4 pb-20"
      >
        <Button 
          type="button"
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onReset();
          }}
          className="gap-2 relative z-10"
          size="lg"
        >
          <RotateCcw className="h-4 w-4" />
          Nouvelle simulation
        </Button>
      </motion.div>
    </div>
  );
}
