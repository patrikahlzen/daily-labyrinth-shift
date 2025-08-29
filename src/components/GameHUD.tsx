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
    <>
      {/* Prism Theme Header */}
      <header className="gamebar theme-prism mb-6">
        <div>
          <div className="display-xl">Daily&nbsp;Challenge</div>
          <div className="meta" style={{opacity: 0.8}}>Puzzle #{String(new Date().getDate()).padStart(2,'0')} • Today</div>
        </div>
        <div style={{display: 'flex', gap: '.5rem', alignItems: 'center'}}>
          <span className="pill">
            <Clock className="w-4 h-4" />
            <span className="counter">{formatTime(timer)}</span>
          </span>
          <span className="pill pill--hot">
            <strong>{moves}</strong>&nbsp;moves
          </span>
        </div>
      </header>

      {/* Enhanced Bottom HUD with glass morphism */}
      <div className="flex justify-center">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="group flex items-center gap-2 px-6 py-3 bg-card/70 backdrop-blur-sm border border-border/50 text-foreground rounded-xl hover:bg-card/90 hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-glow"
        >
          <Undo2 className="w-4 h-4 group-hover:text-accent transition-colors" />
          <span className="font-medium">Undo ({3 - undoUsage} kvar)</span>
        </button>
      </div>
    </>
  );
};