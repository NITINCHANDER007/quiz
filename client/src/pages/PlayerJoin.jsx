import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Gamepad2, User, KeyRound, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { apiCheckRoom } from '../utils/api';

export default function PlayerJoin() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [roomCode, setRoomCode] = useState(code ? code.toUpperCase() : '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingSession, setExistingSession] = useState(null);

  // Check if player has an existing session in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('quizpulse_player_session') || localStorage.getItem('wayground_player_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roomCode && parsed.playerId) {
          setExistingSession(parsed);
          if (!code) {
            setRoomCode(parsed.roomCode);
          }
        }
      }
    } catch (e) {}
  }, [code]);

  const handleResume = () => {
    if (existingSession && existingSession.roomCode) {
      navigate(`/game/${existingSession.roomCode}`);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanCode = roomCode.toUpperCase().trim();
    const trimmedName = name.trim();

    if (!cleanCode) {
      setError('Please enter a 6-character room PIN');
      return;
    }

    if (!trimmedName) {
      setError('Please enter a nickname');
      return;
    }

    if (trimmedName.length > 25) {
      setError('Nickname cannot exceed 25 characters');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify room exists via HTTP check
      const checkRes = await apiCheckRoom(cleanCode);
      if (!checkRes.success || !checkRes.exists) {
        setLoading(false);
        setError('Room not found. Please double-check your 6-character PIN.');
        return;
      }

      if (checkRes.status !== 'lobby') {
        setLoading(false);
        setError('This game has already started. New players cannot join.');
        return;
      }

      // 2. Join room via Socket.IO
      if (!socket || !isConnected) {
        setLoading(false);
        setError('Connecting to game server... Please try again in 2 seconds.');
        return;
      }

      socket.emit('player:join', { roomCode: cleanCode, name: trimmedName }, (res) => {
        setLoading(false);
        if (res && res.success) {
          // Save player session to localStorage for reconnect support
          localStorage.setItem(
            'quizpulse_player_session',
            JSON.stringify({
              roomCode: cleanCode,
              playerId: res.playerId,
              name: res.name,
              avatar: res.avatar,
            })
          );
          navigate(`/lobby/${cleanCode}`);
        } else {
          setError(res?.message || 'Failed to join game room.');
        }
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Network error attempting to join room');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-brand-purple/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-purple/30 mb-5">
            <Gamepad2 className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Join the Challenge
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter the 6-character room PIN and your nickname to play!
          </p>

          {/* Resume game button if active session exists */}
          {existingSession && (
            <div className="mt-5 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-left">
              <div>
                <span className="text-[11px] uppercase font-bold text-brand-pink block">
                  Active Session Found
                </span>
                <span className="text-xs text-gray-300">
                  {existingSession.avatar} {existingSession.name} in Room {existingSession.roomCode}
                </span>
              </div>
              <button
                onClick={handleResume}
                className="px-3 py-1.5 rounded-xl bg-brand-purple text-white text-xs font-bold hover:bg-brand-purple/90 transition-colors shrink-0"
              >
                Resume
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="mt-6 space-y-4 text-left">
            {/* Room Code */}
            <div>
              <label className="block text-xs uppercase font-extrabold text-gray-300 tracking-wider mb-2">
                Game Room PIN
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30 text-yellow-400 font-mono text-xl font-black tracking-widest uppercase placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs uppercase font-extrabold text-gray-300 tracking-wider mb-2">
                Your Nickname
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={25}
                  required
                  placeholder="e.g. SpeedyFox, QuizMaster..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30 text-white font-bold text-base placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-xs text-gray-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-pink shrink-0" />
              <span>You will be auto-assigned a unique random character avatar!</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Joining Room...' : 'Enter Game Room'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-xs text-gray-400 text-center">
            Are you hosting this quiz?{' '}
            <Link to="/admin/login" className="text-brand-pink hover:underline font-bold">
              Sign in as Host
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
