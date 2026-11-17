import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, AlertCircle, ArrowLeft } from 'lucide-react';

const RegisterPage = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    password: '',
    department: 'SCHOOL OF LAW',
    currentSemester: 3,
    program: 'B.A., LL.B.',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'currentSemester' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(formData);
      if (!res.success) {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg my-8">
      {/* Header Branding */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-slate-200 border border-slate-300 text-[#1e3a8a] mb-2">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Student Portal Registration
        </h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Create student account to view and apply for backlog examinations
        </p>
      </div>

      <div className="bg-white rounded border border-slate-300 p-6 shadow-xs">
        {error && (
          <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enrollment / Roll No *
              </label>
              <input
                type="text"
                required
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 72311390"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@university.edu"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School / Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              >
                <option value="SCHOOL OF LAW">SCHOOL OF LAW</option>
                <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics &amp; Communication</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Semester *
              </label>
              <select
                name="currentSemester"
                value={formData.currentSemester}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
                <option value={3}>Semester 3</option>
                <option value={4}>Semester 4</option>
                <option value={5}>Semester 5</option>
                <option value={6}>Semester 6</option>
                <option value={7}>Semester 7</option>
                <option value={8}>Semester 8</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Programme
              </label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleChange}
                placeholder="B.A., LL.B."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Mobile
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Registering Account...' : 'Submit Registration'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-200 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[#1e3a8a] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
