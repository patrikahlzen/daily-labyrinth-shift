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
    let baseClass = "w-full h-full rounded-lg relative transition-smooth backdrop-blur-sm ";
    
    if (tile.type === TileType.EMPTY) {
      baseClass += "bg-game-tile-empty ";
    } else if (tile.type === TileType.PATH) {
      baseClass += "shadow-tile ";
    }

    // Liquid glass effect with subtle border
    baseClass += "ring-1 ring-foreground/15 ";
    
    // Connected path effect
    if (isConnected && isValidPath) {
      baseClass += "ring-2 ring-energy/60 shadow-glow ";
    }

    return baseClass;
  };

  return (
    <div className={getTileClassName()}>
      {/* Enhanced PATH tiles with liquid glass effect */}
      {tile.type === TileType.PATH && (
        <>
          <div className="absolute inset-0 rounded-lg bg-gradient-tile" />
          {/* Liquid glass layers */}
          <div className="absolute inset-0 rounded-lg pointer-events-none bg-gradient-glass" 
               style={{ boxShadow: 'var(--shadow-glass)' }} />
          <div className="absolute inset-0 rounded-lg pointer-events-none backdrop-blur-[2px] bg-foreground/5" />
          {isConnected && isValidPath && (
            <div className="absolute inset-0 rounded-lg liquid-shimmer pointer-events-none" />
          )}
        </>
      )}

      {/* Empty tiles background */}
      {tile.type === TileType.EMPTY && (
        <div className="absolute inset-0 rounded-lg bg-game-tile-empty" />
      )}

      {/* Neutral path symbol (always visible) */}
      {tile.type === TileType.PATH && (
        <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ color: 'hsl(var(--foreground))' }}>
          {renderPathMask()}
          <rect x={0} y={0} width={100} height={100} fill="currentColor" fillOpacity={0.7} mask={`url(#${maskId})`} />
        </svg>
      )}

      {/* Enhanced energy flow for connected paths */}
      {tile.type === TileType.PATH && isConnected && isValidPath && (
          <svg
            className="absolute inset-0 pointer-events-none opacity-100 energy-flow"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ 
              filter: 'drop-shadow(0 0 15px hsl(var(--energy) / 0.8)) brightness(1.2)'
            }}
          >
            {renderPathMask()}
            <defs>
              <linearGradient id={`energy-gradient-${tile.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--energy))" stopOpacity="0.9" />
                <stop offset="50%" stopColor="hsl(var(--energy-flow))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--energy))" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <rect x={0} y={0} width={100} height={100} 
                  fill={`url(#energy-gradient-${tile.id})`} 
                  mask={`url(#${maskId})`} />
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


      {/* Goal marker: non-blocking ring + corner flag for visibility */}
      {isGoal && (
        <>
          <div className="absolute inset-0 rounded-lg ring-2 ring-accent/70 pointer-events-none animate-[pulse_2s_ease-in-out_infinite]" />
          <div className="absolute -top-1 -right-1">
            <Flag className="w-4 h-4 text-accent drop-shadow-sm" />
          </div>
        </>
      )}


      {/* Enhanced Energy Source (Start) with beacon effect */}
      {isStart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-start/30 to-start/20 border-2 border-start/40 start-beacon backdrop-blur-sm flex items-center justify-center"
                 style={{ 
                   boxShadow: '0 0 15px hsl(var(--start) / 0.5), var(--shadow-glass)'
                 }}>
              <Zap className="w-4 h-4 text-start drop-shadow-sm" />
            </div>
            <div className="absolute inset-0 w-7 h-7 rounded-full bg-gradient-glass pointer-events-none" />
            <div className="absolute inset-0 w-7 h-7 rounded-full bg-start/20 animate-ping" />
          </div>
        </div>
      )}
    </div>
  );
};