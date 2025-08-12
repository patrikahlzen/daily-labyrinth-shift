import React from 'react';
import { GameTile, TileType } from '../types/game';
import { Clock, Square, Gem, Zap } from 'lucide-react';

interface TileProps {
  tile: GameTile;
  isPlayer?: boolean;
  isGoal?: boolean;
  isPreview?: boolean;
  isStart?: boolean;
  isEnergized?: boolean;
}

export const Tile: React.FC<TileProps> = ({ tile, isPlayer, isGoal, isPreview, isStart, isEnergized }) => {
  const renderPathMask = () => {
    if (tile.type !== TileType.PATH) return null;

    const thickness = 30; // ~30% of tile size
    const half = 50;

    const maskId = `tile-mask-${tile.id}`;

    return (
      <mask id={maskId} maskUnits="userSpaceOnUse">
        <rect x="0" y="0" width="100" height="100" fill="black" />
        <g stroke="white" strokeWidth={thickness} strokeLinecap="round" fill="none">
          {tile.connections.north && (
            <line x1={half} y1={half} x2={half} y2={0} />
          )}
          {tile.connections.south && (
            <line x1={half} y1={half} x2={half} y2={100} />
          )}
          {tile.connections.east && (
            <line x1={half} y1={half} x2={100} y2={half} />
          )}
          {tile.connections.west && (
            <line x1={half} y1={half} x2={0} y2={half} />
          )}
        </g>
      </mask>
    );
  };

  const getSpecialIcon = () => {
    switch (tile.special) {
      case 'key':
        return null; // Hide key tile visuals for now
      case 'time':
        return null; // Hide time icon per request
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
      baseClass += "shadow-tile ";
    }

    // subtle border/ring for a more polished look
    baseClass += "ring-1 ring-foreground/10 ";

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
      {/* Base background for PATH tiles */}
      {tile.type === TileType.PATH && (
        <>
          <div className="absolute inset-0 rounded-lg bg-gradient-tile" />
          {/* Gloss and glass overlays */}
          <div className="absolute inset-0 rounded-lg pointer-events-none bg-gradient-to-br from-foreground/10 via-transparent to-transparent opacity-[0.12]" />
          <div className="absolute inset-0 rounded-lg pointer-events-none backdrop-blur-[3px] bg-background/5" />
        </>
      )}

      {/* Neutral path symbol (always visible) */}
      {tile.type === TileType.PATH && (
        <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ color: 'hsl(var(--foreground))' }}>
          {renderPathMask()}
          <rect x={0} y={0} width={100} height={100} fill="currentColor" fillOpacity={0.7} mask={`url(#tile-mask-${tile.id})`} />
        </svg>
      )}

      {/* Energy fill along the path (when energized) */}
      {tile.type === TileType.PATH && (
          <svg
            className={`absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-300 ${isEnergized ? 'opacity-100' : 'opacity-0'}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ color: 'hsl(var(--energy))', filter: 'drop-shadow(0 0 10px hsl(var(--energy) / 0.95))' }}
          >
            {renderPathMask()}
            <rect x={0} y={0} width={100} height={100} fill="currentColor" mask={`url(#tile-mask-${tile.id})`} />
          </svg>
      )}

      {/* Empty tiles keep their background */}
      {tile.type === TileType.EMPTY && (
        <div className="absolute inset-0 rounded-lg" />
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

      {/* Energy Source (Start) */}
      {isStart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 shadow-glow flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
};