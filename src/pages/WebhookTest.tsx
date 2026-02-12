import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Webhook, Send, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WebhookTest = () => {
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState<"participant.registered" | "participant.joined">("participant.registered");
  const [email, setEmail] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [result, setResult] = useState<any>(null);

  const simulateWebhook = async () => {
    if (!email || !moduleId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Construire le payload Livestorm
      const payload = {
        event_name: eventType,
        participant: {
          id: participantId || `test-${Date.now()}`,
          email: email,
          first_name: "Test",
          last_name: "User",
        },
        session: {
          id: `session-${Date.now()}`,
          estimated_started_at: new Date().toISOString(),
        },
      };

      console.log("Sending webhook payload:", payload);

      // Appeler l'edge function
      const { data, error } = await supabase.functions.invoke("livestorm-webhook", {
        body: payload,
      });

      if (error) {
        console.error("Edge function error:", error);
        setResult({
          success: false,
          error: error.message,
          details: error,
        });
        toast.error("Erreur lors de l'appel du webhook");
      } else {
        console.log("Edge function response:", data);
        setResult({
          success: true,
          data: data,
        });
        toast.success("Webhook simulé avec succès !");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setResult({
        success: false,
        error: error.message,
      });
      toast.error("Erreur lors de la simulation");
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!email || !moduleId) {
      toast.error("Veuillez remplir email et module ID");
      return;
    }

    try {
      // Get user ID from email
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (!profile) {
        toast.error("Utilisateur non trouvé");
        return;
      }

      const { data: registration } = await supabase
        .from("webinar_registrations")
        .select("*")
        .eq("user_id", profile.id)
        .eq("module_id", parseInt(moduleId))
        .maybeSingle();

      const { data: validation } = await supabase
        .from("module_validations")
        .select("*")
        .eq("user_id", profile.id)
        .eq("module_id", parseInt(moduleId))
        .maybeSingle();

      setResult({
        success: true,
        registration,
        validation,
      });
    } catch (error: any) {
      console.error("Error checking:", error);
      toast.error("Erreur lors de la vérification");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold hero-gradient mb-2">Test Webhook Livestorm</h1>
          <p className="text-muted-foreground">
            Simulez manuellement les événements de webhook Livestorm pour tester la logique de validation
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulaire de simulation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Simuler un événement
              </CardTitle>
              <CardDescription>
                Remplissez les informations pour simuler un webhook Livestorm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Type d'événement</Label>
                <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant.registered">participant.registered</SelectItem>
                    <SelectItem value="participant.joined">participant.joined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de l'utilisateur *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Doit correspondre à un email dans la table profiles
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moduleId">ID du Module *</Label>
                <Input
                  id="moduleId"
                  type="number"
                  placeholder="42"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  L'ID du module webinar à valider
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participantId">ID Participant Livestorm (optionnel)</Label>
                <Input
                  id="participantId"
                  placeholder="livestorm-participant-123"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={simulateWebhook}
                  disabled={loading}
                  className="flex-1"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Envoi..." : "Simuler Webhook"}
                </Button>
                
                <Button
                  onClick={checkRegistration}
                  variant="outline"
                >
                  Vérifier BDD
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result?.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : result ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : null}
                Résultat
              </CardTitle>
              <CardDescription>
                Réponse de l'edge function et état de la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>

                  {result.registration && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Inscription</h4>
                      <div className="text-sm space-y-1">
                        <p>✅ Email: {result.registration.email}</p>
                        <p>✅ Module ID: {result.registration.module_id}</p>
                        <p>
                          {result.registration.registered_at
                            ? "✅ Inscrit le: " +
                              new Date(result.registration.registered_at).toLocaleString()
                            : "❌ Non inscrit"}
                        </p>
                        <p>
                          {result.registration.joined_at
                            ? "✅ A rejoint le: " +
                              new Date(result.registration.joined_at).toLocaleString()
                            : "⏳ Pas encore rejoint"}
                        </p>
                        <p>
                          {result.registration.completed_at
                            ? "✅ Complété le: " +
                              new Date(result.registration.completed_at).toLocaleString()
                            : "⏳ Pas encore complété"}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.validation && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Validation</h4>
                      <div className="text-sm space-y-1">
                        <p>✅ Module validé: {result.validation.success ? "Oui" : "Non"}</p>
                        <p>
                          ✅ Date:{" "}
                          {new Date(result.validation.attempted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Webhook className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucun résultat pour le moment</p>
                  <p className="text-sm mt-2">Simulez un webhook pour voir les résultats</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="space-y-2">
              <li>
                <strong>participant.registered</strong> : Simule une inscription au webinar
                <ul className="mt-1 space-y-1">
                  <li>Crée ou met à jour une entrée dans <code>webinar_registrations</code></li>
                  <li>Enregistre l'email et l'ID du participant Livestorm</li>
                </ul>
              </li>
              <li>
                <strong>participant.joined</strong> : Simule la participation au webinar
                <ul className="mt-1 space-y-1">
                  <li>Met à jour <code>joined_at</code> et <code>completed_at</code> dans <code>webinar_registrations</code></li>
                  <li>Crée une validation dans <code>module_validations</code></li>
                  <li>Attribue les points au profil utilisateur</li>
                  <li>Ajoute le module aux <code>completed_modules</code></li>
                </ul>
              </li>
            </ol>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">⚠️ Important :</p>
              <ul className="text-sm space-y-1">
                <li>L'email doit exister dans la table <code>profiles</code></li>
                <li>Le module doit exister et être de type <code>webinar</code></li>
                <li>La validation ne peut être faite qu'une seule fois par utilisateur/module</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebhookTest;
