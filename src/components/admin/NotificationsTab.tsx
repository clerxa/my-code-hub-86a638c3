import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Send, Settings, Plus, Edit, Eye, Trash2, Zap, ListTree } from "lucide-react";
import { NotificationRule, DisplayType, FrequencyLimit } from "@/types/notifications";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NotificationPreview } from "./NotificationPreview";
import { ConditionEditor, UnifiedConditionConfig } from "./shared/ConditionEditor";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DEFAULT_RULE: Partial<NotificationRule> = {
  rule_name: '',
  rule_key: '',
  trigger_condition: 'custom',
  display_type: 'popup',
  title_template: '',
  message_template: '',
  cta_text: 'Voir plus',
  cta_url: '',
  frequency_limit: '1_per_day',
  active: true,
  use_advanced_conditions: true,
  condition_config: { type: 'always', conditions: [], logic: 'AND' }
};

export const NotificationsTab = () => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualNotif, setManualNotif] = useState({
    title: '',
    message: '',
    image_url: '',
    url_action: '',
    button_text: 'Voir plus',
    display_type: 'dropdown' as DisplayType
  });
  const [sending, setSending] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []) as NotificationRule[]);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error("Erreur lors du chargement des règles");
    } finally {
      setLoading(false);
    }
  };

  const sendManualNotification = async () => {
    if (!manualNotif.title || !manualNotif.message) {
      toast.error("Le titre et le message sont requis");
      return;
    }

    setSending(true);
    try {
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title: manualNotif.title,
          message: manualNotif.message,
          image_url: manualNotif.image_url || null,
          url_action: manualNotif.url_action || null,
          button_text: manualNotif.button_text || 'Voir plus',
          display_type: manualNotif.display_type,
          trigger_type: 'manual'
        })
        .select()
        .single();

      if (notifError) throw notifError;

      const { data: users } = await supabase
        .from('profiles')
        .select('id');

      if (users) {
        const userNotifications = users.map(user => ({
          user_id: user.id,
          notification_id: notification.id
        }));

        await supabase
          .from('user_notifications')
          .insert(userNotifications);
      }

      toast.success("Notification envoyée avec succès !");
      setManualNotif({
        title: '',
        message: '',
        image_url: '',
        url_action: '',
        button_text: 'Voir plus',
        display_type: 'dropdown'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const toggleRuleActive = async (ruleId: string, active: boolean) => {
    try {
      await supabase
        .from('notification_rules')
        .update({ active })
        .eq('id', ruleId);

      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active } : r));
      toast.success(active ? "Règle activée" : "Règle désactivée");
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  const openEditRule = (rule: NotificationRule) => {
    setEditingRule(rule);
    setIsCreating(false);
    setRuleDialogOpen(true);
  };

  const openCreateRule = () => {
    setEditingRule(DEFAULT_RULE as NotificationRule);
    setIsCreating(true);
    setRuleDialogOpen(true);
  };

  const generateRuleKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const saveRule = async () => {
    if (!editingRule) return;

    if (!editingRule.rule_name || !editingRule.title_template || !editingRule.message_template) {
      toast.error("Nom, titre et message sont requis");
      return;
    }

    try {
      const ruleData = {
        rule_name: editingRule.rule_name,
        rule_key: editingRule.rule_key || generateRuleKey(editingRule.rule_name),
        trigger_condition: editingRule.use_advanced_conditions ? 'advanced_conditions' : editingRule.trigger_condition,
        threshold_value: editingRule.use_advanced_conditions 
          ? editingRule.condition_config 
          : editingRule.threshold_value,
        title_template: editingRule.title_template,
        message_template: editingRule.message_template,
        display_type: editingRule.display_type,
        cta_text: editingRule.cta_text,
        cta_url: editingRule.cta_url,
        frequency_limit: editingRule.frequency_limit,
        active: editingRule.active,
        updated_at: new Date().toISOString()
      };

      if (isCreating) {
        const { error } = await supabase
          .from('notification_rules')
          .insert(ruleData);
        if (error) throw error;
        toast.success("Règle créée avec succès");
      } else {
        const { error } = await supabase
          .from('notification_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        if (error) throw error;
        toast.success("Règle mise à jour avec succès");
      }

      setRuleDialogOpen(false);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== ruleId));
      toast.success("Règle supprimée");
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const displayTypeLabels: Record<DisplayType, string> = {
    dropdown: 'Dropdown uniquement',
    popup: 'Popup centrale',
    toast_left: 'Toast bas-gauche',
    toast_right: 'Toast bas-droite',
    banner: 'Bandeau haut',
    silent: 'Silencieux'
  };

  const frequencyLabels: Record<FrequencyLimit, string> = {
    immediate: 'Immédiat',
    '1_per_day': '1x / jour',
    '1_per_week': '1x / semaine',
    '1_per_month': '1x / mois',
    '1_per_milestone': '1x / étape',
    '1_per_quiz': '1x / quiz',
    '1_per_webinar': '1x / webinaire',
    '1_per_journey': '1x / parcours'
  };

  const getConditionSummary = (rule: NotificationRule) => {
    if (rule.trigger_condition === 'advanced_conditions' && rule.threshold_value) {
      const config = rule.threshold_value as UnifiedConditionConfig;
      if (config.type === 'always') return '⚡ Toujours affiché';
      return `⚡ ${config.conditions?.length || 0} condition(s) avancée(s)`;
    }
    return rule.trigger_condition;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Notifications & Automations
        </h2>
        <p className="text-muted-foreground mt-1">
          Gérez les notifications manuelles et créez des règles automatiques avec conditions avancées
        </p>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules">
            <Zap className="h-4 w-4 mr-2" />
            Règles Automatiques ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Send className="h-4 w-4 mr-2" />
            Notification Manuelle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Règles automatiques
                  </CardTitle>
                  <CardDescription>
                    Créez et configurez des notifications déclenchées automatiquement selon des conditions
                  </CardDescription>
                </div>
                <Button onClick={openCreateRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle règle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune règle configurée</p>
                  <Button onClick={openCreateRule} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer votre première règle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <Card key={rule.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base">{rule.rule_name}</CardTitle>
                              <Badge variant={rule.active ? "default" : "secondary"}>
                                {rule.active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">
                                {displayTypeLabels[rule.display_type]}
                              </Badge>
                              {rule.trigger_condition === 'advanced_conditions' && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Avancé
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-sm">
                              {getConditionSummary(rule)} • {frequencyLabels[rule.frequency_limit || 'immediate']}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditRule(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cette règle ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. La règle "{rule.rule_name}" sera définitivement supprimée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteRule(rule.id)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Switch
                              checked={rule.active}
                              onCheckedChange={(checked) => toggleRuleActive(rule.id, checked)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1 text-sm">
                          <p><strong>Titre:</strong> {rule.title_template}</p>
                          <p className="text-muted-foreground line-clamp-2">{rule.message_template}</p>
                          {rule.cta_text && (
                            <p className="text-primary text-xs">CTA: {rule.cta_text} → {rule.cta_url}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Créer une notification
                </CardTitle>
                <CardDescription>
                  Envoyez une notification personnalisée à tous vos utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    value={manualNotif.title}
                    onChange={(e) => setManualNotif(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de la notification"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={manualNotif.message}
                    onChange={(e) => setManualNotif(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Message de la notification"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image (URL)</Label>
                    <Input
                      value={manualNotif.image_url}
                      onChange={(e) => setManualNotif(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lien d'action</Label>
                    <Input
                      value={manualNotif.url_action}
                      onChange={(e) => setManualNotif(prev => ({ ...prev, url_action: e.target.value }))}
                      placeholder="/parcours"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Texte du bouton</Label>
                    <Input
                      value={manualNotif.button_text}
                      onChange={(e) => setManualNotif(prev => ({ ...prev, button_text: e.target.value }))}
                      placeholder="Voir plus"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type d'affichage</Label>
                    <Select
                      value={manualNotif.display_type}
                      onValueChange={(value: DisplayType) => setManualNotif(prev => ({ ...prev, display_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(displayTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={sendManualNotification} disabled={sending} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Envoi en cours..." : "Envoyer la notification"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu
                </CardTitle>
                <CardDescription>
                  Visualisez la notification avant de l'envoyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationPreview
                  title={manualNotif.title}
                  message={manualNotif.message}
                  imageUrl={manualNotif.image_url}
                  urlAction={manualNotif.url_action}
                  displayType={manualNotif.display_type}
                  ctaText={manualNotif.button_text}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Créer une nouvelle règle' : 'Modifier la règle'}</DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Configurez les conditions et le contenu de votre notification automatique'
                : 'Personnalisez les paramètres de cette règle automatique'
              }
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <Tabs defaultValue="conditions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conditions">
                  <ListTree className="h-4 w-4 mr-2" />
                  Conditions
                </TabsTrigger>
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="settings">Paramètres</TabsTrigger>
              </TabsList>

              <TabsContent value="conditions" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nom de la règle *</Label>
                  <Input
                    value={editingRule.rule_name}
                    onChange={(e) => setEditingRule({ 
                      ...editingRule, 
                      rule_name: e.target.value,
                      rule_key: generateRuleKey(e.target.value)
                    })}
                    placeholder="Ex: Rappel profil incomplet"
                  />
                  <p className="text-xs text-muted-foreground">
                    Clé technique: {editingRule.rule_key || generateRuleKey(editingRule.rule_name || 'ma_regle')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Conditions de déclenchement
                  </Label>
                  <ConditionEditor
                    value={editingRule.condition_config as UnifiedConditionConfig || { type: 'always', conditions: [], logic: 'AND' }}
                    onChange={(config) => setEditingRule({
                      ...editingRule,
                      condition_config: config,
                      use_advanced_conditions: true
                    })}
                    maxConditions={5}
                    showAlwaysOption={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre du template *</Label>
                      <Input
                        value={editingRule.title_template}
                        onChange={(e) => setEditingRule({ ...editingRule, title_template: e.target.value })}
                        placeholder="Ex: Complétez votre profil !"
                      />
                      <p className="text-xs text-muted-foreground">
                        Variables disponibles: {'{user_name}'}, {'{progress}'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Message du template *</Label>
                      <Textarea
                        value={editingRule.message_template}
                        onChange={(e) => setEditingRule({ ...editingRule, message_template: e.target.value })}
                        placeholder="Ex: Votre profil financier est incomplet. Complétez-le pour recevoir des recommandations personnalisées."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Texte du CTA</Label>
                        <Input
                          value={editingRule.cta_text || ''}
                          onChange={(e) => setEditingRule({ ...editingRule, cta_text: e.target.value })}
                          placeholder="Voir plus"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL du CTA</Label>
                        <Input
                          value={editingRule.cta_url || ''}
                          onChange={(e) => setEditingRule({ ...editingRule, cta_url: e.target.value })}
                          placeholder="/parcours"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Aperçu
                    </Label>
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <NotificationPreview
                        title={editingRule.title_template}
                        message={editingRule.message_template}
                        urlAction={editingRule.cta_url || undefined}
                        displayType={editingRule.display_type}
                        ctaText={editingRule.cta_text || "Voir plus"}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type d'affichage</Label>
                    <Select
                      value={editingRule.display_type}
                      onValueChange={(value: DisplayType) => setEditingRule({ ...editingRule, display_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(displayTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fréquence limite</Label>
                    <Select
                      value={editingRule.frequency_limit || 'immediate'}
                      onValueChange={(value: FrequencyLimit) => setEditingRule({ ...editingRule, frequency_limit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(frequencyLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Règle active</Label>
                    <p className="text-sm text-muted-foreground">
                      Les règles inactives ne déclencheront pas de notifications
                    </p>
                  </div>
                  <Switch
                    checked={editingRule.active}
                    onCheckedChange={(checked) => setEditingRule({ ...editingRule, active: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveRule}>
              {isCreating ? 'Créer la règle' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
