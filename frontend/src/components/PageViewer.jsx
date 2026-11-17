import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileQuestion,
} from 'lucide-react';

export default function PageViewer({
  images = [],
  currentPage = 1,
  onPageChange,
  highlightedPage = null,
}) {
  const [scale, setScale] = useState(1);
  const [imgError, setImgError] = useState(false);
  const totalPages = images.length;

  useEffect(() => {
    // Reset zoom level and error state when page changes
    setScale(1);
    setImgError(false);
  }, [currentPage]);

  const formatUrl = (url) => {
    if (!url) return '';
    let clean = String(url).replace(/\\/g, '/');
    if (!clean.startsWith('http') && !clean.startsWith('/')) {
      clean = '/' + clean;
    }
    return clean;
  };

  const handleZoomIn = () => setScale((s) => Math.min(3.0, s + 0.25));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const handleResetZoom = () => setScale(1);

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  if (!images || images.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 text-slate-400">
        <FileQuestion className="w-16 h-16 stroke-1 mb-2 text-indigo-400 animate-pulse" />
        <p className="text-sm font-semibold text-slate-200">Loading student answer sheet...</p>
        <p className="text-xs text-slate-400 mt-1">Images are rendering or synchronizing</p>
      </div>
    );
  }

  const currentImageUrl = formatUrl(images[currentPage - 1]);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-700 select-none">
      {/* Top Controls Toolbar */}
      <div className="h-12 bg-slate-800/90 border-b border-slate-700/80 px-4 flex items-center justify-between text-slate-200">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-200 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-900/60 rounded border border-slate-700 text-slate-200">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-200 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Pan and Zoom */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/90 relative">
        {imgError ? (
          <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-sm">
            <p className="text-sm font-semibold text-rose-400 mb-1">Failed to display page image</p>
            <p className="text-xs text-slate-400 mb-3 break-all">{currentImageUrl}</p>
            <button
              onClick={() => setImgError(false)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium"
            >
              Retry Loading Image
            </button>
          </div>
        ) : (
          <div
            className="transition-transform duration-200 ease-out origin-center shadow-2xl"
            style={{ transform: `scale(${scale})` }}
          >
            <img
              key={currentImageUrl}
              src={currentImageUrl}
              alt={`Student Sheet Page ${currentPage}`}
              onError={() => setImgError(true)}
              className="max-w-none max-h-[85vh] w-auto h-auto rounded-sm border border-slate-700 shadow-xl bg-white"
            />
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {totalPages > 1 && (
        <div className="h-20 bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center space-x-3 overflow-x-auto">
          {images.map((imgUrl, idx) => {
            const pageNum = idx + 1;
            const isSelected = currentPage === pageNum;
            const isHighlighted = highlightedPage === pageNum;
            const thumbUrl = formatUrl(imgUrl);

            return (
              <button
                key={idx}
                onClick={() => onPageChange(pageNum)}
                className={`relative flex-shrink-0 h-16 w-12 rounded border-2 overflow-hidden transition-all duration-150 ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                    : isHighlighted
                    ? 'border-amber-400 ring-2 ring-amber-400/50'
                    : 'border-slate-700 hover:border-slate-500 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${pageNum}`}
                  className="w-full h-full object-cover object-top bg-white"
                />
                <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[10px] text-white font-bold py-0.5 text-center">
                  {pageNum}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
