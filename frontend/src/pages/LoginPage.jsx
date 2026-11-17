import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('t@school.com');
  const [password, setPassword] = useState('pass123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Welcome back, Educator!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to sign in. Please check your credentials or ensure the backend server is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/25">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-2xl text-white tracking-tight">GradeX</span>
                </div>
                <p className="text-xs text-slate-400">Paper Evaluation & Assessment Suite</p>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
              Automated exam evaluation with human-in-the-loop oversight.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Empower educators with multi-modal Gemini Vision handwriting recognition, step-by-step rubric mapping, and instant score syntheses.
            </p>

            {/* Feature List */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Multimodal Vision OCR:</strong> Reads handwritten script lines, equations, and diagrams.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Granular Rubrics:</strong> Step-wise points awarded based on mandatory keywords and formulas.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Teacher Review Cockpit:</strong> Full human override control on every awarded mark.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Secure Academic Data Protection Enabled</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-slate-900">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Educator Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access the examination workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Teacher Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              <span>{isLoading ? 'Authenticating with Studio...' : 'Sign In as Educator'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Demo Credentials: <span className="font-mono text-teal-300">t@school.com</span> /{' '}
              <span className="font-mono text-teal-300">pass123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
