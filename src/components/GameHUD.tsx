import React from 'react';
import { Timer, Move, Target, Undo, Check } from 'lucide-react';
import { Button } from './ui/button';

interface GameHUDProps {
  timer: number;
  moves: number;
  canUndo: boolean;
  onUndo: () => void;
  onConfirmMove: () => void;
  hasUnconfirmedMove: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  timer,
  moves,
  canUndo,
  onUndo,
  onConfirmMove,
  hasUnconfirmedMove
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Top HUD */}
      <div className="flex justify-between items-center p-4 bg-card/50 backdrop-blur-sm rounded-2xl mx-4 mt-4 shadow-tile">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-game-goal" />
          <span className="text-sm font-medium text-game-goal">Daily Quest</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono">{formatTime(timer)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Move className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono">{moves}</span>
          </div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="flex justify-between items-center p-4 mx-4 mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-2"
        >
          <Undo className="w-4 h-4" />
          Undo
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onConfirmMove}
          disabled={!hasUnconfirmedMove}
          className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
        >
          <Check className="w-4 h-4" />
          Confirm Move
        </Button>
      </div>
    </>
  );
};