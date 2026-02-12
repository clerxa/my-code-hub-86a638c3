import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '@/types/onboarding';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface OnboardingStep3Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
}

export const OnboardingStep3 = ({ formData, updateFormData }: OnboardingStep3Props) => {
  const logoUrl = typeof formData.logo === 'string' ? formData.logo : '';
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Identité & Branding
        </h2>
        <p className="text-muted-foreground">
          Personnalisez l'apparence de votre espace
        </p>
      </div>

      <div className="space-y-4">
        <ImageUpload
          label="Logo de l'entreprise"
          value={logoUrl}
          onChange={(url) => updateFormData({ logo: url })}
          bucketName="landing-images"
        />

        <div>
          <Label htmlFor="primaryColor">Couleur principale (optionnel)</Label>
          <Input
            id="primaryColor"
            type="color"
            value={formData.primaryColor || '#3b82f6'}
            onChange={(e) => updateFormData({ primaryColor: e.target.value })}
            className="h-12 w-32"
          />
        </div>
      </div>
    </div>
  );
};
