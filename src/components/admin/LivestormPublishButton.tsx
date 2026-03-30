import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Loader2, Rocket, CheckCircle2 } from "lucide-react";

interface LivestormPublishButtonProps {
  moduleId: number | null;
  moduleTitle: string;
  livestormEventId?: string | null;
  onPublished?: (result: {
    livestorm_event_id: string;
    registration_link: string;
    sessions_created: number;
  }) => void;
}

export function LivestormPublishButton({
  moduleId,
  moduleTitle,
  livestormEventId,
  onPublished,
}: LivestormPublishButtonProps) {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!moduleId) {
      toast.error("Enregistrez d'abord le module avant de publier sur Livestorm.");
      return;
    }

    if (livestormEventId) {
      toast.info("Ce module est déjà lié à un événement Livestorm.");
      return;
    }

    // Fetch sessions from DB
    const { data: sessions } = await supabase
      .from("webinar_sessions")
      .select("id, session_date")
      .eq("module_id", moduleId)
      .order("session_date", { ascending: true });

    if (!sessions || sessions.length === 0) {
      toast.error("Ajoutez au moins une session (date) avant de publier sur Livestorm.");
      return;
    }

    setPublishing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-livestorm-webinar",
        {
          body: {
            module_id: moduleId,
            sessions: sessions.map((s) => ({
              id: s.id,
              session_date: s.session_date,
            })),
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Erreur inconnue");
      }

      toast.success(
        `Webinar créé dans Livestorm ! ${data.sessions_created} session(s) synchronisée(s).`
      );

      onPublished?.({
        livestorm_event_id: data.livestorm_event_id,
        registration_link: data.registration_link,
        sessions_created: data.sessions_created,
      });
    } catch (err: any) {
      console.error("Livestorm publish error:", err);
      toast.error(`Erreur Livestorm : ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (livestormEventId) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Lié à Livestorm
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-mono truncate">
            {livestormEventId}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() =>
            window.open(
              `https://app.livestorm.co/fincare/events/${livestormEventId}`,
              "_blank"
            )
          }
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Voir
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handlePublish}
        disabled={publishing || !moduleId}
        className="w-full gap-2"
        variant="default"
      >
        {publishing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Création en cours…
          </>
        ) : (
          <>
            <Rocket className="h-4 w-4" />
            Créer dans Livestorm
          </>
        )}
      </Button>
      {!moduleId && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Enregistrez le module et ajoutez des sessions avant de publier.
        </p>
      )}
    </div>
  );
}
