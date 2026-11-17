import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { studentService } from '../services/studentService';
import {
  Download,
  Printer,
  ArrowLeft,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportPage() {
  const { examId, submissionId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await studentService.getReport(submissionId);
        setReportData(data);
      } catch (err) {
        toast.error('Failed to load student report');
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [submissionId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-400 mt-4 font-medium">Loading official report card...</p>
        </div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout>
        <div className="p-12 text-center text-slate-400">Report dossier not found.</div>
      </Layout>
    );
  }

  const { student, exam, performance, questions, strengths, weak_areas, overall_remark, improvement_suggestions } =
    reportData;

  const pdfUrl = studentService.getReportPdfUrl(submissionId);
  const csvUrl = studentService.getReportCsvUrl(submissionId);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 w-full print:p-0 print:max-w-none">
        {/* Navigation and Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            to={`/exams/${examId}/students/${submissionId}/review`}
            className="inline-flex items-center text-xs text-slate-400 hover:text-teal-400 transition-colors group font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Back to Review Console
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Print Report
            </button>

            <a
              href={csvUrl}
              download
              className="inline-flex items-center px-3.5 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Download CSV
            </a>

            <a
              href={pdfUrl}
              download
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-teal-500/20 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              Download Official PDF
            </a>
          </div>
        </div>

        {/* Printable Official Report Card */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-8 sm:p-10 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Header */}
          <div className="border-b border-slate-800 pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Official Academic Assessment Dossier</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                  GradeX Performance Report
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified Multimodal Handwriting Evaluation & Rubric Breakdown
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-semibold">Cohort Rank</span>
                <div className="text-3xl font-black text-teal-300">#{performance.rank}</div>
              </div>
            </div>
          </div>

          {/* Student & Exam Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 mb-6 text-xs">
            <div>
              <span className="text-slate-500 block font-semibold text-[10px] uppercase">Candidate Name</span>
              <span className="font-bold text-white mt-0.5 block text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-[10px] uppercase">Roll / Candidate ID</span>
              <span className="font-mono font-bold text-teal-300 mt-0.5 block text-sm">{student.roll_number}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-[10px] uppercase">Class / Section</span>
              <span className="font-bold text-white mt-0.5 block text-sm">{student.class_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-[10px] uppercase">Assessment Title</span>
              <span className="font-bold text-white mt-0.5 block text-sm">{exam.title}</span>
            </div>
          </div>

          {/* Big Score Summary Banner */}
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 mb-8 border border-teal-500/30 flex flex-wrap items-center justify-between gap-6 shadow-xl">
            <div>
              <p className="text-xs text-teal-300 uppercase font-extrabold tracking-wider">
                Total Score Awarded
              </p>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-white">{performance.total_marks}</span>
                <span className="text-lg text-slate-400 font-semibold">/ {performance.max_marks}</span>
                <span className="text-xl font-extrabold text-emerald-400 ml-3">
                  ({performance.percentage}%)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Letter Grade</p>
                <p className="text-3xl font-black text-teal-300">{performance.grade}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-lg">
                <Award className="w-8 h-8 stroke-[2.2]" />
              </div>
            </div>
          </div>

          {/* Question-Wise Evaluation Table */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-xs text-teal-400">
              Question-Wise Detailed Breakdown
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 w-14 text-center">Q#</th>
                    <th className="py-3 px-3.5">Question Statement</th>
                    <th className="py-3 px-3.5 w-16 text-center">Max</th>
                    <th className="py-3 px-3.5 w-20 text-center">AI Marks</th>
                    <th className="py-3 px-3.5 w-24 text-center">Final Score</th>
                    <th className="py-3 px-3.5">Teacher / AI Evaluation Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {questions.map((q, idx) => (
                    <tr
                      key={idx}
                      className={q.is_overridden ? 'bg-teal-950/20 font-medium' : 'hover:bg-slate-900/40'}
                    >
                      <td className="py-3 px-3.5 font-bold text-teal-300 text-center">{q.question_no}</td>
                      <td className="py-3 px-3.5 text-slate-200 max-w-xs">{q.question_text}</td>
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{q.max_marks}</td>
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{q.ai_marks}</td>
                      <td className="py-3 px-3.5 text-center font-bold text-white">
                        <span className="text-teal-300 font-mono">{q.final_marks}</span>
                        {q.is_overridden && (
                          <span className="block text-[10px] text-teal-400 font-normal">
                            (Teacher Override)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-300 leading-relaxed">{q.feedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Remark */}
          <div className="mb-6 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1.5">
              Teacher & AI Comprehensive Assessment Remark
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">{overall_remark}</p>
          </div>

          {/* Strengths & Weak Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Strengths */}
            {strengths && strengths.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-center text-xs font-bold text-emerald-300 mb-2">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                  Key Demonstrated Strengths
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                  {strengths.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weak Areas */}
            {weak_areas && weak_areas.length > 0 && (
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30">
                <div className="flex items-center text-xs font-bold text-rose-300 mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2 text-rose-400" />
                  Core Areas for Remediation
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                  {weak_areas.map((wa, i) => (
                    <li key={i}>{wa}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Improvement Suggestions */}
          {improvement_suggestions && improvement_suggestions.length > 0 && (
            <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30">
              <div className="flex items-center text-xs font-bold text-teal-300 mb-2">
                <Lightbulb className="w-4 h-4 mr-2 text-teal-400" />
                Actionable Next Steps & Study Recommendations
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                {improvement_suggestions.map((sugg, i) => (
                  <li key={i}>{sugg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Generated by GradeX Assessment & Evaluation Platform</span>
            <span>Digitally Verified & Certified by Course Instructor</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
