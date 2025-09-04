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
    // Guldig konfetti när man vunnit
    const confettiConfig =
      stars >= 1
        ? { particleCount: 220, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FFCF40', '#E6B800'] }
        : { particleCount: 140, spread: 70, origin: { y: 0.6 } };
    confetti(confettiConfig);
  }, [stars]);

  const shareText = `${t('game.title')} #${String(puzzleNumber).padStart(2, '0')} — ${stars}⭐ ${t(
    'game.time'
  )} ${formatTime(timer)} • ${t('game.moves')} ${moves}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: t('game.title'), text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast({ title: t('game.copied'), description: t('game.copiedDescription') });
      }
    } catch {
      // no-op
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-title"
    >
      {/* Lägg 'win' för att aktivera guldtema i panelen */}
      <article className="finish-overlay win">
        {/* Stäng-knapp */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('game.close')}
          onClick={onClose}
          className="absolute top-4 right-4 z-50 opacity-70 hover:opacity-100"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Trophy + rubrik + stjärnrad / meddelande */}
        <div className="finish-celebration">
          <div className="finish-trophy">
            <Trophy />
          </div>

          <h2 id="win-title" className="finish-title">
            {t('game.puzzleSolved')}
          </h2>
          <p className="finish-sub">{t('game.congrats') ?? ''}</p>

          <div className="finish-message">
            <div className="star-row mb-3">
              {/* Visa upp till 3 stjärnor – StarRating hanterar fyllda/tomma */}
              <StarRating stars={stars} size="lg" maxStars={3} />
            </div>
            <p className="font-medium mb-1">{starDescription}</p>
            {stars < 1 && <p className="text-sm opacity-80">{nextRequirement}</p>}
          </div>
        </div>

        {/* Stats */}
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

        {/* Actions */}
        <div className="finish-actions space-y-3">
          {/* Primär: guld-CTA (harmoniserar med övriga CTA-stilen) */}
          <Button onClick={handleShare} className="btn-cta--gold w-full flex items-center gap-2 justify-center">
            <Share2 className="w-4 h-4" /> {t('game.share')}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            {attempts > 1 && (
              <Button variant="outline" onClick={onTryAgain} className="justify-center pill">
                {t('game.tryAgain')}
              </Button>
            )}
            <Button
              onClick={onClose}
              className={`btn-ghost win-ghost justify-center ${attempts > 1 ? '' : 'col-span-2'}`}
            >
              {t('game.close')}
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
};