import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, Trash2, GripVertical, ChevronUp, ChevronDown, 
  Type, Image, List, Quote, FileText, Eye, Sparkles,
  Palette, Layout, Play, Columns, Upload
} from "lucide-react";
import { 
  Slide, SlideType, SlidesData, createSlide, 
  SLIDE_TYPE_LABELS, TitleSlide, ImageSlide, ListSlide, QuoteSlide, PDFSlide, TextImageSlide,
  TEXT_COLOR_PRESETS
} from "@/types/slides";
import { SlidePreviewMini } from "./SlidePreviewMini";
import { ImageUpload } from "../ImageUpload";
import { FileUpload } from "../FileUpload";

interface SlideEditorProps {
  slidesData: SlidesData;
  onChange: (data: SlidesData) => void;
}

const SLIDE_ICONS: Record<SlideType, React.ReactNode> = {
  title: <Type className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  'text-image': <Columns className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  quote: <Quote className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
};

const BG_GRADIENTS = [
  { label: 'Aucun', value: '' },
  { label: 'Primary', value: 'from-primary/20 to-primary/5' },
  { label: 'Bleu profond', value: 'from-blue-600 to-indigo-900' },
  { label: 'Violet', value: 'from-purple-600 to-pink-600' },
  { label: 'Vert nature', value: 'from-emerald-500 to-teal-700' },
  { label: 'Coucher de soleil', value: 'from-orange-400 to-rose-600' },
  { label: 'Noir élégant', value: 'from-gray-900 to-gray-800' },
];

