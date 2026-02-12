/**
 * Dialog to inform users about their simulation quota status
 * Shows remaining simulations for non-partner users
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, Calculator, Building2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SimulationQuotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationsUsed: number;
  simulationsRemaining: number;
  limit: number;
  isLimited: boolean;
}

export function SimulationQuotaDialog({
  open,
  onOpenChange,
  simulationsUsed,
  simulationsRemaining,
  limit,
  isLimited,
}: SimulationQuotaDialogProps) {
  const navigate = useNavigate();
  const progressPercent = (simulationsUsed / limit) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            {isLimited ? (
              <Lock className="h-8 w-8 text-amber-600" />
            ) : (
              <Calculator className="h-8 w-8 text-amber-600" />
            )}
          </div>
          <DialogTitle className="text-center">
            {isLimited 
              ? "Quota de simulations atteint" 
              : "Compte en accès limité"
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLimited 
              ? "Vous avez utilisé toutes vos simulations gratuites. Pour continuer à utiliser nos simulateurs, proposez un partenariat à votre entreprise."
              : "Vous bénéficiez d'un accès limité aux simulateurs. Proposez un partenariat à votre entreprise pour un accès illimité."
            }
          </DialogDescription>
        </DialogHeader>

        {!isLimited && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Simulations utilisées</span>
              <Badge variant={simulationsRemaining <= 3 ? "destructive" : "secondary"}>
                {simulationsUsed} / {limit}
              </Badge>
            </div>
            <Progress 
              value={progressPercent} 
              className={`h-2 ${progressPercent >= 70 ? "[&>div]:bg-amber-500" : ""} ${progressPercent >= 100 ? "[&>div]:bg-red-500" : ""}`}
            />
            <p className="text-xs text-center text-muted-foreground">
              {simulationsRemaining > 0 
                ? `Il vous reste ${simulationsRemaining} simulation${simulationsRemaining > 1 ? 's' : ''} gratuite${simulationsRemaining > 1 ? 's' : ''}`
                : "Vous n'avez plus de simulations gratuites"
              }
            </p>
          </div>
        )}

        {isLimited && (
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-200">Quota atteint</p>
                <p className="text-red-600 dark:text-red-400">
                  {simulationsUsed} simulations sur {limit} utilisées
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate('/proposer-partenariat');
            }}
          >
            <Building2 className="h-4 w-4" />
            Proposer un partenariat
          </Button>
          {!isLimited && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Continuer avec l'accès limité
            </Button>
          )}
          {isLimited && (
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate(-1);
              }}
            >
              Retour
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
