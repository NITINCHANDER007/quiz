import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundManager } from '../utils/soundEffects';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('wayground_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    soundManager.setMuted(!soundEnabled);
    localStorage.setItem('wayground_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, soundManager }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
