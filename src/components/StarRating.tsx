import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  stars: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ stars, maxStars = 1, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }, (_, index) => {
        const filled = index < stars;
        return (
          <Star
            key={index}
            className={`${sizeClasses[size]} transition-all duration-300 ${
              filled 
                ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                : 'fill-muted text-muted-foreground'
            }`}
          />
        );
      })}
    </div>
  );
};