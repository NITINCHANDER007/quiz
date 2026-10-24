import React from 'react';
import { Check, X, Lock } from 'lucide-react';

const OPTION_STYLES = [
  {
    letter: 'A',
    shape: '▲',
    shapeName: 'Triangle',
    bg: 'bg-kahoot-red',
    hover: 'hover:bg-[#f02b4d]',
    border: 'border-red-400/40',
    shadow: 'shadow-kahoot-red/40',
  },
  {
    letter: 'B',
    shape: '◆',
    shapeName: 'Diamond',
    bg: 'bg-kahoot-blue',
    hover: 'hover:bg-[#1a7de6]',
    border: 'border-blue-400/40',
    shadow: 'shadow-kahoot-blue/40',
  },
  {
    letter: 'C',
    shape: '●',
    shapeName: 'Circle',
    bg: 'bg-kahoot-yellow',
    hover: 'hover:bg-[#ffb424]',
    border: 'border-yellow-400/40',
    shadow: 'shadow-kahoot-yellow/40',
  },
  {
    letter: 'D',
    shape: '■',
    shapeName: 'Square',
    bg: 'bg-kahoot-green',
    hover: 'hover:bg-[#309f13]',
    border: 'border-green-400/40',
    shadow: 'shadow-kahoot-green/40',
  },
];

export default function AnswerOption({
  index,
  text,
  onClick,
  isSelected = false,
  isRevealed = false,
  isCorrect = false,
  correctIndex = null,
  disabled = false,
  showFullText = true,
  count = null, // count for distribution
}) {
  const style = OPTION_STYLES[index] || OPTION_STYLES[0];
  const isActualCorrect = correctIndex === index;

  // Reveal styling decisions
  let revealClasses = '';
  if (isRevealed) {
    if (isActualCorrect) {
      revealClasses = 'ring-4 ring-emerald-400 scale-[1.02] shadow-2xl z-10 brightness-110';
    } else if (isSelected && !isCorrect) {
      revealClasses = 'opacity-85 ring-4 ring-red-500 line-through';
    } else {
      revealClasses = 'opacity-35 grayscale-[40%] scale-[0.98]';
    }
  } else if (isSelected) {
    revealClasses = 'ring-4 ring-white scale-[1.02] shadow-2xl';
  }

  return (
    <button
      type="button"
      onClick={!disabled && !isRevealed ? () => onClick(index) : undefined}
      disabled={disabled || isRevealed}
      className={`relative w-full min-h-[90px] sm:min-h-[120px] p-4 sm:p-6 rounded-2xl ${style.bg} ${
        !disabled && !isRevealed ? style.hover + ' cursor-pointer active:scale-95' : 'cursor-default'
      } text-white font-bold transition-all duration-200 flex items-center justify-between shadow-lg ${
        style.shadow
      } ${revealClasses}`}
    >
      <div className="flex items-center gap-3 sm:gap-4 w-full">
        {/* Shape and Letter badge */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/25 flex items-center justify-center shrink-0 border border-white/20">
          <span className="text-xl sm:text-2xl drop-shadow">{style.shape}</span>
        </div>

        {/* Option text */}
        {showFullText && (
          <div className="text-left flex-1 break-words">
            <span className="text-base sm:text-xl lg:text-2xl font-bold leading-snug drop-shadow-sm">
              {text}
            </span>
          </div>
        )}

        {/* Selected badge */}
        {isSelected && !isRevealed && (
          <div className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-xs sm:text-sm font-black tracking-wide uppercase shrink-0">
            <Lock className="w-4 h-4" />
            <span>Locked</span>
          </div>
        )}

        {/* Distribution count badge if displayed on host */}
        {count !== null && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/30 border border-white/20 text-sm font-extrabold shrink-0">
            <span>{count} answers</span>
          </div>
        )}

        {/* Revealed status badge */}
        {isRevealed && (
          <div className="ml-auto shrink-0">
            {isActualCorrect ? (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce-subtle">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
            ) : isSelected ? (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-lg">
                <X className="w-6 h-6 stroke-[3]" />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </button>
  );
}
