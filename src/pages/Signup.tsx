import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { UserPlus, Building2, GraduationCap, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ONBOARDING_SESSION_KEY = 'fincare_onboarding_session_id';
const INVITATION_TOKEN_KEY = 'fincare_invitation_token';
const INVITATION_COMPANY_KEY = 'fincare_invitation_company';

// Liste des domaines d'emails personnels à bloquer
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'hotmail.fr',
  'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'msn.com',
  'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com',
  'proton.me', 'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr',
  'laposte.net', 'bbox.fr', 'numericable.fr', 'neuf.fr', 'club-internet.fr',
  'gmx.com', 'gmx.fr', 'yandex.com', 'mail.com', 'zoho.com'
];

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

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Vérifier si l'email est personnel en temps réel
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && value.includes('@') && isPersonalEmail(value)) {
      setEmailError("Veuillez utiliser votre adresse email professionnelle pour vous inscrire.");
    } else {
      setEmailError(null);
    }
  };

  useEffect(() => {
    checkExistingSession();
    trackInvitationClick();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // If the user arrives via an invitation link but is already authenticated (often due to an existing admin session),
      // we must avoid redirecting to /employee which can lead to "Profil non trouvé" for newly invited users.
      // Instead, sign out and let the user continue the invitation signup flow.
      const token = searchParams.get("invitation");
      if (token) {
        await supabase.auth.signOut();
        return;
      }

      navigate("/employee");
    }
  };

  // Track invitation link click
  const trackInvitationClick = async () => {
    // First check URL params, then check localStorage (for users coming from onboarding)
    let token = searchParams.get("invitation");
    
    // If no token in URL, check localStorage (set during public onboarding)
    if (!token) {
      token = localStorage.getItem(INVITATION_TOKEN_KEY);
    }
    
    if (token) {
      setInvitationToken(token);
      console.log("Tracking invitation click for token:", token);
      try {
        await supabase.functions.invoke("track-invitation", {
          body: null,
          headers: {},
        }).then(() => {
          // Use fetch directly to pass query params
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-invitation?token=${token}&action=click`);
        });
      } catch (error) {
        console.error("Error tracking invitation click:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification côté client des emails personnels
    if (isPersonalEmail(email.trim())) {
      toast.error("Email professionnel requis", {
        description: "Veuillez utiliser votre adresse email professionnelle pour vous inscrire."
      });
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
      // Get onboarding session ID from localStorage
      const onboardingSessionId = localStorage.getItem(ONBOARDING_SESSION_KEY);
      
      // Call auto-signup edge function
      const response = await supabase.functions.invoke('auto-signup', {
        body: {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          onboardingSessionId, // Pass the session ID to link onboarding responses
          invitationToken, // Pass invitation token for tracking
        }
      });

      console.log('Signup response:', response);

      // Check for SDK-level errors (network, etc.)
      if (response.error) {
        console.error('Edge function SDK error:', response.error);
        toast.error("Erreur de connexion", {
          description: "Impossible de contacter le serveur"
        });
        return;
      }

      const responseData = response.data;

      // Check if response indicates failure
      if (responseData?.success === false || responseData?.error) {
        if (responseData.error === 'personal_email') {
          toast.error(responseData.message || "Votre email doit être un email professionnel. Les adresses personnelles ne sont pas autorisées.");
          return;
        } else if (responseData.error === 'already_exists') {
          toast.error("Cet email est déjà utilisé");
          return;
        } else {
          toast.error(responseData.message || "Erreur lors de l'inscription");
          return;
        }
      }

      // Verify we have valid signup data
      if (!responseData?.user) {
        toast.error("Erreur lors de la création du compte");
        return;
      }

      // Sign in the user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        toast.error("Erreur de connexion", {
          description: loginError.message
        });
        return;
      }

      toast.success("Compte créé avec succès !");
      
      // Clear the onboarding session ID and invitation params from localStorage since they're now used
      localStorage.removeItem(ONBOARDING_SESSION_KEY);
      localStorage.removeItem(INVITATION_TOKEN_KEY);
      localStorage.removeItem(INVITATION_COMPANY_KEY);

      // Check if company has partnership
      if (!responseData.company?.has_partnership) {
        // Redirect to non-partner welcome for non-partner companies
        navigate("/non-partner-welcome");
      } else if (responseData.onboarding_completed) {
        // User already completed public onboarding, go directly to employee dashboard
        navigate("/employee");
      } else {
        // Redirect to employee onboarding (only if they didn't do public onboarding)
        navigate("/employee/onboarding");
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error("Erreur lors de l'inscription", {
        description: error.message || "Une erreur inattendue est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-background">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl hero-gradient">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez FinCare et commencez votre parcours vers la maîtrise financière
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
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@entreprise.com"
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

              {/* Info box expliquant pourquoi email pro */}
              <Alert className="bg-primary/5 border-primary/20">
                <Building2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Pourquoi un email professionnel ?</span>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside">
                    <li>Être automatiquement rattaché à votre entreprise</li>
                    <li>Bénéficier de parcours de formation personnalisés</li>
                    <li>Accéder aux avantages négociés par votre employeur</li>
                  </ul>
                  <p className="mt-2 text-xs italic">
                    Vous pourrez ajouter votre email personnel dans votre profil après inscription.
                  </p>
                </AlertDescription>
              </Alert>

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

              <Button type="submit" className="w-full" variant="hero" disabled={loading}>
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
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video_index3.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default Signup;
