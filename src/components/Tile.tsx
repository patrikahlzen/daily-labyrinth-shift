import React from 'react';
import { GameTile, TileType } from '../types/game';
import { Clock, Square, Gem, Zap, Flag } from 'lucide-react';

interface TileProps {
  tile: GameTile;
  isGoal?: boolean;
  isStart?: boolean;
  isConnected?: boolean;
  isValidPath?: boolean;
}

export const Tile: React.FC<TileProps> = ({ tile, isGoal, isStart, isConnected, isValidPath }) => {
  // Generate unique mask ID using position and random number for Safari compatibility
  const maskId = React.useMemo(() => `tile-mask-${tile.id}-${Math.random().toString(36).substr(2, 9)}`, [tile.id]);

  const renderPathMask = () => {
    if (tile.type !== TileType.PATH) return null;

    const thickness = 30; // ~30% of tile size
    const half = 50;

    return (
      <defs>
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
      </defs>
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
        return (
          <div className="relative">
            <Gem className="w-5 h-5 text-accent drop-shadow-sm" 
                 style={{ filter: 'drop-shadow(0 0 8px hsl(var(--accent) / 0.6))' }} />
            <div className="absolute inset-0 w-5 h-5 rounded-full bg-accent/20 animate-ping" />
          </div>
        );
      default:
        return null;
    }
  };

  const getTileClassName = () => {
    let baseClass = "tile ";
    
    if (tile.type === TileType.PATH) {
      baseClass += "tile--path ";
    }

    // Connected path effect
    if (isConnected && isValidPath) {
      baseClass += "tile--energized ";
    }

    // Start/Goal specific styling
    if (isStart) {
      baseClass += "tile--start ";
    }
    if (isGoal) {
      baseClass += "tile--goal ";
    }

    return baseClass;
  };

  return (
    <div className={getTileClassName()}>
      {/* Bright path symbols for path tiles */}
      {tile.type === TileType.PATH && (
        <svg className="absolute inset-0 pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          {renderPathMask()}
          <rect x={0} y={0} width={100} height={100} fill="hsl(0 0% 98%)" mask={`url(#${maskId})`} />
        </svg>
      )}

      {/* Special items */}
      {tile.special && (
        <div className="absolute top-1 right-1 z-20">
          {getSpecialIcon()}
        </div>
      )}

      {/* Goal marker: flag icon */}
      {isGoal && (
        <div className="absolute -top-1 -right-1 z-20">
          <Flag className="w-4 h-4 text-prism-a drop-shadow-sm" 
                style={{ filter: 'drop-shadow(0 0 8px hsl(var(--prism-a) / 0.8))' }} />
        </div>
      )}

      {/* Start marker: energy icon */}
      {isStart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Zap className="w-4 h-4 text-prism-b drop-shadow-sm" 
               style={{ filter: 'drop-shadow(0 0 8px hsl(var(--prism-b) / 0.8))' }} />
        </div>
      )}
    </div>
  );
};