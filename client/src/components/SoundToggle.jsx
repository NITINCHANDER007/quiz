import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../context/SoundContext';

export default function SoundToggle({ className = '' }) {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <button
      onClick={toggleSound}
      title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
      className={`p-2.5 rounded-xl transition-all duration-200 border ${
        soundEnabled
          ? 'bg-brand-surface/80 text-yellow-400 border-yellow-400/30 hover:bg-brand-surface hover:border-yellow-400/60'
          : 'bg-brand-surface/50 text-gray-400 border-white/5 hover:text-white hover:bg-brand-surface'
      } ${className}`}
      aria-label="Toggle Sound"
    >
      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
    </button>
  );
}
