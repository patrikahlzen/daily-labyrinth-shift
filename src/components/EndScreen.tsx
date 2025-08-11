import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/button';
import { Share2, X, Clock, Move } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EndScreenProps {
  timer: number;
  moves: number;
  puzzleNumber: number;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const EndScreen: React.FC<EndScreenProps> = ({ timer, moves, puzzleNumber, onClose }) => {
  const { toast } = useToast();

  useEffect(() => {
    // Celebrate once on mount
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, []);

  const shareText = `Daily Labyrinth #${String(puzzleNumber).padStart(2,'0')} — Tid ${formatTime(timer)} • Drag ${moves}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Daily Labyrinth', text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast({ title: 'Kopierat!', description: 'Resultatet har kopierats till urklipp.' });
      }
    } catch (e) {
      // no-op
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" role="dialog" aria-modal="true">
      <article className="w-full max-w-sm mx-4 bg-card rounded-2xl shadow-game p-6">
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Pussel klart!</h2>
          <Button variant="ghost" size="icon" aria-label="Stäng" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Tid</span>
            </div>
            <span className="font-mono">{formatTime(timer)}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-foreground">
              <Move className="w-4 h-4 text-muted-foreground" />
              <span>Drag</span>
            </div>
            <span className="font-mono">{moves}</span>
          </div>
        </section>

        <footer className="mt-6 grid grid-cols-2 gap-2">
          <Button onClick={handleShare} className="flex items-center gap-2 justify-center bg-gradient-primary">
            <Share2 className="w-4 h-4" /> Dela
          </Button>
          <Button variant="secondary" onClick={onClose} className="justify-center">Stäng</Button>
        </footer>
      </article>
    </div>
  );
};
