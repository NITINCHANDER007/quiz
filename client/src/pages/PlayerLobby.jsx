import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import AvatarBadge from '../components/AvatarBadge';

export default function PlayerLobby() {
  const { roomCode } = useParams();
  const cleanCode = (roomCode || '').toUpperCase();
  const { socket, isConnected } = useSocket();
  const { soundManager } = useSound();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('wayground_player_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');

  // Reconnection & event listeners
  useEffect(() => {
    if (!socket) return;

    // Attempt reconnect if session exists
    if (player && player.playerId) {
      socket.emit('player:reconnect', { roomCode: cleanCode, playerId: player.playerId }, (res) => {
        if (res && res.success) {
          if (res.status === 'active' || res.status === 'revealed') {
            navigate(`/game/${cleanCode}`);
          } else if (res.status === 'finished') {
            navigate(`/podium/${cleanCode}`);
          }
        }
      });
    }

    const handlePlayersUpdate = (updatedList) => {
      setPlayers((prev) => {
        if (updatedList.length > prev.length) {
          soundManager.playJoin();
        }
        return updatedList;
      });
    };

    const handleGameStarted = () => {
      navigate(`/game/${cleanCode}`);
    };

    const handleNewQuestion = () => {
      navigate(`/game/${cleanCode}`);
    };

    socket.on('room:playersUpdate', handlePlayersUpdate);
    socket.on('room:gameStarted', handleGameStarted);
    socket.on('question:new', handleNewQuestion);

    return () => {
      socket.off('room:playersUpdate', handlePlayersUpdate);
      socket.off('room:gameStarted', handleGameStarted);
      socket.off('question:new', handleNewQuestion);
    };
  }, [socket, cleanCode, player, navigate, soundManager]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 min-h-[85vh] flex flex-col justify-between">
      {/* Top Card: Room PIN */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center shadow-xl">
        <span className="text-xs uppercase font-extrabold text-gray-400 tracking-widest block">
          Game Room PIN
        </span>
        <div className="text-3xl sm:text-4xl font-black text-yellow-400 tracking-widest mt-1 font-mono">
          {cleanCode}
        </div>
      </div>

      {/* Center: Player's Own Profile Card */}
      <div className="my-8 text-center">
        {player ? (
          <div className="inline-block glass-panel p-8 sm:p-10 rounded-3xl border-2 border-brand-purple shadow-2xl relative overflow-hidden animate-pop-in">
            <div className="text-7xl sm:text-8xl mb-3 animate-bounce-subtle filter drop-shadow-xl select-none">
              {player.avatar}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {player.name}
            </h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/20 text-brand-pink border border-brand-pink/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>You are in!</span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-gray-400">
            Connecting your player profile...
          </div>
        )}

        {/* Pulsing Host Waiting Status */}
        <div className="mt-8 flex items-center justify-center gap-3 text-brand-pink font-bold text-base sm:text-lg animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Waiting for host to start...</span>
        </div>
      </div>

      {/* Joined Players Roster */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-purple" />
            <h3 className="text-base font-bold text-white">Players in Lobby</h3>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
            {players.length} Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {players.map((p) => (
            <AvatarBadge
              key={p.playerId}
              avatar={p.avatar}
              name={p.name}
              isSelf={player?.playerId === p.playerId}
              size="sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
