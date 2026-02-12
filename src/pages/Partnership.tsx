import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblems } from "@/components/landing/LandingProblems";
import { LandingSolution } from "@/components/landing/LandingSolution";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingCTAFinal } from "@/components/landing/LandingCTAFinal";

export default function Partnership() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Landing content state
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
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    companySize: "",
    message: "",
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", [
          "landing_hero",
          "landing_problems",
          "landing_solution",
          "landing_social_proof",
          "landing_demo",
          "landing_benefits",
          "landing_comparison",
          "landing_faq",
          "landing_cta_final",
          "partnership_page_contact_form"
        ]);

      if (error) throw error;

      data?.forEach((item) => {
        const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        
        switch (item.key) {
          case "landing_hero":
            setHero(value);
            break;
          case "landing_problems":
            setProblems(value);
            break;
          case "landing_solution":
            setSolution(value);
            break;
          case "landing_social_proof":
            setSocialProof(value);
            break;
          case "landing_demo":
            setDemo(value);
            break;
          case "landing_benefits":
            setBenefits(value);
            break;
          case "landing_comparison":
            setComparison(value);
            break;
          case "landing_faq":
            setFaq(value);
            break;
          case "landing_cta_final":
            setCtaFinal(value);
            break;
          case "partnership_page_contact_form":
            setContactForm(value);
            break;
        }
      });
    } catch (error) {
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
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("partnership_contact_requests")
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          company_size: formData.companySize,
          message: formData.message,
        });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke("send-partnership-email", {
          body: {
            type: "contact_request",
            data: formData,
          },
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      toast({
        title: "Demande envoyée",
        description: "Nous vous contacterons très prochainement.",
      });

      setFormData({
        firstName: "",
        lastName: "",
        company: "",
        email: "",
        phone: "",
        companySize: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      {hero && (
        <LandingHero
          title={hero.title}
          subtitle={hero.subtitle}
          ctaPrimary={hero.ctaPrimary}
          ctaSecondary={hero.ctaSecondary}
          image={hero.image}
          clientLogos={hero.clientLogos}
          onCtaPrimary={scrollToForm}
          onCtaSecondary={() => window.open(hero.ctaSecondaryLink, '_blank')}
        />
      )}
      
      {/* Problems Section */}
      {problems.length > 0 && <LandingProblems problems={problems} />}
      
      {/* Solution Section */}
      {solution && (
        <LandingSolution
          title={solution.title}
          description={solution.description}
          pillars={solution.pillars}
        />
      )}
      
      {/* Social Proof Section */}
      {socialProof && (
        <LandingSocialProof
          title={socialProof.title}
          companies={socialProof.companies}
          testimonials={socialProof.testimonials}
          stats={socialProof.stats}
        />
      )}
      
      {/* Demo Section */}
      {demo && (
        <LandingDemo
          title={demo.title}
          description={demo.description}
          screenshots={demo.screenshots}
          layout={demo.layout}
        />
      )}
      
      {/* Benefits Section */}
      {benefits && (
        <LandingBenefits
          title={benefits.title}
          items={benefits.items}
        />
      )}
      
      {/* Comparison Section */}
      {comparison && (
        <LandingComparison
          title={comparison.title}
          enabled={comparison.enabled}
          rows={comparison.rows}
        />
      )}
      
      {/* FAQ Section */}
      {faq.length > 0 && <LandingFAQ items={faq} />}
      
      {/* CTA Final Section */}
      {ctaFinal && (
        <LandingCTAFinal
          title={ctaFinal.title}
          subtitle={ctaFinal.subtitle}
          cta={ctaFinal.cta}
          onCTA={scrollToForm}
        />
      )}
      
      {/* Contact Form Section */}
      <section id="contact-form" className="py-24 px-4 bg-card/30">
        <div className="container max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Contactez-nous</h2>
            <p className="text-xl text-muted-foreground">
              Remplissez le formulaire et nous vous recontacterons rapidement
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-card">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {contactForm?.firstNameLabel || "Prénom"}
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {contactForm?.lastNameLabel || "Nom"}
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">
                {contactForm?.companyLabel || "Entreprise"}
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {contactForm?.emailLabel || "Email professionnel"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {contactForm?.phoneLabel || "Téléphone"}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">
                {contactForm?.companySizeLabel || "Taille de l'entreprise"}
              </Label>
              <Select
                value={formData.companySize}
                onValueChange={(value) =>
                  setFormData({ ...formData, companySize: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-50">1-50 salariés</SelectItem>
                  <SelectItem value="51-200">51-200 salariés</SelectItem>
                  <SelectItem value="201-500">201-500 salariés</SelectItem>
                  <SelectItem value="501-1000">501-1000 salariés</SelectItem>
                  <SelectItem value="1001-3000">1001-3000 salariés</SelectItem>
                  <SelectItem value="3000+">+ de 3000 salariés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                {contactForm?.messageLabel || "Message (optionnel)"}
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-hero-gradient text-lg py-6"
              disabled={submitting}
            >
              {submitting ? "Envoi en cours..." : (contactForm?.submitButtonText || "Être recontacté")}
            </Button>
          </form>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container max-w-7xl text-center text-muted-foreground">
          <p>© 2024 FinCare. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
