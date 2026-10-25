import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(password.trim());
      if (res.success) {
        navigate('/admin');
      } else {
        setError(res.message || 'Incorrect password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Connection to server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow behind card */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-purple/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-purple/30 mb-5">
            <Shield className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight">
            Host Administration
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter the host password to create, edit quizzes, and run live multiplayer games.
          </p>

          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/30 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30 text-white placeholder-gray-500 outline-none transition-all text-base"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-brand-purple/30 transition-all duration-200 active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Host Console'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Default environment password: <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded">admin123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
