import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { examService } from '../services/examService';
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState('all'); // 'all' | 'grading' | 'completed'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await examService.listExams();
        setExams(data);
      } catch (err) {
        toast.error('Failed to load exams');
      } finally {
        setIsLoading(false);
      }
    }
    loadExams();
  }, []);

  const totalExams = exams.length;
  const totalSubmissions = exams.reduce((acc, e) => acc + (e.total_submissions || 0), 0);
  const totalEvaluated = exams.reduce((acc, e) => acc + (e.evaluated_count || 0), 0);

  const filteredExams = exams.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (e.title || '').toLowerCase().includes(q) ||
      (e.subject || '').toLowerCase().includes(q) ||
      (e.class_name || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (tabFilter === 'grading') {
      return (e.total_submissions || 0) > (e.evaluated_count || 0);
    }
    if (tabFilter === 'completed') {
      return (e.total_submissions || 0) > 0 && (e.evaluated_count || 0) >= (e.total_submissions || 0);
    }
    return true;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/70 border border-teal-500/20 p-6 sm:p-8 shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Grading Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to GradeX Studio
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                Oversee examinations, review handwriting evaluations in real-time, and manage student performance reports with teacher-guided AI precision.
              </p>
            </div>

            <Link
              to="/exams/new"
              className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Create New Exam
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-teal-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Exams</p>
                <h3 className="text-3xl font-extrabold text-white mt-1.5">{totalExams}</h3>
                <span className="text-[11px] text-teal-400 font-medium">Configured in workspace</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
                <h3 className="text-3xl font-extrabold text-white mt-1.5">{totalSubmissions}</h3>
                <span className="text-[11px] text-cyan-400 font-medium">Answer sheets collected</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluated & Verified</p>
                <h3 className="text-3xl font-extrabold text-white mt-1.5">{totalEvaluated}</h3>
                <span className="text-[11px] text-emerald-400 font-medium">Scored with AI assistance</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Positioned Filter Tabs & Search Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Navigation Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-md">
            <button
              onClick={() => setTabFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tabFilter === 'all'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Exams ({exams.length})
            </button>
            <button
              onClick={() => setTabFilter('grading')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tabFilter === 'grading'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grading Active
            </button>
            <button
              onClick={() => setTabFilter('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tabFilter === 'completed'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, subject, class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-10 pr-4 py-2 border border-slate-700 rounded-xl w-full sm:w-72 bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-400 shadow-sm"
            />
          </div>
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mx-auto" />
            <p className="text-xs text-slate-400 mt-4">Loading exam workspaces...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-12 text-center shadow-xl">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">No examinations found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {search
                ? 'No exams match your search criteria. Try a different keyword.'
                : 'Get started by creating your first examination paper to evaluate student answers.'}
            </p>
            {!search && (
              <Link
                to="/exams/new"
                className="inline-flex items-center mt-5 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                Create Exam
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const subs = exam.total_submissions || 0;
              const evaled = exam.evaluated_count || 0;
              const pct = subs > 0 ? Math.round((evaled / subs) * 100) : 0;

              return (
                <Link
                  key={exam.id}
                  to={`/exams/${exam.id}`}
                  className="bg-slate-950 rounded-2xl border border-slate-800 p-6 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-950/40 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-colors pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {exam.subject || 'General'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Class: {exam.class_name || 'N/A'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition-colors">
                      {exam.title}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-slate-400">Grading Progress</span>
                        <span className="text-teal-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Max Marks</p>
                        <p className="text-xs font-extrabold text-white mt-0.5">{exam.total_marks || '—'}</p>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Students</p>
                        <p className="text-xs font-extrabold text-teal-300 mt-0.5">{subs}</p>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Class Avg</p>
                        <p className="text-xs font-extrabold text-emerald-300 mt-0.5">
                          {exam.class_average ? `${exam.class_average}` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-teal-400 transition-colors">
                    <span>Open Exam Studio</span>
                    <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
