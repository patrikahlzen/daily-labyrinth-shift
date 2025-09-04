import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/button';
import { Share2, X, Clock, Move, Trophy, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateStarRating, getStarDescription, getNextStarRequirement } from '../utils/scoring';
import { GameTile } from '../types/game';
import { t } from '../utils/i18n';

interface EndScreenProps {
  timer: number;
  moves: number;
  puzzleNumber: number;
  stars: number;              // 0 eller 1
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
  onTryAgain,
}) => {
  const { toast } = useToast();

  const rating = calculateStarRating(true, moves, board, gemsCollected);
  const starDescription = getStarDescription(stars);
  const nextRequirement = getNextStarRequirement(stars, moves, rating.thresholds);

  useEffect(() => {
    const cfg =
      stars >= 1
        ? { particleCount: 220, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FFCF40', '#E6B800'] }
        : { particleCount: 140, spread: 70, origin: { y: 0.6 } };
    confetti(cfg);
  }, [stars]);

  const shareText = `${t('game.title')} #${String(puzzleNumber).padStart(2, '0')} — ${stars}⭐ ${t('game.time')} ${formatTime(timer)} • ${t('game.moves')} ${moves}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: t('game.title'), text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast({ title: t('game.copied'), description: t('game.copiedDescription') });
      }
    } catch {/* no-op */}
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-title"
    >
      {/* is-compact aktiverar centrerad, staplad layout; win = guldstil */}
      <article className="finish-overlay win is-compact">
        {/* Stäng */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('game.close')}
          onClick={onClose}
          className="absolute top-4 right-4 z-50 opacity-70 hover:opacity-100"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* HERO */}
        <div className="finish-hero finish-celebration">
          <div className="finish-trophy">
            <Trophy />
          </div>
          <h2 id="win-title" className="finish-title">
            {t('game.puzzleSolved')}
          </h2>
          {/* Ingen t('game.congrats') här → inga TS-problem */}
        </div>

        {/* STATS */}
        <section className="finish-stats space-y-2">
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

        {/* ACTIONS */}
        <div className="finish-actions">
          <Button onClick={handleShare} className="btn-cta--gold flex items-center gap-2 justify-center">
            <Share2 className="w-4 h-4" /> {t('game.share')}
          </Button>
          <Button onClick={onClose} className="btn-ghost win-ghost">
            {t('game.close')}
          </Button>
        </div>

        {/* CALLOUT */}
        <div className="finish-callout">
          <div className="finish-message">
            <div className="flex justify-center mb-3">
              {stars >= 1 ? (
                <Star className="w-6 h-6 star-gold" fill="currentColor" />
              ) : (
                <Star className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <p className="font-medium mb-1">{starDescription}</p>
            {stars < 1 && <p className="text-sm opacity-80">{nextRequirement}</p>}
          </div>
        </div>
      </article>
    </div>
  );
};
