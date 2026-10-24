import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Play,
  Edit,
  Trash2,
  FileJson,
  Download,
  Clock,
  HelpCircle,
  History,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiGetQuizzes, apiDeleteQuiz, apiGetGameHistory, getExportCSVUrl } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoomForId, setCreatingRoomForId] = useState(null);
  const [error, setError] = useState('');
  const { socket, isConnected } = useSocket();
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [quizRes, historyRes] = await Promise.all([
        apiGetQuizzes(),
        apiGetGameHistory(),
      ]);

      if (quizRes.success) {
        setQuizzes(quizRes.quizzes || []);
      } else {
        setError(quizRes.message || 'Failed to load quizzes');
      }

      if (historyRes.success) {
        setGameHistory(historyRes.games || []);
      }
    } catch (err) {
      setError(err.message || 'Network error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the quiz "${title}"?`)) {
      return;
    }
    try {
      const res = await apiDeleteQuiz(id);
      if (res.success) {
        setQuizzes((prev) => prev.filter((q) => q._id !== id));
      } else {
        alert(res.message || 'Failed to delete quiz');
      }
    } catch (err) {
      alert('Error deleting quiz: ' + err.message);
    }
  };

  const handleCreateRoom = (quizId) => {
    if (!socket || !isConnected) {
      alert('Connecting to real-time server... Please wait a moment.');
      return;
    }

    setCreatingRoomForId(quizId);

    socket.emit('admin:createRoom', { quizId, token }, (res) => {
      setCreatingRoomForId(null);
      if (res && res.success && res.roomCode) {
        navigate(`/host/lobby/${res.roomCode}`);
      } else {
        alert(res?.message || 'Failed to initialize game room');
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Host Control Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your 20-question quizzes, launch live game lobbies, and analyze past player performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/quiz/new"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-purple/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quiz</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quizzes Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-purple" />
            <span>Your Quizzes</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
            {quizzes.length} Quizzes Available
          </span>
        </div>

        {loading ? (
          <div className="glass-panel p-12 rounded-3xl text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Loading your quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border border-dashed border-white/20">
            <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Quizzes Found</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-1 mb-5">
              You haven't created any quizzes yet. Seed sample quizzes or build a new 20-question challenge!
            </p>
            <Link
              to="/admin/quiz/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-bold shadow-md hover:bg-brand-purple/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Quiz</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-brand-purple/50 transition-all duration-300 flex flex-col justify-between group shadow-xl relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border ${
                        quiz.questionCount === 20
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {quiz.questionCount} Questions {quiz.questionCount === 20 && '★ Complete'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-brand-pink transition-colors line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {quiz.description || 'No description provided.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/admin/quiz/edit/${quiz._id}`}
                      title="Edit Quiz"
                      className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(quiz._id, quiz.title)}
                      title="Delete Quiz"
                      className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleCreateRoom(quiz._id)}
                    disabled={creatingRoomForId === quiz._id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{creatingRoomForId === quiz._id ? 'Opening...' : 'Create Room'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Sessions History Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-pink" />
            <span>Recent Game Sessions & CSV Exports</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
            {gameHistory.length} Sessions
          </span>
        </div>

        {gameHistory.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-gray-400 text-sm">
            No game sessions recorded yet. Launch a game room above to play!
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20 text-xs uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4">Room PIN</th>
                    <th className="py-3 px-4">Quiz Title</th>
                    <th className="py-3 px-4 text-center">Players</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Date</th>
                    <th className="py-3 px-4 text-right">Results CSV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {gameHistory.map((game) => (
                    <tr key={game._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-yellow-400">
                        {game.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {game.quizTitle || 'Quiz'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-white/10 font-bold text-xs text-gray-200">
                          {game.players?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                            game.status === 'finished'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-brand-purple/20 text-brand-purple'
                          }`}
                        >
                          {game.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-400">
                        {new Date(game.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={getExportCSVUrl(game.code)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-pink" />
                          <span>Export CSV</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
