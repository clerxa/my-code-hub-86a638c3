import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblems } from "@/components/landing/LandingProblems";
import { LandingSolution } from "@/components/landing/LandingSolution";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingCTAFinal } from "@/components/landing/LandingCTAFinal";
import { Loader2 } from "lucide-react";

const EmployeePartnership = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [hero, setHero] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [solution, setSolution] = useState<any>(null);
  const [socialProof, setSocialProof] = useState<any>(null);
  const [demo, setDemo] = useState<any>(null);
  const [benefits, setBenefits] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [faq, setFaq] = useState<any[]>([]);
  const [ctaFinal, setCtaFinal] = useState<any>(null);
  const [contactForm, setContactForm] = useState<any>(null);
  
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    contacts: [{ firstName: "", lastName: "", email: "" }],
    message: "",
  });

  useEffect(() => {
    fetchContent();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, companies(name)")
        .eq("id", user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        const landingUrl = window.location.origin + "/partenariat";
        const defaultMessage = `Bonjour {contact_first_name},

Je voulais vous partager une initiative qui pourrait avoir un vrai impact positif : FinCare.

C'est un programme d'éducation financière gratuit, déjà utilisé dans plusieurs entreprises réputées comme Salesforce, Thales, Meta ou encore Wavestone.
Il aide les collaborateurs à :

• mieux comprendre leur rémunération,
• éviter des erreurs fiscales coûteuses,
• optimiser épargne salariale,
• et réduire le stress lié aux finances.

C'est 100% gratuit pour l'entreprise, et les équipes peuvent assister à des webinars thématiques, accéder à des parcours pédagogiques et échanger avec des conseillers certifiés.

Je serais ravi(e) si nous pouvions en bénéficier également.

Découvrez tous les avantages : ${landingUrl}

Merci pour votre attention,

{sender_first_name}`;

        setFormData({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: profileData.email || "",
          phone: profileData.phone_number || "",
          company: profileData.companies?.name || "",
          contacts: [{ firstName: "", lastName: "", email: "" }],
          message: defaultMessage,
        });
      }
    }
  };

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", [
          "employee_partnership_hero",
          "employee_partnership_problems",
          "employee_partnership_solution",
          "employee_partnership_social_proof",
          "employee_partnership_demo",
          "employee_partnership_benefits",
          "employee_partnership_comparison",
          "employee_partnership_faq",
          "employee_partnership_cta_final",
          "employee_partnership_contact_form"
        ]);

      if (error) throw error;

      data?.forEach((item) => {
        const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        
        switch (item.key) {
          case "employee_partnership_hero":
            setHero(value);
            break;
          case "employee_partnership_problems":
            setProblems(value);
            break;
          case "employee_partnership_solution":
            setSolution(value);
            break;
          case "employee_partnership_social_proof":
            setSocialProof(value);
            break;
          case "employee_partnership_demo":
            setDemo(value);
            break;
          case "employee_partnership_benefits":
            setBenefits(value);
            break;
          case "employee_partnership_comparison":
            setComparison(value);
            break;
          case "employee_partnership_faq":
            setFaq(value);
            break;
          case "employee_partnership_cta_final":
            setCtaFinal(value);
            break;
          case "employee_partnership_contact_form":
            setContactForm(value);
            break;
        }
      });
    } catch (error: any) {
      console.error("Error fetching content:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le contenu de la page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    const formElement = document.getElementById("contact-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate contacts
      const validContacts = formData.contacts.filter(c => c.email && c.firstName);
      if (validContacts.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez ajouter au moins un contact avec un nom et un email.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("partnership_requests")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          company_id: profile?.company_id,
          sender_first_name: formData.firstName,
          sender_last_name: formData.lastName,
          sender_email: formData.email,
          contact_email: validContacts[0].email,
          contact_first_name: validContacts[0].firstName,
          contact_last_name: validContacts[0].lastName,
          message: formData.message,
        });

      if (insertError) throw insertError;

      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        "send-employee-partnership-email",
        {
        body: {
          sender: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          company: formData.company,
          contacts: validContacts,
          message: formData.message,
        },
        }
      );

      if (emailError) throw emailError;
      console.log("send-employee-partnership-email response", emailData);

      toast({
        title: "Demande envoyée !",
        description: contactForm?.success_message || "Votre recommandation a été envoyée avec succès.",
      });

      fetchUserProfile();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre demande.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { firstName: "", lastName: "", email: "" }],
    });
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length > 1) {
      setFormData({
        ...formData,
        contacts: formData.contacts.filter((_, i) => i !== index),
      });
    }
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...formData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, contacts: newContacts });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {hero && (
        <LandingHero
          title={hero.title}
          subtitle={hero.subtitle}
          ctaPrimary={hero.ctaPrimary}
          ctaSecondary={hero.ctaSecondary}
          onCtaPrimary={scrollToForm}
          onCtaSecondary={scrollToForm}
        />
      )}

      {problems && problems.length > 0 && (
        <LandingProblems problems={problems} />
      )}

      {solution && (
        <LandingSolution
          title={solution.title}
          description={solution.description}
          pillars={solution.pillars}
        />
      )}

      {socialProof && (
        <LandingSocialProof
          title={socialProof.title}
          companies={socialProof.companies || []}
          testimonials={socialProof.testimonials || []}
          stats={socialProof.stats || []}
        />
      )}

      {demo && (
        <LandingDemo
          title={demo.title}
          description={demo.description || ""}
          screenshots={demo.screenshots || []}
          layout={demo.layout || "2-columns"}
        />
      )}

      {benefits && (
        <LandingBenefits
          title={benefits.title}
          items={benefits.items}
        />
      )}

      {comparison && (
        <LandingComparison
          title={comparison.title}
          enabled={comparison.enabled !== false}
          rows={comparison.rows || []}
        />
      )}

      {faq && faq.length > 0 && (
        <LandingFAQ items={faq} />
      )}

      <section id="contact-form" className="py-24 px-4 bg-card/30">
        <div className="container max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              {contactForm?.title || "Proposez FinCare à votre entreprise"}
            </h2>
            <p className="text-xl text-muted-foreground">
              {contactForm?.description || "Remplissez ce formulaire et nous contacterons votre entreprise"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-lg">
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-lg">Vos informations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Votre prénom</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    placeholder="Jean"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Votre nom</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    placeholder="Dupont"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Votre email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    placeholder="jean.dupont@entreprise.com"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Votre téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    placeholder="+33 6 12 34 56 78"
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company">Votre entreprise</Label>
                <Input
                  id="company"
                  value={formData.company}
                  placeholder="Nom de votre entreprise"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Contacts dans votre entreprise</h3>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  + Ajouter un contact
                </Button>
              </div>
              
              {formData.contacts.map((contact, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                  {formData.contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeContact(index)}
                    >
                      ✕
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`contact-firstName-${index}`}>Prénom du contact *</Label>
                      <Input
                        id={`contact-firstName-${index}`}
                        value={contact.firstName}
                        onChange={(e) => updateContact(index, "firstName", e.target.value)}
                        placeholder="Marie"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-lastName-${index}`}>Nom du contact</Label>
                      <Input
                        id={`contact-lastName-${index}`}
                        value={contact.lastName}
                        onChange={(e) => updateContact(index, "lastName", e.target.value)}
                        placeholder="Martin"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-email-${index}`}>Email du contact *</Label>
                      <Input
                        id={`contact-email-${index}`}
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(index, "email", e.target.value)}
                        placeholder="marie.martin@entreprise.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="message">Message personnalisé</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Personnalisez votre message..."
                rows={12}
                required
              />
              <p className="text-sm text-muted-foreground mt-2">
                Les variables {"{contact_first_name}"} et {"{sender_first_name}"} seront automatiquement remplacées
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                contactForm?.submit_button || "Envoyer ma demande"
              )}
            </Button>
          </form>
        </div>
      </section>

      {ctaFinal && (
        <LandingCTAFinal
          title={ctaFinal.title}
          subtitle={ctaFinal.subtitle}
          cta={ctaFinal.cta}
          onCTA={scrollToForm}
        />
      )}

      <footer className="py-8 px-4 text-center text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} FinCare. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default EmployeePartnership;
