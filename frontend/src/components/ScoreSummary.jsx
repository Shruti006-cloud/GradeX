import React, { useState } from 'react';
import { Check, Edit2, Award, CheckCircle, Sparkles, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ScoreSummary({
  submission,
  scoreSummary,
  onFinalize,
  onUpdateHeader,
  isSaving = false,
}) {
  const navigate = useNavigate();
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [name, setName] = useState(submission?.student_name || '');
  const [roll, setRoll] = useState(submission?.roll_number || '');
  const [className, setClassName] = useState(submission?.class_name || '');

  const { totalAwarded, maxTotal, percentage, grade } = scoreSummary;
  const status = submission?.submission_status || 'uploaded';
  const isFinalized = status === 'finalized';

  const handleSaveHeader = () => {
    onUpdateHeader(name, roll, className);
    setIsEditingStudent(false);
  };

  const gradeColors = {
    'A+': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    A: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    B: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    C: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    D: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    F: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  const statusColors = {
    uploaded: 'bg-slate-800 text-slate-300 border-slate-700',
    processing: 'bg-teal-500/20 text-teal-300 border-teal-500/40 animate-pulse',
    evaluated: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    reviewed: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    finalized: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800 px-5 py-3.5 sticky top-0 z-20 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Student Details with inline edit */}
        <div className="flex items-center space-x-3">
          {isEditingStudent ? (
            <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-slate-700">
              <input
                type="text"
                placeholder="Student Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white w-32 focus:outline-none focus:border-teal-400"
              />
              <input
                type="text"
                placeholder="Roll No"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white w-24 focus:outline-none focus:border-teal-400 font-mono"
              />
              <input
                type="text"
                placeholder="Class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white w-20 focus:outline-none focus:border-teal-400"
              />
              <button
                onClick={handleSaveHeader}
                className="p-1.5 bg-teal-500 text-slate-950 font-bold rounded-lg hover:bg-teal-400 transition-colors"
                title="Save Changes"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">
                    {submission?.student_name || submission?.ai_detected_name || 'Student Name'}
                  </span>
                  <button
                    onClick={() => {
                      setName(submission?.student_name || '');
                      setRoll(submission?.roll_number || '');
                      setClassName(submission?.class_name || '');
                      setIsEditingStudent(true);
                    }}
                    className="text-slate-500 hover:text-teal-400 transition-colors p-1"
                    title="Edit Student Info"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 space-x-2 flex items-center">
                  <span>Roll: <strong className="text-slate-200 font-mono">{submission?.roll_number || submission?.ai_detected_roll || '—'}</strong></span>
                  <span>•</span>
                  <span>Class: <strong className="text-slate-200">{submission?.class_name || '—'}</strong></span>
                </div>
              </div>

              {/* Status Chip */}
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColors[status] || statusColors.uploaded
                  }`}
              >
                {status}
              </span>
            </div>
          )}
        </div>

        {/* Live Score Counter & Actions */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-baseline space-x-1.5 justify-end">
              <span className="font-black text-xl text-white tracking-tight">
                <span className="text-teal-300">{totalAwarded}</span>
              </span>
              <span className="text-xs font-semibold text-slate-400">/ {maxTotal}</span>
              <span className="text-xs font-bold text-emerald-400 ml-1">({percentage}%)</span>
            </div>

            {/* Micro progress bar */}
            <div className="w-36 bg-slate-900 rounded-full h-1.5 overflow-hidden ml-auto mt-1 border border-slate-800">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>

          {/* Grade Badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-lg ${gradeColors[grade] || gradeColors.F
              }`}
            title={`Grade: ${grade}`}
          >
            {grade}
          </div>

          {/* Finalize / View Report Button */}
          {isFinalized ? (
            <button
              onClick={() =>
                navigate(`/exams/${submission.exam_id}/students/${submission.id}/report`)
              }
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Award className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              View Report
            </button>
          ) : (
            <button
              onClick={onFinalize}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              {isSaving ? 'Finalizing...' : 'Approve & Finalize'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
