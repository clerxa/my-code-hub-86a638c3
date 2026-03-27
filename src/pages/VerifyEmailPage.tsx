import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import { CheckCircle, Mail, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Status = "loading" | "verifying" | "success" | "already_verified" | "error" | "awaiting";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const token = searchParams.get("token");

  // If token present, verify it
  useEffect(() => {
    if (!token) {
      setStatus("awaiting");
      return;
    }

    const verify = async () => {
      setStatus("verifying");
      try {
        const { data, error } = await supabase.functions.invoke("verify-email", {
          body: { token },
        });

        if (error) throw error;

        if (data?.already_verified) {
          setStatus("already_verified");
        } else if (data?.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  // If no token and user is logged in, check if already verified
  useEffect(() => {
    if (token || !user) return;

    const checkVerification = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("id", user.id)
        .single();

      if ((data as any)?.email_verified) {
        navigate("/panorama", { replace: true });
      } else {
        setStatus("awaiting");
      }
    };

    checkVerification();
  }, [user, token, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!user || resending) return;
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-email");
      if (error) throw error;
      if (data?.already_verified) {
        navigate("/panorama", { replace: true });
        return;
      }
      toast.success("Email de vérification envoyé !");
      setCooldown(60);
    } catch (err: any) {
      if (err?.message?.includes("patienter")) {
        toast.error("Veuillez patienter avant de renvoyer.");
        setCooldown(30);
      } else {
        toast.error("Erreur lors de l'envoi. Réessayez.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleContinue = () => {
    navigate("/panorama", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, hsl(220 25% 8%) 0%, hsl(230 30% 14%) 50%, hsl(250 25% 12%) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          {/* Loading / Verifying */}
          {(status === "loading" || status === "verifying") && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Vérification en cours...</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-5"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Email vérifié !</h1>
                <p className="text-muted-foreground mt-2">
                  Votre adresse email a été confirmée avec succès. Bienvenue sur MyFinCare !
                </p>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Accéder à mon espace
              </Button>
            </motion.div>
          )}

          {/* Already verified */}
          {status === "already_verified" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-5"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Déjà vérifié</h1>
                <p className="text-muted-foreground mt-2">
                  Votre email est déjà confirmé. Vous pouvez continuer.
                </p>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Continuer
              </Button>
            </motion.div>
          )}

          {/* Error */}
          {status === "error" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-5"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Lien invalide</h1>
                <p className="text-muted-foreground mt-2">
                  Ce lien de vérification est invalide ou a expiré.
                </p>
              </div>
              {user && (
                <Button onClick={handleResend} disabled={resending || cooldown > 0} variant="outline" className="w-full gap-2">
                  <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                  {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer un email"}
                </Button>
              )}
            </motion.div>
          )}

          {/* Awaiting verification (no token, user logged in) */}
          {status === "awaiting" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-5"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Vérifiez votre email</h1>
                <p className="text-muted-foreground mt-2">
                  Un email de confirmation vous a été envoyé lors de votre inscription. 
                  Cliquez sur le lien qu'il contient pour activer votre compte et accéder à votre espace.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  💡 Pensez à vérifier vos <strong>spams</strong> si vous ne trouvez pas l'email.
                </p>
              </div>
              <Button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer l'email"}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
