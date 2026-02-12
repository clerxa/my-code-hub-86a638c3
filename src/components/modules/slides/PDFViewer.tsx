import { useEffect, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  RotateCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfUrl: string;
  isFullscreen?: boolean;
  onProgressUpdate?: (currentPage: number, totalPages: number) => void;

  /** Controlled page number (optional). When provided, the viewer becomes controlled. */
  pageNumber?: number;
  onPageNumberChange?: (page: number) => void;

  /** Hide page navigation controls (prev/next + bottom pagination) to avoid UI duplication. */
  hideNavigation?: boolean;
}

export const PDFViewer = ({
  pdfUrl,
  isFullscreen,
  onProgressUpdate,
  pageNumber: controlledPageNumber,
  onPageNumberChange,
  hideNavigation = false,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [internalPageNumber, setInternalPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = controlledPageNumber ?? internalPageNumber;

  const setPage = useCallback(
    (page: number) => {
      const safePage = Math.max(1, Math.min(page, numPages || page));

      if (controlledPageNumber !== undefined) {
        onPageNumberChange?.(safePage);
      } else {
        setInternalPageNumber(safePage);
      }

      if (numPages) onProgressUpdate?.(safePage, numPages);
    },
    [controlledPageNumber, numPages, onPageNumberChange, onProgressUpdate]
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      setError(null);

      // Reset to page 1 on load for consistency
      if (controlledPageNumber === undefined) {
        setInternalPageNumber(1);
      } else {
        onPageNumberChange?.(1);
      }

      onProgressUpdate?.(1, numPages);
    },
    [controlledPageNumber, onPageNumberChange, onProgressUpdate]
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setLoading(false);
    setError("Impossible de charger le PDF. Vérifiez l'URL.");
  }, []);

  // If controlled mode: keep parent progress in sync when the parent changes the page
  useEffect(() => {
    if (controlledPageNumber !== undefined && numPages) {
      onProgressUpdate?.(controlledPageNumber, numPages);
    }
  }, [controlledPageNumber, numPages, onProgressUpdate]);

  const goToPrevPage = () => setPage(currentPage - 1);
  const goToNextPage = () => setPage(currentPage + 1);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);

  if (!pdfUrl) {
    return (
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Aucun PDF configuré</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center justify-center gap-3 py-16">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const containerHeight = isFullscreen ? "h-[calc(100vh-200px)]" : "h-[500px]";

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-t-lg border border-b-0 border-border/50">
        <div className="flex items-center gap-2">
          {!hideNavigation && (
            <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Badge variant="secondary" className="px-3">
            Page {currentPage} / {numPages || "?"}
          </Badge>
          {!hideNavigation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= (numPages || 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="px-2 font-mono text-xs">
            {Math.round(scale * 100)}%
          </Badge>
          <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Display */}
      <div
        className={`relative ${containerHeight} overflow-auto bg-muted/20 rounded-b-lg border border-t-0 border-border/50`}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement du PDF...</p>
            </div>
          </div>
        )}

        <div className="flex justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="space-y-4">
                <Skeleton className="h-[600px] w-[450px] rounded-lg" />
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              rotate={rotation}
              className="shadow-xl rounded-lg overflow-hidden"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>

      {/* Page navigation (bottom) */}
      {!hideNavigation && numPages && numPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(numPages, 10) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "ghost"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setPage(page)}
              >
                {page}
              </Button>
            ))}
            {numPages > 10 && <span className="text-muted-foreground self-center">...</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="gap-1"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
