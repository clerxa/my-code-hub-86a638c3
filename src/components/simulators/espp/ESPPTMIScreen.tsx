/**
 * Écran TMI — Sélection du taux marginal d'imposition avant le calcul
 */

import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TMI_OPTIONS } from '@/types/esppNew';

interface ESPPTMIScreenProps {
  tmi: number;
  onChangeTmi: (tmi: number) => void;
  onSimulate: () => void;
  onBack: () => void;
}

export function ESPPTMIScreen({ tmi, onChangeTmi, onSimulate, onBack }: ESPPTMIScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Votre fiscalité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>TMI — Tranche marginale d'imposition</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Votre tranche la plus élevée sur vos revenus annuels. Le rabais ESPP sera imposé à ce taux. En cas de doute, utilisez le simulateur d'impôts.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={String(tmi)}
              onValueChange={v => onChangeTmi(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre TMI" />
              </SelectTrigger>
              <SelectContent>
                {TMI_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Le rabais (décote) sera imposé comme un salaire à votre TMI. La plus-value de cession sera imposée au PFU de 30%.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <Button onClick={onSimulate} className="flex-1 gap-2">
          Calculer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
