import React from 'react';
import { CheckCircle, Sparkles, Plus, Trash2, KeyRound } from 'lucide-react';

export default function AnswerKeyEditor({
  answerKeys = [],
  onUpdateKey,
  onConfirmAll,
}) {
  const handleFieldChange = (ak, field, value) => {
    onUpdateKey(ak.id, { ...ak, [field]: value });
  };

  const handleKeyPointsChange = (ak, text) => {
    const points = text.split('\n').filter((p) => p.trim().length > 0);
    onUpdateKey(ak.id, { ...ak, key_points: points });
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Master Solutions Scheme</span>
          </div>
          <h3 className="text-base font-bold text-white">Answer Keys & Grading Rubrics</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Model solutions and mandatory marking points utilized by GradeX during student evaluation.
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirmAll}
          className="inline-flex items-center text-xs px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-md shadow-teal-500/20 transition-all active:scale-95"
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
          Confirm Master Keys
        </button>
      </div>

      <div className="divide-y divide-slate-800/80">
        {answerKeys.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic text-xs">
            <KeyRound className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            No answer keys generated yet. Upload an official key or click "Generate AI Model Answers" above.
          </div>
        ) : (
          answerKeys.map((ak, idx) => (
            <div key={ak.id || idx} className="p-5 hover:bg-slate-900/40 transition-colors space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono font-bold text-xs bg-slate-900 px-3 py-1 rounded-lg text-teal-300 border border-teal-500/30">
                    Question {ak.question_no || `#${idx + 1}`}
                  </span>

                  {ak.is_ai_generated && (
                    <span className="inline-flex items-center text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 mr-1 text-cyan-400" />
                      AI Synthesized Solution
                    </span>
                  )}

                  {ak.teacher_confirmed ? (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      Confirmed
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      Review Needed
                    </span>
                  )}
                </div>
              </div>

              {/* Model Answer Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ideal Model Answer:
                </label>
                <textarea
                  rows={2}
                  value={ak.model_answer || ''}
                  onChange={(e) => handleFieldChange(ak, 'model_answer', e.target.value)}
                  placeholder="Enter ideal solution or model answer text..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-teal-400 leading-relaxed font-sans placeholder-slate-600"
                />
              </div>

              {/* Key Points & Marking Scheme side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mandatory Key Points (one per line):
                  </label>
                  <textarea
                    rows={2}
                    value={(ak.key_points || []).join('\n')}
                    onChange={(e) => handleKeyPointsChange(ak, e.target.value)}
                    placeholder="Formula stated&#10;Correct intermediate value&#10;Final answer with units"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-teal-400 font-mono text-[11px] placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Grading Scheme / Mark Split:
                  </label>
                  <textarea
                    rows={2}
                    value={ak.marking_scheme || ''}
                    onChange={(e) => handleFieldChange(ak, 'marking_scheme', e.target.value)}
                    placeholder="e.g. 1 mark for method, 1 mark for correct numerical answer"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-teal-400 placeholder-slate-600"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
