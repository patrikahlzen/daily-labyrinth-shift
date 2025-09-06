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
  const isEmpty = tile.type === TileType.EMPTY;
  const c = tile.connections || { north:false, south:false, east:false, west:false };

  // Färger
  const ENERGY = 'hsl(var(--energy))';        // cyan
  const CORE   = '#ffffff';                   // vit kärna
  const HILITE = '#E6FBFF';                   // kall highlight

  // Tjocklekar (justera vid behov)
  const GLOW_W = 48;   // underglow - dubbelt så tjock
  const CORE_W = 36;   // vit kärna - dubbelt så tjock
  const HI_W   = 16;   // smal highlight - dubbelt så tjock

  // Hjälpare för att rita ett “segment” i tre lager (glow + core + highlight)
  const Segment: React.FC<{ x1:number; y1:number; x2:number; y2:number }> = ({ x1,y1,x2,y2 }) => (
    <>
      {/* Glow under – cyan + blur */}
      <g filter="url(#softGlow)">
        <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={ENERGY} strokeOpacity="0.35"
              strokeWidth={GLOW_W} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Vit kärna */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={CORE}
            strokeWidth={CORE_W} strokeLinecap="round" strokeLinejoin="round" />

      {/* Highlight */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={HILITE} strokeOpacity="0.9"
            strokeWidth={HI_W} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );

  // Energi-overlay på aktiv väg
  const Energy: React.FC<{ x1:number; y1:number; x2:number; y2:number }> = ({ x1,y1,x2,y2 }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="url(#energyGrad)" strokeWidth={8}
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="12 10" style={{ animation: 'dashShift 1.6s linear infinite' }} />
  );

  // Start/Mål – visas alltid baserat på id
  const isStart = tile.id === 'start-tile';
  const isGoal  = tile.id === 'goal-tile';

  return (
    <div className={`tile ${isPath ? 'tile--path' : ''} ${isEmpty ? 'tile--empty' : ''} ${tile.locked ? 'is-locked' : ''}`}>
      {isPath && (
        <div className="pipe-clip" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {/* Mjuk glow */}
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
              </filter>
              {/* Cyan → vit energi */}
              <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="hsl(var(--energy))" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* RITNING – varje riktning blir tre lager */}
            {c.north && <Segment x1={50} y1={0}   x2={50} y2={50} />}
            {c.south && <Segment x1={50} y1={50}  x2={50} y2={100} />}
            {c.east  && <Segment x1={50} y1={50}  x2={100} y2={50} />}
            {c.west  && <Segment x1={0}  y1={50}  x2={50}  y2={50} />}

            {/* Energi-överlägg på aktiv väg */}
            {isConnected && isValidPath && (
              <>
                {c.north && <Energy x1={50} y1={0}   x2={50} y2={50} />}
                {c.south && <Energy x1={50} y1={50}  x2={50} y2={100} />}
                {c.east  && <Energy x1={50} y1={50}  x2={100} y2={50} />}
                {c.west  && <Energy x1={0}  y1={50}  x2={50}  y2={50} />}
              </>
            )}
          </svg>
        </div>
      )}

      {/* Start/Mål-ring */}
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

      {/* Guld–gem (låst visar 🔒) */}
      {tile.special === 'gem' && (
        <div className="absolute top-1 right-1 flex items-center gap-1" style={{ zIndex: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"
               style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,.65))' }}>
            <path fill="#FFD700"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
          </svg>
          {tile.locked && <span title="Locked" style={{ fontSize: 12 }}>🔒</span>}
        </div>
      )}

      {/* Liten CSS-nyckelframes för dashen (scoped via style) */}
      <style>{`
        @keyframes dashShift { to { stroke-dashoffset: -22; } }
      `}</style>
    </div>
  );
};
