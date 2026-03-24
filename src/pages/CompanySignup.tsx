import { useState, useEffect } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/AuthProvider";

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'hotmail.fr',
  'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'msn.com',
  'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com',
  'proton.me', 'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr',
  'laposte.net', 'bbox.fr', 'numericable.fr', 'neuf.fr', 'club-internet.fr',
  'gmx.com', 'gmx.fr', 'yandex.com', 'mail.com', 'zoho.com'
];

const WHITELISTED_EMAILS = ['xavier.clermont@gmail.com'];

const isWhitelistedEmail = (email: string): boolean => {
  return WHITELISTED_EMAILS.includes(email.toLowerCase().trim());
};

const isPersonalEmail = (email: string): boolean => {
  const domain = email.toLowerCase().split('@')[1];
  return PERSONAL_EMAIL_DOMAINS.includes(domain);
};

const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
});

interface CompanyInfo {
  id: string;
  name: string;
  logo_url: string | null;
  partnership_type: string | null;
  email_domains: string[] | null;
}

const CompanySignup = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [allowPersonalEmails, setAllowPersonalEmails] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // If user is already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate("/employee", { replace: true });
    }
  }, [user, navigate]);

  // Fetch company by slug
  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) {
        setNotFound(true);
        setLoadingCompany(false);
        return;
      }

      const [companyResult, betaResult] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name, logo_url, partnership_type, email_domains")
          .eq("signup_slug", slug)
          .maybeSingle(),
        supabase
          .from("global_settings")
          .select("value")
          .eq("category", "beta")
          .eq("key", "allow_personal_emails")
          .maybeSingle(),
      ]);

      if (companyResult.error || !companyResult.data) {
        setNotFound(true);
      } else {
        setCompany(companyResult.data as CompanyInfo);
      }

      const betaVal = betaResult.data?.value;
      setAllowPersonalEmails(betaVal === true || betaVal === "true");

      setLoadingCompany(false);
    };

    fetchCompany();
  }, [slug]);

  // Validate email based on company rules
  const validateEmail = (value: string): string | null => {
    if (!value || !value.includes("@") || !company) return null;
    if (isWhitelistedEmail(value)) return null;

    const domain = value.toLowerCase().split("@")[1];
    const personal = isPersonalEmail(value);

    if (company.is_beta) {
      // Beta companies: all emails accepted
      return null;
    }

    const hasPartnership = company.partnership_type && 
      company.partnership_type.toLowerCase() !== "aucun";

    if (hasPartnership) {
      // Partner companies: only matching email domains
      const domains = (company.email_domains || []).map(d => 
        d.startsWith("@") ? d.substring(1).toLowerCase() : d.toLowerCase()
      );
      if (domains.length > 0 && !domains.includes(domain)) {
        return `Seuls les emails des domaines ${domains.join(", ")} sont autorisés pour ${company.name}.`;
      }
      return null;
    }

    // Non-partner: only professional emails
    if (personal) {
      return "Veuillez utiliser votre adresse email professionnelle pour vous inscrire.";
    }
    return null;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const emailValidation = validateEmail(email.trim());
    if (emailValidation) {
      toast.error(emailValidation);
      return;
    }

    const validation = signupSchema.safeParse({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke("auto-signup", {
        body: {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyId: company.id, // Pass company ID directly
        },
      });

      if (response.error) {
        toast.error("Erreur de connexion", { description: "Impossible de contacter le serveur" });
        return;
      }

      const responseData = response.data;

      if (responseData?.success === false || responseData?.error) {
        if (responseData.error === "personal_email") {
          toast.error(responseData.message || "Email professionnel requis");
        } else if (responseData.error === "already_exists") {
          toast.error("Cet email est déjà utilisé. Essayez de vous connecter.", {
            action: { label: "Se connecter", onClick: () => navigate("/login") },
          });
        } else {
          toast.error(responseData.message || "Erreur lors de l'inscription");
        }
        return;
      }

      if (!responseData?.user) {
        toast.error("Erreur lors de la création du compte");
        return;
      }

      // Sign in
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        toast.error("Erreur de connexion", { description: loginError.message });
        return;
      }

      toast.success("Compte créé avec succès !");

      const hasPartnership = company.partnership_type && 
        company.partnership_type.toLowerCase() !== "aucun";

      if (!hasPartnership) {
        navigate("/non-partner-welcome");
      } else {
        navigate("/employee/onboarding");
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#101217" }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#101217" }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Lien invalide</CardTitle>
            <CardDescription>
              Ce lien d'inscription n'est pas valide ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/login">
              <Button variant="hero">Retour à la connexion</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: "#101217" }}>
      <PageMeta
        title={`Inscription - ${company?.name}`}
        description={`Créez votre compte FinCare pour ${company?.name}`}
        path={`/join/${slug}`}
        noindex
      />

      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center space-y-2">
            {company?.logo_url ? (
              <div className="flex justify-center mb-2">
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-16 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
              </div>
            )}
            <CardTitle className="text-2xl hero-gradient">
              Rejoignez {company?.name}
            </CardTitle>
            <CardDescription>
              Créez votre compte FinCare et accédez à votre espace bien-être financier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {company?.is_beta ? "Email" : "Email professionnel"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={company?.is_beta ? "votre@email.com" : "jean.dupont@entreprise.com"}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  disabled={loading}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" variant="hero" disabled={loading || !!emailError}>
                {loading ? "Création en cours..." : "Créer mon compte"}
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4">
                Déjà un compte ?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Video */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video_index3.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default CompanySignup;
