import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowRight,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import CircularTimer from '../components/CircularTimer';
import AnswerOption from '../components/AnswerOption';
import DistributionChart from '../components/DistributionChart';
import LeaderboardTable from '../components/LeaderboardTable';

export default function HostGame() {
  const { roomCode } = useParams();
  const cleanCode = (roomCode || '').toUpperCase();
  const { socket } = useSocket();
  const { soundManager } = useSound();
  const navigate = useNavigate();

  // Game state
  const [gameState, setGameState] = useState('waiting_first'); // 'waiting_first' | 'active' | 'revealed' | 'finished'
  const [question, setQuestion] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [distribution, setDistribution] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Countdown interval
  useEffect(() => {
    let timer = null;
    if (gameState === 'active' && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, secondsLeft]);

  useEffect(() => {
    if (!socket) return;

    // Admin receives question WITH correctIndex
    const handleAdminQuestion = (payload) => {
      setQuestion(payload);
      setCorrectIndex(payload.correctIndex);
      setSecondsLeft(payload.duration || 20);
      setAnsweredCount(0);
      setGameState('active');
      setActionLoading(false);
    };

    // Live answer count
    const handleAnswerCount = (payload) => {
      setAnsweredCount(payload.answeredCount || 0);
      setTotalPlayers(payload.totalPlayers || 0);
    };

    // Question reveal update with full leaderboard and answer distribution
    const handleLeaderboardUpdate = (payload) => {
      setGameState('revealed');
      setCorrectIndex(payload.correctIndex);
      setDistribution(payload.distribution || { 0: 0, 1: 0, 2: 0, 3: 0 });
      setLeaderboard(payload.leaderboard || []);
      setAnsweredCount(payload.answeredCount || 0);
      setTotalPlayers(payload.totalPlayers || 0);
      setIsLastQuestion(Boolean(payload.isLastQuestion));
      setActionLoading(false);
      soundManager.playCorrect();
    };

    const handleGameFinished = () => {
      navigate(`/podium/${cleanCode}`);
    };

    socket.on('question:adminNew', handleAdminQuestion);
    socket.on('question:answerCount', handleAnswerCount);
    socket.on('admin:leaderboardUpdate', handleLeaderboardUpdate);
    socket.on('game:finished', handleGameFinished);

    return () => {
      socket.off('question:adminNew', handleAdminQuestion);
      socket.off('question:answerCount', handleAnswerCount);
      socket.off('admin:leaderboardUpdate', handleLeaderboardUpdate);
      socket.off('game:finished', handleGameFinished);
    };
  }, [socket, cleanCode, navigate, soundManager]);

  // Admin triggers the first question or next question
  const handleSendQuestion = () => {
    setActionLoading(true);
    socket.emit('admin:sendQuestion', { roomCode: cleanCode }, (res) => {
      setActionLoading(false);
      if (!res?.success) {
        alert(res?.message || 'Failed to dispatch question');
      }
    });
  };

  const handleNextQuestion = () => {
    setActionLoading(true);
    socket.emit('admin:nextQuestion', { roomCode: cleanCode }, (res) => {
      setActionLoading(false);
      if (res?.finished) {
        navigate(`/podium/${cleanCode}`);
      } else if (!res?.success) {
        alert(res?.message || 'Failed to advance to next question');
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[90vh] flex flex-col justify-between">
      {/* Top Banner */}
      <div className="glass-panel px-6 py-4 rounded-3xl border border-white/10 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase px-3 py-1.5 rounded-full bg-brand-purple/20 text-brand-pink border border-brand-pink/30">
            {question ? `Question ${question.questionIndex + 1} of ${question.totalQuestions}` : 'Game Room'}
          </span>
          <span className="text-sm font-bold text-gray-300 hidden sm:inline-block">
            PIN: <span className="text-yellow-400 font-mono">{cleanCode}</span>
          </span>
        </div>

        {/* Live Answered Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/10 text-white font-extrabold text-xs sm:text-sm">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{answeredCount} / {totalPlayers || '0'} Answered</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-6 flex-1 flex flex-col justify-center">
        {gameState === 'waiting_first' && (
          <div className="glass-panel p-16 rounded-3xl text-center border border-white/10 shadow-2xl max-w-xl mx-auto">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-black text-white mb-2">Quiz is Ready!</h2>
            <p className="text-sm text-gray-400 mb-6">
              All players are connected in the lobby. Click "Send Question 1" to broadcast the first question to everyone.
            </p>
            <button
              onClick={handleSendQuestion}
              disabled={actionLoading}
              className="px-8 py-4 rounded-2xl bg-brand-purple hover:bg-brand-purple/90 text-white font-black text-base shadow-xl shadow-brand-purple/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {actionLoading ? 'Broadcasting...' : 'Send Question 1 Now'}
            </button>
          </div>
        )}

        {gameState === 'active' && question && (
          <div className="space-y-6">
            {/* Question Text & Timer Card */}
            <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/15 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <span className="text-xs uppercase font-extrabold text-brand-purple tracking-wider">
                  Active Question #{question.questionIndex + 1}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-2 leading-tight">
                  {question.text}
                </h2>
              </div>

              {/* Server-authoritative visual timer */}
              <div className="shrink-0">
                <CircularTimer secondsLeft={secondsLeft} totalDuration={20} size={110} strokeWidth={9} />
              </div>
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {question.options.map((optText, i) => (
                <AnswerOption
                  key={i}
                  index={i}
                  text={optText}
                  disabled={true}
                  isRevealed={false}
                />
              ))}
            </div>
          </div>
        )}

        {gameState === 'revealed' && question && (
          <div className="space-y-6">
            {/* Question Header Recap */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                  Question #{question.questionIndex + 1} Revealed
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {question.text}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 block">Correct Answer:</span>
                <span className="text-lg font-black text-emerald-400">
                  Option {String.fromCharCode(65 + correctIndex)}
                </span>
              </div>
            </div>

            {/* Answer Options Recap with counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((optText, i) => (
                <AnswerOption
                  key={i}
                  index={i}
                  text={optText}
                  disabled={true}
                  isRevealed={true}
                  correctIndex={correctIndex}
                  count={distribution[i] || 0}
                />
              ))}
            </div>

            {/* Distribution & Cumulative Leaderboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Distribution Bar Chart */}
              <div className="lg:col-span-1">
                <DistributionChart
                  distribution={distribution}
                  correctIndex={correctIndex}
                  totalAnswered={answeredCount}
                />
              </div>

              {/* Cumulative Leaderboard */}
              <div className="lg:col-span-2">
                <LeaderboardTable leaderboard={leaderboard} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Host Progression Bar */}
      {gameState === 'revealed' && (
        <div className="sticky bottom-6 z-30 glass-panel p-4 sm:p-5 rounded-3xl border border-white/15 shadow-2xl flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-gray-300">
            {isLastQuestion ? (
              <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> That was the final question!
              </span>
            ) : (
              <span>Ready for Question {question ? question.questionIndex + 2 : ''}?</span>
            )}
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={actionLoading}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
              isLastQuestion
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-yellow-500/30'
                : 'bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white shadow-brand-purple/30'
            }`}
          >
            <span>{isLastQuestion ? 'Show Final Podium' : 'Next Question'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
