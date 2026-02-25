import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, MessageSquare, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingContextMessage {
  id: string;
  origin_key: string;
  origin_label: string;
  dialog_title: string;
  dialog_description: string | null;
  is_active: boolean;
}

export function BookingContextMessagesEditor() {
  const [messages, setMessages] = useState<BookingContextMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<BookingContextMessage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("booking_context_messages")
      .select("*")
      .order("origin_label");

    if (error) {
      toast.error("Erreur lors du chargement des messages contextuels");
      console.error(error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingMessage) return;
    setSaving(true);

    const { error } = await supabase
      .from("booking_context_messages")
      .update({
        dialog_title: editingMessage.dialog_title,
        dialog_description: editingMessage.dialog_description,
        is_active: editingMessage.is_active,
      })
      .eq("id", editingMessage.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    } else {
      toast.success("Message contextuel mis à jour");
      setMessages(prev => prev.map(m => m.id === editingMessage.id ? editingMessage : m));
      setEditingMessage(null);
    }
    setSaving(false);
  };

  const toggleActive = async (message: BookingContextMessage) => {
    const { error } = await supabase
      .from("booking_context_messages")
      .update({ is_active: !message.is_active })
      .eq("id", message.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_active: !m.is_active } : m));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages contextuels de prise de RDV
          </CardTitle>
          <CardDescription>
            Personnalisez le titre et la description affichés dans la boîte de dialogue de prise de rendez-vous
            selon la page d'origine de l'utilisateur. Ces messages sont aussi utilisés pour le tracking UTM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origine</TableHead>
                <TableHead>Clé UTM</TableHead>
                <TableHead>Titre du dialog</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">{message.origin_label}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{message.origin_key}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{message.dialog_title}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {message.dialog_description || "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={message.is_active}
                      onCheckedChange={() => toggleActive(message)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setEditingMessage({ ...message })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le message — {editingMessage?.origin_label}</DialogTitle>
          </DialogHeader>
          {editingMessage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre du dialog</Label>
                <Input
                  value={editingMessage.dialog_title}
                  onChange={(e) => setEditingMessage({ ...editingMessage, dialog_title: e.target.value })}
                  placeholder="Réserver un rendez-vous"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (sous le titre)</Label>
                <Textarea
                  value={editingMessage.dialog_description || ""}
                  onChange={(e) => setEditingMessage({ ...editingMessage, dialog_description: e.target.value })}
                  placeholder="Un texte contextuel pour rassurer l'utilisateur..."
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingMessage.is_active}
                  onCheckedChange={(checked) => setEditingMessage({ ...editingMessage, is_active: checked })}
                />
                <Label>Actif</Label>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium">Aperçu du dialog :</p>
                <p className="text-lg font-semibold">{editingMessage.dialog_title}</p>
                {editingMessage.dialog_description && (
                  <p className="text-sm text-muted-foreground">{editingMessage.dialog_description}</p>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
