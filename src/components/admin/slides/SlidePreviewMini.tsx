import { Slide } from "@/types/slides";
import { Type, Image, List, Quote, FileText, Columns } from "lucide-react";

interface SlidePreviewMiniProps {
  slide: Slide;
}

export const SlidePreviewMini = ({ slide }: SlidePreviewMiniProps) => {
  const bgStyle = slide.bgGradient 
    ? `bg-gradient-to-br ${slide.bgGradient}` 
    : slide.bgImage 
      ? 'bg-cover bg-center' 
      : 'bg-muted/50';

  const renderContent = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div className="text-center p-2">
            <div className="text-[10px] font-bold truncate">{slide.title || 'Titre...'}</div>
            {slide.subtitle && (
              <div className="text-[8px] text-muted-foreground truncate">{slide.subtitle}</div>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            {slide.imageUrl ? (
              <img 
                src={slide.imageUrl} 
                alt="" 
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <Image className="h-6 w-6 text-muted-foreground/30" />
            )}
          </div>
        );
      
      case 'text-image':
        return (
          <div className={`flex ${slide.imagePosition === 'left' ? 'flex-row' : 'flex-row-reverse'} items-center gap-1 p-1 h-full`}>
            <div className="w-1/2 h-full flex items-center justify-center">
              {slide.imageUrl ? (
                <img 
                  src={slide.imageUrl} 
                  alt="" 
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="w-full h-full bg-muted/70 rounded flex items-center justify-center">
                  <Image className="h-3 w-3 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="w-1/2 p-1">
              <div className="text-[8px] font-bold truncate">{slide.title || 'Titre...'}</div>
              {slide.content && (
                <div className="text-[6px] text-muted-foreground line-clamp-2">{slide.content}</div>
              )}
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className="p-2 space-y-0.5">
            <div className="text-[9px] font-semibold truncate">{slide.title || 'Liste...'}</div>
            {slide.items.slice(0, 3).map((item, i) => (
              <div key={i} className="text-[7px] text-muted-foreground flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-primary/50" />
                <span className="truncate">{item.text || '...'}</span>
              </div>
            ))}
            {slide.items.length > 3 && (
              <div className="text-[7px] text-muted-foreground">+{slide.items.length - 3} autres</div>
            )}
          </div>
        );
      
      case 'quote':
        return (
          <div className="p-2 text-center">
            <Quote className="h-3 w-3 mx-auto text-primary/50 mb-1" />
            <div className="text-[8px] italic line-clamp-2">{slide.quote || 'Citation...'}</div>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <FileText className="h-5 w-5 text-red-500/70" />
            <span className="text-[8px] text-muted-foreground">PDF</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className={`relative aspect-video rounded overflow-hidden border border-border/30 ${bgStyle}`}
      style={slide.bgImage ? { backgroundImage: `url(${slide.bgImage})` } : undefined}
    >
      {slide.bgImage && <div className="absolute inset-0 bg-black/30" />}
      <div className="relative z-10 h-full flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};
