import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/components/AuthProvider";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères")
});

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const hasRedirected = useRef(false);

  // Si l'utilisateur est déjà connecté (via le contexte auth), rediriger
  useEffect(() => {
    if (!user || hasRedirected.current) return;
    hasRedirected.current = true;

    const redirectLoggedInUser = async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (profileData?.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("partnership_type")
            .eq("id", profileData.company_id)
            .single();

          const hasPartnership = companyData?.partnership_type &&
            companyData.partnership_type.toLowerCase() !== 'aucun';
          if (!hasPartnership) {
            navigate("/non-partner-welcome", { replace: true });
          } else {
            navigate("/employee/onboarding", { replace: true });
          }
        } else {
          navigate("/employee", { replace: true });
        }
      }
    };

    redirectLoggedInUser();
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({
      email: email.trim(),
      password
    });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          toast.error("Email ou mot de passe incorrect");
        } else {
          toast.error("Erreur lors de la connexion");
        }
        return;
      }
      if (!authData.user) {
        toast.error("Erreur lors de la connexion");
        return;
      }

      // Mettre à jour les informations de connexion
      const now = new Date().toISOString();
      await supabase.from("profiles").update({
        last_login: now,
        current_session_start: now
      }).eq("id", authData.user.id);

      // Vérifier le rôle
      const {
        data: roleData
      } = await supabase.from("user_roles").select("role").eq("user_id", authData.user.id).maybeSingle();
      toast.success("Connexion réussie");
      if (roleData?.role === "admin") {
        navigate("/admin");
      } else {
        // Récupérer les infos de l'entreprise de l'utilisateur
        const {
          data: profileData
        } = await supabase.from("profiles").select("company_id").eq("id", authData.user.id).single();
        if (profileData?.company_id) {
          const {
            data: companyData
          } = await supabase.from("companies").select("partnership_type").eq("id", profileData.company_id).single();

          // Rediriger selon le statut de partenariat
          if (!companyData?.partnership_type) {
            navigate("/non-partner-welcome");
          } else {
            navigate("/employee/onboarding");
          }
        } else {
          navigate("/employee");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Veuillez saisir votre email");
      return;
    }
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('public-password-reset', {
        body: { email: resetEmail.trim() },
      });

      if (response.error) {
        console.error("Error from edge function:", response.error);
        toast.error("Erreur lors de l'envoi de l'email");
        return;
      }

      if (response.data && !response.data.success) {
        console.error("Edge function returned error:", response.data.error);
        toast.error("Erreur lors de l'envoi de l'email");
        return;
      }

      toast.success("Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      console.error("Error during password reset:", error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: '#101217' }}>
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl hero-gradient">Rejoignez FinCare</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte FinCare et prenez le pouvoir sur vos finances personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showForgotPassword ? <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Mot de passe
                  </label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                </div>

              <Button type="submit" className="w-full" variant="hero" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>

                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:underline w-full text-center" disabled={loading}>
                  Mot de passe oublié ?
                </button>

                <div className="text-center text-sm text-muted-foreground mt-4">
                  Pas encore de compte ?{" "}
                  <Link to="/signup" className="text-primary hover:underline">
                    S'inscrire
                  </Link>
                </div>
              </form> : <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="reset-email" type="email" placeholder="admin@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required disabled={loading} />
                </div>

                <Button type="submit" className="w-full" variant="hero" disabled={loading}>
                  {loading ? "Envoi..." : "Réinitialiser le mot de passe"}
                </Button>

                <button type="button" onClick={() => {
              setShowForgotPassword(false);
              setResetEmail("");
            }} className="text-sm text-muted-foreground hover:underline w-full text-center" disabled={loading}>
                  Retour à la connexion
                </button>
              </form>}
          </CardContent>
        </Card>
      </div>

      {/* Right side - Video */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video_index3.mp4" type="video/mp4" />
        </video>
      </div>
    </div>;
};
export default Login;