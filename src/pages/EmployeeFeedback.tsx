import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus, Send, Lightbulb, Bug, Palette, BarChart3,
  Clock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Heart, Sparkles, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";

const CATEGORIES = [
  { value: "ux", label: "Expérience utilisateur (UX)", icon: Palette, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "data", label: "Données financières", icon: BarChart3, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "bug", label: "Bug / Problème technique", icon: Bug, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { value: "idea", label: "Boîte à idées", icon: Lightbulb, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "content", label: "Contenu / Pédagogie", icon: MessageSquarePlus, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "other", label: "Autre", icon: MessageSquarePlus, color: "bg-muted text-muted-foreground" },
];

const PRIORITIES = [
  { value: "low", label: "Faible", icon: Clock, color: "text-muted-foreground" },
  { value: "medium", label: "Moyen", icon: AlertTriangle, color: "text-amber-600" },
  { value: "high", label: "Urgent", icon: AlertTriangle, color: "text-destructive" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  submitted: { label: "Soumis", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  in_review: { label: "En cours d'analyse", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  planned: { label: "Planifié", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  done: { label: "Traité", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

export default function EmployeeFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["feedbacks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feedbacks").insert({
        user_id: user!.id,
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Merci pour votre feedback ! 🙏");
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      setCategory("");
      setPriority("medium");
      setSubject("");
      setMessage("");
      setShowForm(false);
    },
    onError: () => toast.error("Erreur lors de l'envoi du feedback"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedbacks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback supprimé");
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const isValid = category && subject.trim().length >= 3 && message.trim().length >= 10;

  const getCategoryInfo = (val: string) => CATEGORIES.find((c) => c.value === val);

  return (
    <EmployeeLayout activeSection="feedback">
      <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <MessageSquarePlus className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
              <p className="text-muted-foreground text-sm">
                Aidez-nous à améliorer votre expérience. Chaque retour compte !
              </p>
            </div>
          </div>
        </motion.div>

        {/* Thank you notice */}
        <Alert className="border-primary/20 bg-primary/5">
          <Heart className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Merci pour le temps que vous consacrez à nous faire un retour.</strong>{" "}
            Chaque feedback est lu attentivement. Il sera traité et priorisé en fonction du degré d'urgence et de notre roadmap produit.
          </AlertDescription>
        </Alert>

        {/* New feedback button */}
        {!showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
              <Sparkles className="h-4 w-4" />
              Nouveau feedback
            </Button>
          </motion.div>
        )}

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nouveau feedback</CardTitle>
                  <CardDescription>Sélectionnez une catégorie et décrivez votre retour.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Category chips */}
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const selected = category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              selected
                                ? `${cat.color} border-current ring-2 ring-current/20`
                                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label>Degré d'urgence</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="flex items-center gap-2">
                              <p.icon className={`h-3.5 w-3.5 ${p.color}`} />
                              {p.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label>Sujet</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Résumez votre feedback en quelques mots"
                      maxLength={150}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label>Description détaillée</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre retour le plus précisément possible..."
                      rows={5}
                      maxLength={2000}
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{message.length}/2000</p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={() => submitMutation.mutate()}
                      disabled={!isValid || submitMutation.isPending}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submitMutation.isPending ? "Envoi..." : "Envoyer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator />

        {/* Feedback history */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Mes feedbacks ({feedbacks.length})</h2>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && feedbacks.length === 0 && (
            <Card className="py-10">
              <CardContent className="text-center text-muted-foreground">
                <MessageSquarePlus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Vous n'avez pas encore soumis de feedback.</p>
              </CardContent>
            </Card>
          )}

          <AnimatePresence>
            {feedbacks.map((fb: any) => {
              const catInfo = getCategoryInfo(fb.category);
              const statusInfo = STATUS_MAP[fb.status] || STATUS_MAP.submitted;
              const expanded = expandedId === fb.id;
              const CatIcon = catInfo?.icon || MessageSquarePlus;

              return (
                <motion.div
                  key={fb.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  layout
                >
                  <Card className="overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left p-4 flex items-center gap-3"
                      onClick={() => setExpandedId(expanded ? null : fb.id)}
                    >
                      <div className={`rounded-full p-2 shrink-0 ${catInfo?.color || "bg-muted"}`}>
                        <CatIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fb.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(fb.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={statusInfo.color} variant="secondary">
                        {statusInfo.label}
                      </Badge>
                      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t pt-3">
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">{catInfo?.label || fb.category}</Badge>
                              <Badge variant="outline">
                                {PRIORITIES.find((p) => p.value === fb.priority)?.label || fb.priority}
                              </Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
                            <div className="flex justify-end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Supprimer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer ce feedback ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(fb.id)}>
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </EmployeeLayout>
  );
}
