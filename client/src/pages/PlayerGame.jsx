import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Lock,
  Trophy,
  Loader2,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { fireConfettiBurst } from '../utils/confetti';
import CircularTimer from '../components/CircularTimer';
import AnswerOption from '../components/AnswerOption';

export default function PlayerGame() {
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

  // Question & response state
  const [gameState, setGameState] = useState('waiting'); // 'waiting' | 'active' | 'locked' | 'revealed'
  const [question, setQuestion] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [selectedOption, setSelectedOption] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  // Synchronized countdown timer
  useEffect(() => {
    let timer = null;
    if ((gameState === 'active' || gameState === 'locked') && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, secondsLeft]);

  // Socket event listeners and reconnect handling
  useEffect(() => {
    if (!socket) return;

    // Check reconnect on load
    if (player && player.playerId) {
      socket.emit('player:reconnect', { roomCode: cleanCode, playerId: player.playerId }, (res) => {
        if (res && res.success) {
          if (res.status === 'active' && res.questionData) {
            setQuestion(res.questionData);
            setSecondsLeft(res.remainingSeconds || 20);
            if (res.hasAnswered) {
              setSelectedOption(res.selectedOption);
              setGameState('locked');
            } else {
              setGameState('active');
            }
          } else if (res.status === 'revealed' && res.revealData) {
            setRevealData(res.revealData);
            setSelectedOption(res.revealData.selectedOption);
            setGameState('revealed');
          } else if (res.status === 'finished') {
            navigate(`/podium/${cleanCode}`);
          }
        }
      });
    }

    // New Question received
    const handleNewQuestion = (qData) => {
      setQuestion(qData);
      setSelectedOption(null);
      setRevealData(null);
      setSecondsLeft(qData.duration || 20);
      setGameState('active');
    };

    // Live answer count
    const handleAnswerCount = (countData) => {
      setAnsweredCount(countData.answeredCount || 0);
      setTotalPlayers(countData.totalPlayers || 0);
    };

    // Personalized reveal data
    const handleReveal = (result) => {
      setRevealData(result);
      setGameState('revealed');

      if (result.isCorrect) {
        soundManager.playCorrect();
        fireConfettiBurst();
      } else {
        soundManager.playWrong();
      }
    };

    // Game finished -> podium
    const handleFinished = () => {
      navigate(`/podium/${cleanCode}`);
    };

    socket.on('question:new', handleNewQuestion);
    socket.on('question:answerCount', handleAnswerCount);
    socket.on('question:reveal', handleReveal);
    socket.on('game:finished', handleFinished);

    return () => {
      socket.off('question:new', handleNewQuestion);
      socket.off('question:answerCount', handleAnswerCount);
      socket.off('question:reveal', handleReveal);
      socket.off('game:finished', handleFinished);
    };
  }, [socket, cleanCode, player, navigate, soundManager]);

  // Handle player clicking an option
  const handleSelectOption = (optionIndex) => {
    if (gameState !== 'active' || !player || !question) return;

    setSelectedOption(optionIndex);
    setGameState('locked');

    socket.emit(
      'player:answer',
      {
        roomCode: cleanCode,
        playerId: player.playerId,
        questionIndex: question.questionIndex,
        selectedOption: optionIndex,
      },
      (res) => {
        if (!res?.success) {
          console.warn('Answer submit callback warning:', res?.message);
        }
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 min-h-[90vh] flex flex-col justify-between">
      {/* Top Player Info Bar */}
      <div className="glass-panel px-5 py-3 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl filter drop-shadow animate-bounce-subtle select-none">
            {player?.avatar || '🦊'}
          </span>
          <span className="font-extrabold text-white text-sm sm:text-base">
            {player?.name || 'Player'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {question && (
            <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-brand-purple/20 text-brand-pink border border-brand-pink/30">
              Q {question.questionIndex + 1}/{question.totalQuestions}
            </span>
          )}
          {revealData && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              {revealData.currentScore} pts
            </span>
          )}
        </div>
      </div>

      {/* Main Game Card */}
      <div className="my-6 flex-1 flex flex-col justify-center">
        {/* Waiting for Question State */}
        {gameState === 'waiting' && (
          <div className="glass-panel p-12 rounded-3xl text-center border border-white/10 shadow-2xl">
            <div className="text-6xl mb-4 animate-bounce-subtle select-none">{player?.avatar || '🦊'}</div>
            <h3 className="text-2xl font-black text-white">Get Ready!</h3>
            <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
              <span>Host is about to launch the question...</span>
            </p>
          </div>
        )}

        {/* Active Question or Answer Locked State */}
        {(gameState === 'active' || gameState === 'locked') && question && (
          <div className="space-y-6">
            {/* Question Text and Timer */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center sm:text-left">
                <span className="text-xs font-extrabold uppercase text-brand-purple tracking-wider">
                  Question #{question.questionIndex + 1}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1 leading-snug">
                  {question.text}
                </h2>
              </div>
              <div className="shrink-0">
                <CircularTimer secondsLeft={secondsLeft} totalDuration={20} size={88} strokeWidth={8} />
              </div>
            </div>

            {/* Answer Locked Message if already picked */}
            {gameState === 'locked' && (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-center flex items-center justify-center gap-3 animate-pop-in">
                <div className="w-9 h-9 rounded-full bg-brand-purple flex items-center justify-center text-white shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-white block">
                    Answer locked! Waiting for others...
                  </span>
                  <span className="text-xs text-gray-400">
                    {answeredCount} of {totalPlayers} players answered
                  </span>
                </div>
              </div>
            )}

            {/* 4 Colored Option Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((optText, i) => (
                <AnswerOption
                  key={i}
                  index={i}
                  text={optText}
                  onClick={handleSelectOption}
                  isSelected={selectedOption === i}
                  disabled={gameState === 'locked'}
                  isRevealed={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Revealed State */}
        {gameState === 'revealed' && revealData && (
          <div className={`space-y-6 ${!revealData.isCorrect ? 'animate-shake' : 'animate-pop-in'}`}>
            {/* Result Announcement Banner */}
            <div
              className={`p-8 rounded-3xl text-center shadow-2xl border ${
                revealData.isCorrect
                  ? 'bg-gradient-to-tr from-emerald-900/90 via-emerald-800/80 to-emerald-950 border-emerald-400/50 shadow-emerald-500/20'
                  : 'bg-gradient-to-tr from-red-900/90 via-red-800/80 to-red-950 border-red-500/50 shadow-red-500/20'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 shadow-lg">
                {revealData.isCorrect ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-400" />
                )}
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {revealData.isCorrect ? 'CORRECT! +10 PTS 🎉' : 'INCORRECT! ❌'}
              </h2>

              <p className="text-sm text-gray-300 mt-2 font-medium">
                {revealData.isCorrect
                  ? 'Lightning fast! Points added to your total.'
                  : revealData.selectedOption === null
                  ? 'Time expired! No points awarded.'
                  : 'Better luck on the next question!'}
              </p>

              {/* Player Score & Current Rank Box */}
              <div className="mt-6 pt-5 border-t border-white/20 grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-3 rounded-2xl border border-white/10">
                  <span className="text-[11px] uppercase font-bold text-gray-400 block">
                    Your Total Score
                  </span>
                  <span className="text-2xl font-black text-yellow-400">
                    {revealData.currentScore} <span className="text-xs text-gray-400">pts</span>
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-white/10">
                  <span className="text-[11px] uppercase font-bold text-gray-400 block">
                    Your Current Rank
                  </span>
                  <span className="text-2xl font-black text-brand-pink">
                    #{revealData.currentRank || '-'} <span className="text-xs text-gray-400">of {revealData.totalPlayers}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Answer Options Recap (Highlights the correct option) */}
            {question && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((optText, i) => (
                  <AnswerOption
                    key={i}
                    index={i}
                    text={optText}
                    disabled={true}
                    isSelected={selectedOption === i}
                    isRevealed={true}
                    isCorrect={revealData.isCorrect}
                    correctIndex={revealData.correctIndex}
                  />
                ))}
              </div>
            )}

            <div className="text-center text-sm font-semibold text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
              <span>Waiting for host to send next question...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-xs text-gray-500 py-2">
        Wayground Real-Time Multiplayer Quiz
      </div>
    </div>
  );
}
