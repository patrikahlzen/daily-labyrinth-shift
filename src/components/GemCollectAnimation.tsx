import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface GemCollectAnimationProps {
  position: { x: number; y: number };
  onComplete: () => void;
}

export const GemCollectAnimation: React.FC<GemCollectAnimationProps> = ({ 
  position, 
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Main gem collect animation */}
      <div className="gem-collect">
        <Sparkles className="w-8 h-8 text-accent" 
                   style={{ filter: 'drop-shadow(0 0 12px hsl(var(--gem-collect) / 0.8))' }} />
      </div>
      
      {/* Particle effects */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-accent rounded-full animate-ping"
          style={{
            left: `${20 + i * 10}px`,
            top: `${10 + (i % 2) * 15}px`,
            animationDelay: `${i * 100}ms`,
            animationDuration: '600ms'
          }}
        />
      ))}
      
      {/* Text feedback */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 animate-fade-in">
        <span className="text-sm font-bold text-accent bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-accent/30">
          +Gem!
        </span>
      </div>
    </div>
  );
};