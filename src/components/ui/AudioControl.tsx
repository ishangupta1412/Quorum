'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '@/lib/sound/audio-cues';

interface AudioControlProps {
  className?: string;
  showLabel?: boolean;
}

export function AudioControl({ className = '', showLabel = false }: AudioControlProps) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundEngine.isMuted());

    const handleAudioToggle = (e: Event) => {
      const custom = e as CustomEvent<{ muted: boolean }>;
      if (custom.detail) {
        setMuted(custom.detail.muted);
      }
    };

    window.addEventListener('quorum-audio-toggle', handleAudioToggle);
    return () => window.removeEventListener('quorum-audio-toggle', handleAudioToggle);
  }, []);

  const handleToggle = () => {
    const next = soundEngine.toggleMute();
    setMuted(next);
    if (!next) {
      soundEngine.playThreatAlert();
    }
  };

  return (
    <button
      onClick={handleToggle}
      title={muted ? 'Unmute Audio Cues (Tactile radar & alert sounds)' : 'Mute Audio Cues'}
      className={`flex items-center justify-center gap-1.5 transition-all duration-150 rounded ${className}`}
      aria-label={muted ? 'Unmute audio' : 'Mute audio'}
    >
      {muted ? (
        <VolumeX className="w-4 h-4 text-slate-500" />
      ) : (
        <Volume2 className="w-4 h-4 text-[#10B981]" />
      )}
      {showLabel && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {muted ? 'Muted' : 'Audio ON'}
        </span>
      )}
    </button>
  );
}
