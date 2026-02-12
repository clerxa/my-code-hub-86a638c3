import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Eye, EyeOff } from "lucide-react";
import { HeroEditor } from "./landing/HeroEditor";
import { ProblemsEditor } from "./landing/ProblemsEditor";
import { SolutionEditor } from "./landing/SolutionEditor";
import { SocialProofEditor } from "./landing/SocialProofEditor";
import { FAQEditor } from "./landing/FAQEditor";
import { ContactFormEditor } from "./landing/ContactFormEditor";
import { ComparisonEditor } from "./landing/ComparisonEditor";
import { DemoEditor } from "./landing/DemoEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";

export const LandingPageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
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
          "partnership_page_content"
        ]);

      if (error) throw error;

      data?.forEach((item) => {
        let value;
        try {
          // Si c'est une string, essayer de parser
          if (typeof item.value === 'string') {
            value = JSON.parse(item.value);
          } else {
            value = item.value;
          }
        } catch (e) {
          console.error(`Error parsing ${item.key}:`, e);
          // Si le parsing échoue, utiliser la valeur brute si c'est un objet, sinon null
          value = typeof item.value === 'object' ? item.value : null;
        }
        
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
          case "partnership_page_content":
            setContactForm(value?.form_fields || {
              title: "Demandez une démo",
              description: "Remplissez ce formulaire et notre équipe vous contactera",
              firstName_label: "Prénom",
              firstName_placeholder: "Votre prénom",
              firstName_required: true,
              lastName_label: "Nom",
              lastName_placeholder: "Votre nom",
              lastName_required: true,
              company_label: "Entreprise",
              company_placeholder: "Nom de votre entreprise",
              company_required: true,
              email_label: "Email",
              email_placeholder: "votre.email@entreprise.com",
              phone_label: "Téléphone",
              phone_placeholder: "+33 6 12 34 56 78",
              phone_required: false,
              companySize_label: "Taille de l'entreprise",
              companySize_placeholder: "Sélectionnez la taille",
              companySize_required: true,
              message_label: "Message",
              message_placeholder: "Parlez-nous de vos besoins...",
              message_required: false,
              submit_button: "Envoyer ma demande",
              success_message: "Merci ! Nous reviendrons vers vous rapidement."
            });
            break;
        }
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      // Fetch current partnership content to merge form fields
      const { data: currentData } = await supabase
        .from("settings")
        .select("metadata")
        .eq("key", "partnership_page_content")
        .single();

      const partnershipContent = currentData?.metadata as any || {};

      const updates = [
        { key: "landing_hero", value: JSON.stringify(hero) },
        { key: "landing_problems", value: JSON.stringify(problems) },
        { key: "landing_solution", value: JSON.stringify(solution) },
        { key: "landing_social_proof", value: JSON.stringify(socialProof) },
        { key: "landing_demo", value: JSON.stringify(demo) },
        { key: "landing_benefits", value: JSON.stringify(benefits) },
        { key: "landing_comparison", value: JSON.stringify(comparison) },
        { key: "landing_faq", value: JSON.stringify(faq) },
        { key: "landing_cta_final", value: JSON.stringify(ctaFinal) },
        { 
          key: "partnership_page_content", 
          value: JSON.stringify({ ...partnershipContent, form_fields: contactForm }) 
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert({
            key: update.key,
            value: update.value,
            metadata: { section: update.key.replace("landing_", "") }
          }, {
            onConflict: "key"
          });

        if (error) throw error;
      }

      toast.success("Landing page sauvegardée !");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Éditeur Landing Page B2B</h2>
          <p className="text-muted-foreground">
            Modifiez tous les éléments de votre landing page
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/partenariat", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir la landing page
          </Button>
          <Button onClick={saveContent} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="problems">Problèmes</TabsTrigger>
              <TabsTrigger value="solution">Solution</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="demo">Démo</TabsTrigger>
              <TabsTrigger value="benefits">Avantages</TabsTrigger>
              <TabsTrigger value="comparison">Comparaison</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="cta">CTA</TabsTrigger>
              <TabsTrigger value="form">Formulaire</TabsTrigger>
            </TabsList>

            <div className="mt-4 bg-card rounded-lg border p-6 max-h-[calc(100vh-16rem)] overflow-auto">
              <TabsContent value="hero" className="mt-0">
                <HeroEditor data={hero} onChange={setHero} />
              </TabsContent>

              <TabsContent value="problems" className="mt-0">
                <ProblemsEditor data={problems} onChange={setProblems} />
              </TabsContent>

              <TabsContent value="solution" className="mt-0">
                <SolutionEditor data={solution} onChange={setSolution} />
              </TabsContent>

              <TabsContent value="social" className="mt-0">
                <SocialProofEditor data={socialProof} onChange={setSocialProof} />
              </TabsContent>

              <TabsContent value="demo" className="mt-0">
                <DemoEditor data={demo} onChange={setDemo} />
              </TabsContent>

              <TabsContent value="benefits" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Avantages FinCare</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={benefits?.title || ""}
                        onChange={(e) => setBenefits({ ...benefits, title: e.target.value })}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Utilisez la section "Problèmes" pour gérer les items individuels
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="mt-0">
                <ComparisonEditor data={comparison} onChange={setComparison} />
              </TabsContent>

              <TabsContent value="faq" className="mt-0">
                <FAQEditor data={faq} onChange={setFaq} />
              </TabsContent>

              <TabsContent value="cta" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>CTA Final</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={ctaFinal?.title || ""}
                        onChange={(e) => setCtaFinal({ ...ctaFinal, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sous-titre</Label>
                      <Input
                        value={ctaFinal?.subtitle || ""}
                        onChange={(e) => setCtaFinal({ ...ctaFinal, subtitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte du bouton</Label>
                      <Input
                        value={ctaFinal?.cta || ""}
                        onChange={(e) => setCtaFinal({ ...ctaFinal, cta: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="form" className="mt-0">
                <ContactFormEditor data={contactForm || {}} onChange={setContactForm} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
    </div>
  );
};