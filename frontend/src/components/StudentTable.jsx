import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, CheckCircle, Clock, Trash2, ArrowRight, UserCheck, Eye, Award } from 'lucide-react';

export default function StudentTable({
  submissions = [],
  examId,
  onDeleteSubmission,
}) {
  const [search, setSearch] = useState('');

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    const name = (s.student_name || s.ai_detected_name || '').toLowerCase();
    const roll = (s.roll_number || s.ai_detected_roll || '').toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  const statusBadges = {
    uploaded: { text: 'Uploaded', class: 'bg-slate-800 text-slate-300 border-slate-700' },
    processing: { text: 'AI Grading...', class: 'bg-teal-500/20 text-teal-300 border-teal-500/40 animate-pulse' },
    evaluated: { text: 'Evaluated', class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    reviewed: { text: 'Teacher Reviewed', class: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    finalized: { text: 'Finalized', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header & Search */}
      <div className="px-6 py-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Submissions Ledger</span>
          </div>
          <h3 className="text-base font-bold text-white">Student Answer Sheets & AI Scores</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline status, OCR detected student information, and review triggers.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl w-64 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-5">Student Name</th>
              <th className="py-3.5 px-4 font-mono">Roll No</th>
              <th className="py-3.5 px-4">Class</th>
              <th className="py-3.5 px-4">Pages</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">AI Score</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  {search ? 'No student matches your search query.' : 'No answer sheets uploaded yet. Upload student PDFs above.'}
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const badge = statusBadges[s.submission_status] || statusBadges.uploaded;
                return (
                  <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Student Name */}
                    <td className="py-3.5 px-5 font-bold text-white">
                      {s.student_name || s.ai_detected_name || (
                        <span className="text-slate-500 italic">Unidentified</span>
                      )}
                    </td>

                    {/* Roll No */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {s.roll_number || s.ai_detected_roll || '—'}
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {s.class_name || '—'}
                    </td>

                    {/* Pages */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {s.total_pages || (s.page_image_paths?.length || 0)} pgs
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.class}`}
                      >
                        {badge.text}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      {s.submission_status in { evaluated: 1, reviewed: 1, finalized: 1 } ? (
                        <span>
                          <span className="text-teal-300 font-extrabold">{s.total_marks}</span> / {s.max_marks}{' '}
                          <span className="text-slate-500 text-[11px] font-normal">({s.percentage}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <Link
                        to={`/exams/${examId}/students/${s.id}/review`}
                        className="inline-flex items-center text-xs px-3 py-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 font-bold rounded-lg border border-teal-500/30 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                        Review
                      </Link>

                      {s.submission_status === 'finalized' && (
                        <Link
                          to={`/exams/${examId}/students/${s.id}/report`}
                          className="inline-flex items-center text-xs px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-lg border border-emerald-500/30 transition-all"
                        >
                          <Award className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          Report
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteSubmission(s.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Submission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
