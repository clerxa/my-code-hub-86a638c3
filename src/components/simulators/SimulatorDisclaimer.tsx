import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SimulatorDisclaimer() {
  return (
    <Alert variant="default" className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
        Les informations présentées sont fournies à titre indicatif et pédagogique. Elles ne constituent ni un conseil en investissement, ni une recommandation personnalisée. L'adéquation d'un produit à votre situation réelle nécessite l'analyse d'un expert certifié. Les rendements passés ne préjugent pas des rendements futurs.
      </AlertDescription>
    </Alert>
  );
}
