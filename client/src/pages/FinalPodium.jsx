import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  Download,
  Home,
  RotateCcw,
  Sparkles,
  Award,
  Medal,
  Users,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { firePodiumCelebration } from '../utils/confetti';
import { getExportCSVUrl } from '../utils/api';
import LeaderboardTable from '../components/LeaderboardTable';

export default function FinalPodium() {
  const { roomCode } = useParams();
  const cleanCode = (roomCode || '').toUpperCase();
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();
  const { soundManager } = useSound();

  const [podium, setPodium] = useState([]);
  const [fullLeaderboard, setFullLeaderboard] = useState([]);
  const [quizTitle, setQuizTitle] = useState('Multiplayer Quiz');
  const [showFullTable, setShowFullTable] = useState(isAuthenticated);

  const [player] = useState(() => {
    try {
      const saved = localStorage.getItem('wayground_player_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    // Launch celebration effects on arrival
    soundManager.playFanfare();
    firePodiumCelebration();

    if (socket) {
      // Re-fetch or catch finished event
      const handleGameFinished = (payload) => {
        if (payload.podium) setPodium(payload.podium);
        if (payload.fullLeaderboard) setFullLeaderboard(payload.fullLeaderboard);
        if (payload.quizTitle) setQuizTitle(payload.quizTitle);
      };

      socket.on('game:finished', handleGameFinished);

      // In case we landed here via refresh, request state
      if (player && player.playerId) {
        socket.emit('player:reconnect', { roomCode: cleanCode, playerId: player.playerId }, (res) => {
          if (res?.quizTitle) setQuizTitle(res.quizTitle);
        });
      }

      return () => {
        socket.off('game:finished', handleGameFinished);
      };
    }
  }, [socket, cleanCode, player, soundManager]);

  // Extract top 3: 1st, 2nd, 3rd
  const first = podium[0] || fullLeaderboard[0] || null;
  const second = podium[1] || fullLeaderboard[1] || null;
  const third = podium[2] || fullLeaderboard[2] || null;

  const playerFinalRank = fullLeaderboard.find((p) => p.playerId === player?.playerId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[90vh] flex flex-col justify-between">
      {/* Top Header */}
      <div className="text-center my-4">
        <span className="text-xs uppercase font-extrabold text-brand-pink tracking-widest flex items-center justify-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>Game Concluded • Room {cleanCode}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Champions Podium 🏆
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mt-2 font-medium">
          {quizTitle}
        </p>
      </div>

      {/* Olympic Podium Display */}
      <div className="my-8 max-w-3xl mx-auto w-full">
        <div className="flex items-end justify-center gap-3 sm:gap-6 pt-12 pb-4">
          {/* 2nd Place (Silver - Left) */}
          <div className="flex flex-col items-center flex-1 max-w-[200px]">
            {second ? (
              <div className="text-center mb-3 animate-pop-in">
                <div className="text-5xl sm:text-6xl mb-1 filter drop-shadow-lg select-none animate-bounce-subtle">
                  {second.avatar}
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-gray-200 block truncate max-w-[140px]">
                  {second.name}
                </span>
                <span className="text-xs font-black text-slate-300">
                  {second.score} pts
                </span>
              </div>
            ) : (
              <div className="h-20" />
            )}
            {/* Silver Pedestal */}
            <div className="w-full h-36 sm:h-44 rounded-t-3xl bg-gradient-to-t from-slate-700 via-slate-600 to-slate-400 flex flex-col items-center justify-center border-t-2 border-slate-300 shadow-xl shadow-slate-900/40 relative">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 drop-shadow">
                2
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Silver
              </span>
            </div>
          </div>

          {/* 1st Place (Gold - Center, Tallest) */}
          <div className="flex flex-col items-center flex-1 max-w-[240px] z-10 -mt-8">
            {first ? (
              <div className="text-center mb-3 animate-pop-in">
                <div className="text-2xl mb-1 animate-bounce">👑</div>
                <div className="text-6xl sm:text-8xl mb-1 filter drop-shadow-2xl select-none scale-110">
                  {first.avatar}
                </div>
                <span className="text-sm sm:text-lg font-black text-yellow-300 block truncate max-w-[160px] drop-shadow">
                  {first.name}
                </span>
                <span className="text-sm font-black px-3 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                  {first.score} pts
                </span>
              </div>
            ) : (
              <div className="h-24" />
            )}
            {/* Gold Pedestal */}
            <div className="w-full h-48 sm:h-60 rounded-t-3xl bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 flex flex-col items-center justify-center border-t-2 border-yellow-200 shadow-2xl shadow-yellow-500/20 relative">
              <span className="text-4xl sm:text-6xl font-black text-amber-950 drop-shadow">
                1
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-amber-900">
                Champion
              </span>
            </div>
          </div>

          {/* 3rd Place (Bronze - Right) */}
          <div className="flex flex-col items-center flex-1 max-w-[200px]">
            {third ? (
              <div className="text-center mb-3 animate-pop-in">
                <div className="text-5xl sm:text-6xl mb-1 filter drop-shadow-lg select-none animate-bounce-subtle">
                  {third.avatar}
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-amber-200 block truncate max-w-[140px]">
                  {third.name}
                </span>
                <span className="text-xs font-black text-amber-300">
                  {third.score} pts
                </span>
              </div>
            ) : (
              <div className="h-16" />
            )}
            {/* Bronze Pedestal */}
            <div className="w-full h-28 sm:h-36 rounded-t-3xl bg-gradient-to-t from-amber-900 via-amber-800 to-amber-600 flex flex-col items-center justify-center border-t-2 border-amber-500 shadow-xl shadow-amber-950/40 relative">
              <span className="text-3xl sm:text-4xl font-black text-amber-950 drop-shadow">
                3
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950">
                Bronze
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Player's Own Result Badge */}
      {playerFinalRank && !isAuthenticated && (
        <div className="max-w-md mx-auto mb-8 p-4 rounded-2xl glass-panel border border-brand-purple/40 text-center flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <span className="text-3xl">{playerFinalRank.avatar}</span>
            <div>
              <span className="text-xs text-gray-400 font-bold uppercase block">
                Your Result
              </span>
              <span className="text-base font-extrabold text-white">
                {playerFinalRank.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-brand-pink">
              Rank #{playerFinalRank.rank}
            </span>
            <span className="text-xs text-yellow-400 block font-bold">
              {playerFinalRank.score} points
            </span>
          </div>
        </div>
      )}

      {/* Full Leaderboard Section */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-purple" />
            <span>Full Final Standings</span>
          </h3>
          {fullLeaderboard.length > 0 && !isAuthenticated && (
            <button
              onClick={() => setShowFullTable((prev) => !prev)}
              className="text-xs font-bold text-brand-pink hover:underline"
            >
              {showFullTable ? 'Hide Table' : 'Show All Players'}
            </button>
          )}
        </div>

        {(showFullTable || isAuthenticated) && (
          <LeaderboardTable leaderboard={fullLeaderboard} showDetails={true} />
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Play Again</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/admin"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-sm transition-colors shadow-md shadow-brand-purple/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Host Dashboard</span>
            </Link>
          )}
        </div>

        {/* Admin CSV Download Button */}
        {isAuthenticated && (
          <a
            href={getExportCSVUrl(cleanCode)}
            target="_blank"
            rel="noreferrer"
            download={`quiz_results_${cleanCode}.csv`}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Results CSV</span>
          </a>
        )}
      </div>
    </div>
  );
}