export const SlideEditor = ({ slidesData, onChange }: SlideEditorProps) => {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(
    slidesData.slides.length > 0 ? 0 : null
  );
  const [showPreview, setShowPreview] = useState(false);

  const slides = slidesData.slides || [];

  const addSlide = (type: SlideType) => {
    const newSlide = createSlide(type);
    const newSlides = [...slides, newSlide];
    onChange({ ...slidesData, slides: newSlides });
    setSelectedSlideIndex(newSlides.length - 1);
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates } as Slide;
    onChange({ ...slidesData, slides: newSlides });
  };

  const removeSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    onChange({ ...slidesData, slides: newSlides });
    if (selectedSlideIndex !== null) {
      if (selectedSlideIndex >= newSlides.length) {
        setSelectedSlideIndex(newSlides.length - 1 >= 0 ? newSlides.length - 1 : null);
      }
    }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    onChange({ ...slidesData, slides: newSlides });
    setSelectedSlideIndex(targetIndex);
  };

  const selectedSlide = selectedSlideIndex !== null ? slides[selectedSlideIndex] : null;

  const renderSlideFields = () => {
    if (!selectedSlide) return null;

    switch (selectedSlide.type) {
      case 'title':
        return <TitleSlideFields slide={selectedSlide} onChange={(updates) => updateSlide(selectedSlideIndex!, updates)} />;
      case 'image':
        return <ImageSlideFields slide={selectedSlide} onChange={(updates) => updateSlide(selectedSlideIndex!, updates)} />;
      case 'text-image':
        return <TextImageSlideFields slide={selectedSlide} onChange={(updates) => updateSlide(selectedSlideIndex!, updates)} />;
      case 'list':
        return <ListSlideFields slide={selectedSlide} onChange={(updates) => updateSlide(selectedSlideIndex!, updates)} />;
      case 'quote':
        return <QuoteSlideFields slide={selectedSlide} onChange={(updates) => updateSlide(selectedSlideIndex!, updates)} />;
      case 'pdf':
        return <PDFSlideFields slide={selectedSlide} onChange={(updates) => updateSlide(selectedSlideIndex!, updates)} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Éditeur de slides</h3>
          <Badge variant="secondary">{slides.length} slide{slides.length > 1 ? 's' : ''}</Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? 'Masquer' : 'Aperçu'}
        </Button>
      </div>

      {/* Main editor area */}
      <div className="grid grid-cols-12 gap-4">
        {/* Slides list - left sidebar */}
        <div className="col-span-4 space-y-3">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Slides
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-2">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`group relative rounded-lg border transition-all cursor-pointer ${
                        selectedSlideIndex === index 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedSlideIndex(index)}
                    >
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground opacity-50" />
                          <Badge variant="outline" className="text-xs gap-1">
                            {SLIDE_ICONS[slide.type]}
                            {index + 1}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {SLIDE_TYPE_LABELS[slide.type]}
                          </span>
                        </div>
                        
                        {/* Mini preview */}
                        <SlidePreviewMini slide={slide} />

                        {/* Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'up'); }}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'down'); }}
                            disabled={index === slides.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); removeSlide(index); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {slides.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune slide</p>
                      <p className="text-xs">Ajoutez votre première slide ci-dessous</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Add slide buttons */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Ajouter une slide</p>
                <div className="grid grid-cols-3 gap-1">
                  {(['title', 'text-image', 'image', 'list', 'quote', 'pdf'] as SlideType[]).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-col h-auto py-2 gap-1 text-xs"
                      onClick={() => addSlide(type)}
                    >
                      {SLIDE_ICONS[type]}
                      <span className="truncate w-full">{type === 'title' ? 'Titre' : type === 'text-image' ? 'Texte+Img' : type === 'image' ? 'Image' : type === 'list' ? 'Liste' : type === 'quote' ? 'Citation' : 'PDF'}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slide editor - right panel */}
        <div className="col-span-8">
          {selectedSlide ? (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {SLIDE_ICONS[selectedSlide.type]}
                    <CardTitle className="text-sm">{SLIDE_TYPE_LABELS[selectedSlide.type]}</CardTitle>
                  </div>
                  <Badge variant="secondary">Slide {selectedSlideIndex! + 1}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderSlideFields()}

                {/* Common style options */}
                <div className="pt-4 border-t border-border/50 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Palette className="h-4 w-4" />
                    Style de la slide
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Dégradé de fond</Label>
                      <Select
                        value={selectedSlide.bgGradient || ''}
                        onValueChange={(value) => updateSlide(selectedSlideIndex!, { bgGradient: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                          {BG_GRADIENTS.map((g) => (
                            <SelectItem key={g.value || 'none'} value={g.value || 'none'}>
                              <div className="flex items-center gap-2">
                                {g.value && (
                                  <div className={`w-4 h-4 rounded bg-gradient-to-r ${g.value}`} />
                                )}
                                {g.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Couleur du texte</Label>
                      <Select
                        value={selectedSlide.textColor || ''}
                        onValueChange={(value) => updateSlide(selectedSlideIndex!, { textColor: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Par défaut" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEXT_COLOR_PRESETS.map((c) => (
                            <SelectItem key={c.value || 'none'} value={c.value || 'none'}>
                              <div className="flex items-center gap-2">
                                {c.value && (
                                  <div className={`w-4 h-4 rounded border ${c.value.replace('text-', 'bg-')}`} />
                                )}
                                {c.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Image de fond</Label>
                      <ImageUpload
                        label=""
                        value={selectedSlide.bgImage || ''}
                        onChange={(url) => updateSlide(selectedSlideIndex!, { bgImage: url })}
                        bucketName="slides"
                        maxWidth="100%"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-border/50 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-center">
                  Sélectionnez une slide à modifier<br />
                  <span className="text-sm">ou créez-en une nouvelle</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Global settings */}
      <Card className="border-border/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Lecture automatique</Label>
                <Switch
                  checked={slidesData.autoPlay || false}
                  onCheckedChange={(checked) => onChange({ ...slidesData, autoPlay: checked })}
                />
              </div>
              
              {slidesData.autoPlay && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Intervalle (sec)</Label>
                  <Input
                    type="number"
                    min={3}
                    max={30}
                    value={slidesData.autoPlayInterval || 8}
                    onChange={(e) => onChange({ ...slidesData, autoPlayInterval: parseInt(e.target.value) })}
                    className="w-20 h-8"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Transition</Label>
              <Select
                value={slidesData.transition || 'fade'}
                onValueChange={(value: any) => onChange({ ...slidesData, transition: value })}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fondu</SelectItem>
                  <SelectItem value="slide">Glissement</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="flip">Retournement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual slide type field components
const TitleSlideFields = ({ slide, onChange }: { slide: TitleSlide; onChange: (updates: Partial<TitleSlide>) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Titre principal</Label>
      <Input
        value={slide.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Un titre accrocheur..."
        className="text-lg font-semibold"
      />
    </div>
    <div className="space-y-2">
      <Label>Sous-titre (optionnel)</Label>
      <Input
        value={slide.subtitle || ''}
        onChange={(e) => onChange({ subtitle: e.target.value })}
        placeholder="Une ligne d'explication..."
      />
    </div>
    <div className="space-y-2">
      <Label>Contenu (optionnel)</Label>
      <Textarea
        value={slide.content || ''}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder="Texte détaillé..."
        rows={4}
      />
    </div>
  </div>
);

const ImageSlideFields = ({ slide, onChange }: { slide: ImageSlide; onChange: (updates: Partial<ImageSlide>) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Image
      </Label>
      <ImageUpload
        label=""
        value={slide.imageUrl}
        onChange={(url) => onChange({ imageUrl: url })}
        bucketName="slides"
        hint="Uploadez une image ou collez une URL"
      />
    </div>
    <div className="space-y-2">
      <Label>Titre (optionnel)</Label>
      <Input
        value={slide.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Titre de l'image..."
      />
    </div>
    <div className="space-y-2">
      <Label>Légende</Label>
      <Textarea
        value={slide.caption || ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Description de l'image..."
        rows={3}
      />
    </div>
    <div className="space-y-2">
      <Label>Position de l'image</Label>
      <Select
        value={slide.imagePosition || 'center'}
        onValueChange={(value: any) => onChange({ imagePosition: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="center">Centrée</SelectItem>
          <SelectItem value="left">À gauche</SelectItem>
          <SelectItem value="right">À droite</SelectItem>
          <SelectItem value="background">Plein écran (fond)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

// New: Text + Image slide fields
const TextImageSlideFields = ({ slide, onChange }: { slide: TextImageSlide; onChange: (updates: Partial<TextImageSlide>) => void }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titre</Label>
          <Input
            value={slide.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Titre de la slide..."
            className="text-lg font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label>Contenu</Label>
          <Textarea
            value={slide.content || ''}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Texte explicatif..."
            rows={6}
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Image
          </Label>
          <ImageUpload
            label=""
            value={slide.imageUrl}
            onChange={(url) => onChange({ imageUrl: url })}
            bucketName="slides"
            hint="Uploadez une image"
          />
        </div>
        <div className="space-y-2">
          <Label>Texte alternatif</Label>
          <Input
            value={slide.imageAlt || ''}
            onChange={(e) => onChange({ imageAlt: e.target.value })}
            placeholder="Description pour l'accessibilité..."
          />
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <Label>Disposition</Label>
      <Select
        value={slide.imagePosition}
        onValueChange={(value: 'left' | 'right') => onChange({ imagePosition: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="left">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <div className="w-3 h-4 bg-primary/60 rounded-sm" />
                <div className="w-4 h-4 bg-muted rounded-sm" />
              </div>
              Image à gauche, texte à droite
            </div>
          </SelectItem>
          <SelectItem value="right">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <div className="w-4 h-4 bg-muted rounded-sm" />
                <div className="w-3 h-4 bg-primary/60 rounded-sm" />
              </div>
              Texte à gauche, image à droite
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const ListSlideFields = ({ slide, onChange }: { slide: ListSlide; onChange: (updates: Partial<ListSlide>) => void }) => {
  const addItem = () => {
    onChange({ items: [...slide.items, { text: '' }] });
  };

  const updateItem = (index: number, updates: Partial<{ text: string; description: string }>) => {
    const items = [...slide.items];
    items[index] = { ...items[index], ...updates };
    onChange({ items });
  };

  const removeItem = (index: number) => {
    onChange({ items: slide.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre de la liste</Label>
        <Input
          value={slide.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Points clés à retenir..."
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          checked={slide.showNumbers || false}
          onCheckedChange={(checked) => onChange({ showNumbers: checked })}
        />
        <Label className="text-sm">Afficher les numéros</Label>
      </div>

      <div className="space-y-2">
        <Label>Éléments de la liste</Label>
        <div className="space-y-2">
          {slide.items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  value={item.text}
                  onChange={(e) => updateItem(index, { text: e.target.value })}
                  placeholder={`Point ${index + 1}...`}
                />
                <Input
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="Description (optionnel)..."
                  className="text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addItem} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un point
          </Button>
        </div>
      </div>
    </div>
  );
};

const QuoteSlideFields = ({ slide, onChange }: { slide: QuoteSlide; onChange: (updates: Partial<QuoteSlide>) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Citation / Message clé</Label>
      <Textarea
        value={slide.quote}
        onChange={(e) => onChange({ quote: e.target.value })}
        placeholder="Le message important à retenir..."
        rows={4}
        className="text-lg italic"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Auteur (optionnel)</Label>
        <Input
          value={slide.author || ''}
          onChange={(e) => onChange({ author: e.target.value })}
          placeholder="Nom de l'auteur..."
        />
      </div>
      <div className="space-y-2">
        <Label>Rôle / Fonction (optionnel)</Label>
        <Input
          value={slide.role || ''}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="PDG, Expert..."
        />
      </div>
    </div>
  </div>
);

const PDFSlideFields = ({ slide, onChange }: { slide: PDFSlide; onChange: (updates: Partial<PDFSlide>) => void }) => {
  const [pdfInputMode, setPdfInputMode] = useState<'upload' | 'url'>('upload');
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre du document (optionnel)</Label>
        <Input
          value={slide.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Nom du document..."
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document PDF
          </Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={pdfInputMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPdfInputMode('upload')}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
            <Button
              type="button"
              variant={pdfInputMode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPdfInputMode('url')}
            >
              URL
            </Button>
          </div>
        </div>
        
        {pdfInputMode === 'upload' ? (
          <FileUpload
            label=""
            value={slide.pdfUrl}
            onChange={(url) => onChange({ pdfUrl: url })}
            bucketName="slides"
            accept="pdf"
            hint="Uploadez un fichier PDF"
            maxSizeMB={20}
          />
        ) : (
          <Input
            value={slide.pdfUrl}
            onChange={(e) => onChange({ pdfUrl: e.target.value })}
            placeholder="https://... URL du PDF"
          />
        )}
      </div>
      
      {slide.pdfUrl && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Le PDF sera affiché page par page avec une navigation intégrée.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
