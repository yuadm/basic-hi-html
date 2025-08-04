import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  FileText,
  Download,
  Maximize2
} from "lucide-react";
import { PDF_CONFIG, zoomUtils, pdfErrorHandler } from "@/lib/pdf-config";
import { toast } from "sonner";

interface EnhancedPDFViewerProps {
  pdfUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  onPageClick?: (event: React.MouseEvent) => void;
  overlayContent?: React.ReactNode;
  showToolbar?: boolean;
  className?: string;
  enableKeyboardNavigation?: boolean;
}

export function EnhancedPDFViewer({
  pdfUrl,
  currentPage,
  onPageChange,
  scale = PDF_CONFIG.defaultScale,
  onScaleChange,
  onPageClick,
  overlayContent,
  showToolbar = true,
  className = "",
  enableKeyboardNavigation = true
}: EnhancedPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailsVisible, setThumbnailsVisible] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;
    
    const { code, ctrlKey, metaKey } = event;
    const isModifier = ctrlKey || metaKey;
    
    // Prevent default for handled keys
    const handledKeys = Object.values(PDF_CONFIG.keyboardShortcuts).flat();
    if (handledKeys.includes(code as any)) {
      event.preventDefault();
    }

    if ((PDF_CONFIG.keyboardShortcuts.nextPage as readonly string[]).includes(code) && !isModifier) {
      if (currentPage < numPages) {
        onPageChange(currentPage + 1);
      }
    } else if ((PDF_CONFIG.keyboardShortcuts.prevPage as readonly string[]).includes(code) && !isModifier) {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    } else if ((PDF_CONFIG.keyboardShortcuts.firstPage as readonly string[]).includes(code)) {
      onPageChange(1);
    } else if ((PDF_CONFIG.keyboardShortcuts.lastPage as readonly string[]).includes(code)) {
      onPageChange(numPages);
    } else if ((PDF_CONFIG.keyboardShortcuts.zoomIn as readonly string[]).includes(code) && onScaleChange) {
      const newScale = zoomUtils.getNextZoomLevel(scale, 'in');
      onScaleChange(newScale);
    } else if ((PDF_CONFIG.keyboardShortcuts.zoomOut as readonly string[]).includes(code) && onScaleChange) {
      const newScale = zoomUtils.getNextZoomLevel(scale, 'out');
      onScaleChange(newScale);
    } else if ((PDF_CONFIG.keyboardShortcuts.resetZoom as readonly string[]).includes(code) && onScaleChange) {
      onScaleChange(PDF_CONFIG.defaultScale);
    }
  }, [currentPage, numPages, onPageChange, scale, onScaleChange, enableKeyboardNavigation]);

  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enableKeyboardNavigation]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const handleDocumentLoadError = (error: any) => {
    const errorMessage = pdfErrorHandler.getErrorMessage(error);
    setError(errorMessage);
    setIsLoading(false);
    toast.error(errorMessage);
  };

  const handleZoomChange = (newScale: number) => {
    const clampedScale = zoomUtils.clampScale(newScale);
    onScaleChange?.(clampedScale);
  };

  const goToPage = (page: number) => {
    const clampedPage = Math.max(1, Math.min(numPages, page));
    onPageChange(clampedPage);
  };

  if (error) {
    return (
      <Card className={`flex items-center justify-center h-96 ${className}`}>
        <CardContent className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center gap-4 p-4 border-b bg-background">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage <= 1}
              title="First page (Home)"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Previous page (← or PageUp)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-0">
              <Label className="text-sm whitespace-nowrap">Page</Label>
              <Select
                value={currentPage.toString()}
                onValueChange={(value) => goToPage(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: numPages }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                of {numPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              title="Next page (→ or PageDown)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(numPages)}
              disabled={currentPage >= numPages}
              title="Last page (End)"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Zoom Controls */}
          {onScaleChange && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoomChange(zoomUtils.getNextZoomLevel(scale, 'out'))}
                disabled={scale <= PDF_CONFIG.minScale}
                title="Zoom out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Select
                value={scale.toString()}
                onValueChange={(value) => handleZoomChange(parseFloat(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PDF_CONFIG.scaleSteps.map((scaleStep) => (
                    <SelectItem key={scaleStep} value={scaleStep.toString()}>
                      {zoomUtils.formatScalePercent(scaleStep)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoomChange(zoomUtils.getNextZoomLevel(scale, 'in'))}
                disabled={scale >= PDF_CONFIG.maxScale}
                title="Zoom in (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoomChange(PDF_CONFIG.defaultScale)}
                title="Reset zoom (0)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="h-6 w-px bg-border" />

          {/* Additional Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setThumbnailsVisible(!thumbnailsVisible)}
              title="Toggle thumbnails"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pdfUrl, '_blank')}
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        {thumbnailsVisible && numPages > 1 && (
          <div className="w-48 border-r bg-muted/10 overflow-y-auto p-2">
            <div className="space-y-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  className={`cursor-pointer p-1 rounded border-2 transition-colors ${
                    pageNum === currentPage 
                      ? 'border-primary bg-primary/10' 
                      : 'border-transparent hover:border-muted-foreground/20'
                  }`}
                  onClick={() => goToPage(pageNum)}
                >
                  <Document file={pdfUrl}>
                    <Page
                      pageNumber={pageNum}
                      width={150}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  <p className="text-xs text-center mt-1">Page {pageNum}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main PDF Viewer */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-muted/10 p-4"
        >
          {isLoading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}

          <div 
            ref={pageRef}
            className="relative inline-block"
            onClick={onPageClick}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading=""
              className="inline-block"
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={PDF_CONFIG.defaultOptions.renderTextLayer}
                renderAnnotationLayer={PDF_CONFIG.defaultOptions.renderAnnotationLayer}
                className="shadow-lg"
              />
            </Document>
            
            {/* Custom overlay content */}
            {overlayContent}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {enableKeyboardNavigation && (
        <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
          <span className="font-medium">Keyboard shortcuts:</span> 
          {' '}Arrow keys (page navigation), +/- (zoom), Home/End (first/last page), 0 (reset zoom)
        </div>
      )}
    </div>
  );
}