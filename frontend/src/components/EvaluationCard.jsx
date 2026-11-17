import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function EvaluationCard({
  evaluation,
  onOverride,
  onReset,
  onReEvaluate,
  onJumpToPage,
  isReEvaluating = false,
}) {
  const [marks, setMarks] = useState(evaluation.final_marks ?? evaluation.ai_marks ?? 0);
  const [comment, setComment] = useState(evaluation.teacher_comment || '');
  const [isEditingComment, setIsEditingComment] = useState(false);

  useEffect(() => {
    setMarks(evaluation.final_marks ?? evaluation.ai_marks ?? 0);
    setComment(evaluation.teacher_comment || '');
  }, [evaluation]);

  const maxMarks = evaluation.max_marks || 1.0;
  const isOverridden = evaluation.is_overridden || false;
  const isFlagged = evaluation.is_flagged || false;
  const confidence = evaluation.confidence ?? 0.9;
  const pageNumbers = evaluation.page_numbers || [];

  const handleStepMarks = (delta) => {
    const nextVal = Math.max(0, Math.min(maxMarks, Math.round((marks + delta) * 10) / 10));
    setMarks(nextVal);
    onOverride(evaluation.id, nextVal, comment);
  };

  const handleDirectInput = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(maxMarks, val));
      setMarks(clamped);
      onOverride(evaluation.id, clamped, comment);
    }
  };

  const handleSaveComment = () => {
    onOverride(evaluation.id, marks, comment);
    setIsEditingComment(false);
  };

  return (
    <div
      id={`eval-card-${evaluation.id}`}
      className={`rounded-2xl border transition-all duration-200 bg-slate-950 shadow-xl overflow-hidden mb-5 ${isFlagged
          ? 'border-amber-500/60 ring-1 ring-amber-500/30'
          : isOverridden
            ? 'border-teal-500/60 ring-1 ring-teal-500/30'
            : 'border-slate-800'
        }`}
    >
      {/* Card Header */}
      <div className="bg-slate-900/80 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="font-mono font-bold text-xs text-slate-950 bg-teal-400 px-2.5 py-0.5 rounded-md shadow-xs">
            Q{evaluation.question_no || '?'}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            [Max: {maxMarks} {maxMarks === 1 ? 'mark' : 'marks'}]
          </span>

          {/* Page badge(s) that jump viewer */}
          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => onJumpToPage(p)}
              className="inline-flex items-center text-[10px] font-bold text-teal-300 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              title={`Jump to Page ${p}`}
            >
              <ExternalLink className="w-2.5 h-2.5 mr-1 text-teal-400" />
              Page {p}
            </button>
          ))}
        </div>

        {/* Confidence & Flag Badges */}
        <div className="flex items-center space-x-2">
          {isFlagged && (
            <span
              className="inline-flex items-center text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full"
              title={evaluation.flag_reason || 'Attention needed'}
            >
              <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
              {evaluation.flag_reason || 'Flagged for Review'}
            </span>
          )}

          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${confidence >= 0.8
                ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                : confidence >= 0.6
                  ? 'text-teal-300 bg-teal-500/15 border-teal-500/30'
                  : 'text-rose-300 bg-rose-500/15 border-rose-500/30'
              }`}
          >
            {Math.round(confidence * 100)}% Conf.
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Question Text */}
        {evaluation.question_text && (
          <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="font-bold text-teal-400 uppercase tracking-wider text-[10px] block mb-0.5">
              Question Statement:
            </span>
            {evaluation.question_text}
          </div>
        )}

        {/* Student Transcribed Answer */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
            <span>Student's Handwritten Text (OCR Extracted):</span>
          </div>
          <div className="text-xs bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-slate-200 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
            {evaluation.transcribed_answer || (
              <span className="text-slate-500 italic">No answer detected on scanned sheet</span>
            )}
          </div>
        </div>

        {/* Model Answer & Key Points */}
        {(evaluation.model_answer || (evaluation.key_points && evaluation.key_points.length > 0)) && (
          <div className="text-xs bg-teal-950/30 border border-teal-500/20 rounded-xl p-3 text-slate-300">
            {evaluation.model_answer && (
              <div className="mb-2">
                <span className="font-bold text-teal-300 uppercase tracking-wider text-[10px] block mb-0.5">
                  Model Solution:
                </span>
                <span className="text-slate-200">{evaluation.model_answer}</span>
              </div>
            )}
            {evaluation.key_points && evaluation.key_points.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="font-bold text-teal-400 text-[10px] mr-1">Mandatory Points:</span>
                {evaluation.key_points.map((kp, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-900 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded text-[10px]"
                  >
                    {kp}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Key Points Matched vs Missed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Matched */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center font-bold text-emerald-300 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Points Awarded ({evaluation.key_points_matched?.length || 0})
            </div>
            {evaluation.key_points_matched && evaluation.key_points_matched.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {evaluation.key_points_matched.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No points matched</p>
            )}
          </div>

          {/* Missed */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3">
            <div className="flex items-center font-bold text-rose-300 mb-1.5">
              <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
              Points Missed ({evaluation.key_points_missed?.length || 0})
            </div>
            {evaluation.key_points_missed && evaluation.key_points_missed.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {evaluation.key_points_missed.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500 italic">None missed (Full Score)</p>
            )}
          </div>
        </div>

        {/* AI Feedback */}
        {evaluation.feedback && (
          <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="font-bold text-teal-400 flex items-center mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 mr-1.5" />
              GradeX AI Feedback:
            </span>
            <p className="text-slate-300 leading-relaxed">{evaluation.feedback}</p>
          </div>
        )}

        {/* Teacher Override & Control Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Marks Control */}
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold text-slate-300">Marks:</span>

            <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden bg-slate-900">
              <button
                type="button"
                onClick={() => handleStepMarks(-0.5)}
                disabled={marks <= 0}
                className="px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 font-bold text-sm transition-colors"
                title="Decrease 0.5"
              >
                -
              </button>

              <input
                type="number"
                step="0.5"
                min="0"
                max={maxMarks}
                value={marks}
                onChange={handleDirectInput}
                className="w-16 text-center font-extrabold text-sm text-teal-300 bg-slate-950 border-x border-slate-700 py-1.5 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleStepMarks(0.5)}
                disabled={marks >= maxMarks}
                className="px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 font-bold text-sm transition-colors"
                title="Increase 0.5"
              >
                +
              </button>
            </div>

            <span className="text-xs text-slate-400 font-semibold">/ {maxMarks}</span>

            {/* AI Marks Reference Badge */}
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              AI: {evaluation.ai_marks}
            </span>

            {isOverridden && (
              <button
                type="button"
                onClick={() => onReset(evaluation.id)}
                className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center transition-colors ml-1"
                title="Reset to AI marks"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsEditingComment(!isEditingComment)}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center font-bold transition-colors ${comment
                  ? 'border-teal-500/40 text-teal-300 bg-teal-500/15 hover:bg-teal-500/25'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              title="Add Teacher Comment"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {comment ? 'Edit Comment' : 'Add Note'}
            </button>

            <button
              type="button"
              onClick={() => onReEvaluate(evaluation.id)}
              disabled={isReEvaluating}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center font-bold disabled:opacity-50 transition-colors"
              title="Re-run Gemini evaluation for this single question"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isReEvaluating ? 'animate-spin text-teal-400' : ''}`} />
              Re-grade
            </button>
          </div>
        </div>

        {/* Comment Box Dropdown */}
        {isEditingComment && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add teacher note or rationale for mark override..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-teal-400"
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={() => setIsEditingComment(false)}
                className="text-xs px-3 py-1 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveComment}
                className="text-xs px-3.5 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 rounded-lg font-bold shadow-sm"
              >
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
