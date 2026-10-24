import React from 'react';

export default function AvatarBadge({
  avatar = '🦊',
  name = 'Player',
  score = null,
  rank = null,
  isSelf = false,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  status = null, // 'connected', 'disconnected', 'answered'
}) {
  const sizeMap = {
    sm: { box: 'p-2', avatar: 'text-2xl', text: 'text-xs' },
    md: { box: 'p-3', avatar: 'text-3xl sm:text-4xl', text: 'text-sm sm:text-base' },
    lg: { box: 'p-4', avatar: 'text-5xl sm:text-6xl', text: 'text-lg sm:text-xl' },
    xl: { box: 'p-6', avatar: 'text-6xl sm:text-7xl', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center rounded-2xl glass-card transition-all duration-300 transform hover:scale-105 ${
        isSelf ? 'border-2 border-brand-purple ring-4 ring-brand-purple/20' : 'border border-white/10'
      } ${currentSize.box} animate-pop-in`}
    >
      {/* Rank indicator if provided */}
      {rank !== null && (
        <div className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-gradient-to-tr from-brand-purple to-brand-pink text-white font-black text-xs flex items-center justify-center shadow-md border border-white/20">
          #{rank}
        </div>
      )}

      {/* Avatar Emoji with playful bounce */}
      <div className={`filter drop-shadow-md transition-transform hover:scale-110 select-none ${currentSize.avatar} animate-bounce-subtle`}>
        {avatar}
      </div>

      {/* Name */}
      <span className={`font-bold text-gray-100 mt-1 max-w-[120px] truncate ${currentSize.text}`}>
        {name} {isSelf && <span className="text-brand-pink font-black text-xs">(You)</span>}
      </span>

      {/* Optional Score */}
      {score !== null && (
        <span className="mt-0.5 text-xs font-black px-2 py-0.5 rounded-full bg-white/10 text-yellow-400">
          {score} pts
        </span>
      )}

      {/* Optional status pill */}
      {status === 'answered' && (
        <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow">
          Ready
        </span>
      )}
    </div>
  );
}
