import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink } from "lucide-react";
import { HeroEditor } from "./landing/HeroEditor";
import { ProblemsEditor } from "./landing/ProblemsEditor";
import { SolutionEditor } from "./landing/SolutionEditor";
import { SocialProofEditor } from "./landing/SocialProofEditor";
import { DemoEditor } from "./landing/DemoEditor";
import { LandingPreview } from "./landing/LandingPreview";
import { ComparisonEditor } from "./landing/ComparisonEditor";
import { FAQEditor } from "./landing/FAQEditor";
import { ContactFormEditor } from "./landing/ContactFormEditor";

export const EmployeePartnershipEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hero, setHero] = useState({
    title: "Offrez le bien-être financier à toute votre entreprise",
    subtitle: "Vous utilisez FinCare et vous en êtes convaincu ? Devenez ambassadeur et aidez vos collègues à prendre en main leur avenir financier.",
    ctaPrimary: "Proposer FinCare",
    ctaSecondary: "Découvrir les avantages",
  });

  const [problems, setProblems] = useState([
    {
      title: "Vous êtes isolé dans votre démarche",
      description: "Vous bénéficiez de FinCare individuellement, mais vos collègues n'ont pas accès à ces outils essentiels pour leur avenir financier.",
      icon: "UserX",
    },
    {
      title: "Vos collègues peinent à gérer leurs finances",
      description: "Épargne, retraite, fiscalité... Vous voyez autour de vous des personnes stressées par ces sujets sans savoir où trouver de l'aide.",
      icon: "TrendingDown",
    },
    {
      title: "Votre entreprise pourrait faire plus",
      description: "Le bien-être financier de vos collègues impacte leur productivité et leur satisfaction au travail, mais votre entreprise n'a pas encore mis en place de solution.",
      icon: "Building2",
    },
  ]);

  const [solution, setSolution] = useState({
    title: "Vous avez le pouvoir de changer les choses",
    description: "En proposant FinCare à votre entreprise, vous devenez un acteur clé du bien-être de vos collègues",
    pillars: [
      {
        title: "Impact collectif",
        description: "Permettez à tous vos collègues d'accéder aux mêmes outils que vous",
        icon: "Users",
      },
      {
        title: "Reconnaissance interne",
        description: "Soyez reconnu comme un ambassadeur du bien-être au sein de votre entreprise",
        icon: "Award",
      },
      {
        title: "Simple et rapide",
        description: "Un formulaire, une mise en relation, et c'est FinCare qui fait le reste",
        icon: "Zap",
      },
      {
        title: "Accompagnement dédié",
        description: "FinCare accompagne votre entreprise de A à Z dans la mise en place",
        icon: "Handshake",
      },
    ],
  });

  const [socialProof, setSocialProof] = useState({
    title: "Des salariés déjà convaincus",
    companies: [],
    testimonials: [
      {
        name: "Marie D.",
        role: "Ingénieure",
        company: "TechCorp",
        content: "J'ai proposé FinCare à mon entreprise et aujourd'hui toute mon équipe en profite. Voir mes collègues reprendre le contrôle de leurs finances, c'est vraiment gratifiant !",
        avatar: "",
      },
    ],
    stats: [
      { value: "85%", label: "des salariés recommandent FinCare à leur entreprise" },
      { value: "3 semaines", label: "en moyenne pour déployer FinCare" },
      { value: "500+", label: "entreprises partenaires" },
    ],
  });

  const [demo, setDemo] = useState({
    title: "Comment ça marche ?",
    description: "De votre proposition à la mise en place du partenariat",
    screenshots: [],
    layout: "2-columns" as const,
  });

  const [benefits, setBenefits] = useState({
    title: "Pourquoi proposer FinCare ?",
    items: [
      {
        title: "Vous aidez vos collègues",
        description: "Offrez à toute votre entreprise les outils dont vous bénéficiez déjà pour une meilleure sérénité financière",
        icon: "Heart",
      },
      {
        title: "Vous êtes valorisé",
        description: "Devenez un acteur clé du bien-être dans votre entreprise et soyez reconnu pour votre initiative",
        icon: "Star",
      },
      {
        title: "Vous renforcez la culture d'entreprise",
        description: "Contribuez à créer un environnement de travail où le bien-être financier est pris au sérieux",
        icon: "Briefcase",
      },
      {
        title: "Aucun risque, aucun engagement",
        description: "Vous proposez, FinCare s'occupe du reste. Zéro contrainte pour vous",
        icon: "Shield",
      },
    ],
  });

  const [comparison, setComparison] = useState({
    title: "Avec ou sans FinCare pour toute l'entreprise",
    enabled: true,
    rows: [
      {
        without: "Vous êtes le seul à bénéficier de FinCare",
        with: "Toute votre entreprise a accès à FinCare",
        highlight: true,
      },
      {
        without: "Vos collègues restent stressés financièrement",
        with: "Vos collègues reprennent le contrôle de leur avenir",
        highlight: false,
      },
      {
        without: "Le bien-être financier n'est pas une priorité RH",
        with: "Votre entreprise se positionne comme employeur innovant",
        highlight: false,
      },
    ],
  });

  const [faq, setFaq] = useState([
    {
      question: "Que se passe-t-il après avoir envoyé le formulaire ?",
      answer: "FinCare prend contact avec votre entreprise pour présenter l'offre. Vous restez informé de l'avancement sans aucune charge de travail supplémentaire.",
    },
    {
      question: "Est-ce que je prends un risque en proposant FinCare ?",
      answer: "Absolument aucun ! Vous faites simplement une recommandation. C'est FinCare qui gère toute la relation commerciale et l'accompagnement de votre entreprise.",
    },
    {
      question: "Mon entreprise va-t-elle savoir que c'est moi qui ai fait la proposition ?",
      answer: "Oui, si vous le souhaitez. Vous pouvez choisir de rester anonyme ou d'être identifié comme ambassadeur FinCare dans votre entreprise.",
    },
    {
      question: "Combien de temps faut-il pour mettre en place FinCare ?",
      answer: "En moyenne 3 semaines entre le premier contact et le déploiement complet. FinCare s'occupe de tout : présentation, personnalisation, formation des équipes.",
    },
    {
      question: "Y a-t-il un nombre minimum de salariés requis ?",
      answer: "FinCare s'adapte à toutes les tailles d'entreprise, des PME aux grands groupes. Chaque offre est personnalisée selon les besoins.",
    },
  ]);

  const [ctaFinal, setCtaFinal] = useState({
    title: "Prêt à faire la différence ?",
    subtitle: "Proposez FinCare à votre entreprise et devenez un ambassadeur du bien-être financier",
    cta: "Proposer FinCare maintenant",
  });

  const [contactForm, setContactForm] = useState({
    title: "Proposez FinCare à votre entreprise",
    description: "Remplissez ce formulaire et notre équipe contactera votre entreprise pour présenter FinCare",
    firstName_label: "Votre prénom",
    firstName_placeholder: "Jean",
    firstName_required: true,
    lastName_label: "Votre nom",
    lastName_placeholder: "Dupont",
    lastName_required: true,
    company_label: "Votre entreprise",
    company_placeholder: "Nom de votre entreprise",
    company_required: true,
    email_label: "Votre email professionnel",
    email_placeholder: "jean.dupont@entreprise.com",
    phone_label: "Votre téléphone (optionnel)",
    phone_placeholder: "+33 6 12 34 56 78",
    phone_required: false,
    companySize_label: "Taille de l'entreprise",
    companySize_placeholder: "Ex: 50-200 salariés",
    companySize_required: false,
    message_label: "Pourquoi recommandez-vous FinCare ? (optionnel)",
    message_placeholder: "Partagez votre expérience avec FinCare et pourquoi vous pensez que vos collègues en bénéficieraient...",
    message_required: false,
    submit_button: "Envoyer ma proposition",
    success_message: "Merci ! Votre proposition a été envoyée avec succès. Nous contacterons votre entreprise prochainement.",
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
          "employee_partnership_hero",
          "employee_partnership_problems",
          "employee_partnership_solution",
          "employee_partnership_social_proof",
          "employee_partnership_demo",
          "employee_partnership_benefits",
          "employee_partnership_comparison",
          "employee_partnership_faq",
          "employee_partnership_cta_final",
          "employee_partnership_contact_form",
        ]);

      if (error) throw error;

      let hasData = false;
      data?.forEach((item) => {
        hasData = true;
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

      // Si aucune donnée n'existe, sauvegarder le contenu par défaut
      if (!hasData) {
        await saveContent();
        toast({
          title: "Initialisation",
          description: "Le contenu par défaut a été créé. N'hésitez pas à le personnaliser !",
        });
      }
    } catch (error: any) {
      console.error("Error fetching content:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le contenu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "employee_partnership_hero", value: JSON.stringify(hero) },
        { key: "employee_partnership_problems", value: JSON.stringify(problems) },
        { key: "employee_partnership_solution", value: JSON.stringify(solution) },
        { key: "employee_partnership_social_proof", value: JSON.stringify(socialProof) },
        { key: "employee_partnership_demo", value: JSON.stringify(demo) },
        { key: "employee_partnership_benefits", value: JSON.stringify(benefits) },
        { key: "employee_partnership_comparison", value: JSON.stringify(comparison) },
        { key: "employee_partnership_faq", value: JSON.stringify(faq) },
        { key: "employee_partnership_cta_final", value: JSON.stringify(ctaFinal) },
        { key: "employee_partnership_contact_form", value: JSON.stringify(contactForm) },
      ];

      const { error } = await supabase
        .from("settings")
        .upsert(updates, { onConflict: "key" });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La page a été mise à jour avec succès",
      });
    } catch (error: any) {
      console.error("Error saving content:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Landing Page Salarié - Partenariat</h2>
          <p className="text-muted-foreground">
            Personnalisez la page pour que les salariés proposent FinCare à leur entreprise
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/proposer-partenariat" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir la page
            </a>
          </Button>
          <Button onClick={saveContent} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder"
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="problems">Problèmes</TabsTrigger>
          <TabsTrigger value="solution">Solution</TabsTrigger>
          <TabsTrigger value="social">Social Proof</TabsTrigger>
          <TabsTrigger value="demo">Démo</TabsTrigger>
          <TabsTrigger value="benefits">Avantages</TabsTrigger>
          <TabsTrigger value="comparison">Comparaison</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="cta">CTA Final</TabsTrigger>
          <TabsTrigger value="form">Formulaire</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroEditor data={hero} onChange={setHero} />
        </TabsContent>

        <TabsContent value="problems">
          <ProblemsEditor data={problems} onChange={setProblems} />
        </TabsContent>

        <TabsContent value="solution">
          <SolutionEditor data={solution} onChange={setSolution} />
        </TabsContent>

        <TabsContent value="social">
          <SocialProofEditor data={socialProof} onChange={setSocialProof} />
        </TabsContent>

        <TabsContent value="demo">
          <DemoEditor data={demo} onChange={setDemo} />
        </TabsContent>

        <TabsContent value="benefits">
          <SolutionEditor data={benefits} onChange={setBenefits} />
        </TabsContent>

        <TabsContent value="comparison">
          <ComparisonEditor data={comparison} onChange={setComparison} />
        </TabsContent>

        <TabsContent value="faq">
          <FAQEditor data={faq} onChange={setFaq} />
        </TabsContent>

        <TabsContent value="cta">
          <HeroEditor data={ctaFinal} onChange={setCtaFinal} />
        </TabsContent>

        <TabsContent value="form">
          <ContactFormEditor data={contactForm} onChange={setContactForm} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
