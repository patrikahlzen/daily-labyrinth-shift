import React from 'react';
import { Clock, SkipBack, Undo2, Target } from 'lucide-react';

interface GameHUDProps {
  timer: number;
  moves: number;
  canUndo: boolean;
  canRewind: boolean;
  onUndo: () => void;
  onRewind: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  timer,
  moves,
  canUndo,
  canRewind,
  onUndo,
  onRewind
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Enhanced Top HUD with liquid glass design */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3">
          Dagens Utmaning
        </h1>
        <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-medium">{formatTime(timer)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Target className="w-4 h-4 text-accent" />
            <span className="font-medium">{moves} drag</span>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom HUD with glass morphism */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onRewind}
          disabled={!canRewind}
          className="group flex items-center gap-2 px-5 py-2.5 bg-card/70 backdrop-blur-sm border border-border/50 text-foreground rounded-xl hover:bg-card/90 hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-glow"
        >
          <SkipBack className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span className="font-medium">Återställ</span>
        </button>
        
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="group flex items-center gap-2 px-5 py-2.5 bg-card/70 backdrop-blur-sm border border-border/50 text-foreground rounded-xl hover:bg-card/90 hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-glow"
        >
          <Undo2 className="w-4 h-4 group-hover:text-accent transition-colors" />
          <span className="font-medium">Ångra</span>
        </button>
      </div>
    </>
  );
};