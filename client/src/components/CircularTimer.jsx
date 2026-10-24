import React, { useEffect } from 'react';
import { useSound } from '../context/SoundContext';

export default function CircularTimer({
  secondsLeft = 20,
  totalDuration = 20,
  size = 120,
  strokeWidth = 10,
}) {
  const { soundManager } = useSound();

  // Play ticks during last 5 seconds
  useEffect(() => {
    if (secondsLeft > 0 && secondsLeft <= 5) {
      soundManager.playUrgentTick();
    } else if (secondsLeft > 5 && secondsLeft <= 10) {
      soundManager.playTick();
    }
  }, [secondsLeft]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, secondsLeft / totalDuration));
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Dynamic color coding
  let strokeColor = '#00B894'; // Emerald green
  let glowClass = 'drop-shadow-[0_0_8px_rgba(0,184,148,0.6)]';
  if (secondsLeft <= 5) {
    strokeColor = '#E21B3C'; // Red
    glowClass = 'drop-shadow-[0_0_12px_rgba(226,27,60,0.8)] animate-pulse';
  } else if (secondsLeft <= 10) {
    strokeColor = '#FFA602'; // Amber
    glowClass = 'drop-shadow-[0_0_10px_rgba(255,166,2,0.7)]';
  }

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated countdown circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className={`transition-all duration-300 ease-linear ${glowClass}`}
        />
      </svg>
      {/* Centered seconds number */}
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className={`font-black tracking-tight ${
            secondsLeft <= 5 ? 'text-red-400 scale-110' : 'text-white'
          } transition-transform duration-200`}
          style={{ fontSize: size * 0.32 }}
        >
          {Math.max(0, Math.ceil(secondsLeft))}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 -mt-1">
          sec
        </span>
      </div>
    </div>
  );
}
