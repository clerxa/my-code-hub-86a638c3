import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useProspectPresentation, useUpdatePresentation, type ProspectPresentation } from "@/hooks/useProspectPresentations";
import { PRESENTATION_STATS, KEY_FIGURES, CLIENT_LOGOS_BANK, TESTIMONIALS } from "@/data/presentationContent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  presentationId: string;
  onBack: () => void;
}

export function ProspectPresentationForm({ presentationId, onBack }: Props) {
  const { data: presentation, isLoading } = useProspectPresentation(presentationId);
  const updateMutation = useUpdatePresentation();
  const [form, setForm] = useState<Partial<ProspectPresentation>>({});

  useEffect(() => {
    if (presentation) setForm(presentation);
  }, [presentation]);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleArrayItem = (key: string, item: string) => {
    const arr = (form as any)[key] as string[] || [];
    const next = arr.includes(item) ? arr.filter((v: string) => v !== item) : [...arr, item];
    update(key, next);
  };

  const handleSave = () => {
    if (!form.id) return;
    updateMutation.mutate(form as any);
  };

  if (isLoading) return <div className="animate-pulse p-8"><div className="h-6 bg-muted rounded w-48 mb-4" /><div className="h-4 bg-muted rounded w-full" /></div>;

  const selectedStats = form.selected_stats || [];
  const selectedKeyFigures = form.selected_key_figures || [];
  const selectedLogos = form.selected_client_logos || [];
  const selectedTestimonials = form.selected_testimonials || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/presentation/${form.share_token}`, "_blank")}>
            <Eye className="h-4 w-4 mr-2" /> Prévisualiser
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" /> Sauvegarder
          </Button>
        </div>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Titre de la présentation</Label>
            <Input value={form.title || ""} onChange={e => update("title", e.target.value)} placeholder="Présentation FinCare pour..." />
          </div>
          <div>
            <Label>Nom du prospect</Label>
            <Input value={form.prospect_name || ""} onChange={e => update("prospect_name", e.target.value)} placeholder="Nom de l'entreprise" />
          </div>
          <div>
            <Label>Logo du prospect (URL)</Label>
            <Input value={form.prospect_logo_url || ""} onChange={e => update("prospect_logo_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Secteur</Label>
            <Select value={form.prospect_sector || "other"} onValueChange={v => update("prospect_sector", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tech">Tech / SaaS / Digital</SelectItem>
                <SelectItem value="other">Autres secteurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Selection */}
      <Card>
        <CardHeader><CardTitle>Statistiques d'accroche (max 2)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {PRESENTATION_STATS.map(stat => (
            <label key={stat.id} className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={selectedStats.includes(stat.id)}
                onCheckedChange={() => {
                  if (!selectedStats.includes(stat.id) && selectedStats.length >= 2) return;
                  toggleArrayItem("selected_stats", stat.id);
                }}
                disabled={!selectedStats.includes(stat.id) && selectedStats.length >= 2}
              />
              <div>
                <span className="font-bold text-primary">{stat.figure}</span> — {stat.text}
                {stat.source && <span className="text-xs text-muted-foreground block">{stat.source}</span>}
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Challenge Text */}
      <Card>
        <CardHeader><CardTitle>Le défi de {form.prospect_name || "[Entreprise]"}</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={form.challenge_text || ""}
            onChange={e => update("challenge_text", e.target.value)}
            placeholder="Texte personnalisé sur le défi de cette entreprise..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Key Figures */}
      <Card>
        <CardHeader><CardTitle>Chiffres clés (max 4)</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {KEY_FIGURES.map(fig => (
            <label key={fig.id} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={selectedKeyFigures.includes(fig.id)}
                onCheckedChange={() => {
                  if (!selectedKeyFigures.includes(fig.id) && selectedKeyFigures.length >= 4) return;
                  toggleArrayItem("selected_key_figures", fig.id);
                }}
                disabled={!selectedKeyFigures.includes(fig.id) && selectedKeyFigures.length >= 4}
              />
              <span><strong>{fig.value}</strong> {fig.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Client Logos */}
      <Card>
        <CardHeader><CardTitle>Logos clients — "Ils nous font confiance"</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Tech & Digital</p>
          <div className="grid gap-2 sm:grid-cols-3 mb-4">
            {CLIENT_LOGOS_BANK.filter(l => l.category === "tech").map(logo => (
              <label key={logo.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedLogos.includes(logo.id)}
                  onCheckedChange={() => toggleArrayItem("selected_client_logos", logo.id)}
                />
                <span className="text-sm">{logo.name}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-3">Autres secteurs</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {CLIENT_LOGOS_BANK.filter(l => l.category === "other").map(logo => (
              <label key={logo.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedLogos.includes(logo.id)}
                  onCheckedChange={() => toggleArrayItem("selected_client_logos", logo.id)}
                />
                <span className="text-sm">{logo.name}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testimonials */}
      <Card>
        <CardHeader><CardTitle>Témoignages (max 2)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {TESTIMONIALS.map(t => (
            <label key={t.id} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition">
              <Checkbox
                checked={selectedTestimonials.includes(t.id)}
                onCheckedChange={() => {
                  if (!selectedTestimonials.includes(t.id) && selectedTestimonials.length >= 2) return;
                  toggleArrayItem("selected_testimonials", t.id);
                }}
                disabled={!selectedTestimonials.includes(t.id) && selectedTestimonials.length >= 2}
              />
              <div>
                <p className="font-medium">{t.name} — {t.company}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
                <p className="text-sm italic mt-1">"{t.verbatim.slice(0, 120)}..."</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader><CardTitle>Contact de clôture</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Nom</Label>
            <Input value={form.contact_name || ""} onChange={e => update("contact_name", e.target.value)} />
          </div>
          <div>
            <Label>Rôle</Label>
            <Input value={form.contact_role || ""} onChange={e => update("contact_role", e.target.value)} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={form.contact_phone || ""} onChange={e => update("contact_phone", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.contact_email || ""} onChange={e => update("contact_email", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>URL de prise de rendez-vous</Label>
            <Input value={form.contact_booking_url || ""} onChange={e => update("contact_booking_url", e.target.value)} placeholder="https://calendly.com/..." />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
