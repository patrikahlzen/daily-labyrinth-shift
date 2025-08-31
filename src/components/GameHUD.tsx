import React from 'react';
import { Clock, SkipBack, Undo2, Target } from 'lucide-react';

interface GameHUDProps {
  timer: number;
  moves: number;
  canUndo: boolean;
  onUndo: () => void;
  undoUsage?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  timer,
  moves,
  canUndo,
  onUndo,
  undoUsage = 0
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* BOLD HEADER */}
      <header className="gamebar theme-prism">
        <div>
          <div className="display-xl">Daily Challenge</div>
          <div className="header-text text-white">Puzzle #{String(new Date().getDate()).padStart(2,'0')} • Today</div>
        </div>
        <div style={{display: 'flex', gap: '.75rem', alignItems: 'center'}}>
          <span className="pill">
            <Clock className="w-4 h-4" />
            <span className="counter font-bold">{formatTime(timer)}</span>
          </span>
          <span className="pill pill--hot">
            <strong className="text-lg font-black">{moves}</strong>&nbsp;<span className="font-bold">moves</span>
          </span>
        </div>
      </header>

      {/* BOLD UNDO BUTTON */}
      <div className="flex justify-center">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="pill group flex items-center gap-2 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 font-bold text-lg backdrop-blur-xl"
        >
          <span className="text-xl group-hover:text-accent transition-colors">⟲</span>
          <span className="font-black">{3 - undoUsage}</span>
        </button>
      </div>
    </div>
  );
};