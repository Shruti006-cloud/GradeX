import React, { useState, useEffect, useRef } from 'react';
import { useJob } from '../hooks/useJob';
import { CheckCircle2, AlertCircle, Loader2, Clock, Sparkles } from 'lucide-react';

export default function JobProgress({ jobId, onComplete, title = 'Processing Document' }) {
  const { status, progress, currentStep, errorMessage } = useJob(jobId, onComplete);

  const [completedSteps, setCompletedSteps] = useState([]);
  const prevStep = useRef('');

  useEffect(() => {
    setCompletedSteps([]);
    prevStep.current = '';
  }, [jobId]);

  useEffect(() => {
    if (currentStep && currentStep !== prevStep.current && prevStep.current) {
      setCompletedSteps((prev) => {
        if (prev.includes(prevStep.current)) return prev;
        return [...prev, prevStep.current];
      });
    }
    prevStep.current = currentStep;
  }, [currentStep]);

  if (!jobId) return null;

  const isDone = status === 'done';
  const isFailed = status === 'failed';
  const isActive = !isDone && !isFailed;

  return (
    <div className="relative bg-slate-950 rounded-2xl border border-teal-500/30 shadow-2xl my-4 overflow-hidden">
      {/* Scanning laser beam animation */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden bg-slate-900">
          <div className="animate-scanline h-full w-1/3 bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
        </div>
      )}
      {isDone && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400" />
      )}
      {isFailed && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
      )}

      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : isFailed ? (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-teal-400 animate-spin flex-shrink-0" />
            )}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block">
                GradeX AI Engine Pipeline
              </span>
              <span className="text-sm font-bold text-white">{title}</span>
            </div>
          </div>
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
              isDone
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : isFailed
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
            }`}
          >
            {isDone ? '✓ Completed' : isFailed ? 'Failed' : `${progress}%`}
          </span>
        </div>

        {/* Step Log */}
        <div className="space-y-1.5 mb-4">
          {completedSteps.map((step, i) => (
            <div
              key={i}
              className="flex items-center space-x-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-3.5 py-2 animate-fadeIn"
            >
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
              <span className="font-medium">{step}</span>
            </div>
          ))}

          {isActive && currentStep && (
            <div className="flex items-center space-x-2 text-xs text-teal-200 bg-teal-950/50 border border-teal-500/30 rounded-xl px-3.5 py-2 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 flex-shrink-0 text-teal-400 animate-spin" />
              <span className="font-bold">{currentStep}</span>
            </div>
          )}

          {isActive && !currentStep && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
              <span>Initializing vision pipeline...</span>
            </div>
          )}

          {isDone && (
            <div className="flex items-center space-x-2 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-3.5 py-2">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
              <span className="font-bold">Evaluation completed successfully</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              isFailed
                ? 'bg-rose-500'
                : isDone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400'
            }`}
            style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          />
        </div>

        {isFailed && (
          <div className="mt-3 p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {errorMessage || 'Failed to complete job. Please verify your connection or Gemini API key.'}
          </div>
        )}
      </div>
    </div>
  );
}
