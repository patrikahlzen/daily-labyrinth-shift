import React from 'react';
import { GameTile, TileType } from '../types/game';

interface Props {
  tile: GameTile;
  isStart?: boolean;
  isGoal?: boolean;
  isConnected?: boolean;
  isValidPath?: boolean;
  isEnergized?: boolean;
}

export const Tile: React.FC<Props> = ({
  tile,
  isStart,
  isGoal,
  isConnected,
  isValidPath,
  isEnergized,
}) => {
  const showPipes = tile.type === TileType.PATH;
  const c = tile.connections;

  return (
    <div className={`tile ${showPipes ? 'tile--path' : ''}`}>

      {/* Pipes */}
      <div className="pipe-clip">
        {showPipes && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* center node */}
            <circle cx="50" cy="50" r="6" fill="hsl(var(--muted-foreground))" opacity="0.6" />

            {/* pipe arms */}
            {c.north && (
              <line x1="50" y1="0" x2="50" y2="50"
                    stroke="hsl(var(--tile-path))"
                    strokeWidth="14" strokeLinecap="round" />
            )}
            {c.south && (
              <line x1="50" y1="50" x2="50" y2="100"
                    stroke="hsl(var(--tile-path))"
                    strokeWidth="14" strokeLinecap="round" />
            )}
            {c.east && (
              <line x1="50" y1="50" x2="100" y2="50"
                    stroke="hsl(var(--tile-path))"
                    strokeWidth="14" strokeLinecap="round" />
            )}
            {c.west && (
              <line x1="0" y1="50" x2="50" y2="50"
                    stroke="hsl(var(--tile-path))"
                    strokeWidth="14" strokeLinecap="round" />
            )}

            {/* energy glow when connected */}
            {isConnected && isValidPath && (
              <>
                {c.north && <line x1="50" y1="0" x2="50" y2="50" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.8" />}
                {c.south && <line x1="50" y1="50" x2="50" y2="100" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.8" />}
                {c.east  && <line x1="50" y1="50" x2="100" y2="50" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.8" />}
                {c.west  && <line x1="0"  y1="50" x2="50"  y2="50" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.8" />}
              </>
            )}
          </svg>
        )}
      </div>

      {/* Start/Goal marks */}
      {(isStart || isGoal) && (
        <div className={`mark`} data-symbol={isStart ? 'S' : 'M'} />
      )}

      {/* Gem icon (locked = small lock badge, but pipes still show) */}
      {tile.special === 'gem' && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full star-gold" />
          {tile.locked && (
            <span className="inline-block text-xs opacity-80" title="Locked">🔒</span>
          )}
        </div>
      )}

      {/* Key and Time specials */}
      {tile.special === 'key' && (
        <div className="absolute bottom-1 left-1" title="Key">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 14a5 5 0 119.9-1H22v3h-2v2h-3v-2h-2.1A5 5 0 017 14z"
              fill="hsl(var(--prism-a))"
            />
          </svg>
        </div>
      )}
      {tile.special === 'time' && (
        <div className="absolute bottom-1 right-1" title="Time">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="hsl(var(--prism-b))" opacity="0.25" />
            <path d="M12 7v6l4 2" stroke="hsl(var(--prism-b))" strokeWidth="2" fill="none" />
          </svg>
        </div>
      )}
    </div>
  );
};