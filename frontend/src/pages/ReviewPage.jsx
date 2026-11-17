import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import EvaluationCard from '../components/EvaluationCard';
import ScoreSummary from '../components/ScoreSummary';
import { useEvaluation } from '../hooks/useEvaluation';
import {
  ArrowLeft,
  BookOpen,
  FileQuestion,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Columns,
  ListFilter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

// ─── Left panel: all page images stacked vertically, auto-scrolls ───────────
function ScrollablePageStrip({ images, activePageRef, currentPage }) {
  const [scale, setScale] = useState(1);

  const formatUrl = (url) => {
    if (!url) return '';
    let clean = String(url).replace(/\\/g, '/');
    if (!clean.startsWith('http') && !clean.startsWith('/')) clean = '/' + clean;
    return clean;
  };

  if (!images || images.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-8">
        <FileQuestion className="w-16 h-16 stroke-1 mb-3 text-teal-400 animate-pulse" />
        <p className="text-sm font-bold text-slate-200">Loading student answer sheet...</p>
        <p className="text-xs text-slate-500 mt-1">High-resolution scans are synchronizing</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800 select-none">
      {/* Toolbar */}
      <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
          <span>Answer Sheet</span>
          <span className="text-slate-500">•</span>
          <span className="text-teal-400">{images.length} {images.length !== 1 ? 'pages' : 'page'}</span>
        </span>

        {/* Page indicator pill */}
        <span className="text-xs font-mono font-bold px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg">
          Page {currentPage} of {images.length}
        </span>

        {/* Zoom controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 min-w-[42px] text-center font-bold">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vertically scrollable page strip */}
      <div className="flex-1 overflow-y-auto overflow-x-auto bg-slate-950 p-4 space-y-8">
        {images.map((imgUrl, idx) => {
          const pageNum = idx + 1;
          const isActive = currentPage === pageNum;
          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (activePageRef && activePageRef.current) {
                  activePageRef.current[pageNum] = el;
                }
              }}
              className={`relative transition-all duration-300 ${isActive
                  ? 'ring-2 ring-teal-400 ring-offset-4 ring-offset-slate-950 rounded-lg shadow-2xl shadow-teal-500/20'
                  : 'opacity-75 hover:opacity-100'
                }`}
              style={{ transformOrigin: 'top center', transform: `scale(${scale})` }}
            >
              {/* Page label */}
              <div
                className={`absolute -top-6 left-0 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md ${isActive
                    ? 'bg-teal-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                  }`}
              >
                Page {pageNum}
              </div>

              <img
                src={formatUrl(imgUrl)}
                alt={`Page ${pageNum}`}
                className="w-full h-auto rounded-lg border border-slate-800 shadow-2xl bg-white block"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          );
        })}
        {/* Bottom spacer so last page can scroll to top */}
        <div className="h-[50vh]" />
      </div>
    </div>
  );
}

