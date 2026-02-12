import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TaxDeclarationFormData } from "@/types/tax-declaration";
import { AlertTriangle, HelpCircle, Phone, Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepProps {
  formData: TaxDeclarationFormData;
  updateFormData: (updates: Partial<TaxDeclarationFormData>) => void;
}

export function Step1InformationsGenerales({ formData, updateFormData }: StepProps) {
  const [showPerlibClientBlock, setShowPerlibClientBlock] = useState(false);
  const [perlibEmailSent, setPerlibEmailSent] = useState(false);
  const [perlibContactEmail, setPerlibContactEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handlePerlibClientChange = (value: string) => {
    const isClient = value === "oui";
    updateFormData({ 
      is_perlib_client: isClient,
      conseiller_dedie: !isClient ? '' : formData.conseiller_dedie 
    });
    setShowPerlibClientBlock(isClient);
  };

  const handleSendPerlibContactRequest = async () => {
    if (!perlibContactEmail) {
      toast.error("Veuillez renseigner votre adresse email");
      return;
    }

    setIsSendingEmail(true);
    try {
      // Store the contact request (we could also call an edge function to send an email)
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          sender_id: (await supabase.auth.getUser()).data.user?.id || "",
          recipient_type: "support",
          subject: "Recherche conseiller Perlib - Aide déclaration fiscale",
          message: `Un client Perlib cherche son conseiller dédié.\n\nEmail utilisé avec Perlib: ${perlibContactEmail}\n\nNom: ${formData.nom} ${formData.prenom}\nEmail actuel: ${formData.email}`,
          company_id: null
        });

      if (error) throw error;

      setPerlibEmailSent(true);
      toast.success("Votre demande a été envoyée. Un conseiller vous contactera rapidement.");
    } catch (error) {
      console.error("Error sending contact request:", error);
      toast.error("Erreur lors de l'envoi de la demande");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // If user is a Perlib client, show the special block
  if (showPerlibClientBlock && formData.is_perlib_client) {
    return (
      <div className="space-y-6">
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Vous êtes déjà client Perlib</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300 mt-2">
            <p className="mb-3">
              En tant que client Perlib, vous bénéficiez d'un accompagnement dédié avec votre conseiller. 
              Veuillez vous rapprocher directement de lui pour votre déclaration fiscale.
            </p>
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg text-sm">
              <p className="font-medium mb-1">Qu'est-ce qu'un client Perlib ?</p>
              <p className="text-muted-foreground">
                Un client Perlib est une personne qui a déjà été accompagnée par un conseiller Perlib 
                dans la mise en place d'un investissement ou durant un premier échange approfondi.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Vous ne savez pas qui est votre conseiller ?
            </CardTitle>
            <CardDescription>
              Renseignez l'adresse email que vous avez utilisée lors de vos échanges avec Perlib
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!perlibEmailSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="perlib_email">Adresse email utilisée avec Perlib</Label>
                  <Input
                    id="perlib_email"
                    type="email"
                    value={perlibContactEmail}
                    onChange={(e) => setPerlibContactEmail(e.target.value)}
                    placeholder="email@exemple.com"
                  />
                </div>
                <Button 
                  onClick={handleSendPerlibContactRequest}
                  disabled={isSendingEmail || !perlibContactEmail}
                  className="w-full"
                >
                  {isSendingEmail ? (
                    "Envoi en cours..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer ma demande
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-green-700 dark:text-green-400">Demande envoyée !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Un conseiller vous contactera rapidement pour vous accompagner.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => {
              updateFormData({ is_perlib_client: false });
              setShowPerlibClientBlock(false);
            }}
          >
            Je ne suis finalement pas client Perlib
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entreprise">Entreprise</Label>
          <Input
            id="entreprise"
            value={formData.entreprise}
            onChange={(e) => updateFormData({ entreprise: e.target.value })}
            placeholder="Nom de votre entreprise"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="intitule_poste">Intitulé de poste</Label>
          <Input
            id="intitule_poste"
            value={formData.intitule_poste}
            onChange={(e) => updateFormData({ intitule_poste: e.target.value })}
            placeholder="Votre poste"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => updateFormData({ nom: e.target.value })}
            placeholder="Votre nom"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => updateFormData({ prenom: e.target.value })}
            placeholder="Votre prénom"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="votre@email.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            type="tel"
            value={formData.telephone}
            onChange={(e) => updateFormData({ telephone: e.target.value })}
            placeholder="+33 6 00 00 00 00"
          />
        </div>
      </div>

      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Êtes-vous déjà client de Perlib ?
            <Badge variant="outline" className="text-xs font-normal">Important</Badge>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Un client Perlib est une personne qui a déjà été accompagnée par un conseiller Perlib 
            dans la mise en place d'un investissement ou durant un premier échange approfondi.
          </p>
          <Select
            value={formData.is_perlib_client ? "oui" : "non"}
            onValueChange={handlePerlibClientChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui, je suis client Perlib</SelectItem>
              <SelectItem value="non">Non, je ne suis pas encore client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
