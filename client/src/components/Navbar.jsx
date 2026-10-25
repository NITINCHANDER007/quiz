import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Shield, LogOut, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SoundToggle from './SoundToggle';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white shadow-lg shadow-brand-purple/30 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              QUIZPULSE
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-pink border border-brand-pink/30">
              Live Quiz
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <SoundToggle />

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl text-gray-200 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span>Join Game</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white shadow-md shadow-brand-purple/25 transition-all"
              >
                <Shield className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Logout Admin"
                className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
