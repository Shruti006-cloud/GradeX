import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { examService } from '../services/examService';
import { BookOpen, ArrowLeft, Sparkles, Layers, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class_name: '',
    total_marks: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        subject: formData.subject,
        class_name: formData.class_name,
        total_marks: formData.total_marks ? parseFloat(formData.total_marks) : null,
        description: formData.description,
      };

      const created = await examService.createExam(payload);
      toast.success('Exam created! Proceeding to Question Paper Blueprint.');
      navigate(`/exams/${created.id}`);
    } catch (err) {
      toast.error('Failed to create exam');
    } finally {
      setIsLoading(false);
    }
  };

  const subjectPills = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'English Literature'];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 w-full">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-xs text-slate-400 hover:text-teal-400 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  Step 0 — Initialization
                </span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Create New Exam Blueprint</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure exam details. You will upload the question paper in Step 1.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Exam Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mid-Term Assessment: Advanced Calculus"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-xs px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                />
                {/* Quick Subject Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {subjectPills.slice(0, 3).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setFormData({ ...formData, subject: sub })}
                      className="text-[10px] font-medium px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-teal-300 rounded-md border border-slate-800 transition-colors"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Class / Batch</label>
                <input
                  type="text"
                  placeholder="e.g. Grade 11-B"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="w-full text-xs px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Total Exam Marks <span className="text-slate-500 font-normal">(optional, auto-summed from questions)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                placeholder="e.g. 50 or 100"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                className="w-full text-xs px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Description & Teacher Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Optional test instructions, term notes, or grading guidance..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-xs px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            <div className="pt-5 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Exam...' : 'Create & Proceed to Questions'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4 ml-1.5 stroke-[2.5]" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
