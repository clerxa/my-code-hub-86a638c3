import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import {
  MessageSquarePlus, Send, Palette, BarChart3, Bug, Lightbulb,
  Clock, AlertTriangle, CheckCircle2, Search, Filter, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const CATEGORIES: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  ux: { label: "UX", icon: Palette, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  data: { label: "Données", icon: BarChart3, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  bug: { label: "Bug", icon: Bug, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  idea: { label: "Idée", icon: Lightbulb, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  content: { label: "Contenu", icon: MessageSquarePlus, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  other: { label: "Autre", icon: MessageSquarePlus, color: "bg-muted text-muted-foreground" },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  submitted: { label: "Soumis", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  in_review: { label: "En analyse", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  planned: { label: "Planifié", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  done: { label: "Traité", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

const PRIORITIES: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  low: { label: "Faible", icon: Clock, color: "text-muted-foreground" },
  medium: { label: "Moyen", icon: AlertTriangle, color: "text-amber-600" },
  high: { label: "Urgent", icon: AlertTriangle, color: "text-destructive" },
};

export function FeedbackAdminTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*, profiles:user_id(first_name, last_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const respondMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        status: newStatus || selectedFeedback.status,
      };
      if (response.trim()) {
        updates.admin_response = response.trim();
        updates.responded_at = new Date().toISOString();
        updates.responded_by = user!.id;
      }
      const { error } = await supabase
        .from("feedbacks")
        .update(updates)
        .eq("id", selectedFeedback.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-feedbacks"] });
      setSelectedFeedback(null);
      setResponse("");
      setNewStatus("");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const filtered = feedbacks.filter((fb: any) => {
    if (filterCategory !== "all" && fb.category !== filterCategory) return false;
    if (filterStatus !== "all" && fb.status !== filterStatus) return false;
    if (filterPriority !== "all" && fb.priority !== filterPriority) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = `${fb.profiles?.first_name || ""} ${fb.profiles?.last_name || ""}`.toLowerCase();
      if (!fb.subject.toLowerCase().includes(s) && !fb.message.toLowerCase().includes(s) && !name.includes(s)) return false;
    }
    return true;
  });

  const stats = {
    total: feedbacks.length,
    submitted: feedbacks.filter((f: any) => f.status === "submitted").length,
    high: feedbacks.filter((f: any) => f.priority === "high" && f.status !== "done").length,
  };

  const openDetail = (fb: any) => {
    setSelectedFeedback(fb);
    setResponse(fb.admin_response || "");
    setNewStatus(fb.status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquarePlus className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Gestion des Feedbacks</h2>
          <p className="text-sm text-muted-foreground">Consultez et répondez aux retours utilisateurs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.high}</p>
            <p className="text-xs text-muted-foreground">Urgents</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par sujet, message ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Catégories</SelectItem>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Statuts</SelectItem>
            {Object.entries(STATUSES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Priorités</SelectItem>
            {Object.entries(PRIORITIES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Réponse</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun feedback trouvé</TableCell></TableRow>
              )}
              {filtered.map((fb: any) => {
                const cat = CATEGORIES[fb.category] || CATEGORIES.other;
                const status = STATUSES[fb.status] || STATUSES.submitted;
                const prio = PRIORITIES[fb.priority] || PRIORITIES.medium;
                const PrioIcon = prio.icon;
                return (
                  <TableRow key={fb.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(fb)}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(fb.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <p className="font-medium">{fb.profiles?.first_name} {fb.profiles?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{fb.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={cat.color} variant="secondary">{cat.label}</Badge></TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-xs font-medium ${prio.color}`}>
                        <PrioIcon className="h-3.5 w-3.5" />
                        {prio.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{fb.subject}</TableCell>
                    <TableCell><Badge className={status.color} variant="secondary">{status.label}</Badge></TableCell>
                    <TableCell className="text-center">
                      {fb.admin_response ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail / Response Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg">
          {selectedFeedback && (() => {
            const cat = CATEGORIES[selectedFeedback.category] || CATEGORIES.other;
            const CatIcon = cat.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CatIcon className="h-5 w-5" />
                    {selectedFeedback.subject}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge className={cat.color} variant="secondary">{cat.label}</Badge>
                    <Badge variant="outline">
                      {PRIORITIES[selectedFeedback.priority]?.label || selectedFeedback.priority}
                    </Badge>
                    <span className="text-muted-foreground">
                      {selectedFeedback.profiles?.first_name} {selectedFeedback.profiles?.last_name} · {new Date(selectedFeedback.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>

                  {/* Status change */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Statut</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUSES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin response */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Réponse admin</label>
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Répondez à l'utilisateur..."
                      rows={4}
                      maxLength={2000}
                    />
                  </div>

                  {selectedFeedback.responded_at && (
                    <p className="text-[10px] text-muted-foreground">
                      Dernière réponse le {new Date(selectedFeedback.responded_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedFeedback(null)}>Fermer</Button>
                  <Button onClick={() => respondMutation.mutate()} disabled={respondMutation.isPending} className="gap-2">
                    <Send className="h-4 w-4" />
                    {respondMutation.isPending ? "Envoi..." : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
