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
      {/* Compact Prism Header */}
      <header className="gamebar theme-prism">
        <div>
          <div className="display-xl">Daily&nbsp;Challenge</div>
          <div className="meta" style={{opacity: 0.8}}>Puzzle #{String(new Date().getDate()).padStart(2,'0')} • Today</div>
        </div>
        <div style={{display: 'flex', gap: '.5rem', alignItems: 'center'}}>
          <span className="pill">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="counter text-sm sm:text-base">{formatTime(timer)}</span>
          </span>
          <span className="pill pill--hot">
            <strong className="text-sm sm:text-base">{moves}</strong>&nbsp;<span className="hidden sm:inline">moves</span><span className="sm:hidden">m</span>
          </span>
        </div>
      </header>

      {/* Compact bottom controls */}
      <div className="flex justify-center">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="pill group flex items-center gap-2 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
        >
          <Undo2 className="w-3 h-3 sm:w-4 sm:h-4 group-hover:text-accent transition-colors" />
          <span className="text-xs sm:text-sm font-medium">Undo ({3 - undoUsage})</span>
        </button>
      </div>
    </div>
  );
};