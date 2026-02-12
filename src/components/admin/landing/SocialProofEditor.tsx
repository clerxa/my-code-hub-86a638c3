import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface SocialProofEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export const SocialProofEditor = ({ data, onChange }: SocialProofEditorProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Titre</Label>
        <Input
          value={data?.title || ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>

      {/* Companies */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Logos entreprises</Label>
          <Button
            type="button"
            size="sm"
            onClick={() => onChange({
              ...data,
              companies: [...(data.companies || []), { name: "Nouveau", logo: "" }]
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          Vous pouvez uploader des logos ou utiliser des URLs
        </div>
        {data?.companies?.map((company: any, index: number) => {
          const companyData = typeof company === 'string' 
            ? { name: company, logo: "" } 
            : company;
          
          return (
            <Card key={index}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Label>Logo {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange({
                      ...data,
                      companies: data.companies.filter((_: any, i: number) => i !== index)
                    })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Nom de l'entreprise</Label>
                  <Input
                    value={companyData.name}
                    onChange={(e) => {
                      const newCompanies = [...(data.companies || [])];
                      newCompanies[index] = { ...companyData, name: e.target.value };
                      onChange({ ...data, companies: newCompanies });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo (URL ou upload)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Convertir en base64 pour stockage temporaire
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const newCompanies = [...(data.companies || [])];
                          newCompanies[index] = { ...companyData, logo: reader.result as string };
                          onChange({ ...data, companies: newCompanies });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                  <Input
                    placeholder="Ou entrez une URL"
                    value={companyData.logo}
                    onChange={(e) => {
                      const newCompanies = [...(data.companies || [])];
                      newCompanies[index] = { ...companyData, logo: e.target.value };
                      onChange({ ...data, companies: newCompanies });
                    }}
                  />
                  {companyData.logo && (
                    <div className="mt-2">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        <img 
                          src={companyData.logo} 
                          alt={companyData.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Format carré recommandé</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Testimonials */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Témoignages</Label>
          <Button
            type="button"
            size="sm"
            onClick={() => onChange({
              ...data,
              testimonials: [...(data.testimonials || []), {
                name: "Nom",
                role: "Rôle",
                content: "Témoignage",
                avatar: ""
              }]
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
        {data?.testimonials?.map((testimonial: any, index: number) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Témoignage {index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange({
                  ...data,
                  testimonials: data.testimonials.filter((_: any, i: number) => i !== index)
                })}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={testimonial.name}
                    onChange={(e) => {
                      const newTestimonials = [...data.testimonials];
                      newTestimonials[index] = { ...testimonial, name: e.target.value };
                      onChange({ ...data, testimonials: newTestimonials });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Input
                    value={testimonial.role}
                    onChange={(e) => {
                      const newTestimonials = [...data.testimonials];
                      newTestimonials[index] = { ...testimonial, role: e.target.value };
                      onChange({ ...data, testimonials: newTestimonials });
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  value={testimonial.content}
                  onChange={(e) => {
                    const newTestimonials = [...data.testimonials];
                    newTestimonials[index] = { ...testimonial, content: e.target.value };
                    onChange({ ...data, testimonials: newTestimonials });
                  }}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Statistiques</Label>
          <Button
            type="button"
            size="sm"
            onClick={() => onChange({
              ...data,
              stats: [...(data.stats || []), { value: "100+", label: "Métrique" }]
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
        {data?.stats?.map((stat: any, index: number) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Valeur</Label>
                  <Input
                    value={stat.value}
                    onChange={(e) => {
                      const newStats = [...data.stats];
                      newStats[index] = { ...stat, value: e.target.value };
                      onChange({ ...data, stats: newStats });
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={stat.label}
                    onChange={(e) => {
                      const newStats = [...data.stats];
                      newStats[index] = { ...stat, label: e.target.value };
                      onChange({ ...data, stats: newStats });
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => onChange({
                    ...data,
                    stats: data.stats.filter((_: any, i: number) => i !== index)
                  })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};