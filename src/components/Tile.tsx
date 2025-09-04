// src/components/Tile.tsx
import React from 'react';
import { GameTile, TileType } from '../types/game';
import { Lock } from 'lucide-react';

type Props = {
  tile: GameTile;
  isStart?: boolean;
  isGoal?: boolean;
  isConnected?: boolean;
  isValidPath?: boolean;
  isEnergized?: boolean;
};

export const Tile: React.FC<Props> = ({
  tile,
  isStart = false,
  isGoal = false,
  isConnected = false,
  isValidPath = false,
  isEnergized = false,
}) => {
  const classes = [
    'tile',
    tile.type === TileType.PATH ? 'tile--path' : '',
    isStart ? 'tile--start' : '',
    isGoal ? 'tile--goal' : '',
    isEnergized ? 'is-energized' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // simple pipe renderer: draw lines from center to each connected side
  const size = 100; // arbitrary viewBox size for easy math
  const c = size / 2;
  const inset = 14; // inner padding to match your CSS inset ~6px visually
  const end = size - inset;

  const segments: Array<[number, number, number, number]> = [];
  if (tile.connections.north) segments.push([c, inset, c, c]);
  if (tile.connections.south) segments.push([c, c, c, end]);
  if (tile.connections.west) segments.push([inset, c, c, c]);
  if (tile.connections.east) segments.push([c, c, end, c]);

  const showGem = tile.special === 'gem';
  const showKey = tile.special === 'key';
  const showTime = tile.special === 'time';

  return (
    <div className={classes}>
      {/* pipes */}
      <div className="pipe-clip">
        <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="none">
          {/* main circle hub */}
          <circle cx={c} cy={c} r={10} fill="currentColor" opacity="0.9" />
          {/* spokes */}
          {segments.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={12}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      {/* start/goal marks */}
      {isStart && <div className="mark" data-symbol="S" />}
      {isGoal && <div className="mark" data-symbol="M" />}

      {/* specials */}
      {showGem && (
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
          }}
          aria-label="Gem"
          title="Gem"
        >
          {/* diamond gem */}
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3l4.5 4.5L12 21 7.5 7.5 12 3z"
              fill="hsl(var(--prism-c))"
              opacity="0.95"
            />
          </svg>
        </div>
      )}
      {showKey && (
        <div
          className="absolute"
          style={{ left: 8, bottom: 8, zIndex: 5 }}
          aria-label="Key"
          title="Key"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 14a5 5 0 119.9-1H22v3h-2v2h-3v-2h-2.1A5 5 0 017 14z"
              fill="hsl(var(--prism-a))"
            />
          </svg>
        </div>
      )}
      {showTime && (
        <div
          className="absolute"
          style={{ right: 8, bottom: 8, zIndex: 5 }}
          aria-label="Time"
          title="Time"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="hsl(var(--prism-b))" opacity="0.25" />
            <path d="M12 7v6l4 2" stroke="hsl(var(--prism-b))" strokeWidth="2" fill="none" />
          </svg>
        </div>
      )}

      {/* locked badge (covers all types, including gem) */}
      {tile.locked && (
        <div
          className="absolute"
          style={{ right: 6, top: 6, zIndex: 6 }}
          title="Låst"
          aria-label="Låst"
        >
          <span className="pill" style={{ padding: '2px 6px' }}>
            <Lock className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
};
