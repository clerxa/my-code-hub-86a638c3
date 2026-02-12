import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, BookOpen, CheckCircle, Lightbulb, FileCode,
  Sparkles, Plus
} from "lucide-react";
import { SLIDE_TEMPLATES, SlideTemplate } from "@/types/slides";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SlideTemplateSelectorProps {
  onSelect: (templateId: string) => void;
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  Play: <Play className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  FileCode: <FileCode className="h-5 w-5" />,
};

export const SlideTemplateSelector = ({ onSelect }: SlideTemplateSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Templates prédéfinis</span>
        <Badge variant="secondary" className="text-xs">
          Démarrage rapide
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {SLIDE_TEMPLATES.map((template) => (
          <TemplateCard 
            key={template.id} 
            template={template} 
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

const TemplateCard = ({ 
  template, 
  onSelect 
}: { 
  template: SlideTemplate; 
  onSelect: (id: string) => void;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card 
          className={`
            relative overflow-hidden cursor-pointer transition-all duration-200
            hover:scale-[1.02] hover:shadow-lg border-2 border-transparent
            hover:border-primary/50 group
          `}
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
          
          <div className="relative p-3 text-center space-y-2">
            {/* Icon */}
            <div className={`
              inline-flex items-center justify-center w-10 h-10 rounded-xl
              bg-gradient-to-br ${template.color} text-white
              shadow-lg
            `}>
              {TEMPLATE_ICONS[template.icon] || <FileCode className="h-5 w-5" />}
            </div>
            
            {/* Name */}
            <h4 className="font-medium text-sm">{template.name}</h4>
            
            {/* Slide count */}
            <Badge variant="outline" className="text-xs">
              {template.slides.length} slides
            </Badge>
          </div>
        </Card>
      </PopoverTrigger>
      
      <PopoverContent className="w-72 p-4" align="center">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`
              inline-flex items-center justify-center w-10 h-10 rounded-xl
              bg-gradient-to-br ${template.color} text-white
            `}>
              {TEMPLATE_ICONS[template.icon] || <FileCode className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="font-semibold">{template.name}</h4>
              <p className="text-xs text-muted-foreground">{template.slides.length} slides incluses</p>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {template.description}
          </p>
          
          {/* Preview of slides */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Contenu :</span>
            <ul className="text-xs space-y-1">
              {template.slides.map((slide, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span className="capitalize">
                    {slide.type === 'title' && (slide as any).title ? 
                      (slide as any).title.substring(0, 30) + ((slide as any).title.length > 30 ? '...' : '') : 
                      slide.type}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action */}
          <Button 
            className="w-full" 
            size="sm"
            onClick={() => onSelect(template.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter ce template
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
