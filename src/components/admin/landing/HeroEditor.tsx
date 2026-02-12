import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface HeroEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export const HeroEditor = ({ data, onChange }: HeroEditorProps) => {
  const handleLogoAdd = () => {
    onChange({
      ...data,
      clientLogos: [...(data.clientLogos || []), "Nouveau Logo"],
    });
  };

  const handleLogoRemove = (index: number) => {
    onChange({
      ...data,
      clientLogos: data.clientLogos.filter((_: any, i: number) => i !== index),
    });
  };

  const handleLogoChange = (index: number, value: string) => {
    const newLogos = [...data.clientLogos];
    newLogos[index] = value;
    onChange({ ...data, clientLogos: newLogos });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="hero-title">Titre principal</Label>
        <Textarea
          id="hero-title"
          value={data?.title || ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hero-subtitle">Sous-titre</Label>
        <Textarea
          id="hero-subtitle"
          value={data?.subtitle || ""}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hero-cta-primary">CTA Principal</Label>
          <Input
            id="hero-cta-primary"
            value={data?.ctaPrimary || ""}
            onChange={(e) => onChange({ ...data, ctaPrimary: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero-cta-secondary">CTA Secondaire</Label>
          <Input
            id="hero-cta-secondary"
            value={data?.ctaSecondary || ""}
            onChange={(e) => onChange({ ...data, ctaSecondary: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hero-cta-secondary-link">Lien du CTA Secondaire</Label>
        <Input
          id="hero-cta-secondary-link"
          value={data?.ctaSecondaryLink || ""}
          onChange={(e) => onChange({ ...data, ctaSecondaryLink: e.target.value })}
          placeholder="https://exemple.com"
        />
      </div>

      <ImageUpload
        label="Image/Bannière"
        value={data?.image || ""}
        onChange={(url) => onChange({ ...data, image: url })}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Logos clients</Label>
          <Button type="button" size="sm" onClick={handleLogoAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
        
        {data?.clientLogos?.map((logo: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              value={logo}
              onChange={(e) => handleLogoChange(index, e.target.value)}
              placeholder="Nom du logo"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleLogoRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};