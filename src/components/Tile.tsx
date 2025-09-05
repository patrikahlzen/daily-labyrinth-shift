import React from 'react';
import { GameTile, TileType } from '../types/game';

type Props = {
  tile: GameTile;
  isConnected?: boolean;
  isValidPath?: boolean;
  isEnergized?: boolean;
};

export const Tile: React.FC<Props> = ({
  tile,
  isConnected,
  isValidPath,
}) => {
  const isPath = tile.type === TileType.PATH;

  // Read start/goal directly from tile.id so markers always show
  const isStart = tile.id === 'start-tile';
  const isGoal = tile.id === 'goal-tile';

  const c = tile.connections;

  return (
    <div className={`tile ${isPath ? 'tile--path' : ''} ${tile.locked ? 'is-locked' : ''}`}>
      {/* Pipes */}
      {isPath && (
        <div className="pipe-clip">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* pipe arms */}
            {c.north && (
              <line x1="50" y1="0" x2="50" y2="50"
                    stroke="hsl(var(--tile-path))" strokeWidth="14" strokeLinecap="round" />
            )}
            {c.south && (
              <line x1="50" y1="50" x2="50" y2="100"
                    stroke="hsl(var(--tile-path))" strokeWidth="14" strokeLinecap="round" />
            )}
            {c.east && (
              <line x1="50" y1="50" x2="100" y2="50"
                    stroke="hsl(var(--tile-path))" strokeWidth="14" strokeLinecap="round" />
            )}
            {c.west && (
              <line x1="0" y1="50" x2="50" y2="50"
                    stroke="hsl(var(--tile-path))" strokeWidth="14" strokeLinecap="round" />
            )}

            {/* energy on active path */}
            {isConnected && isValidPath && (
              <>
                {c.north && <line x1="50" y1="0" x2="50" y2="50" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.9" />}
                {c.south && <line x1="50" y1="50" x2="50" y2="100" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.9" />}
                {c.east  && <line x1="50" y1="50" x2="100" y2="50" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.9" />}
                {c.west  && <line x1="0"  y1="50" x2="50"  y2="50" stroke="hsl(var(--energy))" strokeWidth="6" strokeLinecap="round" opacity="0.9" />}
              </>
            )}
          </svg>
        </div>
      )}

      {/* Start/Goal markers */}
      {(isStart || isGoal) && (
        <div className="mark" data-symbol={isStart ? 'S' : 'M'} />
      )}

      {/* Gem + lock badge */}
      {tile.special === 'gem' && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full star-gold" />
          {tile.locked && <span className="inline-block text-xs opacity-80" title="Locked">🔒</span>}
        </div>
      )}
    </div>
  );
};