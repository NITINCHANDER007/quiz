import React from 'react';
import { Trophy, Medal, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function LeaderboardTable({ leaderboard = [], showDetails = true }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-gray-400">
        <p className="text-base font-semibold">No players joined yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl">
      <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <h4 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span>Cumulative Leaderboard</span>
        </h4>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-purple/20 text-brand-pink border border-brand-pink/20">
          {leaderboard.length} Contenders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-400 bg-black/20">
              <th className="py-3 px-4 text-center w-16">Rank</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4 text-right">Score</th>
              {showDetails && (
                <>
                  <th className="py-3 px-4 text-center">Correct</th>
                  <th className="py-3 px-4 text-center">Time</th>
                  <th className="py-3 px-4 text-center">Last Answer</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {leaderboard.map((player) => {
              // Special badges for top 3
              let rankBadge = (
                <span className="w-7 h-7 rounded-full bg-white/10 text-gray-300 font-bold text-xs inline-flex items-center justify-center">
                  #{player.rank}
                </span>
              );

              if (player.rank === 1) {
                rankBadge = (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-black font-black text-xs inline-flex items-center justify-center shadow-md shadow-yellow-500/30 ring-2 ring-yellow-300">
                    🥇
                  </span>
                );
              } else if (player.rank === 2) {
                rankBadge = (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-300 to-slate-100 text-black font-black text-xs inline-flex items-center justify-center shadow-md shadow-slate-300/30 ring-2 ring-slate-200">
                    🥈
                  </span>
                );
              } else if (player.rank === 3) {
                rankBadge = (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-md shadow-amber-600/30 ring-2 ring-amber-500">
                    🥉
                  </span>
                );
              }

              return (
                <tr
                  key={player.playerId}
                  className="hover:bg-white/5 transition-colors duration-150 group"
                >
                  {/* Rank */}
                  <td className="py-3 px-4 text-center font-bold">{rankBadge}</td>

                  {/* Player Avatar + Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow group-hover:scale-110 transition-transform">
                        {player.avatar}
                      </span>
                      <div>
                        <div className="font-extrabold text-white text-base flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {!player.connected && (
                            <span className="text-[10px] text-gray-500 font-normal">
                              (away)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3 px-4 text-right">
                    <span className="text-base sm:text-lg font-black text-yellow-400 drop-shadow">
                      {player.score}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">pts</span>
                  </td>

                  {/* Optional Detailed Metrics */}
                  {showDetails && (
                    <>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-200">
                          {player.correctCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-xs text-gray-300 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {player.totalTime}s
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {player.lastAnswerCorrect === true ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>+10</span>
                          </span>
                        ) : player.lastAnswerCorrect === false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>0</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
