/**
 * ===========================================================
 * 📄 File: CompanyContacts.tsx
 * 📌 Rôle du fichier : Page de gestion des contacts pour les employés
 * 🧩 Dépendances importantes :
 *   - supabase pour les requêtes
 *   - framer-motion pour les animations
 * 🔁 Logiques principales :
 *   - Affichage des contacts entreprise
 *   - Envoi de messages aux contacts et admins
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Building2,
  Mail,
  Phone,
  Send,
  MessageSquare,
  Crown,
  UserCircle,
  Sparkles,
  CheckCircle,
  Clock,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { MobileCompanyNav } from "@/components/company/MobileCompanyNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CompanyContact {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  role_contact: string | null;
}

interface Company {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  partnership_type: string | null;
  enable_points_ranking: boolean;
}

interface Message {
  id: string;
  subject: string;
  message: string;
  recipient_type: string;
  is_read: boolean;
  created_at: string;
}

const CompanyContacts = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompanyContact, setIsCompanyContact] = useState(false);
  const [activeSection, setActiveSection] = useState("contacts");

  // Message dialog state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    type: "company_contact" | "admin";
    contact?: CompanyContact;
  } | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // Sent messages
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    try {
      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id, name, primary_color, secondary_color, partnership_type, enable_points_ranking")
        .eq("id", id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", id);

      if (!contactsError && contactsData) {
        setContacts(contactsData);
      }

      // Check user role
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        setIsCompanyContact(roleData?.role === "contact_entreprise" || roleData?.role === "admin");
      }

      // Fetch sent messages
      await fetchSentMessages();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const fetchSentMessages = async () => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSentMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenMessageDialog = (type: "company_contact" | "admin", contact?: CompanyContact) => {
    setSelectedRecipient({ type, contact });
    setMessageSubject("");
    setMessageContent("");
    setMessageSent(false);
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!user || !id || !selectedRecipient) return;
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSendingMessage(true);
    try {
      // Insert message in database
      const { error } = await supabase.from("contact_messages").insert({
        sender_id: user.id,
        recipient_type: selectedRecipient.type,
        recipient_id: selectedRecipient.contact?.id || null,
        company_id: id,
        subject: messageSubject.trim(),
        message: messageContent.trim(),
      });

      if (error) throw error;

      // If message is to admin (MyFinCare), send email notification
      if (selectedRecipient.type === "admin") {
        // Get user profile for sender name
        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        const senderName = profileData
          ? `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim()
          : user.email || "Utilisateur";

        // Send email via edge function
        const { error: emailError } = await supabase.functions.invoke("send-contact-message", {
          body: {
            senderName,
            senderEmail: user.email,
            companyName: company?.name || "",
            subject: messageSubject.trim(),
            message: messageContent.trim(),
          },
        });

        if (emailError) {
          console.warn("Email notification failed:", emailError);
          // Don't throw - message was still saved
        }
      }

      setMessageSent(true);
      toast.success("Message envoyé avec succès !");

      // Refresh messages list
      setTimeout(() => {
        fetchSentMessages();
        setMessageDialogOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  };

  const primaryColor = company?.primary_color || "hsl(var(--primary))";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block h-12 w-12 rounded-full border-4 border-primary border-r-transparent"
          />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Entreprise non trouvée</p>
          <Button className="mt-4" onClick={() => navigate("/employee")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      {/* Mobile Nav - Top */}
      <div className="lg:hidden px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <MobileCompanyNav
          activeSection={activeSection}
          onSectionChange={(section) => {
            if (section === "contacts") return;
            navigate(`/company/${id}?section=${section}`);
          }}
          isCompanyContact={isCompanyContact}
          companyId={id}
          enablePointsRanking={company.enable_points_ranking}
        />
      </div>

      <main className="flex-1 flex">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <CompanySidebar
            activeSection={activeSection}
            onSectionChange={(section) => {
              if (section === "contacts") return;
              navigate(`/company/${id}?section=${section}`);
            }}
            isCompanyContact={isCompanyContact}
            companyId={id}
            primaryColor={primaryColor}
            enablePointsRanking={company.enable_points_ranking}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header with back button */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <Button variant="ghost" onClick={() => navigate(`/company/${id}`)} className="mb-4 hover:bg-muted/50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="flex items-center gap-4">
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, hsl(var(--secondary)))` }}
                >
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Mes Contacts
                  </h1>
                  <p className="text-muted-foreground mt-1">Contactez vos référents entreprise ou l'équipe MyFinCare</p>
                </div>
              </div>
            </motion.div>

            <Tabs defaultValue="contacts" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger
                  value="contacts"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mes messages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="space-y-8">
                {/* Company Contacts Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Contacts de votre entreprise</h2>
                      <p className="text-sm text-muted-foreground">Vos référents internes pour toute question</p>
                    </div>
                  </div>

                  {contacts.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Aucun contact entreprise configuré</p>
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
                          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden">
                            <div
                              className="h-2"
                              style={{ background: `linear-gradient(90deg, ${primaryColor}, hsl(var(--secondary)))` }}
                            />
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md"
                                    style={{ background: primaryColor }}
                                  >
                                    {contact.nom.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{contact.nom}</CardTitle>
                                    {contact.role_contact && (
                                      <Badge variant="secondary" className="mt-1 text-xs font-normal">
                                        {contact.role_contact}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {contact.email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors">
                                    {contact.email}
                                  </a>
                                </div>
                              )}
                              {contact.telephone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <a href={`tel:${contact.telephone}`} className="hover:text-primary transition-colors">
                                    {contact.telephone}
                                  </a>
                                </div>
                              )}

                              <Button
                                className="w-full mt-4 group-hover:shadow-md transition-all"
                                style={{
                                  background: `linear-gradient(135deg, ${primaryColor}, hsl(var(--secondary)))`,
                                }}
                                onClick={() => handleOpenMessageDialog("company_contact", contact)}
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20">
                      <Crown className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Support MyFinCare</h2>
                      <p className="text-sm text-muted-foreground">Notre équipe d'experts est là pour vous aider</p>
                    </div>
                  </div>

                  <Card className="group relative overflow-hidden border-border/50 hover:border-secondary/30 hover:shadow-xl transition-all duration-500">
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardContent className="relative p-8">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
                            <Headphones className="h-12 w-12 text-white" />
                          </div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-2 -right-2"
                          >
                            <Sparkles className="h-6 w-6 text-accent" />
                          </motion.div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-2xl font-bold mb-2">Équipe MyFinCare</h3>
                          <p className="text-muted-foreground mb-4 max-w-md">
                            Une question sur vos finances personnelles, l'utilisation de la plateforme ou une demande
                            spécifique ? Notre équipe vous répond sous 24h.
                          </p>

                          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                            <Badge variant="outline" className="bg-background/50">
                              <Clock className="h-3 w-3 mr-1" />
                              Réponse sous 24h
                            </Badge>
                            <Badge variant="outline" className="bg-background/50">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Experts certifiés
                            </Badge>
                          </div>

                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-secondary to-accent hover:shadow-glow transition-all duration-300"
                            onClick={() => handleOpenMessageDialog("admin")}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Contacter l'équipe MyFinCare
                            <ChevronRight className="h-4 w-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Messages envoyés</h2>
                      <p className="text-sm text-muted-foreground">Historique de vos échanges</p>
                    </div>
                  </div>

                  {loadingMessages ? (
                    <div className="flex justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent"
                      />
                    </div>
                  ) : sentMessages.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Vous n'avez pas encore envoyé de message</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Vos messages apparaîtront ici</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {sentMessages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                      variant={msg.recipient_type === "admin" ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {msg.recipient_type === "admin" ? "MyFinCare" : "Contact entreprise"}
                                    </Badge>
                                    {msg.is_read && (
                                      <Badge variant="outline" className="text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Lu
                                      </Badge>
                                    )}
                                  </div>
                                  <h4 className="font-medium truncate">{msg.subject}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{msg.message}</p>
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <AnimatePresence mode="wait">
            {messageSent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="h-10 w-10 text-success" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">Message envoyé !</h3>
                <p className="text-muted-foreground">
                  {selectedRecipient?.type === "admin"
                    ? "L'équipe MyFinCare vous répondra sous 24h"
                    : "Votre contact recevra votre message très prochainement"}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedRecipient?.type === "admin" ? (
                      <>
                        <Crown className="h-5 w-5 text-secondary" />
                        Contacter MyFinCare
                      </>
                    ) : (
                      <>
                        <UserCircle className="h-5 w-5 text-primary" />
                        Message à {selectedRecipient?.contact?.nom}
                      </>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedRecipient?.type === "admin"
                      ? "Notre équipe d'experts vous répondra sous 24h"
                      : `Envoyez un message à votre contact entreprise`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      placeholder="Ex: Comment rentrer en contact avec un conseiller Perlib?"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Votre message</Label>
                    <Textarea
                      id="message"
                      placeholder="Décrivez votre question ou demande..."
                      className="min-h-[150px] resize-none"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setMessageDialogOpen(false)} disabled={sendingMessage}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageSubject.trim() || !messageContent.trim()}
                    className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                  >
                    {sendingMessage ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                      />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {sendingMessage ? "Envoi..." : "Envoyer"}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyContacts;
