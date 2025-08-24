import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/button';
import { Share2, X, Clock, Move, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './StarRating';
import { calculateStarRating, getStarDescription, getNextStarRequirement } from '../utils/scoring';
import { GameTile } from '../types/game';

interface EndScreenProps {
  timer: number;
  moves: number;
  puzzleNumber: number;
  stars: number;
  board: GameTile[][];
  gemsCollected: number;
  attempts: number;
  onClose: () => void;
  onTryAgain: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const EndScreen: React.FC<EndScreenProps> = ({ 
  timer, 
  moves, 
  puzzleNumber, 
  stars, 
  board, 
  gemsCollected, 
  attempts,
  onClose,
  onTryAgain
}) => {
  const { toast } = useToast();

  const rating = calculateStarRating(true, moves, board, gemsCollected);
  const starDescription = getStarDescription(stars);
  const nextRequirement = getNextStarRequirement(stars, moves, rating.thresholds);

  useEffect(() => {
    // Golden celebration if earned
    const confettiConfig = stars >= 1 
      ? { particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500', '#FFCF40'] }
      : { particleCount: 120, spread: 70, origin: { y: 0.6 } };
    
    confetti(confettiConfig);
  }, [stars]);

  const shareText = `Daily Labyrinth #${String(puzzleNumber).padStart(2,'0')} — ${stars}⭐ Time ${formatTime(timer)} • Moves ${moves}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Daily Labyrinth', text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast({ title: 'Copied!', description: 'Your result has been copied to the clipboard.' });
      }
    } catch (e) {
      // no-op
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" role="dialog" aria-modal="true">
      <article className="w-full max-w-sm mx-4 bg-card rounded-2xl shadow-game p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Puzzle Solved!</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </header>

        <section className="text-center mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex justify-center mb-3">
            <StarRating stars={stars} size="lg" maxStars={1} />
          </div>
          <p className="text-foreground font-medium mb-2">{starDescription}</p>
          {stars < 1 && (
            <p className="text-sm text-muted-foreground">{nextRequirement}</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Time</span>
            </div>
            <span className="font-mono">{formatTime(timer)}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-foreground">
              <Move className="w-4 h-4 text-muted-foreground" />
              <span>Moves</span>
            </div>
            <span className="font-mono">{moves}</span>
          </div>
        </section>

        <footer className="mt-6 space-y-2">
          <Button onClick={handleShare} className="w-full flex items-center gap-2 justify-center bg-gradient-primary">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {attempts > 1 && (
              <Button variant="outline" onClick={onTryAgain} className="justify-center">
                Try Again
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={onClose} 
              className={`justify-center ${attempts > 1 ? '' : 'col-span-2'}`}
            >
              Close
            </Button>
          </div>
        </footer>
      </article>
    </div>
  );
};
