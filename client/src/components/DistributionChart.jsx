import React from 'react';

const BARS = [
  { key: 0, label: 'A', shape: '▲', color: 'bg-kahoot-red', text: 'text-red-400' },
  { key: 1, label: 'B', shape: '◆', color: 'bg-kahoot-blue', text: 'text-blue-400' },
  { key: 2, label: 'C', shape: '●', color: 'bg-kahoot-yellow', text: 'text-yellow-400' },
  { key: 3, label: 'D', shape: '■', color: 'bg-kahoot-green', text: 'text-green-400' },
];

export default function DistributionChart({
  distribution = { 0: 0, 1: 0, 2: 0, 3: 0 },
  correctIndex = null,
  totalAnswered = 0,
}) {
  const counts = [
    distribution[0] || 0,
    distribution[1] || 0,
    distribution[2] || 0,
    distribution[3] || 0,
  ];

  const maxCount = Math.max(1, ...counts);

  return (
    <div className="w-full glass-panel p-6 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-200 flex items-center gap-2">
          <span>📊</span> Answer Distribution
        </h4>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
          Total Answers: {totalAnswered}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:gap-6 h-48 items-end pt-6 pb-2">
        {BARS.map((bar, i) => {
          const count = counts[i];
          const heightPercent = Math.max(12, Math.round((count / maxCount) * 100));
          const isCorrect = correctIndex === i;

          return (
            <div key={bar.label} className="flex flex-col items-center h-full justify-end group">
              {/* Count indicator on top of bar */}
              <div className="mb-2 text-center transition-transform group-hover:scale-110">
                <span className="text-base sm:text-lg font-black text-white drop-shadow">
                  {count}
                </span>
                {isCorrect && (
                  <span className="block text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    Correct
                  </span>
                )}
              </div>

              {/* Animated Vertical Bar */}
              <div className="w-full max-w-[65px] bg-white/5 rounded-t-xl overflow-hidden p-1 flex items-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out ${bar.color} ${
                    isCorrect ? 'ring-2 ring-emerald-300 brightness-110 shadow-lg shadow-emerald-500/20' : 'opacity-85'
                  }`}
                />
              </div>

              {/* Bottom Option Label & Shape */}
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white drop-shadow">{bar.shape}</span>
                <span className="text-xs sm:text-sm font-black text-gray-300">{bar.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
