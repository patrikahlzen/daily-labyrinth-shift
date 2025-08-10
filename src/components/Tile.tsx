import React from 'react';
import { GameTile, TileType } from '../types/game';
import { Key, Clock, Square, Gem } from 'lucide-react';

interface TileProps {
  tile: GameTile;
  isPlayer?: boolean;
  isGoal?: boolean;
  isPreview?: boolean;
}

export const Tile: React.FC<TileProps> = ({ tile, isPlayer, isGoal, isPreview }) => {
  const getPathElements = () => {
    const paths: React.ReactNode[] = [];
    
    if (tile.connections.north) {
      paths.push(
        <div key="north" className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-1/2 bg-foreground/80" />
      );
    }
    if (tile.connections.south) {
      paths.push(
        <div key="south" className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-1/2 bg-foreground/80" />
      );
    }
    if (tile.connections.east) {
      paths.push(
        <div key="east" className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1/2 h-2 bg-foreground/80" />
      );
    }
    if (tile.connections.west) {
      paths.push(
        <div key="west" className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1/2 h-2 bg-foreground/80" />
      );
    }

    return paths;
  };

  const getSpecialIcon = () => {
    switch (tile.special) {
      case 'key':
        return <Key className="w-4 h-4 text-accent animate-pulse" />;
      case 'time':
        return <Clock className="w-4 h-4 text-accent animate-pulse" />;
      case 'block':
        return <Square className="w-4 h-4 text-muted-foreground" />;
      case 'gem':
        return <Gem className="w-4 h-4 text-accent animate-pulse" />;
      default:
        return null;
    }
  };

  const getTileClassName = () => {
    let baseClass = "w-full h-full rounded-lg relative transition-all duration-300 ";
    
    if (tile.type === TileType.EMPTY) {
      baseClass += "bg-game-tile-empty ";
    } else {
      baseClass += "bg-gradient-tile shadow-tile ";
      if (tile.special) {
        baseClass += "bg-gradient-special ";
      }
    }

    if (isPreview) {
      baseClass += "ring-2 ring-primary ring-opacity-60 ";
    }

    if (isPlayer) {
      baseClass += "tile-glow ";
    }

    return baseClass;
  };

  return (
    <div className={getTileClassName()}>
      {/* Path connections */}
      {tile.type === TileType.PATH && getPathElements()}
      
      {/* Center dot for intersections */}
      {tile.type === TileType.PATH && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-foreground/80 rounded-full" />
      )}

      {/* Special items */}
      {tile.special && (
        <div className="absolute top-1 right-1">
          {getSpecialIcon()}
        </div>
      )}

      {/* Player */}
      {isPlayer && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-game-player rounded-full shadow-glow player-bounce border-2 border-foreground/20" />
        </div>
      )}

      {/* Goal */}
      {isGoal && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-game-goal rounded-lg shadow-glow goal-pulse border-2 border-accent/40 flex items-center justify-center">
            <Gem className="w-4 h-4 text-accent-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};