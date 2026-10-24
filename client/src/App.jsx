import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SoundProvider } from './context/SoundContext';

import Navbar from './components/Navbar';
import PlayerJoin from './pages/PlayerJoin';
import PlayerLobby from './pages/PlayerLobby';
import PlayerGame from './pages/PlayerGame';
import FinalPodium from './pages/FinalPodium';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import QuizEditor from './pages/QuizEditor';
import HostLobby from './pages/HostLobby';
import HostGame from './pages/HostGame';

// Protected route wrapper for Admin views
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <SoundProvider>
            <div className="min-h-screen flex flex-col bg-[#12121e] text-white">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Player Experience Routes */}
                  <Route path="/" element={<PlayerJoin />} />
                  <Route path="/join" element={<PlayerJoin />} />
                  <Route path="/join/:code" element={<PlayerJoin />} />
                  <Route path="/lobby/:roomCode" element={<PlayerLobby />} />
                  <Route path="/game/:roomCode" element={<PlayerGame />} />
                  <Route path="/podium/:roomCode" element={<FinalPodium />} />

                  {/* Admin Auth Route */}
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Protected Host/Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/quiz/new"
                    element={
                      <ProtectedAdminRoute>
                        <QuizEditor />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/quiz/edit/:id"
                    element={
                      <ProtectedAdminRoute>
                        <QuizEditor />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/host/lobby/:roomCode"
                    element={
                      <ProtectedAdminRoute>
                        <HostLobby />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/host/game/:roomCode"
                    element={
                      <ProtectedAdminRoute>
                        <HostGame />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </SoundProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
