import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Play,
  QrCode,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Wifi,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import QRCodeModal from '../components/QRCodeModal';
import AvatarBadge from '../components/AvatarBadge';

export default function HostLobby() {
  const { roomCode } = useParams();
  const cleanCode = (roomCode || '').toUpperCase();
  const { socket, isConnected } = useSocket();
  const { soundManager } = useSound();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const joinUrl = `${window.location.origin}/join/${cleanCode}`;

  useEffect(() => {
    if (!socket) return;

    // Listen for live player updates in the lobby
    const handlePlayersUpdate = (updatedList) => {
      setPlayers((prev) => {
        // If a new player joined, play chime
        if (updatedList.length > prev.length) {
          soundManager.playJoin();
        }
        return updatedList;
      });
    };

    const handleGameStarted = () => {
      navigate(`/host/game/${cleanCode}`);
    };

    socket.on('room:playersUpdate', handlePlayersUpdate);
    socket.on('room:gameStarted', handleGameStarted);

    return () => {
      socket.off('room:playersUpdate', handlePlayersUpdate);
      socket.off('room:gameStarted', handleGameStarted);
    };
  }, [socket, cleanCode, navigate, soundManager]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartQuiz = () => {
    if (players.length === 0) {
      alert('Cannot start quiz: At least 1 player must join the lobby.');
      return;
    }

    setStarting(true);
    setError('');

    socket.emit('admin:startGame', { roomCode: cleanCode }, (res) => {
      if (res && res.success) {
        navigate(`/host/game/${cleanCode}`);
      } else {
        setStarting(false);
        setError(res?.message || 'Failed to start game');
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[90vh] flex flex-col justify-between">
      {/* Top Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-extrabold text-brand-pink tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Join at {window.location.host}/join</span>
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-gray-300">Game PIN:</h1>
            <span className="text-4xl sm:text-5xl font-black tracking-widest text-yellow-400 drop-shadow">
              {cleanCode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowQR(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors border border-white/10"
          >
            <QrCode className="w-5 h-5 text-brand-purple" />
            <span>Show QR</span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all border ${
              copied
                ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5 text-brand-pink" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Players Grid Area */}
      <div className="my-8 flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-purple" />
            <h2 className="text-2xl font-black text-white">Joined Players</h2>
          </div>
          <span className="text-sm font-extrabold px-3.5 py-1.5 rounded-full bg-brand-purple/20 text-brand-pink border border-brand-pink/30">
            {players.length} {players.length === 1 ? 'Contender' : 'Contenders'} Ready
          </span>
        </div>

        {players.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl text-center border border-dashed border-white/15">
            <div className="text-5xl mb-4 animate-bounce-subtle">🦊 🐼 🐸 🤖 🦄</div>
            <h3 className="text-2xl font-black text-white mb-2">Waiting for Players to Join...</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Share the PIN <span className="font-mono text-yellow-400 font-bold">{cleanCode}</span> or display the QR code for players to join from their phones!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {players.map((p) => (
              <AvatarBadge
                key={p.playerId}
                avatar={p.avatar}
                name={p.name}
                size="md"
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Start Quiz Controls */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>
            {players.length === 0
              ? 'Quiz start is disabled until at least 1 player joins'
              : `Ready to start with ${players.length} player${players.length > 1 ? 's' : ''}!`}
          </span>
        </div>

        <button
          onClick={handleStartQuiz}
          disabled={players.length === 0 || starting}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{starting ? 'Starting Quiz...' : 'Start Quiz Now'}</span>
        </button>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        roomCode={cleanCode}
        joinUrl={joinUrl}
      />
    </div>
  );
}
