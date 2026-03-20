import { useState, useMemo } from "react";
import { IconSelector } from "./IconSelector";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import * as LucideIcons from "lucide-react";
import { 
  Plus, Edit, Trash2, Save, X, Info, Calculator, Zap, 
  ChevronDown, Eye, Calendar, Target, ArrowRight,
  ExternalLink, Code, Users, Copy, GripVertical
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConditionEditor, UnifiedConditionConfig } from "./shared/ConditionEditor";
import { cn } from "@/lib/utils";

type SimulatorType = 'per' | 'espp' | 'impots' | 'optimisation_fiscale' | 'epargne_precaution' | 'lmnp' | 'capacite_emprunt' | 'pret_immobilier' | 'interets_composes';
type ActionType = 'internal_link' | 'external_link' | 'html_script' | 'modal' | 'expert_booking';
type ConditionOperator = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between';

interface SimulatorCTA {
  id: string;
  internal_name?: string;
  simulator_type: SimulatorType;
  condition_key: string;
  condition_operator?: ConditionOperator;
  condition_value?: any;
  title: string;
  description?: string;
  button_text: string;
  button_color?: string;
  icon?: string;
  action_type: ActionType;
  action_value: string;
  order_num: number;
  active: boolean;
}

const generateInternalName = (simulatorType: SimulatorType, conditionKey: string, title: string, orderNum: number): string => {
  const simLabel = SIMULATOR_LABELS[simulatorType]?.replace(/Simulateur\s*/i, '').replace(/\s+/g, '_').toLowerCase() || simulatorType;
  const condLabel = conditionKey === 'always' ? 'always' : conditionKey.replace(/\s+/g, '_').toLowerCase();
  const titlePart = title ? title.substring(0, 20).replace(/\s+/g, '_').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : 'cta';
  return `${simLabel}_${condLabel}_${titlePart}_${orderNum}`;
};

const SIMULATOR_LABELS: Record<SimulatorType, string> = {
  per: 'Simulateur PER',
  espp: 'Mes plans ESPP',
  impots: 'Simulateur d\'Impôts',
  optimisation_fiscale: 'Optimisation Fiscale',
  epargne_precaution: 'Épargne de Précaution',
  lmnp: 'Simulateur LMNP',
  capacite_emprunt: 'Capacité d\'Emprunt',
  pret_immobilier: 'Prêt Immobilier',
  interets_composes: 'Intérêts Composés',
};

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  internal_link: 'Lien interne',
  external_link: 'Lien externe',
  html_script: 'Script HTML',
  modal: 'Modale',
  expert_booking: 'RDV Expert',
};

const ACTION_TYPE_ICONS: Record<ActionType, any> = {
  internal_link: ArrowRight,
  external_link: ExternalLink,
  html_script: Code,
  modal: Eye,
  expert_booking: Users,
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  '>': 'supérieur à',
  '<': 'inférieur à',
  '>=': 'supérieur ou égal à',
  '<=': 'inférieur ou égal à',
  '=': 'égal à',
  '!=': 'différent de',
  'between': 'entre',
};

