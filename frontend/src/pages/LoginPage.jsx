import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, User, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const LoginPage = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState('student'); // 'student' or 'admin'
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please provide your login credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(loginId, password);
      if (!res.success) {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (id, pwd, tab) => {
    setRoleTab(tab);
    setLoginId(id);
    setPassword(pwd);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-600/25 mb-4 ring-4 ring-blue-500/10">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
            Examination Portal
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Central Backlog Examination Registration System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 backdrop-blur-sm">
          {/* Role Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRoleTab('student');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                roleTab === 'student'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('admin');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                roleTab === 'admin'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Administrator
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {roleTab === 'student' ? 'Roll Number or University Email' : 'Administrator Email'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={roleTab === 'student' ? 'e.g. CS2022001 or rahul.cs@university.edu' : 'admin@university.edu'}
                  className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                roleTab === 'student'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
              } disabled:opacity-50`}
            >
              {loading ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In as {roleTab === 'student' ? 'Student' : 'Administrator'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {roleTab === 'student' && (
            <div className="mt-5 text-center text-xs text-slate-600">
              New candidate registering for backlog exams?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-blue-600 hover:underline"
              >
                Register Here
              </button>
            </div>
          )}

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@university.edu', 'admin123', 'admin')}
                className="text-left p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-900 transition-colors"
              >
                <div className="text-[11px] font-bold">Admin: Dr. Ramesh</div>
                <div className="text-[10px] text-indigo-600 font-mono">admin@university.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('rahul.cs@university.edu', 'student123', 'student')}
                className="text-left p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 transition-colors"
              >
                <div className="text-[11px] font-bold">Student: Rahul (Sem 5)</div>
                <div className="text-[10px] text-blue-600 font-mono">CS2022001 (Odd Backlogs)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('priya.cs@university.edu', 'student123', 'student')}
                className="text-left p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 transition-colors"
              >
                <div className="text-[11px] font-bold">Student: Priya (Receipt Demo)</div>
                <div className="text-[10px] text-emerald-600 font-mono">CS2022045 (Pending Verif)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('amit.ec@university.edu', 'student123', 'student')}
                className="text-left p-2.5 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-900 transition-colors"
              >
                <div className="text-[11px] font-bold">Student: Amit (Online Paid)</div>
                <div className="text-[10px] text-purple-600 font-mono">EC2022012 (Confirmed)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
