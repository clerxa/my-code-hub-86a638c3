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
  
  const defaultHero = {
    title: "Le bien-être financier de vos collaborateurs, notre priorité",
    subtitle: "MyFinCare accompagne vos salariés avec des parcours d'éducation financière personnalisés, des simulateurs et un accès à des experts certifiés.",
    ctaPrimary: "Demander une démo",
    ctaSecondary: "Découvrir nos solutions",
    image: "",
    clientLogos: [],
  };

  const defaultProblems = [
    {
      title: "Stress financier généralisé",
      description: "72% des salariés sont stressés par leurs finances personnelles, impactant directement leur productivité et leur engagement au travail.",
      icon: "TrendingDown",
    },
    {
      title: "Manque d'accompagnement",
      description: "La majorité des entreprises n'offrent aucun programme d'éducation financière, laissant leurs collaborateurs livrés à eux-mêmes.",
      icon: "UserX",
    },
    {
      title: "Avantages sociaux sous-utilisés",
      description: "Épargne salariale, PEE, PERCO, RSU… Vos collaborateurs ne comprennent pas leurs avantages et passent à côté d'opportunités.",
      icon: "PieChart",
    },
  ];

  const defaultSolution = {
    title: "MyFinCare : la solution complète",
    description: "Une plateforme tout-en-un pour transformer le bien-être financier de vos équipes",
    pillars: [
      { title: "Parcours pédagogiques", description: "Des modules interactifs adaptés au niveau de chaque collaborateur", icon: "GraduationCap" },
      { title: "Simulateurs avancés", description: "Épargne, impôts, capacité d'emprunt… Des outils concrets pour mieux décider", icon: "Calculator" },
      { title: "Experts certifiés", description: "Un accès direct à des conseillers financiers pour un accompagnement personnalisé", icon: "Shield" },
      { title: "Tableau de bord RH", description: "Suivez l'engagement et mesurez l'impact du programme en temps réel", icon: "BarChart" },
    ],
  };

  const defaultSocialProof = {
    title: "Ils font confiance à MyFinCare",
    companies: [],
    testimonials: [
      {
        name: "Sophie M.",
        role: "DRH",
        company: "TechCorp",
        content: "Depuis le déploiement de MyFinCare, nous avons constaté une réduction significative du stress financier chez nos collaborateurs et une amélioration de l'engagement.",
        avatar: "",
      },
    ],
    stats: [
      { value: "500+", label: "entreprises partenaires" },
      { value: "92%", label: "de satisfaction collaborateurs" },
      { value: "3x", label: "meilleure compréhension des avantages" },
    ],
  };

  const defaultDemo = {
    title: "Comment ça marche ?",
    description: "Un déploiement simple en 3 étapes",
    screenshots: [],
    layout: "2-columns" as const,
  };

  const defaultBenefits = {
    title: "Pourquoi choisir MyFinCare ?",
    items: [
      { title: "Réduction du turnover", description: "Les entreprises proposant un programme financier réduisent leur turnover de 25%", icon: "TrendingUp" },
      { title: "Marque employeur renforcée", description: "Positionnez-vous comme un employeur innovant et soucieux du bien-être global", icon: "Award" },
      { title: "ROI mesurable", description: "Suivez l'impact en temps réel grâce à notre tableau de bord analytique", icon: "BarChart" },
      { title: "Déploiement clé en main", description: "Notre équipe vous accompagne de A à Z, zéro charge technique pour vos équipes", icon: "Zap" },
    ],
  };

  const defaultComparison = {
    title: "Avec ou sans MyFinCare",
    enabled: true,
    rows: [
      { without: "Salariés stressés par leurs finances", with: "Collaborateurs sereins et accompagnés", highlight: true },
      { without: "Avantages sociaux mal compris et sous-utilisés", with: "Avantages pleinement exploités grâce à la pédagogie", highlight: false },
      { without: "Aucune visibilité sur le bien-être financier", with: "Données et KPIs en temps réel pour les RH", highlight: false },
    ],
  };

  const defaultFaq = [
    { question: "Combien de temps prend le déploiement ?", answer: "Le déploiement est réalisé en 2 à 3 semaines. Notre équipe s'occupe de tout : personnalisation, intégration et formation." },
    { question: "Le programme est-il adapté à toutes les tailles d'entreprise ?", answer: "Oui, MyFinCare s'adapte aux PME comme aux grands groupes avec des offres personnalisées selon vos besoins." },
    { question: "Quel est le coût pour l'entreprise ?", answer: "Nous proposons plusieurs formules adaptées à votre taille et vos besoins. Contactez-nous pour un devis personnalisé." },
    { question: "Les données des salariés sont-elles protégées ?", answer: "Absolument. Toutes les données sont chiffrées et hébergées en France. Nous sommes conformes au RGPD." },
    { question: "Peut-on personnaliser le contenu pour notre entreprise ?", answer: "Oui, la plateforme est entièrement personnalisable : logo, couleurs, modules activés, ressources documentaires spécifiques." },
  ];

  const defaultCtaFinal = {
    title: "Prêt à transformer le bien-être financier de vos équipes ?",
    subtitle: "Rejoignez les 500+ entreprises qui font confiance à MyFinCare",
    cta: "Demander une démo gratuite",
  };

  const defaultContactForm = {
    title: "Demandez une démo",
    description: "Remplissez ce formulaire et notre équipe vous contactera sous 24h",
    firstName_label: "Prénom",
    firstName_placeholder: "Votre prénom",
    firstName_required: true,
    lastName_label: "Nom",
    lastName_placeholder: "Votre nom",
    lastName_required: true,
    company_label: "Entreprise",
    company_placeholder: "Nom de votre entreprise",
    company_required: true,
    email_label: "Email professionnel",
    email_placeholder: "votre.email@entreprise.com",
    phone_label: "Téléphone",
    phone_placeholder: "+33 6 12 34 56 78",
    phone_required: false,
    companySize_label: "Taille de l'entreprise",
    companySize_placeholder: "Sélectionnez la taille",
    companySize_required: true,
    message_label: "Message (optionnel)",
    message_placeholder: "Parlez-nous de vos besoins...",
    message_required: false,
    submit_button: "Envoyer ma demande",
    success_message: "Merci ! Nous reviendrons vers vous sous 24h.",
  };

  const [hero, setHero] = useState<any>(defaultHero);
  const [problems, setProblems] = useState<any[]>(defaultProblems);
  const [solution, setSolution] = useState<any>(defaultSolution);
  const [socialProof, setSocialProof] = useState<any>(defaultSocialProof);
  const [demo, setDemo] = useState<any>(defaultDemo);
  const [benefits, setBenefits] = useState<any>(defaultBenefits);
  const [comparison, setComparison] = useState<any>(defaultComparison);
  const [faq, setFaq] = useState<any[]>(defaultFaq);
  const [ctaFinal, setCtaFinal] = useState<any>(defaultCtaFinal);
  const [contactForm, setContactForm] = useState<any>(defaultContactForm);

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

      if (!data || data.length === 0) {
        // No data in DB, save defaults
        await saveContent();
        toast.success("Contenu par défaut initialisé. Personnalisez-le selon vos besoins !");
        setLoading(false);
        return;
      }

      data.forEach((item) => {
        let value;
        try {
          if (typeof item.value === 'string') {
            value = JSON.parse(item.value);
          } else {
            value = item.value;
          }
        } catch (e) {
          console.error(`Error parsing ${item.key}:`, e);
          value = typeof item.value === 'object' ? item.value : null;
        }
        
        switch (item.key) {
          case "landing_hero":
            if (value) setHero(value);
            break;
          case "landing_problems":
            if (value) setProblems(value);
            break;
          case "landing_solution":
            if (value) setSolution(value);
            break;
          case "landing_social_proof":
            if (value) setSocialProof(value);
            break;
          case "landing_demo":
            if (value) setDemo(value);
            break;
          case "landing_benefits":
            if (value) setBenefits(value);
            break;
          case "landing_comparison":
            if (value) setComparison(value);
            break;
          case "landing_faq":
            if (value) setFaq(value);
            break;
          case "landing_cta_final":
            if (value) setCtaFinal(value);
            break;
          case "partnership_page_content":
            if (value?.form_fields) setContactForm(value.form_fields);
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