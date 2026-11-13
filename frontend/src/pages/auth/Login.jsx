import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Shield, UserCheck, GraduationCap, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@smartomr.edu');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSelect = (role) => {
    setError(null);
    if (role === 'admin') {
      setEmail('admin@smartomr.edu');
      setPassword('Admin@123456');
    } else if (role === 'teacher') {
      setEmail('teacher@smartomr.edu');
      setPassword('Teacher@123456');
    } else if (role === 'student') {
      setEmail('student@smartomr.edu');
      setPassword('Student@123456');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'student') {
        navigate('/student-portal');
      } else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-primary-500 selection:text-white transition-colors">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-primary-600 to-brand-500 flex items-center justify-center shadow-xl shadow-primary-500/25 text-white font-extrabold text-2xl">
          S
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Smart<span className="text-primary-600">OMR</span> System
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Automated OMR Examination & Evaluation Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        
        {/* Quick Demo Role Selector */}
        <div className="mb-4 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex space-x-1">
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              email === 'admin@smartomr.edu'
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('teacher')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              email === 'teacher@smartomr.edu'
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('student')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              email === 'student@smartomr.edu'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start space-x-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
                  placeholder="e.g. admin@smartomr.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="mt-1.5">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 shadow-lg shadow-primary-500/25 flex items-center justify-center space-x-2 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Role-Based Access Control enforced with Laravel Sanctum
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

