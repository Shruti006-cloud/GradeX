import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  LogOut,
  User,
  PlusCircle,
  Menu,
  X,
  Compass,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function Layout({ children }) {
  const { teacher, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Exams & Papers', path: '/exams', icon: FileText },
  ];

  const isCurrent = (path) => {
    if (path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/')) return true;
    if (path === '/exams' && location.pathname.startsWith('/exams') && location.pathname !== '/exams/new') return true;
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-teal-500 selection:text-white">
      {/* ── Left Modern Dock Sidebar (Desktop) ── */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800/80 p-5 flex-shrink-0 justify-between select-none shadow-xl">
        <div>
          {/* Logo Brand */}
          <Link to="/dashboard" className="flex items-center space-x-3 group mb-8 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/25 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">GradeX</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Evaluation Studio</p>
            </div>
          </Link>

          {/* Quick Action: New Exam */}
          <div className="mb-6 px-1">
            <Link
              to="/exams/new"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 hover:shadow-teal-500/35 transition-all duration-200 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Exam</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Workspace
            </p>
            {navItems.map((item) => {
              const active = isCurrent(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    active
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${
                        active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* AI Engine Status Card */}
          <div className="mt-8 mx-1 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold mb-1">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              <span>Vision Engine Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Google Gemini Vision pipeline active for handwritten script evaluation.
            </p>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between px-1">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-300 text-xs font-bold flex-shrink-0">
              {teacher?.full_name ? teacher.full_name[0].toUpperCase() : 'T'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {teacher?.full_name || 'Educator'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{teacher?.email || 'teacher@school.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight">GradeX</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Link
            to="/exams/new"
            className="p-2 bg-teal-500/20 text-teal-300 rounded-lg border border-teal-500/30"
          >
            <PlusCircle className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/95 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <span className="font-bold text-lg text-white">Navigation</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-200"
                >
                  <item.icon className="w-5 h-5 text-teal-400" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <Link
                to="/exams/new"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-sm font-bold shadow-md"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create New Exam</span>
              </Link>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* ── Main Canvas Viewport ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-x-hidden">
        {/* Top subtle bar with workspace info */}
        <div className="hidden md:flex h-12 bg-slate-950/60 border-b border-slate-800/60 px-8 items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">GradeX Intelligent Evaluation Workspace</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[11px] text-slate-400">Status: <strong className="text-teal-400 font-semibold">Online</strong></span>
            <div className="h-3 w-px bg-slate-800" />
            <span className="text-[11px] text-slate-400 font-mono">v2.4 Pro</span>
          </div>
        </div>

        {/* Page Children */}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
