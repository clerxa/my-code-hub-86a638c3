import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, ArrowRight, GraduationCap, Palette } from "lucide-react";
import { IconSelector, getIconByName } from "../IconSelector";
import { ColorPicker } from "../ColorPicker";
import { supabase } from "@/integrations/supabase/client";
import { 
  OnboardingScreen, 
  OnboardingOption,
  OnboardingScreenType,
  SCREEN_TYPE_LABELS,
  LEAD_RANK_CONFIG,
  CalculationConfig,
  TransitionCondition,
} from "@/types/onboarding-cms";
import { CalculationConfigEditor } from "./CalculationConfigEditor";
import { TransitionConditionsEditor } from "./TransitionConditionsEditor";
import { canTransitionTo, getDestinationTypeLabel } from "@/lib/onboarding-compatibility";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OnboardingScreenEditorProps {
  screen: OnboardingScreen;
  allScreens: OnboardingScreen[];
  onUpdate: (screen: OnboardingScreen) => void;
}

// Icons are now handled by the centralized IconSelector

// Liste des pages internes de l'application
const INTERNAL_PAGES = [
  { value: '/login', label: 'Page de Connexion' },
  { value: '/signup', label: 'Page d\'Inscription' },
  { value: '/employee', label: 'Dashboard Employé' },
  { value: '/employee/profile', label: 'Profil Employé' },
  { value: '/employee/simulations', label: 'Mes Simulations' },
  { value: '/employee/onboarding', label: 'Onboarding Employé' },
  { value: '/risk-profile', label: 'Profil de Risque' },
  { value: '/expert-booking', label: 'Réservation Expert' },
  { value: '/parcours', label: 'Parcours Formation' },
  { value: '/simulateur-impots', label: 'Simulateur Impôts' },
  { value: '/simulateur-espp', label: 'Simulateur ESPP' },
  { value: '/optimisation-fiscale', label: 'Optimisation Fiscale' },
  { value: '/simulateur-per', label: 'Simulateur PER' },
  { value: '/simulateur-epargne-precaution', label: 'Simulateur Épargne de Précaution' },
  { value: '/simulateur-interets-composes', label: 'Simulateur Intérêts Composés' },
  { value: '/simulateur-lmnp', label: 'Simulateur LMNP' },
  { value: '/simulateur-pret-immobilier', label: 'Simulateur Prêt Immobilier' },
  { value: '/simulateur-capacite-emprunt', label: 'Simulateur Capacité d\'Emprunt' },
  { value: '/simulateur-capacite-emprunt', label: 'Simulateur Capacité d\'Emprunt' },
  { value: '/forum', label: 'Forum' },
  { value: '/villains', label: 'Méchants Vaincus' },
  { value: '/plans', label: 'Plans & Tarifs' },
];

interface Parcours {
  id: string;
  title: string;
}

interface SortableOptionProps {
  option: OnboardingOption;
  index: number;
  onUpdate: (index: number, option: OnboardingOption) => void;
  onDelete: (index: number) => void;
  allScreens: OnboardingScreen[];
  currentScreenType: OnboardingScreenType;
  parcoursList: Parcours[];
}

