import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Play, Pause, RotateCcw 
} from "lucide-react";
import { Slide, SlidesData, SlideTransition } from "@/types/slides";
import { SlideRenderer } from "./SlideRenderer";

interface SlideViewerProps {
  slidesData: SlidesData;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

const getTransitionVariants = (transition: SlideTransition) => {
  switch (transition) {
    case 'slide':
      return {
        initial: { x: 300, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -300, opacity: 0 },
      };
    case 'zoom':
      return {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1.2, opacity: 0 },
      };
    case 'flip':
      return {
        initial: { rotateY: 90, opacity: 0 },
        animate: { rotateY: 0, opacity: 1 },
        exit: { rotateY: -90, opacity: 0 },
      };
    case 'fade':
    default:
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      };
  }
};

export const SlideViewer = ({ slidesData, onProgressUpdate, onComplete }: SlideViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(slidesData.autoPlay || false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([0]));
  
  // Track PDF progress per slide: slideIndex -> { current, total }
  const [pdfProgress, setPdfProgress] = useState<Record<number, { current: number; total: number }>>({});

  const slides = slidesData.slides || [];
  const totalSlides = slides.length;
  const transition = slidesData.transition || 'fade';
  const interval = (slidesData.autoPlayInterval || 8) * 1000;

  // Calculate progress considering PDF pages
  const calculateProgress = useCallback(() => {
    let totalUnits = 0;
    let completedUnits = 0;
    
    slides.forEach((slide, index) => {
      if (slide.type === 'pdf' && pdfProgress[index]) {
        // PDF slide: count each page as a unit
        const { current, total } = pdfProgress[index];
        totalUnits += total;
        if (visitedSlides.has(index)) {
          completedUnits += current;
        }
      } else {
        // Regular slide: counts as 1 unit
        totalUnits += 1;
        if (visitedSlides.has(index)) {
          completedUnits += 1;
        }
      }
    });
    
    return totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;
  }, [slides, visitedSlides, pdfProgress]);

  const progress = calculateProgress();

  // Handler for PDF progress updates
  const handlePdfProgressUpdate = useCallback((currentPage: number, totalPages: number) => {
    setPdfProgress(prev => ({
      ...prev,
      [currentIndex]: { current: currentPage, total: totalPages }
    }));
  }, [currentIndex]);

  useEffect(() => {
    onProgressUpdate?.(progress);
    
    // Check completion: all slides visited AND all PDFs fully viewed
    const allVisited = visitedSlides.size === totalSlides;
    const allPdfsComplete = slides.every((slide, index) => {
      if (slide.type !== 'pdf') return true;
      const pdfState = pdfProgress[index];
      return pdfState && pdfState.current === pdfState.total;
    });
    
    if (allVisited && allPdfsComplete && totalSlides > 0) {
      onComplete?.();
    }
  }, [progress, visitedSlides.size, totalSlides, pdfProgress, slides, onProgressUpdate, onComplete]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || totalSlides <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, interval, totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'f') {
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      setDirection('next');
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setVisitedSlides(prev => new Set([...prev, nextIndex]));
    }
  }, [currentIndex, totalSlides]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 'next' : 'prev');
    setCurrentIndex(index);
    setVisitedSlides(prev => new Set([...prev, index]));
  };

  const reset = () => {
    setCurrentIndex(0);
    setVisitedSlides(new Set([0]));
    setIsPlaying(false);
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-xl border-2 border-dashed border-border">
        <p className="text-muted-foreground">Aucune slide à afficher</p>
      </div>
    );
  }

  const variants = getTransitionVariants(transition);
  const currentSlide = slides[currentIndex];
  const isPdfSlide = currentSlide.type === 'pdf';
  const currentPdfState = isPdfSlide ? pdfProgress[currentIndex] : undefined;
  const currentPdfPage = currentPdfState?.current ?? 1;
  const totalPdfPages = currentPdfState?.total;

  const setPdfPageForCurrentSlide = useCallback((page: number) => {
    setPdfProgress((prev) => {
      const existing = prev[currentIndex];
      return {
        ...prev,
        [currentIndex]: {
          current: page,
          total: existing?.total ?? page,
        },
      };
    });
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (isPdfSlide && currentPdfState && currentPdfState.current > 1) {
      setPdfPageForCurrentSlide(currentPdfState.current - 1);
      return;
    }
    goToPrev();
  }, [isPdfSlide, currentPdfState, setPdfPageForCurrentSlide, goToPrev]);

  const handleNext = useCallback(() => {
    if (isPdfSlide && currentPdfState && currentPdfState.current < currentPdfState.total) {
      setPdfPageForCurrentSlide(currentPdfState.current + 1);
      return;
    }
    goToNext();
  }, [isPdfSlide, currentPdfState, setPdfPageForCurrentSlide, goToNext]);

  const prevDisabled = isPdfSlide
    ? currentIndex === 0 && (!currentPdfState || currentPdfState.current <= 1)
    : currentIndex === 0;

  const nextDisabled = isPdfSlide
    ? currentIndex === totalSlides - 1 && (!currentPdfState || currentPdfState.current >= currentPdfState.total)
    : currentIndex === totalSlides - 1;

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-background" 
    : "relative rounded-2xl overflow-hidden border border-border/50 shadow-xl";

  return (
    <div className={containerClasses}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Main slide area */}
      <div className={`relative ${isFullscreen ? 'h-screen' : 'aspect-video'} bg-gradient-to-br from-background to-muted/30 overflow-hidden`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={direction === 'next' ? variants.initial : { ...variants.initial, x: variants.initial.x ? -variants.initial.x : undefined }}
            animate={variants.animate}
            exit={direction === 'next' ? variants.exit : { ...variants.exit, x: variants.exit.x ? -variants.exit.x : undefined }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="absolute inset-0"
          >
            <SlideRenderer
              slide={currentSlide}
              isFullscreen={isFullscreen}
              onPdfProgressUpdate={isPdfSlide ? handlePdfProgressUpdate : undefined}
              pdfPageNumber={isPdfSlide ? currentPdfPage : undefined}
              onPdfPageNumberChange={isPdfSlide ? setPdfPageForCurrentSlide : undefined}
              hidePdfNavigation={isPdfSlide}
            />
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators (dots) */}
        {!isPdfSlide && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 h-2 bg-primary'
                    : visitedSlides.has(index)
                      ? 'w-2 h-2 bg-primary/50 hover:bg-primary/70'
                      : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Aller à la slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Navigation overlay */}
        {!isPdfSlide && (
          <div className="absolute inset-0 flex">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="w-1/4 h-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-4 disabled:cursor-not-allowed group"
            >
              <div className="p-3 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="h-6 w-6 text-foreground" />
              </div>
            </button>
            <div className="flex-1" />
            <button
              onClick={goToNext}
              disabled={currentIndex === totalSlides - 1}
              className="w-1/4 h-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-4 disabled:cursor-not-allowed group"
            >
              <div className="p-3 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-6 w-6 text-foreground" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background/95 via-background/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Slide/Page counter */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
              {isPdfSlide ? (
                <>Page {currentPdfPage} / {totalPdfPages || '?'}</>
              ) : (
                <>{currentIndex + 1} / {totalSlides}</>
              )}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {Math.round(progress)}% complété
            </span>
          </div>

          {/* Center: Play/Pause controls */}
          <div className="flex items-center gap-2">
            {totalSlides > 1 && !isPdfSlide && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-10 w-10"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={reset}
                  className="h-10 w-10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Right: Navigation buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={prevDisabled}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              disabled={nextDisabled}
              className="gap-1"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-9 w-9"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Keyboard hints (fullscreen only) */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-20 text-xs text-muted-foreground bg-background/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <span className="opacity-60">← → pour naviguer · Esc pour quitter</span>
        </div>
      )}
    </div>
  );
};
