import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Edit3, HelpCircle, FileText } from 'lucide-react';

export default function QuestionTable({
  questions = [],
  onUpdateQuestion,
  onAddQuestion,
  onDeleteQuestion,
  onConfirmAll,
  isConfirmed = false,
}) {
  const [editingId, setEditingId] = useState(null);

  const handleFieldChange = (q, field, value) => {
    onUpdateQuestion(q.id, { ...q, [field]: value });
  };

  const totalMarks = questions.reduce((acc, q) => acc + (parseFloat(q.max_marks) || 0), 0);

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Extracted Question Blueprint</span>
          </div>
          <h3 className="text-base font-bold text-white">Questions & Mark Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Review question text, categories, and max points before confirming the blueprint.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-900 text-teal-300 rounded-xl border border-teal-500/30">
            <span>{questions.length} Questions</span>
            <span className="mx-2 text-slate-600">|</span>
            <span>Total Marks: {Math.round(totalMarks * 10) / 10}</span>
          </div>

          <button
            type="button"
            onClick={onAddQuestion}
            className="inline-flex items-center text-xs px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white rounded-xl font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
            Add Question
          </button>

          <button
            type="button"
            onClick={onConfirmAll}
            className="inline-flex items-center text-xs px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-md shadow-teal-500/20 transition-all active:scale-95"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
            Confirm Questions
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-16 text-center">#</th>
              <th className="py-3.5 px-4">Question Text</th>
              <th className="py-3.5 px-4 w-32">Type</th>
              <th className="py-3.5 px-4 w-28 text-center">Max Marks</th>
              <th className="py-3.5 px-4 w-32">Status</th>
              <th className="py-3.5 px-4 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  No questions extracted yet. Upload a Question Paper PDF above to populate the blueprint.
                </td>
              </tr>
            ) : (
              questions.map((q, idx) => (
                <tr key={q.id || idx} className="hover:bg-slate-900/50 transition-colors">
                  {/* Question No */}
                  <td className="py-3.5 px-4 font-bold text-center">
                    <input
                      type="text"
                      value={q.question_no || ''}
                      onChange={(e) => handleFieldChange(q, 'question_no', e.target.value)}
                      className="w-12 px-1.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-bold text-center text-teal-300 focus:outline-none focus:border-teal-400 text-xs"
                    />
                  </td>

                  {/* Question Text */}
                  <td className="py-3.5 px-4">
                    <textarea
                      rows={2}
                      value={q.question_text || ''}
                      onChange={(e) => handleFieldChange(q, 'question_text', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-400 leading-relaxed font-sans placeholder-slate-600"
                    />
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4">
                    <select
                      value={q.question_type || 'short'}
                      onChange={(e) => handleFieldChange(q, 'question_type', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-400"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="short">Short Answer</option>
                      <option value="long">Long Essay</option>
                      <option value="numerical">Numerical / Math</option>
                    </select>
                  </td>

                  {/* Max Marks */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={q.max_marks || 1}
                      onChange={(e) =>
                        handleFieldChange(q, 'max_marks', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-center font-bold text-teal-300 focus:outline-none focus:border-teal-400"
                    />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {q.teacher_confirmed ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                        AI Draft
                      </span>
                    )}
                  </td>

                  {/* Delete */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