function SortableOption({ option, index, onUpdate, onDelete, allScreens, currentScreenType, parcoursList }: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `option-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Filter compatible screens
  const compatibleScreens = allScreens.filter(s => canTransitionTo(currentScreenType, s.type));

  // Determine current destination type
  const getDestinationType = (): 'screen' | 'internal' | 'external' => {
    if (option.redirectExternalUrl !== undefined) return 'external';
    if (option.redirectInternalUrl !== undefined) return 'internal';
    return 'screen';
  };

  const destinationType = getDestinationType();

  const handleDestinationTypeChange = (newType: string) => {
    const updates: Partial<OnboardingOption> = {
      nextStepId: undefined,
      redirectInternalUrl: undefined,
      redirectExternalUrl: undefined,
    };
    
    if (newType === 'screen') {
      updates.nextStepId = '_pending';
    } else if (newType === 'internal') {
      updates.redirectInternalUrl = '';
    } else if (newType === 'external') {
      updates.redirectExternalUrl = '';
    }
    
    onUpdate(index, { ...option, ...updates });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 border rounded-lg bg-card space-y-3"
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-2"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-3">
          {/* Row 1: Label + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Label</Label>
              <Input
                value={option.label}
                onChange={(e) => onUpdate(index, { ...option, label: e.target.value })}
                placeholder="Label affiché"
              />
            </div>
            <div>
              <Label className="text-xs">Valeur</Label>
              <Input
                value={String(option.value)}
                onChange={(e) => onUpdate(index, { ...option, value: e.target.value })}
                placeholder="Valeur technique"
              />
            </div>
          </div>

          {/* Row 2: Icon + Icon Colors */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Icône</Label>
                <IconSelector
                  value={option.icon || ''}
                  onChange={(v) => onUpdate(index, { ...option, icon: v || undefined })}
                  allowNone
                  placeholder="Choisir une icône..."
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  Fond icône
                </Label>
                <ColorPicker
                  label=""
                  value={option.iconBgColor || "217 91% 60%"}
                  onChange={(v) => onUpdate(index, { ...option, iconBgColor: v })}
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  Couleur icône
                </Label>
                <ColorPicker
                  label=""
                  value={option.iconColor || "0 0% 100%"}
                  onChange={(v) => onUpdate(index, { ...option, iconColor: v })}
                />
              </div>
            </div>
            
            {/* Preview of the icon with colors */}
            {option.icon && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Aperçu:</span>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${option.iconBgColor || "217 91% 60%"})` }}
                >
                  {(() => {
                    const IconComp = getIconByName(option.icon);
                    if (!IconComp) return null;
                    return <IconComp className="h-5 w-5" style={{ color: `hsl(${option.iconColor || "0 0% 100%"})` }} />;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Lead Rank */}
          <div>
            <Label className="text-xs">Lead Rank</Label>
            <Select
              value={option.leadRankImpact ? String(option.leadRankImpact) : '_none'}
              onValueChange={(v) => onUpdate(index, { 
                ...option, 
                leadRankImpact: v === '_none' ? undefined : parseInt(v) 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Impact..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Non défini</SelectItem>
                {Object.entries(LEAD_RANK_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.emoji} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 3: Parcours à assigner */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Parcours à assigner
            </Label>
            <Select
              value={option.parcoursId || '_none'}
              onValueChange={(v) => onUpdate(index, { 
                ...option, 
                parcoursId: v === '_none' ? undefined : v 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun parcours..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Aucun parcours</SelectItem>
                {parcoursList.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              Ce parcours sera automatiquement ajouté à l'utilisateur s'il choisit cette option
            </p>
          </div>

          {/* Row 4: Description (optional) */}
          <div>
            <Label className="text-xs">Description (optionnelle)</Label>
            <Input
              value={option.description || ''}
              onChange={(e) => onUpdate(index, { ...option, description: e.target.value })}
              placeholder="Texte d'aide sous l'option"
            />
          </div>

          {/* Row 4: Destination - Simplified UI */}
          <div className="pt-2 border-t">
            <Label className="text-xs font-medium">Au clic → Destination</Label>
            <div className="mt-2 space-y-2">
              <Select
                value={destinationType}
                onValueChange={handleDestinationTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screen">{getDestinationTypeLabel('screen')}</SelectItem>
                  <SelectItem value="internal">{getDestinationTypeLabel('internal')}</SelectItem>
                  <SelectItem value="external">{getDestinationTypeLabel('external')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Show appropriate input based on destination type */}
              {destinationType === 'screen' && (
                <Select
                  value={option.nextStepId || '_none'}
                  onValueChange={(v) => onUpdate(index, { 
                    ...option, 
                    nextStepId: v === '_none' ? undefined : v,
                    redirectInternalUrl: undefined,
                    redirectExternalUrl: undefined,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'écran..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Choisir un écran...</SelectItem>
                    {compatibleScreens.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.order_num + 1}. {s.title} <span className="text-muted-foreground">({SCREEN_TYPE_LABELS[s.type as OnboardingScreenType]})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {destinationType === 'internal' && (
                <Select
                  value={option.redirectInternalUrl || '_none'}
                  onValueChange={(v) => onUpdate(index, { 
                    ...option, 
                    redirectInternalUrl: v === '_none' ? undefined : v,
                    nextStepId: undefined,
                    redirectExternalUrl: undefined,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une page..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Choisir une page...</SelectItem>
                    {INTERNAL_PAGES.map(page => (
                      <SelectItem key={page.value} value={page.value}>
                        {page.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {destinationType === 'external' && (
                <Input
                  value={option.redirectExternalUrl || ''}
                  onChange={(e) => onUpdate(index, { 
                    ...option, 
                    redirectExternalUrl: e.target.value || undefined,
                    nextStepId: undefined,
                    redirectInternalUrl: undefined,
                  })}
                  placeholder="https://calendly.com/..."
                />
              )}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Component for global screen destination selection
interface ScreenDestinationSelectorProps {
  screen: OnboardingScreen;
  allScreens: OnboardingScreen[];
  onUpdate: (screen: OnboardingScreen) => void;
}

function ScreenDestinationSelector({ screen, allScreens, onUpdate }: ScreenDestinationSelectorProps) {
  // Filter compatible screens (exclude current and incompatible types)
  const compatibleScreens = allScreens.filter(s => 
    s.id !== screen.id && canTransitionTo(screen.type as OnboardingScreenType, s.type as OnboardingScreenType)
  );

  // Determine destination type from metadata
  const getDestinationType = (): 'screen' | 'internal' | 'external' => {
    if (screen.metadata.redirectExternalUrl !== undefined) return 'external';
    if (screen.metadata.redirectInternalUrl !== undefined) return 'internal';
    return 'screen';
  };

  const destinationType = getDestinationType();

  const handleDestinationTypeChange = (newType: string) => {
    const updates: Partial<OnboardingScreen> = {
      next_step_id: null,
      metadata: {
        ...screen.metadata,
        redirectInternalUrl: undefined,
        redirectExternalUrl: undefined,
      },
    };
    
    if (newType === 'screen') {
      updates.next_step_id = '_pending';
    } else if (newType === 'internal') {
      updates.metadata = { ...updates.metadata!, redirectInternalUrl: '' };
    } else if (newType === 'external') {
      updates.metadata = { ...updates.metadata!, redirectExternalUrl: '' };
    }
    
    onUpdate({ ...screen, ...updates, updated_at: new Date().toISOString() });
  };

  const handleScreenSelect = (screenId: string) => {
    onUpdate({
      ...screen,
      next_step_id: screenId === '_none' ? null : screenId,
      metadata: {
        ...screen.metadata,
        redirectInternalUrl: undefined,
        redirectExternalUrl: undefined,
      },
      updated_at: new Date().toISOString(),
    });
  };

  const handleInternalUrlChange = (url: string) => {
    onUpdate({
      ...screen,
      next_step_id: null,
      metadata: {
        ...screen.metadata,
        redirectInternalUrl: url || undefined,
        redirectExternalUrl: undefined,
      },
      updated_at: new Date().toISOString(),
    });
  };

  const handleExternalUrlChange = (url: string) => {
    onUpdate({
      ...screen,
      next_step_id: null,
      metadata: {
        ...screen.metadata,
        redirectInternalUrl: undefined,
        redirectExternalUrl: url || undefined,
      },
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-3">
      <Select
        value={destinationType}
        onValueChange={handleDestinationTypeChange}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="screen">{getDestinationTypeLabel('screen')}</SelectItem>
          <SelectItem value="internal">{getDestinationTypeLabel('internal')}</SelectItem>
          <SelectItem value="external">{getDestinationTypeLabel('external')}</SelectItem>
        </SelectContent>
      </Select>

      {destinationType === 'screen' && (
        <Select
          value={screen.next_step_id || '_none'}
          onValueChange={handleScreenSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner l'écran..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Choisir un écran...</SelectItem>
            {compatibleScreens.length === 0 ? (
              <SelectItem value="_no_compat" disabled>
                Aucun écran compatible disponible
              </SelectItem>
            ) : (
              compatibleScreens.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.order_num + 1}. {s.title}
                  <span className="text-muted-foreground ml-1">
                    ({SCREEN_TYPE_LABELS[s.type as OnboardingScreenType]})
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {destinationType === 'internal' && (
        <Select
          value={(screen.metadata.redirectInternalUrl as string) || '_none'}
          onValueChange={(v) => handleInternalUrlChange(v === '_none' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir une page..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Choisir une page...</SelectItem>
            {INTERNAL_PAGES.map(page => (
              <SelectItem key={page.value} value={page.value}>
                {page.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {destinationType === 'external' && (
        <Input
          value={(screen.metadata.redirectExternalUrl as string) || ''}
          onChange={(e) => handleExternalUrlChange(e.target.value)}
          placeholder="https://calendly.com/..."
        />
      )}
    </div>
  );
}

export function OnboardingScreenEditor({
  screen, 
  allScreens, 
  onUpdate 
}: OnboardingScreenEditorProps) {
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);

  // Fetch parcours list on mount
  useEffect(() => {
    const fetchParcours = async () => {
      const { data } = await supabase
        .from('parcours')
        .select('id, title')
        .order('title');
      if (data) setParcoursList(data);
    };
    fetchParcours();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFieldChange = (field: keyof OnboardingScreen, value: any) => {
    onUpdate({ ...screen, [field]: value, updated_at: new Date().toISOString() });
  };

  const handleMetadataChange = (key: string, value: any) => {
    onUpdate({
      ...screen,
      metadata: { ...screen.metadata, [key]: value },
      updated_at: new Date().toISOString(),
    });
  };

  const handleOptionUpdate = (index: number, option: OnboardingOption) => {
    const newOptions = [...screen.options];
    newOptions[index] = option;
    handleFieldChange('options', newOptions);
  };

  const handleOptionDelete = (index: number) => {
    const newOptions = screen.options.filter((_, i) => i !== index);
    handleFieldChange('options', newOptions);
  };

  const handleAddOption = () => {
    handleFieldChange('options', [
      ...screen.options,
      { label: 'Nouvelle option', value: `option_${Date.now()}` }
    ]);
  };

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('option-', ''));
      const newIndex = parseInt(String(over.id).replace('option-', ''));
      handleFieldChange('options', arrayMove(screen.options, oldIndex, newIndex));
    }
  };

  const showOptionsEditor = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'TOGGLE'].includes(screen.type);
  const showSliderSettings = screen.type === 'SLIDER';
  const showWelcomeSettings = screen.type === 'WELCOME';
  const showResultSettings = screen.type === 'CALCULATION_RESULT';
  const showTextInputSettings = screen.type === 'TEXT_INPUT';

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Type d'écran</Label>
            <Select
              value={screen.type}
              onValueChange={(v) => handleFieldChange('type', v as OnboardingScreenType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCREEN_TYPE_LABELS).map(([type, label]) => (
                  <SelectItem key={type} value={type}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Statut</Label>
            <Select
              value={screen.status}
              onValueChange={(v) => handleFieldChange('status', v)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    Brouillon
                  </span>
                </SelectItem>
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Actif
                  </span>
                </SelectItem>
                <SelectItem value="archived">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Archivé
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Titre</Label>
          <Input
            value={screen.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Titre principal de l'écran"
          />
        </div>

        <div>
          <Label>Sous-titre</Label>
          <Textarea
            value={screen.subtitle || ''}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            placeholder="Texte d'aide contextuel (optionnel)"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={screen.is_active}
            onCheckedChange={(v) => handleFieldChange('is_active', v)}
          />
          <Label>Écran actif</Label>
        </div>

        {/* Button Text - Available for all screen types */}
        <div>
          <Label>Texte du bouton principal</Label>
          <Input
            value={screen.metadata.buttonText || ''}
            onChange={(e) => handleMetadataChange('buttonText', e.target.value)}
            placeholder={screen.type === 'WELCOME' ? 'Commencer' : 'Continuer'}
          />
        </div>
      </div>

      <Separator />

      {/* Welcome Settings */}
      {showWelcomeSettings && (
        <div className="space-y-4">
          <h4 className="font-medium">Paramètres écran d'accueil</h4>
          <div>
            <Label>Icône</Label>
            <IconSelector
              value={screen.metadata.icon || 'Sparkles'}
              onChange={(v) => handleMetadataChange('icon', v)}
            />
          </div>
        </div>
      )}

      {/* Slider Settings */}
      {showSliderSettings && (
        <div className="space-y-4">
          <h4 className="font-medium">Paramètres du curseur</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum</Label>
              <Input
                type="number"
                value={screen.metadata.min || 0}
                onChange={(e) => handleMetadataChange('min', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Maximum</Label>
              <Input
                type="number"
                value={screen.metadata.max || 100}
                onChange={(e) => handleMetadataChange('max', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Pas</Label>
              <Input
                type="number"
                value={screen.metadata.step || 1}
                onChange={(e) => handleMetadataChange('step', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Unité</Label>
              <Input
                value={screen.metadata.unit || ''}
                onChange={(e) => handleMetadataChange('unit', e.target.value)}
                placeholder="€, %, etc."
              />
            </div>
            <div className="col-span-2">
              <Label>Valeur par défaut</Label>
              <Input
                type="number"
                value={screen.metadata.defaultValue || screen.metadata.min || 0}
                onChange={(e) => handleMetadataChange('defaultValue', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Text Input Settings */}
      {showTextInputSettings && (
        <div className="space-y-4">
          <h4 className="font-medium">Paramètres de saisie</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type d'entrée</Label>
              <Select
                value={screen.metadata.inputType || 'text'}
                onValueChange={(v) => handleMetadataChange('inputType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Téléphone</SelectItem>
                  <SelectItem value="number">Nombre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input
                value={screen.metadata.placeholder || ''}
                onChange={(e) => handleMetadataChange('placeholder', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Result Settings */}
      {showResultSettings && (
        <div className="space-y-6">
          <h4 className="font-medium">Paramètres du résultat</h4>
          
          {/* Calculation Configuration */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <h5 className="font-medium text-sm">Configuration du calcul</h5>
            <CalculationConfigEditor
              config={screen.metadata.calculationConfig}
              allScreens={allScreens}
              onChange={(config: CalculationConfig) => handleMetadataChange('calculationConfig', config)}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Texte de chargement</Label>
              <Input
                value={screen.metadata.loadingText || 'Analyse en cours...'}
                onChange={(e) => handleMetadataChange('loadingText', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-texte chargement</Label>
              <Input
                value={screen.metadata.loadingSubtext || ''}
                onChange={(e) => handleMetadataChange('loadingSubtext', e.target.value)}
              />
            </div>
            <div>
              <Label>Label du résultat</Label>
              <Input
                value={screen.metadata.resultLabel || 'Résultat'}
                onChange={(e) => handleMetadataChange('resultLabel', e.target.value)}
              />
            </div>
            <div>
              <Label>Unité du résultat</Label>
              <Input
                value={screen.metadata.resultUnit || '€'}
                onChange={(e) => handleMetadataChange('resultUnit', e.target.value)}
                placeholder="€, %, points..."
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            💡 La destination au clic du bouton est définie dans les "Conditions de transition" ci-dessous.
          </p>
        </div>
      )}

      {/* Options Editor */}
      {showOptionsEditor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Options</h4>
            <Button size="sm" variant="outline" onClick={handleAddOption}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une option
            </Button>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleOptionDragEnd}
          >
            <SortableContext
              items={screen.options.map((_, i) => `option-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {screen.options.map((option, index) => (
                  <SortableOption
                    key={`option-${index}`}
                    option={option}
                    index={index}
                    onUpdate={handleOptionUpdate}
                    onDelete={handleOptionDelete}
                    allScreens={allScreens}
                    currentScreenType={screen.type as OnboardingScreenType}
                    parcoursList={parcoursList}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {screen.options.length === 0 && (
            <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
              Aucune option configurée
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Default Next Screen - Global for all screen types */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Écran suivant par défaut</h4>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Définissez où aller après cet écran (si aucune condition de transition ne s'applique).
        </p>

        <ScreenDestinationSelector
          screen={screen}
          allScreens={allScreens}
          onUpdate={onUpdate}
        />
      </div>

      <Separator />

      {/* Transition Conditions Editor - Available for all screen types */}
      <TransitionConditionsEditor
        screen={screen}
        allScreens={allScreens}
        onUpdate={(conditions: TransitionCondition[]) => handleMetadataChange('transitionConditions', conditions)}
      />
    </div>
  );
}
