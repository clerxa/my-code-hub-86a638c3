import { motion } from "framer-motion";
import { 
  Slide, TitleSlide, ImageSlide, ListSlide, QuoteSlide, PDFSlide, TextImageSlide 
} from "@/types/slides";
import { Quote, Check, FileText } from "lucide-react";
import { PDFViewer } from "./PDFViewer";

interface SlideRendererProps {
  slide: Slide;
  isFullscreen?: boolean;
  onPdfProgressUpdate?: (currentPage: number, totalPages: number) => void;
  pdfPageNumber?: number;
  onPdfPageNumberChange?: (page: number) => void;
  hidePdfNavigation?: boolean;
}

export const SlideRenderer = ({
  slide,
  isFullscreen,
  onPdfProgressUpdate,
  pdfPageNumber,
  onPdfPageNumberChange,
  hidePdfNavigation,
}: SlideRendererProps) => {
  const bgClasses = slide.bgGradient 
    ? `bg-gradient-to-br ${slide.bgGradient}` 
    : 'bg-transparent';
  
  const bgStyle = slide.bgImage 
    ? { backgroundImage: `url(${slide.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  const contentPadding = isFullscreen ? 'p-16' : 'p-8 md:p-12';
  
  // Text color class from slide settings
  const textColorClass = slide.textColor || '';

  return (
    <div 
      className={`relative w-full h-full ${bgClasses}`}
      style={bgStyle}
    >
      {slide.bgImage && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      )}
      
      <div className={`relative z-10 w-full h-full flex items-center justify-center ${contentPadding} ${textColorClass}`}>
        {slide.type === 'title' && <TitleSlideView slide={slide} />}
        {slide.type === 'image' && <ImageSlideView slide={slide} />}
        {slide.type === 'text-image' && <TextImageSlideView slide={slide} />}
        {slide.type === 'list' && <ListSlideView slide={slide} />}
        {slide.type === 'quote' && <QuoteSlideView slide={slide} />}
        {slide.type === 'pdf' && (
          <PDFSlideView
            slide={slide}
            isFullscreen={isFullscreen}
            onProgressUpdate={onPdfProgressUpdate}
            pageNumber={pdfPageNumber}
            onPageNumberChange={onPdfPageNumberChange}
            hideNavigation={hidePdfNavigation}
          />
        )}
      </div>
    </div>
  );
};

// Title Slide
const TitleSlideView = ({ slide }: { slide: TitleSlide }) => (
  <div className="text-center max-w-4xl mx-auto">
    <motion.h1 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
    >
      {slide.title}
    </motion.h1>
    
    {slide.subtitle && (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl md:text-2xl text-muted-foreground mb-8"
      >
        {slide.subtitle}
      </motion.p>
    )}
    
    {slide.content && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed"
      >
        {slide.content}
      </motion.p>
    )}
  </div>
);

// Image Slide
const ImageSlideView = ({ slide }: { slide: ImageSlide }) => {
  if (slide.imagePosition === 'background') {
    return (
      <div className="absolute inset-0">
        <img 
          src={slide.imageUrl} 
          alt={slide.imageAlt || ''} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {(slide.title || slide.caption) && (
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            {slide.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-5xl font-bold text-white mb-4"
              >
                {slide.title}
              </motion.h2>
            )}
            {slide.caption && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-white/80 max-w-2xl"
              >
                {slide.caption}
              </motion.p>
            )}
          </div>
        )}
      </div>
    );
  }

  const layoutClasses = {
    center: 'flex-col items-center',
    left: 'flex-row items-center gap-8',
    right: 'flex-row-reverse items-center gap-8',
  };

  return (
    <div className={`flex ${layoutClasses[slide.imagePosition || 'center']} w-full max-w-6xl mx-auto`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`${slide.imagePosition === 'center' ? 'w-full max-w-3xl' : 'w-1/2'}`}
      >
        <img 
          src={slide.imageUrl} 
          alt={slide.imageAlt || ''} 
          className="w-full h-auto rounded-2xl shadow-2xl"
        />
      </motion.div>
      
      {(slide.title || slide.caption) && (
        <motion.div
          initial={{ opacity: 0, x: slide.imagePosition === 'left' ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`${slide.imagePosition === 'center' ? 'text-center mt-8' : 'w-1/2'}`}
        >
          {slide.title && (
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              {slide.title}
            </h2>
          )}
          {slide.caption && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {slide.caption}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Text + Image Slide (new layout)
const TextImageSlideView = ({ slide }: { slide: TextImageSlide }) => {
  const isImageLeft = slide.imagePosition === 'left';
  
  return (
    <div className={`flex ${isImageLeft ? 'flex-row' : 'flex-row-reverse'} items-center gap-8 lg:gap-12 w-full max-w-6xl mx-auto`}>
      {/* Image side */}
      <motion.div
        initial={{ opacity: 0, x: isImageLeft ? -30 : 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-1/2 flex-shrink-0"
      >
        {slide.imageUrl ? (
          <img 
            src={slide.imageUrl} 
            alt={slide.imageAlt || slide.title} 
            className="w-full h-auto rounded-2xl shadow-2xl object-cover max-h-[60vh]"
          />
        ) : (
          <div className="w-full aspect-video bg-muted/50 rounded-2xl flex items-center justify-center">
            <span className="text-muted-foreground">Aucune image</span>
          </div>
        )}
      </motion.div>
      
      {/* Text side */}
      <motion.div
        initial={{ opacity: 0, x: isImageLeft ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-1/2"
      >
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          {slide.title}
        </h2>
        {slide.content && (
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {slide.content}
          </p>
        )}
      </motion.div>
    </div>
  );
};

// List Slide
const ListSlideView = ({ slide }: { slide: ListSlide }) => (
  <div className="w-full max-w-4xl mx-auto">
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-3xl md:text-5xl font-bold text-foreground mb-12 text-center"
    >
      {slide.title}
    </motion.h2>
    
    <div className="space-y-6">
      {slide.items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + index * 0.15, duration: 0.4 }}
          className="flex items-start gap-4 group"
        >
          <div className="flex-shrink-0 mt-1">
            {slide.showNumbers ? (
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                {index + 1}
              </span>
            ) : (
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Check className="h-5 w-5" />
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xl md:text-2xl font-medium text-foreground">
              {item.text}
            </p>
            {item.description && (
              <p className="text-muted-foreground mt-2 text-lg">
                {item.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// Quote Slide
const QuoteSlideView = ({ slide }: { slide: QuoteSlide }) => (
  <div className="w-full max-w-4xl mx-auto text-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Quote className="h-16 w-16 mx-auto text-primary/30 mb-8" />
    </motion.div>
    
    <motion.blockquote
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="text-2xl md:text-4xl lg:text-5xl font-medium text-foreground leading-relaxed italic mb-12"
    >
      "{slide.quote}"
    </motion.blockquote>
    
    {(slide.author || slide.role) && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex items-center justify-center gap-3"
      >
        <div className="h-px w-12 bg-primary/30" />
        <div className="text-lg">
          {slide.author && <span className="font-semibold text-foreground">{slide.author}</span>}
          {slide.role && <span className="text-muted-foreground"> · {slide.role}</span>}
        </div>
        <div className="h-px w-12 bg-primary/30" />
      </motion.div>
    )}
  </div>
);

// PDF Slide
const PDFSlideView = ({
  slide,
  isFullscreen,
  onProgressUpdate,
  pageNumber,
  onPageNumberChange,
  hideNavigation,
}: {
  slide: PDFSlide;
  isFullscreen?: boolean;
  onProgressUpdate?: (currentPage: number, totalPages: number) => void;
  pageNumber?: number;
  onPageNumberChange?: (page: number) => void;
  hideNavigation?: boolean;
}) => (
  <div className="w-full h-full flex flex-col">
    {slide.title && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <FileText className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">{slide.title}</h2>
      </motion.div>
    )}
    <div className="flex-1 min-h-0">
      <PDFViewer
        pdfUrl={slide.pdfUrl}
        isFullscreen={isFullscreen}
        onProgressUpdate={onProgressUpdate}
        pageNumber={pageNumber}
        onPageNumberChange={onPageNumberChange}
        hideNavigation={hideNavigation}
      />
    </div>
  </div>
);
