import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface ContactFormEditorProps {
  data: {
    title?: string;
    description?: string;
    firstName_label: string;
    firstName_placeholder?: string;
    firstName_required?: boolean;
    lastName_label: string;
    lastName_placeholder?: string;
    lastName_required?: boolean;
    company_label: string;
    company_placeholder?: string;
    company_required?: boolean;
    email_label: string;
    email_placeholder?: string;
    phone_label: string;
    phone_placeholder?: string;
    phone_required?: boolean;
    companySize_label: string;
    companySize_placeholder?: string;
    companySize_required?: boolean;
    message_label: string;
    message_placeholder?: string;
    message_required?: boolean;
    submit_button: string;
    success_message?: string;
  };
  onChange: (data: any) => void;
}

export const ContactFormEditor = ({ data, onChange }: ContactFormEditorProps) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const FormField = ({ 
    label, 
    labelField, 
    placeholderField, 
    requiredField 
  }: { 
    label: string; 
    labelField: string; 
    placeholderField?: string; 
    requiredField?: string;
  }) => (
    <Card className="p-4">
      <div className="space-y-3">
        <h4 className="font-medium">{label}</h4>
        <div className="space-y-2">
          <Label className="text-sm">Label du champ</Label>
          <Input
            value={data?.[labelField] || ""}
            onChange={(e) => updateField(labelField, e.target.value)}
            placeholder="Ex: Prénom"
          />
        </div>
        {placeholderField && (
          <div className="space-y-2">
            <Label className="text-sm">Placeholder</Label>
            <Input
              value={data?.[placeholderField] || ""}
              onChange={(e) => updateField(placeholderField, e.target.value)}
              placeholder="Ex: Entrez votre prénom"
            />
          </div>
        )}
        {requiredField && (
          <div className="flex items-center justify-between">
            <Label className="text-sm">Champ obligatoire</Label>
            <Switch
              checked={data?.[requiredField] || false}
              onCheckedChange={(checked) => updateField(requiredField, checked)}
            />
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration du formulaire de contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">En-tête du formulaire</h3>
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              value={data?.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Ex: Demandez une démo"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={data?.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Ex: Remplissez ce formulaire et notre équipe vous contactera"
              rows={3}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Champs du formulaire</h3>
          <div className="grid gap-4">
            <FormField 
              label="Prénom"
              labelField="firstName_label"
              placeholderField="firstName_placeholder"
              requiredField="firstName_required"
            />
            <FormField 
              label="Nom"
              labelField="lastName_label"
              placeholderField="lastName_placeholder"
              requiredField="lastName_required"
            />
            <FormField 
              label="Entreprise"
              labelField="company_label"
              placeholderField="company_placeholder"
              requiredField="company_required"
            />
            <FormField 
              label="Email"
              labelField="email_label"
              placeholderField="email_placeholder"
            />
            <FormField 
              label="Téléphone"
              labelField="phone_label"
              placeholderField="phone_placeholder"
              requiredField="phone_required"
            />
            <FormField 
              label="Taille d'entreprise"
              labelField="companySize_label"
              placeholderField="companySize_placeholder"
              requiredField="companySize_required"
            />
            <FormField 
              label="Message"
              labelField="message_label"
              placeholderField="message_placeholder"
              requiredField="message_required"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bouton et messages</h3>
          <div className="space-y-2">
            <Label>Texte du bouton</Label>
            <Input
              value={data?.submit_button || ""}
              onChange={(e) => updateField("submit_button", e.target.value)}
              placeholder="Ex: Envoyer ma demande"
            />
          </div>
          <div className="space-y-2">
            <Label>Message de succès</Label>
            <Textarea
              value={data?.success_message || ""}
              onChange={(e) => updateField("success_message", e.target.value)}
              placeholder="Ex: Merci ! Nous reviendrons vers vous rapidement."
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
