import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck
} from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-300 text-blue-900 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-none">
                Examination Portal
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isAdmin ? 'Office of Examination Controller' : 'Student Backlog Examination System'}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isStudent && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-100 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-slate-100 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Apply for Backlog
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-dashboard')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'admin-dashboard' || activeTab === 'dashboard'
                      ? 'bg-slate-100 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-registrations')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'admin-registrations'
                      ? 'bg-slate-100 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Registrations &amp; Receipts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-sessions')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'admin-sessions'
                      ? 'bg-slate-100 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Sessions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-config')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'admin-config'
                      ? 'bg-slate-100 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Fees &amp; Limits
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-subjects')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'admin-subjects'
                      ? 'bg-slate-100 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Curriculum
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                {isAdmin ? <ShieldCheck className="w-4 h-4 text-blue-900" /> : <User className="w-4 h-4 text-slate-700" />}
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-800 leading-tight">
                  {user?.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {user?.role === 'admin' ? 'Administrator' : `Roll: ${user?.rollNumber || ''}`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="text-xs text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-2 text-xs">
          <div className="pb-2 border-b border-slate-100 text-slate-600">
            Signed in as: <strong className="text-slate-900">{user?.name}</strong> ({user?.rollNumber || user?.role})
          </div>

          {isStudent && (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-2.5 rounded ${
                  activeTab === 'dashboard' ? 'bg-slate-100 font-bold text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-2.5 rounded ${
                  activeTab === 'register' ? 'bg-slate-100 font-bold text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Apply for Backlog
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab('admin-dashboard'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-2.5 rounded ${
                  activeTab === 'admin-dashboard' || activeTab === 'dashboard' ? 'bg-slate-100 font-bold text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('admin-registrations'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-2.5 rounded ${
                  activeTab === 'admin-registrations' ? 'bg-slate-100 font-bold text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Registrations
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('admin-sessions'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-2.5 rounded ${
                  activeTab === 'admin-sessions' ? 'bg-slate-100 font-bold text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Sessions
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('admin-config'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-2.5 rounded ${
                  activeTab === 'admin-config' ? 'bg-slate-100 font-bold text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Fees &amp; Limits
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
