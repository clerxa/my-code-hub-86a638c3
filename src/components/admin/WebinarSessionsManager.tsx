import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface WebinarSession {
  id?: string;
  session_date: string;
  registration_url: string;
  livestorm_session_id: string;
  isNew?: boolean;
}

interface WebinarSessionsManagerProps {
  moduleId: number | null;
}

// Convert ISO to datetime-local
const toDatetimeLocal = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

// Convert datetime-local to ISO
const toISO = (dtLocal: string): string | null => {
  if (!dtLocal) return null;
  return new Date(dtLocal).toISOString();
};

export function WebinarSessionsManager({ moduleId }: WebinarSessionsManagerProps) {
  const [sessions, setSessions] = useState<WebinarSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (moduleId) fetchSessions();
  }, [moduleId]);

  const fetchSessions = async () => {
    if (!moduleId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("webinar_sessions")
      .select("id, session_date, registration_url, livestorm_session_id")
      .eq("module_id", moduleId)
      .order("session_date", { ascending: true });

    if (!error && data) {
      setSessions(
        data.map((s) => ({
          id: s.id,
          session_date: toDatetimeLocal(s.session_date),
          registration_url: s.registration_url || "",
          livestorm_session_id: s.livestorm_session_id || "",
        }))
      );
    }
    setLoading(false);
  };

  const addSession = () => {
    setSessions((prev) => [
      ...prev,
      { session_date: "", registration_url: "", livestorm_session_id: "", isNew: true },
    ]);
  };

  const removeSession = async (index: number) => {
    const session = sessions[index];
    if (session.id && moduleId) {
      const { error } = await supabase
        .from("webinar_sessions")
        .delete()
        .eq("id", session.id);
      if (error) {
        toast.error("Erreur lors de la suppression");
        return;
      }
    }
    setSessions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSession = (index: number, field: keyof WebinarSession, value: string) => {
    setSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const saveSession = async (index: number) => {
    if (!moduleId) {
      toast.error("Enregistrez d'abord le module avant d'ajouter des sessions");
      return;
    }

    const session = sessions[index];
    if (!session.session_date) {
      toast.error("Veuillez renseigner une date");
      return;
    }

    const isoDate = toISO(session.session_date);
    if (!isoDate) return;

    if (session.id) {
      const { error } = await supabase
        .from("webinar_sessions")
        .update({
          session_date: isoDate,
          registration_url: session.registration_url || null,
          livestorm_session_id: session.livestorm_session_id || null,
        })
        .eq("id", session.id);
      if (error) {
        toast.error("Erreur lors de la mise à jour");
        return;
      }
      toast.success("Session mise à jour");
    } else {
      const { data, error } = await supabase
        .from("webinar_sessions")
        .insert({
          module_id: moduleId,
          session_date: isoDate,
          registration_url: session.registration_url || null,
          livestorm_session_id: session.livestorm_session_id || null,
        })
        .select("id")
        .single();
      if (error) {
        toast.error("Erreur lors de la création");
        return;
      }
      setSessions((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, id: data.id, isNew: false } : s
        )
      );
      toast.success("Session ajoutée");
    }
  };

  if (!moduleId) {
    return (
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        💡 Enregistrez le module pour pouvoir ajouter des sessions (dates multiples).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Sessions (dates multiples)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSession} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Ajouter une date
        </Button>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Chargement…</p>}

      {sessions.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground italic">
          Aucune session supplémentaire. La date principale ci-dessus sera utilisée.
        </p>
      )}

      {sessions.map((session, index) => (
        <Card key={session.id || `new-${index}`} className="border-dashed">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Date et heure</Label>
                <Input
                  type="datetime-local"
                  value={session.session_date}
                  onChange={(e) => updateSession(index, "session_date", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Lien d'inscription</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={session.registration_url}
                  onChange={(e) => updateSession(index, "registration_url", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSession(index)}
                className="text-destructive hover:text-destructive h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Supprimer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => saveSession(index)}
                className="h-7 px-3"
              >
                {session.id ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
