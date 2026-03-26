/**
 * ===========================================================
 * 📄 File: EmployeeContactsSection.tsx
 * 📌 Rôle du fichier : Affichage des contacts entreprise pour tous les employés
 * 🧩 Dépendances importantes :
 *   - supabase pour les requêtes
 *   - framer-motion pour les animations
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Crown,
  ChevronRight,
  Headphones,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CompanyContact {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role_contact: string | null;
  photo_url?: string | null;
}

interface EmployeeContactsSectionProps {
  companyId: string;
  companyName?: string;
  primaryColor?: string;
}

export const EmployeeContactsSection = ({ companyId, companyName, primaryColor }: EmployeeContactsSectionProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Message dialog state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CompanyContact | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const themeColor = primaryColor || "hsl(var(--primary))";

  useEffect(() => {
    if (companyId) {
      fetchContacts();
    }
  }, [companyId]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("company_contacts")
        .select("id, nom, email, telephone, role_contact, photo_url")
        .eq("company_id", companyId);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMessageDialog = (contact: CompanyContact) => {
    setSelectedContact(contact);
    setMessageSubject("");
    setMessageContent("");
    setMessageSent(false);
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedContact) return;
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        sender_id: user.id,
        recipient_type: "company_contact",
        recipient_id: selectedContact.id,
        company_id: companyId,
        subject: messageSubject.trim(),
        message: messageContent.trim(),
      });

      if (error) throw error;

      setMessageSent(true);
      toast.success("Message envoyé avec succès !");

      setTimeout(() => {
        setMessageDialogOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="p-3 rounded-xl"
          style={{ background: `linear-gradient(135deg, ${themeColor}, hsl(var(--secondary)))` }}
        >
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Mes Contacts</h2>
          <p className="text-muted-foreground">Vos référents entreprise et support</p>
        </div>
      </div>

      {/* Company Contacts Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Contacts {companyName ? `de ${companyName}` : "de votre entreprise"}
            </h3>
            <p className="text-sm text-muted-foreground">Vos référents internes pour toute question</p>
          </div>
        </div>

        {contacts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucun contact entreprise configuré</p>
              <p className="text-sm text-muted-foreground mt-2">
                Contactez votre administrateur pour ajouter des contacts
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden h-full">
                  <div
                    className="h-2"
                    style={{ background: `linear-gradient(90deg, ${themeColor}, hsl(var(--secondary)))` }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {contact.photo_url ? (
                        <img
                          src={contact.photo_url}
                          alt={contact.nom}
                          className="w-12 h-12 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md"
                          style={{ background: themeColor }}
                        >
                          {contact.nom.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{contact.nom}</CardTitle>
                        {contact.role_contact && (
                          <Badge variant="secondary" className="mt-1 text-xs font-normal">
                            {contact.role_contact}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <a 
                          href={`mailto:${contact.email}`} 
                          className="hover:text-primary transition-colors truncate"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.telephone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <a 
                          href={`tel:${contact.telephone}`} 
                          className="hover:text-primary transition-colors"
                        >
                          {contact.telephone}
                        </a>
                      </div>
                    )}

                    <Button
                      className="w-full mt-4 group-hover:shadow-md transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${themeColor}, hsl(var(--secondary)))`,
                      }}
                      onClick={() => handleOpenMessageDialog(contact)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Envoyer un message
                      <ChevronRight className="h-4 w-4 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* MyFinCare Support Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20">
            <Crown className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Support MyFinCare</h3>
            <p className="text-sm text-muted-foreground">Une question sur le programme FinCare ou l'application MyFinCare ?</p>
          </div>
        </div>

        <Card className="group relative overflow-hidden border-border/50 hover:border-secondary/30 hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Headphones className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-bold mb-2">Besoin d'aide ?</h4>
                <p className="text-muted-foreground mb-4">
                  Une question sur le programme FinCare ou l'utilisation de l'application MyFinCare ? Notre équipe est là pour vous.
                </p>
                <Button
                  variant="outline"
                  className="group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors"
                  onClick={() => window.location.href = "mailto:contact@myfincare.fr"}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter le support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {messageSent ? "Message envoyé !" : `Envoyer un message à ${selectedContact?.nom}`}
            </DialogTitle>
            <DialogDescription>
              {messageSent
                ? "Votre message a été transmis avec succès."
                : "Rédigez votre message ci-dessous."}
            </DialogDescription>
          </DialogHeader>

          {messageSent ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-muted-foreground">Votre contact vous répondra dans les meilleurs délais.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Objet</Label>
                <Input
                  id="subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Objet de votre message"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Votre message..."
                  rows={5}
                />
              </div>
            </div>
          )}

          {!messageSent && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSendMessage} disabled={sendingMessage}>
                {sendingMessage ? "Envoi..." : "Envoyer"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
