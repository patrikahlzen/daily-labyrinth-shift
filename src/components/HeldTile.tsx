import React from 'react';
import { Tile } from './Tile';
import { GameTile } from '../types/game';

interface HeldTileProps {
  tile: GameTile | null;
}

export const HeldTile: React.FC<HeldTileProps> = ({ tile }) => {
  if (!tile) return null;

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <span className="text-xs text-muted-foreground font-medium">Next Tile</span>
      <div className="w-16 h-16 bg-card rounded-lg shadow-tile">
        <Tile tile={tile} />
      </div>
    </div>
  );
};