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
  const buildMaskDataUrl = () => {
    if (tile.type !== TileType.PATH) return undefined;

    const thickness = 30; // ~30% of tile size
    const half = 50;
    const lines: string[] = [];

    if (tile.connections.north) {
      lines.push(`<line x1="${half}" y1="${half}" x2="${half}" y2="0" stroke="black" stroke-width="${thickness}" stroke-linecap="round" />`);
    }
    if (tile.connections.south) {
      lines.push(`<line x1="${half}" y1="${half}" x2="${half}" y2="100" stroke="black" stroke-width="${thickness}" stroke-linecap="round" />`);
    }
    if (tile.connections.east) {
      lines.push(`<line x1="${half}" y1="${half}" x2="100" y2="${half}" stroke="black" stroke-width="${thickness}" stroke-linecap="round" />`);
    }
    if (tile.connections.west) {
      lines.push(`<line x1="${half}" y1="${half}" x2="0" y2="${half}" stroke="black" stroke-width="${thickness}" stroke-linecap="round" />`);
    }

    // Optional center dot cutout for intersections
    // lines.push(`<circle cx="${half}" cy="${half}" r="${thickness/4}" fill="black" />`);

    const svg = `<?xml version='1.0' encoding='UTF-8'?>\n` +
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
      `<rect x='0' y='0' width='100' height='100' rx='12' ry='12' fill='white'/>` +
      `${lines.join('')}` +
      `</svg>`;

    const encoded = encodeURIComponent(svg);
    return `url("data:image/svg+xml;utf8,${encoded}")`;
  };

  const getSpecialIcon = () => {
    switch (tile.special) {
      case 'key':
        return null; // Hide key tile visuals for now
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
      baseClass += "shadow-tile ";
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
      {/* Energy layer (shows through cutout) */}
      {tile.type === TileType.PATH && (
        <div
          className={`absolute inset-0 rounded-lg bg-energy ${isEnergized ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />
      )}

      {/* Tile body with SVG mask cutout for the path symbol */}
      {tile.type === TileType.PATH && (
        <div
          className="absolute inset-0 rounded-lg bg-gradient-tile"
          style={{
            WebkitMaskImage: buildMaskDataUrl(),
            maskImage: buildMaskDataUrl(),
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%'
          }}
        />
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