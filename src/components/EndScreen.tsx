import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/button';
import { Share2, X, Clock, Move, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './StarRating';
import { calculateStarRating, getStarDescription, getNextStarRequirement } from '../utils/scoring';
import { GameTile } from '../types/game';
import { t } from '../utils/i18n';

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

  const shareText = `${t('game.title')} #${String(puzzleNumber).padStart(2,'0')} — ${stars}⭐ ${t('game.time')} ${formatTime(timer)} • ${t('game.moves')} ${moves}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: t('game.title'), text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast({ 
          title: t('game.copied'), 
          description: t('game.copiedDescription')
        });
      }
    } catch (e) {
      // no-op
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" role="dialog" aria-modal="true">
      <article className="finish-overlay gamebar w-full max-w-sm mx-4">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-prism flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="display-xl" style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}>
              {t('game.puzzleSolved')}
            </h2>
          </div>
          <Button variant="ghost" size="icon" aria-label={t('game.close')} onClick={onClose} className="pill">
            <X className="w-4 h-4" />
          </Button>
        </header>

        <section className="text-center mb-6 p-4 rounded-xl" style={{ background: 'var(--gradient-prism)', opacity: 0.1 }}>
          <div className="flex justify-center mb-3">
            <StarRating stars={stars} size="lg" maxStars={1} />
          </div>
          <p className="text-foreground font-medium mb-2 meta">{starDescription}</p>
          {stars < 1 && (
            <p className="text-sm text-muted-foreground meta">{nextRequirement}</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="pill flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-prism-b" />
              <span className="meta">{t('game.time')}</span>
            </div>
            <span className="counter">{formatTime(timer)}</span>
          </div>
          <div className="pill flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground">
              <Move className="w-4 h-4 text-prism-a" />
              <span className="meta">{t('game.moves')}</span>
            </div>
            <span className="counter">{moves}</span>
          </div>
        </section>

        <footer className="finish-actions mt-6 space-y-2">
          <Button onClick={handleShare} className="w-full flex items-center gap-2 justify-center pill pill--hot">
            <Share2 className="w-4 h-4" /> {t('game.share')}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {attempts > 1 && (
              <Button variant="outline" onClick={onTryAgain} className="justify-center pill">
                {t('game.tryAgain')}
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={onClose} 
              className={`justify-center pill ${attempts > 1 ? '' : 'col-span-2'}`}
            >
              {t('game.close')}
            </Button>
          </div>
        </footer>
      </article>
    </div>
  );
};
