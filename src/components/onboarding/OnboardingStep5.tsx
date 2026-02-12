import { OnboardingData } from '@/types/onboarding';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';

interface OnboardingStep5Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
}

const MATURITE_OPTIONS = [
  {
    value: 'faible' as const,
    label: 'Faible',
    description: 'Besoins de formation de base en finance',
    icon: TrendingDown,
    color: 'text-red-500'
  },
  {
    value: 'moyen' as const,
    label: 'Moyen',
    description: 'Connaissances financières intermédiaires',
    icon: Activity,
    color: 'text-orange-500'
  },
  {
    value: 'eleve' as const,
    label: 'Élevé',
    description: 'Bonne maîtrise des concepts financiers',
    icon: TrendingUp,
    color: 'text-green-500'
  }
];

export const OnboardingStep5 = ({ formData, updateFormData }: OnboardingStep5Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Maturité financière des salariés
        </h2>
        <p className="text-muted-foreground">
          Quel est le niveau général de vos collaborateurs ?
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {MATURITE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = formData.niveauMaturiteFinanciere === option.value;
          
          return (
            <Card
              key={option.value}
              onClick={() => updateFormData({ niveauMaturiteFinanciere: option.value })}
              className={cn(
                "p-6 cursor-pointer transition-all hover:border-primary",
                isSelected && "border-primary bg-primary/10"
              )}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <Icon className={cn("h-12 w-12", option.color)} />
                <h3 className="font-semibold text-lg text-foreground">{option.label}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Défis RH (optionnel)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Identifiez les principaux défis de vos collaborateurs
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="financial_anxiety"
              checked={formData.hrChallenges?.financial_anxiety || false}
              onCheckedChange={(checked) => updateFormData({
                hrChallenges: { ...formData.hrChallenges, financial_anxiety: checked as boolean }
              })}
            />
            <label htmlFor="financial_anxiety" className="text-sm text-foreground cursor-pointer">
              Anxiété financière
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="understanding_gaps"
              checked={formData.hrChallenges?.understanding_gaps || false}
              onCheckedChange={(checked) => updateFormData({
                hrChallenges: { ...formData.hrChallenges, understanding_gaps: checked as boolean }
              })}
            />
            <label htmlFor="understanding_gaps" className="text-sm text-foreground cursor-pointer">
              Lacunes de compréhension financière
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax_optimization"
              checked={formData.hrChallenges?.tax_optimization_interest || false}
              onCheckedChange={(checked) => updateFormData({
                hrChallenges: { ...formData.hrChallenges, tax_optimization_interest: checked as boolean }
              })}
            />
            <label htmlFor="tax_optimization" className="text-sm text-foreground cursor-pointer">
              Intérêt pour l'optimisation fiscale
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="declaration_errors"
              checked={formData.hrChallenges?.recurring_declaration_errors || false}
              onCheckedChange={(checked) => updateFormData({
                hrChallenges: { ...formData.hrChallenges, recurring_declaration_errors: checked as boolean }
              })}
            />
            <label htmlFor="declaration_errors" className="text-sm text-foreground cursor-pointer">
              Erreurs récurrentes dans les déclarations
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="salary_frustrations">Frustrations salariales</Label>
          <Textarea
            id="salary_frustrations"
            value={formData.hrChallenges?.salary_frustrations || ''}
            onChange={(e) => updateFormData({
              hrChallenges: { ...formData.hrChallenges, salary_frustrations: e.target.value }
            })}
            placeholder="Décrivez les frustrations liées à la rémunération..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
