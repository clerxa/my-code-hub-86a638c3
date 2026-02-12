import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save, Plus, Trash2, Download, FlaskConical, Settings, MessageSquare, BarChart3, Edit, Eye, ChevronRight, Star, AlertCircle, ThumbsUp, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { CSATSettings, CSATBetaQuestion, CSATResponse, BetaQuestionType } from '@/types/csat';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ResponseDetail {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  content_name: string;
  parcours_id?: string;
  user_level?: string;
  content_quality_score?: number;
  experience_score?: number;
  visual_score?: number;
  relevance_score?: number;
  information_level?: string;
  beta_responses?: any[];
  improvement_feedback?: string;
  positive_feedback?: string;
  expert_intent?: string;
  completion_status: string;
  completed_at: string;
}

export const CSATAdminTab: React.FC = () => {
  const [settings, setSettings] = useState<CSATSettings | null>(null);
  const [betaQuestions, setBetaQuestions] = useState<CSATBetaQuestion[]>([]);
  const [responses, setResponses] = useState<ResponseDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filterContentType, setFilterContentType] = useState<string>('all');
  
  // Question editing
  const [editingQuestion, setEditingQuestion] = useState<CSATBetaQuestion | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'rating_1_5' as BetaQuestionType,
    options: [] as string[],
    priority_order: 1,
    is_active: true
  });
  
  // Response detail view
  const [selectedResponse, setSelectedResponse] = useState<ResponseDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, questionsRes, responsesRes] = await Promise.all([
        supabase.from('csat_settings').select('*').limit(1).maybeSingle(),
        supabase.from('csat_beta_questions').select('*').order('priority_order'),
        supabase.from('csat_responses').select('*').order('completed_at', { ascending: false }).limit(100)
      ]);

      if (settingsRes.data) setSettings(settingsRes.data as unknown as CSATSettings);
      if (questionsRes.data) setBetaQuestions(questionsRes.data as unknown as CSATBetaQuestion[]);
      if (responsesRes.data) setResponses(responsesRes.data as ResponseDetail[]);
    } catch (error) {
      console.error('Error fetching CSAT data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('csat_settings')
        .update(settings as any)
        .eq('id', settings.id);
      if (error) throw error;
      toast.success('Paramètres enregistrés');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const openNewQuestionDialog = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'rating_1_5',
      options: [],
      priority_order: betaQuestions.length + 1,
      is_active: true
    });
    setIsQuestionDialogOpen(true);
  };

  const openEditQuestionDialog = (question: CSATBetaQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [],
      priority_order: question.priority_order,
      is_active: question.is_active
    });
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) {
      toast.error('La question est requise');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        options: questionForm.question_type === 'single_choice' ? questionForm.options : null,
        priority_order: questionForm.priority_order,
        is_active: questionForm.is_active
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('csat_beta_questions')
          .update(data as any)
          .eq('id', editingQuestion.id);
        if (error) throw error;
        setBetaQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...data } : q));
        toast.success('Question modifiée');
      } else {
        const { data: newQuestion, error } = await supabase
          .from('csat_beta_questions')
          .insert(data as any)
          .select()
          .single();
        if (error) throw error;
        setBetaQuestions(prev => [...prev, newQuestion as unknown as CSATBetaQuestion]);
        toast.success('Question créée');
      }
      setIsQuestionDialogOpen(false);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return;
    try {
      const { error } = await supabase.from('csat_beta_questions').delete().eq('id', id);
      if (error) throw error;
      setBetaQuestions(prev => prev.filter(q => q.id !== id));
      toast.success('Question supprimée');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Erreur');
    }
  };

  const handleExportCSV = () => {
    const filtered = filterContentType === 'all' ? responses : responses.filter(r => r.content_type === filterContentType);
    const headers = ['Date', 'Type', 'Contenu', 'Qualité', 'Expérience', 'Visuel', 'Pertinence', 'Niveau info', 'Amélioration', 'Positif', 'Expert', 'Statut'];
    const rows = filtered.map(r => [
      format(new Date(r.completed_at), 'dd/MM/yyyy HH:mm'),
      r.content_type, r.content_name, r.content_quality_score || '', r.experience_score || '', r.visual_score || '', r.relevance_score || '',
      r.information_level || '', r.improvement_feedback || '', r.positive_feedback || '', r.expert_intent || '', r.completion_status
    ]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `csat_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const addOption = () => {
    setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const updateOption = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const filteredResponses = filterContentType === 'all' ? responses : responses.filter(r => r.content_type === filterContentType);
  
  const avgScore = (field: keyof ResponseDetail) => {
    const valid = filteredResponses.filter(r => r[field] !== null && r[field] !== undefined);
    if (!valid.length) return '-';
    const sum = valid.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    return (sum / valid.length).toFixed(1);
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  const getInformationLevelLabel = (level?: string) => {
    switch (level) {
      case 'too_simple': return 'Trop simple';
      case 'adapted': return 'Adapté';
      case 'too_complex': return 'Trop complexe';
      default: return '-';
    }
  };

  const getExpertIntentLabel = (intent?: string) => {
    switch (intent) {
      case 'yes': return 'Oui, je souhaite être contacté';
      case 'not_now': return 'Pas maintenant';
      case 'no': return 'Non merci';
      default: return '-';
    }
  };

  const openResponseDetail = (response: ResponseDetail) => {
    setSelectedResponse(response);
    setIsDetailDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-amber-500" />
            CSAT Bêta
          </h2>
          <p className="text-muted-foreground">Gérez le questionnaire de satisfaction version bêta</p>
        </div>
      </div>

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results" className="gap-2"><BarChart3 className="h-4 w-4" />Résultats</TabsTrigger>
          <TabsTrigger value="questions" className="gap-2"><MessageSquare className="h-4 w-4" />Questions</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" />Paramètres</TabsTrigger>
        </TabsList>

        {/* RESULTS TAB */}
        <TabsContent value="results" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={filterContentType} onValueChange={setFilterContentType}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrer par type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="module">Modules</SelectItem>
                <SelectItem value="simulator">Simulateurs</SelectItem>
                <SelectItem value="parcours">Parcours</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="financial_profile">Profil financier</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Exporter CSV</Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{filteredResponses.length}</div>
                <div className="text-sm text-muted-foreground">Réponses totales</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${Number(avgScore('content_quality_score')) >= 4 ? 'text-green-600' : Number(avgScore('content_quality_score')) >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgScore('content_quality_score')}
                </div>
                <div className="text-sm text-muted-foreground">Qualité moy.</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${Number(avgScore('experience_score')) >= 4 ? 'text-green-600' : Number(avgScore('experience_score')) >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgScore('experience_score')}
                </div>
                <div className="text-sm text-muted-foreground">Expérience moy.</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${Number(avgScore('visual_score')) >= 4 ? 'text-green-600' : Number(avgScore('visual_score')) >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgScore('visual_score')}
                </div>
                <div className="text-sm text-muted-foreground">Visuel moy.</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${Number(avgScore('relevance_score')) >= 4 ? 'text-green-600' : Number(avgScore('relevance_score')) >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgScore('relevance_score')}
                </div>
                <div className="text-sm text-muted-foreground">Pertinence moy.</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {filteredResponses.filter(r => r.completion_status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Complétés</div>
              </CardContent>
            </Card>
          </div>

          {/* Responses List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Réponses détaillées ({filteredResponses.length})
              </CardTitle>
              <CardDescription>Cliquez sur une ligne pour voir tous les détails</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead className="text-center">Qualité</TableHead>
                    <TableHead className="text-center">UX</TableHead>
                    <TableHead className="text-center">Visuel</TableHead>
                    <TableHead className="text-center">Pertinence</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Expert</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.map((r) => (
                    <TableRow 
                      key={r.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openResponseDetail(r)}
                    >
                      <TableCell className="text-sm">
                        {format(new Date(r.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.content_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="flex flex-col">
                          <span className="font-medium truncate">{r.content_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {r.content_type === 'module' ? 'Module de formation' : 
                             r.content_type === 'simulator' ? 'Simulateur' :
                             r.content_type === 'parcours' ? 'Parcours' :
                             r.content_type === 'onboarding' ? 'Onboarding' :
                             r.content_type === 'financial_profile' ? 'Profil financier' : r.content_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getScoreColor(r.content_quality_score)}`}>
                          {r.content_quality_score || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getScoreColor(r.experience_score)}`}>
                          {r.experience_score || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getScoreColor(r.visual_score)}`}>
                          {r.visual_score || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getScoreColor(r.relevance_score)}`}>
                          {r.relevance_score || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={r.information_level === 'adapted' ? 'default' : r.information_level === 'too_complex' ? 'destructive' : 'secondary'}
                        >
                          {getInformationLevelLabel(r.information_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.expert_intent && (
                          <Badge variant={r.expert_intent === 'yes' ? 'default' : 'secondary'}>
                            {r.expert_intent === 'yes' ? 'Oui' : r.expert_intent === 'not_now' ? 'Plus tard' : 'Non'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.completion_status === 'completed' ? 'default' : 'secondary'}>
                          {r.completion_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Feedback Summary */}
          {filteredResponses.some(r => r.improvement_feedback || r.positive_feedback) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Feedbacks textuels récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredResponses.filter(r => r.improvement_feedback || r.positive_feedback).slice(0, 10).map((r, index) => (
                    <AccordionItem key={r.id} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{r.content_type}</Badge>
                          <span className="font-medium">{r.content_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(r.completed_at), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {r.positive_feedback && (
                            <div className="flex gap-2">
                              <ThumbsUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-700">Points positifs</p>
                                <p className="text-sm text-muted-foreground">{r.positive_feedback}</p>
                              </div>
                            </div>
                          )}
                          {r.improvement_feedback && (
                            <div className="flex gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-700">Axes d'amélioration</p>
                                <p className="text-sm text-muted-foreground">{r.improvement_feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* QUESTIONS TAB */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Questions bêta</CardTitle>
                <CardDescription>Questions affichées en rotation à l'écran 2 du CSAT</CardDescription>
              </div>
              <Button onClick={openNewQuestionDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle question
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Ordre</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="text-center">Actif</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {betaQuestions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono">{q.priority_order}</TableCell>
                      <TableCell className="max-w-[300px]">{q.question_text}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {q.question_type === 'rating_1_5' ? 'Note 1-5' : q.question_type === 'yes_no' ? 'Oui/Non' : 'Choix unique'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {q.options?.length ? q.options.join(', ') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={q.is_active ? 'default' : 'secondary'}>
                          {q.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditQuestionDialog(q)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {betaQuestions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucune question bêta configurée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activation globale</CardTitle>
              <CardDescription>Activez ou désactivez le CSAT pour différents types de contenu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label className="text-base font-semibold">CSAT activé globalement</Label>
                  <p className="text-sm text-muted-foreground">Active ou désactive tous les questionnaires CSAT</p>
                </div>
                <Switch 
                  checked={settings?.csat_enabled} 
                  onCheckedChange={(v) => setSettings(s => s ? {...s, csat_enabled: v} : s)} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Modules de formation</Label>
                  <Switch checked={settings?.enabled_for_modules} onCheckedChange={(v) => setSettings(s => s ? {...s, enabled_for_modules: v} : s)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Simulateurs</Label>
                  <Switch checked={settings?.enabled_for_simulators} onCheckedChange={(v) => setSettings(s => s ? {...s, enabled_for_simulators: v} : s)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Parcours</Label>
                  <Switch checked={settings?.enabled_for_parcours} onCheckedChange={(v) => setSettings(s => s ? {...s, enabled_for_parcours: v} : s)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Onboarding</Label>
                  <Switch checked={settings?.enabled_for_onboarding} onCheckedChange={(v) => setSettings(s => s ? {...s, enabled_for_onboarding: v} : s)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Profil financier</Label>
                  <Switch checked={settings?.enabled_for_financial_profile} onCheckedChange={(v) => setSettings(s => s ? {...s, enabled_for_financial_profile: v} : s)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Question intention expert</Label>
                  <Switch checked={settings?.expert_intent_enabled} onCheckedChange={(v) => setSettings(s => s ? {...s, expert_intent_enabled: v} : s)} />
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <Label className="flex-1">Nombre de questions bêta affichées</Label>
                <Select 
                  value={String(settings?.beta_questions_count || 2)} 
                  onValueChange={(v) => setSettings(s => s ? {...s, beta_questions_count: parseInt(v)} : s)}
                >
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Question Edit Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Modifier la question' : 'Nouvelle question'}</DialogTitle>
            <DialogDescription>
              Configurez une question bêta pour le CSAT
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texte de la question *</Label>
              <Textarea 
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Ex: Comment évaluez-vous la clarté des explications ?"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de question</Label>
                <Select 
                  value={questionForm.question_type} 
                  onValueChange={(v: BetaQuestionType) => setQuestionForm(prev => ({ ...prev, question_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating_1_5">Note de 1 à 5</SelectItem>
                    <SelectItem value="yes_no">Oui / Non</SelectItem>
                    <SelectItem value="single_choice">Choix unique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Ordre de priorité</Label>
                <Input 
                  type="number" 
                  min={1}
                  value={questionForm.priority_order}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, priority_order: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            
            {questionForm.question_type === 'single_choice' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options de réponse</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input 
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Switch 
                checked={questionForm.is_active}
                onCheckedChange={(v) => setQuestionForm(prev => ({ ...prev, is_active: v }))}
              />
              <Label>Question active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveQuestion} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingQuestion ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Détail de la réponse CSAT
            </DialogTitle>
          </DialogHeader>
          
          {selectedResponse && (
            <div className="space-y-6">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(selectedResponse.completed_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedResponse.content_type}</Badge>
                  <Badge variant={selectedResponse.completion_status === 'completed' ? 'default' : 'secondary'}>
                    {selectedResponse.completion_status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Contenu évalué</h4>
                <p className="text-lg">{selectedResponse.content_name}</p>
              </div>

              {/* Scores */}
              <div>
                <h4 className="font-semibold mb-3">Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(selectedResponse.content_quality_score)}`}>
                      {selectedResponse.content_quality_score || '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Qualité</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(selectedResponse.experience_score)}`}>
                      {selectedResponse.experience_score || '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Expérience</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(selectedResponse.visual_score)}`}>
                      {selectedResponse.visual_score || '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Visuel</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(selectedResponse.relevance_score)}`}>
                      {selectedResponse.relevance_score || '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Pertinence</div>
                  </div>
                </div>
              </div>

              {/* Information Level */}
              {selectedResponse.information_level && (
                <div>
                  <h4 className="font-semibold mb-2">Niveau d'information</h4>
                  <Badge 
                    variant={selectedResponse.information_level === 'adapted' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {getInformationLevelLabel(selectedResponse.information_level)}
                  </Badge>
                </div>
              )}

              {/* Beta responses */}
              {selectedResponse.beta_responses && selectedResponse.beta_responses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Questions bêta</h4>
                  <div className="space-y-3">
                    {selectedResponse.beta_responses.map((br: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-1">{br.question_text}</p>
                        <p className="text-primary font-semibold">{br.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedbacks */}
              {(selectedResponse.positive_feedback || selectedResponse.improvement_feedback) && (
                <div>
                  <h4 className="font-semibold mb-3">Feedbacks</h4>
                  <div className="space-y-3">
                    {selectedResponse.positive_feedback && (
                      <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Points positifs</span>
                        </div>
                        <p className="text-sm">{selectedResponse.positive_feedback}</p>
                      </div>
                    )}
                    {selectedResponse.improvement_feedback && (
                      <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Axes d'amélioration</span>
                        </div>
                        <p className="text-sm">{selectedResponse.improvement_feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Expert Intent */}
              {selectedResponse.expert_intent && (
                <div>
                  <h4 className="font-semibold mb-2">Intention de contact expert</h4>
                  <Badge variant={selectedResponse.expert_intent === 'yes' ? 'default' : 'secondary'}>
                    {getExpertIntentLabel(selectedResponse.expert_intent)}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