// Clés de résultats disponibles par simulateur
const RESULT_KEYS: Record<SimulatorType, { value: string; label: string; type: 'number' | 'string' | 'boolean'; unit?: string }[]> = {
  per: [
    { value: 'tmi', label: 'TMI', type: 'number', unit: '%' },
    { value: 'economie_impots', label: 'Économie d\'impôts', type: 'number', unit: '€' },
    { value: 'effort_reel', label: 'Effort réel', type: 'number', unit: '€' },
    { value: 'impot_sans_per', label: 'Impôt sans PER', type: 'number', unit: '€' },
    { value: 'impot_avec_per', label: 'Impôt avec PER', type: 'number', unit: '€' },
    { value: 'capital_futur', label: 'Capital futur', type: 'number', unit: '€' },
    { value: 'versement_per', label: 'Versement PER', type: 'number', unit: '€' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  espp: [
    { value: 'gain_acquisition_total', label: 'Gain d\'acquisition', type: 'number', unit: '€' },
    { value: 'quantite_actions', label: 'Nombre d\'actions', type: 'number' },
    { value: 'net_apres_impot', label: 'Net après impôt', type: 'number', unit: '€' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  impots: [
    { value: 'tmi', label: 'TMI', type: 'number', unit: '%' },
    { value: 'impot_net', label: 'Impôt net', type: 'number', unit: '€' },
    { value: 'revenu_fiscal', label: 'Revenu fiscal', type: 'number', unit: '€' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  optimisation_fiscale: [
    { value: 'economie_totale', label: 'Économie totale', type: 'number', unit: '€' },
    { value: 'tmi', label: 'TMI', type: 'number', unit: '%' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  epargne_precaution: [
    { value: 'nb_mois_securite', label: 'Mois de sécurité', type: 'number', unit: 'mois' },
    { value: 'epargne_recommandee', label: 'Épargne recommandée', type: 'number', unit: '€' },
    { value: 'epargne_manquante', label: 'Épargne manquante', type: 'number', unit: '€' },
    { value: 'capacite_epargne', label: 'Capacité d\'épargne', type: 'number', unit: '€' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  lmnp: [
    { value: 'meilleur_regime', label: 'Meilleur régime', type: 'string' },
    { value: 'economie_regime', label: 'Économie régime', type: 'number', unit: '€' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  capacite_emprunt: [
    { value: 'capacite_emprunt', label: 'Capacité d\'emprunt', type: 'number', unit: '€' },
    { value: 'mensualite_maximale', label: 'Mensualité max', type: 'number', unit: '€' },
    { value: 'taux_endettement_futur', label: 'Taux endettement', type: 'number', unit: '%' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  pret_immobilier: [
    { value: 'mensualite_totale', label: 'Mensualité', type: 'number', unit: '€' },
    { value: 'cout_total_interets', label: 'Coût intérêts', type: 'number', unit: '€' },
    { value: 'taux_endettement', label: 'Taux endettement', type: 'number', unit: '%' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
  interets_composes: [
    { value: 'capital_final', label: 'Capital final', type: 'number', unit: '€' },
    { value: 'total_interets', label: 'Total intérêts', type: 'number', unit: '€' },
    { value: 'versement_mensuel', label: 'Versement mensuel', type: 'number', unit: '€' },
    { value: 'always', label: 'Toujours afficher', type: 'boolean' },
  ],
};

// Composant de prévisualisation du CTA
const CTAPreview = ({ formData }: { formData: any }) => {
  const iconName = formData.icon || 'Calendar';
  const IconComponent = (LucideIcons as any)[iconName] || Calendar;

  return (
    <div className="p-4 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border/50 rounded-xl">
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        Prévisualisation
      </div>
      
      <button className="w-full h-auto py-4 px-4 flex items-start gap-3 group bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-left">
        <div className="flex-shrink-0 p-2 rounded-lg bg-primary-foreground/10">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">
            {formData.button_text || 'Texte du bouton'}
          </div>
          {formData.description && (
            <div className="text-xs text-primary-foreground/70 mt-1 line-clamp-2">
              {formData.description}
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 mt-1" />
      </button>
    </div>
  );
};

// Composant carte CTA
const CTACard = ({ 
  cta, 
  onEdit, 
  onDelete, 
  onToggle,
  onDuplicate 
}: { 
  cta: SimulatorCTA; 
  onEdit: () => void; 
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}) => {
  const ActionIcon = ACTION_TYPE_ICONS[cta.action_type] || ArrowRight;
  const keyConfig = RESULT_KEYS[cta.simulator_type]?.find(k => k.value === cta.condition_key);
  
  const getConditionBadge = () => {
    if (cta.condition_key === 'always') {
      return <Badge variant="secondary" className="text-xs">Toujours</Badge>;
    }
    
    const operator = cta.condition_operator || '=';
    const value = cta.condition_value;
    let valueStr = '';
    
    if (operator === 'between' && value?.min !== undefined) {
      valueStr = `${value.min}-${value.max}`;
    } else if (typeof value !== 'object') {
      valueStr = value?.toString() || '';
    }
    
    return (
      <Badge variant="outline" className="text-xs font-mono">
        {keyConfig?.label || cta.condition_key} {operator} {valueStr}{keyConfig?.unit || ''}
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "group relative transition-all hover:shadow-lg",
      !cta.active && "opacity-50"
    )}>
      {/* Barre de statut */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 rounded-t-lg",
        cta.active ? "bg-primary" : "bg-muted"
      )} />
      
      <CardContent className="pt-5 space-y-4">
        {/* Header avec ordre et actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-sm font-mono">
              {cta.order_num}
            </div>
            <div>
              <h4 className="font-medium line-clamp-1">{cta.title}</h4>
              <code className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
                {cta.internal_name || cta.id.slice(0, 8)}
              </code>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Condition */}
        <div className="flex flex-wrap gap-1.5">
          {getConditionBadge()}
        </div>

        {/* Aperçu du bouton */}
        <div className="flex items-center gap-2 p-2.5 bg-primary/10 rounded-lg border border-primary/20">
          <div className="p-1.5 rounded bg-primary/20">
            <ActionIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{cta.button_text}</p>
            {cta.description && (
              <p className="text-xs text-muted-foreground truncate">{cta.description}</p>
            )}
          </div>
        </div>

        {/* Footer avec type action et toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className="gap-1 text-xs">
            <ActionIcon className="h-3 w-3" />
            {ACTION_TYPE_LABELS[cta.action_type]}
          </Badge>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {cta.active ? 'Actif' : 'Inactif'}
            </span>
            <Switch checked={cta.active} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SimulatorCTAsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSimulator, setSelectedSimulator] = useState<SimulatorType>('per');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCTA, setEditingCTA] = useState<SimulatorCTA | null>(null);

  // États des sections collapsibles
  const [openSections, setOpenSections] = useState({
    condition: true,
    content: true,
    action: true,
  });

  // Form state
  const [formData, setFormData] = useState({
    internal_name: '',
    simulator_type: 'per' as SimulatorType,
    condition_key: 'always',
    condition_operator: '>' as ConditionOperator,
    condition_value: null as any,
    condition_value_min: '',
    condition_value_max: '',
    title: '',
    description: '',
    button_text: '',
    button_color: '#3b82f6',
    icon: 'Calendar',
    action_type: 'internal_link' as ActionType,
    action_value: '',
    order_num: 0,
    active: true,
  });
  
  const [conditionMode, setConditionMode] = useState<'legacy' | 'advanced'>('legacy');
  const [advancedCondition, setAdvancedCondition] = useState<UnifiedConditionConfig>({
    type: 'always',
    conditions: [],
    logic: 'AND'
  });
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const { data: ctas, isLoading } = useQuery({
    queryKey: ['simulator_ctas', selectedSimulator],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_ctas')
        .select('*')
        .eq('simulator_type', selectedSimulator)
        .order('order_num', { ascending: true });

      if (error) throw error;
      return data as SimulatorCTA[];
    },
  });

  const selectedKeyConfig = RESULT_KEYS[formData.simulator_type]?.find(
    k => k.value === formData.condition_key
  );

  // Stats par simulateur
  const simulatorStats = useMemo(() => {
    if (!ctas) return { total: 0, active: 0 };
    return {
      total: ctas.length,
      active: ctas.filter(c => c.active).length,
    };
  }, [ctas]);

  const resetForm = () => {
    const orderNum = ctas?.length || 0;
    setFormData({
      internal_name: generateInternalName(selectedSimulator, 'always', '', orderNum),
      simulator_type: selectedSimulator,
      condition_key: 'always',
      condition_operator: '>',
      condition_value: null,
      condition_value_min: '',
      condition_value_max: '',
      title: '',
      description: '',
      button_text: '',
      button_color: '#3b82f6',
      icon: 'Calendar',
      action_type: 'internal_link',
      action_value: '',
      order_num: orderNum,
      active: true,
    });
    setConditionMode('legacy');
    setAdvancedCondition({ type: 'always', conditions: [], logic: 'AND' });
    setDuplicateError(null);
  };

  const handleOpenDialog = (cta?: SimulatorCTA, duplicate?: boolean) => {
    if (cta) {
      const ctaToEdit = duplicate ? { ...cta, id: '', title: `${cta.title} (copie)`, order_num: (ctas?.length || 0) } : cta;
      setEditingCTA(duplicate ? null : cta);
      
      const condValue = ctaToEdit.condition_value;
      const isAdvanced = ctaToEdit.condition_key === 'advanced' && condValue?.type;
      setConditionMode(isAdvanced ? 'advanced' : 'legacy');
      
      if (isAdvanced) {
        setAdvancedCondition(condValue as UnifiedConditionConfig);
      } else {
        setAdvancedCondition({ type: 'always', conditions: [], logic: 'AND' });
      }
      
      setFormData({
        internal_name: duplicate ? '' : (ctaToEdit.internal_name || ''),
        simulator_type: ctaToEdit.simulator_type,
        condition_key: ctaToEdit.condition_key,
        condition_operator: (ctaToEdit.condition_operator as ConditionOperator) || '>',
        condition_value: condValue,
        condition_value_min: condValue?.min?.toString() || '',
        condition_value_max: condValue?.max?.toString() || condValue?.toString() || '',
        title: ctaToEdit.title,
        description: ctaToEdit.description || '',
        button_text: ctaToEdit.button_text,
        button_color: ctaToEdit.button_color || '#3b82f6',
        icon: ctaToEdit.icon || 'Calendar',
        action_type: ctaToEdit.action_type,
        action_value: ctaToEdit.action_value,
        order_num: ctaToEdit.order_num,
        active: ctaToEdit.active,
      });
    } else {
      setEditingCTA(null);
      resetForm();
    }
    setDuplicateError(null);
    setShowDialog(true);
  };

  const buildConditionValue = () => {
    if (formData.condition_key === 'always') return null;
    if (formData.condition_operator === 'between') {
      return {
        min: parseFloat(formData.condition_value_min) || 0,
        max: parseFloat(formData.condition_value_max) || 0,
      };
    }
    const keyConfig = RESULT_KEYS[formData.simulator_type]?.find(k => k.value === formData.condition_key);
    if (keyConfig?.type === 'string') {
      return formData.condition_value_max;
    }
    return parseFloat(formData.condition_value_max) || 0;
  };

  const handleSave = async () => {
    setDuplicateError(null);
    
    try {
      let conditionKey = formData.condition_key;
      let conditionOperator = formData.condition_key === 'always' ? '=' : formData.condition_operator;
      let conditionValue: any = buildConditionValue();
      
      if (conditionMode === 'advanced') {
        conditionKey = 'advanced';
        conditionOperator = '=';
        conditionValue = advancedCondition;
      }
      
      const dataToSave = {
        internal_name: formData.internal_name || generateInternalName(formData.simulator_type, conditionKey, formData.title, formData.order_num),
        simulator_type: formData.simulator_type,
        condition_key: conditionKey,
        condition_operator: conditionOperator,
        condition_value: conditionValue,
        title: formData.title,
        description: formData.description || null,
        button_text: formData.button_text,
        button_color: formData.button_color,
        icon: formData.icon,
        action_type: formData.action_type,
        action_value: formData.action_type === 'expert_booking' && !formData.action_value 
          ? '/employee/rdv-expert' 
          : formData.action_value,
        order_num: formData.order_num,
        active: formData.active,
      };

      if (editingCTA) {
        const { error } = await supabase
          .from('simulator_ctas')
          .update(dataToSave)
          .eq('id', editingCTA.id);

        if (error) throw error;

        toast({ title: "CTA mis à jour", description: "Modifications enregistrées" });
      } else {
        const { error } = await supabase.from('simulator_ctas').insert(dataToSave);
        if (error) throw error;
        toast({ title: "CTA créé", description: "Nouveau CTA ajouté" });
      }

      queryClient.invalidateQueries({ queryKey: ['simulator_ctas'] });
      setShowDialog(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce CTA ?')) return;
    
    try {
      const { error } = await supabase.from('simulator_ctas').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "CTA supprimé" });
      queryClient.invalidateQueries({ queryKey: ['simulator_ctas'] });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const handleToggleActive = async (cta: SimulatorCTA) => {
    try {
      const { error } = await supabase
        .from('simulator_ctas')
        .update({ active: !cta.active })
        .eq('id', cta.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['simulator_ctas'] });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur de simulateur */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>CTAs des Simulateurs</CardTitle>
                <CardDescription>
                  Configurez les appels à l'action dynamiques
                </CardDescription>
              </div>
            </div>
            
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau CTA
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Sélecteur de simulateur avec stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedSimulator} onValueChange={(v) => setSelectedSimulator(v as SimulatorType)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SIMULATOR_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{simulatorStats.total} CTA{simulatorStats.total > 1 ? 's' : ''}</span>
              <span className="text-primary">{simulatorStats.active} actif{simulatorStats.active > 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille de CTAs */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : !ctas || ctas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aucun CTA configuré</p>
              <p className="text-sm text-muted-foreground">
                Créez votre premier CTA pour {SIMULATOR_LABELS[selectedSimulator]}
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un CTA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ctas.map((cta) => (
            <CTACard
              key={cta.id}
              cta={cta}
              onEdit={() => handleOpenDialog(cta)}
              onDelete={() => handleDelete(cta.id)}
              onToggle={() => handleToggleActive(cta)}
              onDuplicate={() => handleOpenDialog(cta, true)}
            />
          ))}
        </div>
      )}

      {/* Dialog de création/édition */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCTA ? 'Modifier le CTA' : 'Nouveau CTA'}
            </DialogTitle>
            <DialogDescription>
              Configurez la condition, le contenu et l'action
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-[1fr,300px] gap-6">
            {/* Formulaire */}
            <div className="space-y-4">
              {/* Section Condition */}
              <Collapsible open={openSections.condition} onOpenChange={() => toggleSection('condition')}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium">Condition d'affichage</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.condition && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  {/* Simulateur */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Simulateur</Label>
                      <Select 
                        value={formData.simulator_type} 
                        onValueChange={(v) => setFormData({ ...formData, simulator_type: v as SimulatorType, condition_key: 'always' })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SIMULATOR_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Nom interne</Label>
                      <Input
                        value={formData.internal_name}
                        onChange={(e) => setFormData({ ...formData, internal_name: e.target.value })}
                        placeholder="auto-généré"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Mode de condition */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={conditionMode === 'legacy' ? 'default' : 'outline'}
                      onClick={() => setConditionMode('legacy')}
                    >
                      Simple
                    </Button>
                    <Button
                      size="sm"
                      variant={conditionMode === 'advanced' ? 'default' : 'outline'}
                      onClick={() => setConditionMode('advanced')}
                      className="gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      Avancé
                    </Button>
                  </div>

                  {conditionMode === 'legacy' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Variable à évaluer</Label>
                        <Select 
                          value={formData.condition_key} 
                          onValueChange={(v) => setFormData({ ...formData, condition_key: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RESULT_KEYS[formData.simulator_type]?.map((key) => (
                              <SelectItem key={key.value} value={key.value}>
                                {key.label} {key.unit && `(${key.unit})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.condition_key !== 'always' && selectedKeyConfig?.type !== 'boolean' && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Opérateur</Label>
                            <Select 
                              value={formData.condition_operator} 
                              onValueChange={(v) => setFormData({ ...formData, condition_operator: v as ConditionOperator })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{key} {label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {formData.condition_operator === 'between' ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={formData.condition_value_min}
                                onChange={(e) => setFormData({ ...formData, condition_value_min: e.target.value })}
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={formData.condition_value_max}
                                onChange={(e) => setFormData({ ...formData, condition_value_max: e.target.value })}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label>Valeur {selectedKeyConfig?.unit && `(${selectedKeyConfig.unit})`}</Label>
                              <Input
                                type={selectedKeyConfig?.type === 'string' ? 'text' : 'number'}
                                placeholder="Valeur"
                                value={formData.condition_value_max}
                                onChange={(e) => setFormData({ ...formData, condition_value_max: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <ConditionEditor
                      value={advancedCondition}
                      onChange={setAdvancedCondition}
                      maxConditions={5}
                      showAlwaysOption={true}
                    />
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Section Contenu */}
              <Collapsible open={openSections.content} onOpenChange={() => toggleSection('content')}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-primary" />
                      <span className="font-medium">Contenu du CTA</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.content && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      placeholder="Ex: Optimisez votre fiscalité"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texte du bouton *</Label>
                      <Input
                        placeholder="Ex: Prendre RDV"
                        value={formData.button_text}
                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Icône</Label>
                      <IconSelector
                        value={formData.icon}
                        onChange={(value) => setFormData({ ...formData, icon: value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optionnel)</Label>
                    <Textarea
                      placeholder="Texte affiché sous le bouton"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <Label>Ordre</Label>
                      <Input
                        type="number"
                        className="w-20"
                        value={formData.order_num}
                        onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) })}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      />
                      <Label htmlFor="active">Actif</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Section Action */}
              <Collapsible open={openSections.action} onOpenChange={() => toggleSection('action')}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="font-medium">Action au clic</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openSections.action && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Type d'action</Label>
                    <Select 
                      value={formData.action_type} 
                      onValueChange={(v) => setFormData({ ...formData, action_type: v as ActionType })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => {
                          const Icon = ACTION_TYPE_ICONS[key as ActionType];
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.action_type === 'expert_booking' ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        L'URL de RDV sera récupérée selon le rang de l'entreprise de l'utilisateur.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      <Label>
                        {formData.action_type === 'internal_link' && 'Chemin (ex: /plans)'}
                        {formData.action_type === 'external_link' && 'URL complète'}
                        {formData.action_type === 'html_script' && 'Code HTML'}
                        {formData.action_type === 'modal' && 'ID de la modale'}
                      </Label>
                      <Textarea
                        placeholder={
                          formData.action_type === 'internal_link' ? '/employee/rdv-expert' :
                          formData.action_type === 'external_link' ? 'https://...' :
                          formData.action_type === 'html_script' ? '<script>...</script>' :
                          'modal_id'
                        }
                        value={formData.action_value}
                        onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                        rows={formData.action_type === 'html_script' ? 4 : 2}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Prévisualisation */}
            <div className="space-y-4">
              <CTAPreview formData={formData} />
              
              {duplicateError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{duplicateError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.button_text || (formData.action_type !== 'expert_booking' && !formData.action_value)}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingCTA ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