// ─── Main ReviewPage ─────────────────────────────────────────────────────────
export default function ReviewPage() {
  const { examId, submissionId } = useParams();
  const {
    submission,
    evaluations,
    isLoading,
    isSaving,
    scoreSummary,
    overrideMarks,
    resetToAiMarks,
    reEvaluate,
    finalize,
    updateHeader,
  } = useEvaluation(submissionId);

  // Active page & view mode tab
  const [currentPage, setCurrentPage] = useState(1);
  const [reEvaluatingId, setReEvaluatingId] = useState(null);
  const [viewTab, setViewTab] = useState('split'); // 'split' | 'sheet' | 'rubrics'

  const pageElemRefs = useRef({});
  const cardRefs = useRef({});
  const rightScrollRef = useRef(null);
  const observerRef = useRef(null);
  const isUserScrollingLeft = useRef(false);

  // When right side scrolls: sync left strip
  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isUserScrollingLeft.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length === 0) return;

        const evalId = visible[0].target.dataset.evalId;
        const ev = evaluations.find((e) => String(e.id) === evalId);
        if (!ev || !ev.page_numbers || ev.page_numbers.length === 0) return;

        const targetPage = ev.page_numbers[0];
        if (targetPage === currentPage) return;

        setCurrentPage(targetPage);

        const pageEl = pageElemRefs.current[targetPage];
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      {
        root: rightScrollRef.current,
        rootMargin: '-5% 0px -55% 0px',
        threshold: 0,
      }
    );

    Object.values(cardRefs.current).forEach((el) => {
      if (el) observerRef.current.observe(el);
    });
  }, [evaluations, currentPage]);

  useEffect(() => {
    if (evaluations.length > 0) {
      const t = setTimeout(setupObserver, 150);
      return () => clearTimeout(t);
    }
  }, [evaluations, setupObserver]);

  useEffect(() => {
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, []);

  const handleJumpToPage = (pageNum) => {
    if (!pageNum || pageNum <= 0) return;
    setCurrentPage(pageNum);
    const pageEl = pageElemRefs.current[pageNum];
    if (pageEl) {
      isUserScrollingLeft.current = true;
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { isUserScrollingLeft.current = false; }, 900);
    }
    if (window.innerWidth < 768) setViewTab('sheet');
  };

  const handleJumpToQuestion = (ev) => {
    // Scroll right card into view
    const cardEl = cardRefs.current[ev.id];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Also scroll corresponding page
    if (ev.page_numbers && ev.page_numbers.length > 0) {
      handleJumpToPage(ev.page_numbers[0]);
    }
  };

  const handleReEvaluate = async (evalId) => {
    setReEvaluatingId(evalId);
    await reEvaluate(evalId);
    setReEvaluatingId(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-400 mt-4 font-medium">
            Loading student answer sheets and question evaluations...
          </p>
        </div>
      </Layout>
    );
  }

  const pageImageUrls = submission?.page_image_urls || [];

  return (
    <Layout>
      {/* ── Sub-Header Bar: Breadcrumb + View Mode Tabs + Question Navigator ── */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <Link
          to={`/exams/${examId}`}
          className="inline-flex items-center text-slate-400 hover:text-teal-400 transition-colors font-medium group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to Exam Workspace
        </Link>

        {/* ── View Mode Switcher Tabs ── */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewTab('split')}
            className={`hidden md:inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewTab === 'split'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Workspace</span>
          </button>
          <button
            onClick={() => setViewTab('sheet')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewTab === 'sheet'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Answer Sheet ({pageImageUrls.length} pgs)</span>
          </button>
          <button
            onClick={() => setViewTab('rubrics')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewTab === 'rubrics'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Evaluations ({evaluations.length})</span>
          </button>
        </div>
      </div>

      {/* ── Horizontal Question Fast-Navigation Strip ── */}
      {evaluations.length > 0 && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center space-x-2 overflow-x-auto select-none">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 mr-1">
            Jump to Q:
          </span>
          {evaluations.map((ev) => {
            const marksAwarded = ev.final_marks ?? ev.ai_marks ?? 0;
            const isFull = marksAwarded >= (ev.max_marks || 1);
            const isZero = marksAwarded === 0;

            return (
              <button
                key={ev.id}
                onClick={() => handleJumpToQuestion(ev)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex-shrink-0 border transition-all ${ev.is_flagged
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : ev.is_overridden
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
                      : isFull
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : isZero
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
              >
                <span>Q{ev.question_no}</span>
                <span className="text-[10px] opacity-75">({marksAwarded}/{ev.max_marks})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Dual Screen ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-8.5rem)]">
        {/* ── LEFT: Vertically scrollable page strip ── */}
        <div
          className={`h-full flex flex-col ${viewTab === 'sheet'
              ? 'w-full flex'
              : viewTab === 'rubrics'
                ? 'hidden'
                : 'w-full md:w-1/2 flex'
            }`}
        >
          <ScrollablePageStrip
            images={pageImageUrls}
            currentPage={currentPage}
            activePageRef={pageElemRefs}
          />
        </div>

        {/* ── RIGHT: Evaluation cards & Score Summary ── */}
        <div
          className={`h-full flex flex-col bg-slate-900 overflow-hidden ${viewTab === 'rubrics'
              ? 'w-full flex'
              : viewTab === 'sheet'
                ? 'hidden'
                : 'w-full md:w-1/2 flex'
            }`}
        >
          <ScoreSummary
            submission={submission}
            scoreSummary={scoreSummary}
            onFinalize={finalize}
            onUpdateHeader={updateHeader}
            isSaving={isSaving}
          />

          {/* Scrollable cards list */}
          <div ref={rightScrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
            {evaluations.length === 0 ? (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-12 text-center text-slate-400 shadow-xl">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <h4 className="text-base font-bold text-white">No Evaluations Generated Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Run the grading pipeline on the exam workspace to populate question evaluations.
                </p>
              </div>
            ) : (
              evaluations.map((ev) => (
                <div
                  key={ev.id}
                  ref={(el) => { cardRefs.current[ev.id] = el; }}
                  data-eval-id={String(ev.id)}
                >
                  <EvaluationCard
                    evaluation={ev}
                    onOverride={overrideMarks}
                    onReset={resetToAiMarks}
                    onReEvaluate={handleReEvaluate}
                    onJumpToPage={handleJumpToPage}
                    isReEvaluating={reEvaluatingId === ev.id}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
