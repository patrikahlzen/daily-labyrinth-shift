import React from 'react';
import { Direction } from '../types/game';
import { Button } from './ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DirectionPickerProps {
  options: Direction[];
  onChoose: (dir: Direction) => void;
}

export const DirectionPicker: React.FC<DirectionPickerProps> = ({ options, onChoose }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-full h-full">
        {options.includes('up') && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onChoose('up')}
            className="absolute top-1.5 left-1/2 -translate-x-1/2 pointer-events-auto"
            aria-label="Choose up"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        )}
        {options.includes('down') && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onChoose('down')}
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 pointer-events-auto"
            aria-label="Choose down"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        )}
        {options.includes('left') && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onChoose('left')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-auto"
            aria-label="Choose left"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        {options.includes('right') && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onChoose('right')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-auto"
            aria-label="Choose right"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
