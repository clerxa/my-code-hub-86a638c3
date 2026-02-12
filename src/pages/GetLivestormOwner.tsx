import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";

const GetLivestormOwner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  const [lookupEmail, setLookupEmail] = useState("");
  const [manualOwnerId, setManualOwnerId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const fetchOwner = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-livestorm-owner");

      if (error) {
        console.error("Error fetching owner:", error);
        toast.error((data as any)?.error || error.message || "Impossible de récupérer l'owner automatiquement.");
        setShowManualInput(true);
        return;
      }

      console.log("Owner data:", data);

      if (data?.success && data.owners?.length > 0) {
        const owner = data.owners[0];
        setOwnerId(owner.id);
        setOwnerEmail(owner.email);
        setOwnerName(`${owner.first_name || ''} ${owner.last_name || ''}`.trim());
        toast.success("Owner Livestorm récupéré avec succès");
      } else {
        toast.error(
          data?.error || "Impossible de récupérer l'owner automatiquement. Utilisez la saisie manuelle."
        );
        setShowManualInput(true);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur lors de la récupération de l'owner. Utilisez la saisie manuelle.");
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerByEmail = async () => {
    if (!lookupEmail.trim()) {
      toast.error("Veuillez saisir un email");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-livestorm-owner", {
        body: { email: lookupEmail.trim() },
      });

      if (error) {
        console.error("Error fetching owner by email:", error);
        toast.error((data as any)?.error || error.message || "Impossible de résoudre l'owner via l'email.");
        setShowManualInput(true);
        return;
      }

      if (data?.success && data.owners?.length > 0) {
        const owner = data.owners[0];
        setOwnerId(owner.id);
        setOwnerEmail(owner.email);
        setOwnerName(`${owner.first_name || ''} ${owner.last_name || ''}`.trim());
        toast.success("Owner Livestorm trouvé via email");
      } else {
        toast.error(data?.error || "Aucun utilisateur trouvé avec cet email");
        setShowManualInput(true);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur lors de la recherche par email.");
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const saveOwnerEmail = async () => {
    if (!lookupEmail.trim()) {
      toast.error("Veuillez saisir un email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'livestorm_owner_email',
            value: lookupEmail.trim(),
            metadata: { saved_at: new Date().toISOString() },
          },
          {
            onConflict: 'key',
          }
        );

      if (error) throw error;
      toast.success("Email enregistré. La création de webinar pourra résoudre l'Owner ID automatiquement.");
    } catch (err) {
      console.error("Error saving owner email:", err);
      toast.error("Erreur lors de l'enregistrement de l'email");
    } finally {
      setLoading(false);
    }
  };

  const saveManualOwnerId = async () => {
    if (!manualOwnerId.trim()) {
      toast.error("Veuillez saisir un Owner ID");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'livestorm_owner_id',
            value: manualOwnerId.trim(),
            metadata: { manual: true, saved_at: new Date().toISOString() },
          },
          {
            onConflict: 'key',
          }
        );

      if (error) throw error;

      setOwnerId(manualOwnerId.trim());
      setOwnerEmail(null);
      setOwnerName(null);
      toast.success("Owner ID enregistré avec succès");
    } catch (err) {
      console.error("Error saving owner ID:", err);
      toast.error("Erreur lors de l'enregistrement de l'owner ID");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Back-Office
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Récupérer Owner Livestorm</CardTitle>
            <CardDescription>
              Récupérez automatiquement l'ID du propriétaire Livestorm pour créer des webinars, ou saisissez-le manuellement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button
                onClick={fetchOwner}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Récupération en cours...
                  </>
                ) : (
                  "Récupérer l'Owner Livestorm (API)"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowManualInput(!showManualInput)}
                className="w-full sm:w-auto"
              >
                {showManualInput ? "Masquer la saisie manuelle" : "Saisir manuellement l'Owner ID"}
              </Button>
            </div>

            {showManualInput && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email de l'owner (optionnel)</label>
                  <input
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="owner@votre-entreprise.com"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Si vous ne retrouvez pas l'Owner ID, on peut tenter de le résoudre à partir de l'email (l'API Livestorm
                    doit être accessible avec votre token).
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={fetchOwnerByEmail}
                      disabled={loading || !lookupEmail.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Recherche...
                        </>
                      ) : (
                        "Trouver l'Owner via email (API)"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={saveOwnerEmail}
                      disabled={loading || !lookupEmail.trim()}
                      className="w-full"
                    >
                      Enregistrer l'email
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner ID Livestorm</label>
                  <input
                    type="text"
                    value={manualOwnerId}
                    onChange={(e) => setManualOwnerId(e.target.value)}
                    placeholder="usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Comment trouver votre Owner ID :</strong>
                    <br />
                    1. Connectez-vous à Livestorm
                    <br />
                    2. Allez dans <strong>Settings → Team</strong>
                    <br />
                    3. Ouvrez la fiche du membre (ou cliquez sur son nom)
                    <br />
                    4. L'ID est généralement dans l'URL (format <code className="text-xs bg-background px-1 py-0.5 rounded">usr_...</code>)
                  </p>
                </div>

                <Button
                  onClick={saveManualOwnerId}
                  disabled={loading || !manualOwnerId.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer l'Owner ID"
                  )}
                </Button>
              </div>
            )}

            {ownerId && (
              <div className="p-6 bg-muted rounded-lg space-y-3">
                <h3 className="font-semibold text-lg">✅ Owner configuré :</h3>
                <div className="space-y-2">
                  {ownerName && (
                    <p className="text-sm">
                      <span className="font-medium">Nom :</span>{" "}
                      <span className="text-muted-foreground">{ownerName}</span>
                    </p>
                  )}
                  {ownerEmail && (
                    <p className="text-sm">
                      <span className="font-medium">Email :</span>{" "}
                      <span className="text-muted-foreground">{ownerEmail}</span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">ID :</span>{" "}
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {ownerId}
                    </code>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  ✅ Cet ID a été enregistré et sera utilisé pour créer les futurs webinars Livestorm.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GetLivestormOwner;
