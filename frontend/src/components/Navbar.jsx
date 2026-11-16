import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  User,
  LogOut,
  FileText,
  Calendar,
  Settings,
  BookOpen,
  History,
  LayoutDashboard
} from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAdmin, isStudent } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg no-print">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-4 py-1.5 border-b border-indigo-900/60 text-xs font-medium text-slate-300 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Central Examination Control Office &bull; Backlog Portal Session 2026-27</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>Helpline: +91 (011) 2584-9100</span>
          <span>Support: exam.cell@university.edu</span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Outfit']">
                  UNIVERSITAS
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {isAdmin ? 'ADMIN CONSOLE' : 'STUDENT PORTAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Backlog Examination Registration System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isStudent && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'register'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Exam Registration
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  My Applications
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('admin-dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-dashboard'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('admin-registrations')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-registrations'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Registrations &amp; Payments
                </button>
                <button
                  onClick={() => setActiveTab('admin-sessions')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-sessions'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Exam Sessions
                </button>
                <button
                  onClick={() => setActiveTab('admin-config')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-config'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Fees &amp; Limits
                </button>
                <button
                  onClick={() => setActiveTab('admin-subjects')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-subjects'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Curriculum
                </button>
                <button
                  onClick={() => setActiveTab('admin-audit')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-audit'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Audit Trail
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-sm font-semibold text-white leading-tight">
                {user?.name}
              </span>
              <span className="text-xs text-slate-400">
                {isAdmin ? 'Examination Officer' : `${user?.rollNumber} &bull; Sem ${user?.currentSemester}`}
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              {isAdmin ? <ShieldCheck className="w-5 h-5 text-indigo-400" /> : <User className="w-5 h-5 text-blue-400" />}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto py-2 gap-2 border-t border-slate-800 scrollbar-none">
          {isStudent && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'register' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                Register Backlogs
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                My History
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'admin-dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('admin-registrations')}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'admin-registrations' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                Registrations
              </button>
              <button
                onClick={() => setActiveTab('admin-sessions')}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'admin-sessions' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveTab('admin-config')}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'admin-config' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                Fees &amp; Limits
              </button>
              <button
                onClick={() => setActiveTab('admin-subjects')}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'admin-subjects' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                Curriculum
              </button>
              <button
                onClick={() => setActiveTab('admin-audit')}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-medium ${
                  activeTab === 'admin-audit' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                Audit
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
