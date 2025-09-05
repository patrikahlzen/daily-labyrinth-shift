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

  // Läs markörer direkt från tile.id så de alltid syns
  const isStart = tile.id === 'start-tile';
  const isGoal  = tile.id === 'goal-tile';

  const c = tile.connections || { north:false, south:false, east:false, west:false };

  // Ljusa rör + cyan energi
  const PIPE = 'hsl(var(--foreground))'; // off-white
  const ENERGY = 'hsl(var(--energy))';

  return (
    <div className={`tile ${isPath ? 'tile--path' : ''} ${tile.locked ? 'is-locked' : ''}`}>
      {/* RÖR */}
      {isPath && (
        <div className="pipe-clip" style={{ zIndex: 2, pointerEvents: 'none' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* huvud-rör (vita) */}
            {c.north && (
              <line x1="50" y1="0" x2="50" y2="50"
                stroke={PIPE} strokeWidth="14" strokeLinecap="round" />
            )}
            {c.south && (
              <line x1="50" y1="50" x2="50" y2="100"
                stroke={PIPE} strokeWidth="14" strokeLinecap="round" />
            )}
            {c.east && (
              <line x1="50" y1="50" x2="100" y2="50"
                stroke={PIPE} strokeWidth="14" strokeLinecap="round" />
            )}
            {c.west && (
              <line x1="0" y1="50" x2="50" y2="50"
                stroke={PIPE} strokeWidth="14" strokeLinecap="round" />
            )}

            {/* energi-overlay på aktiv väg */}
            {isConnected && isValidPath && (
              <>
                {c.north && (
                  <line x1="50" y1="0" x2="50" y2="50"
                    stroke={ENERGY} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                )}
                {c.south && (
                  <line x1="50" y1="50" x2="50" y2="100"
                    stroke={ENERGY} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                )}
                {c.east && (
                  <line x1="50" y1="50" x2="100" y2="50"
                    stroke={ENERGY} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                )}
                {c.west && (
                  <line x1="0" y1="50" x2="50" y2="50"
                    stroke={ENERGY} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                )}
              </>
            )}
          </svg>
        </div>
      )}

      {/* START / MÅL – egen stil (ingen CSS-beroende klass) */}
      {(isStart || isGoal) && (
        <div
          className="mark"
          data-symbol={isStart ? 'S' : 'M'}
          style={{
            position: 'absolute',
            inset: '35% 35%',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '999px',
            border: '2px solid currentColor',
            color: isStart ? 'hsl(var(--prism-b))' : 'hsl(var(--prism-c))',
            zIndex: 3,
          }}
        />
      )}

      {/* GEM + ev lås – alltid synligt */}
      {tile.special === 'gem' && (
        <div className="absolute top-1 right-1 flex items-center gap-1" style={{ zIndex: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"
               style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,.6))' }}>
            <path fill="#FFD700"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
          </svg>
          {tile.locked && <span title="Locked" style={{ fontSize: 12 }}>🔒</span>}
        </div>
      )}
    </div>
  );
};