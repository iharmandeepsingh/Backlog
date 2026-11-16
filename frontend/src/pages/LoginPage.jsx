import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, AlertCircle, ArrowRight, User, ShieldCheck } from 'lucide-react';

const LoginPage = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState('student'); // 'student' | 'admin'
  const [loginId, setLoginId] = useState('72312720');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please enter your Enrollment / Email and Password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login({ loginId, password });
      if (!res.success) {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (id, pass, role) => {
    setRoleTab(role);
    setLoginId(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto py-8">
      {/* Login Card */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6 sm:p-8">
        {/* University Header */}
        <div className="text-center pb-5 border-b border-slate-200 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Examination Portal Login
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Backlog Examination Registration &amp; Fee Management
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex border border-slate-300 rounded mb-5 p-1 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setRoleTab('student');
              setError('');
              setLoginId('72312720');
            }}
            className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              roleTab === 'student'
                ? 'bg-[#1e3a8a] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab('admin');
              setError('');
              setLoginId('admin@university.edu');
            }}
            className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              roleTab === 'admin'
                ? 'bg-[#1e3a8a] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {roleTab === 'student' ? 'Enrollment / Roll No. or Email *' : 'Admin Official Email *'}
            </label>
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder={roleTab === 'student' ? 'e.g. 72312720 or 72311390' : 'admin@university.edu'}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your portal password"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:border-blue-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1e3a8a] hover:bg-blue-900 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to {roleTab === 'student' ? 'Student Account' : 'Admin Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {roleTab === 'student' && (
          <div className="mt-4 pt-3 text-center text-xs text-slate-500 border-t border-slate-200">
            First time registering?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Student Self-Registration
            </button>
          </div>
        )}

        {/* Quick Demo Access Box */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="text-[11px] font-bold text-slate-600 block mb-2 uppercase">
            Quick Login (From LAW 2023.xlsx):
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleDemoFill('72312720', 'student123', 'student')}
              className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div>
                <strong>Student A</strong> (Roll: <code>72312720</code>)
                <span className="block text-[10px] text-slate-500">Failed: 23BALB11C01 (Sem 1)</span>
              </div>
              <span className="text-[10px] text-blue-700 font-bold">Fill &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('72311390', 'student123', 'student')}
              className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div>
                <strong>Student B</strong> (Roll: <code>72311390</code>)
                <span className="block text-[10px] text-slate-500">Failed: 23BALB11C02 (Sem 1)</span>
              </div>
              <span className="text-[10px] text-blue-700 font-bold">Fill &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('admin@university.edu', 'admin123', 'admin')}
              className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div>
                <strong>Admin</strong> (<code>admin@university.edu</code>)
                <span className="block text-[10px] text-slate-500">Exam Controller Office</span>
              </div>
              <span className="text-[10px] text-blue-700 font-bold">Fill &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
