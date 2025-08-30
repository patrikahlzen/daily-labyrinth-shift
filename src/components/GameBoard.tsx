import React, { useState, useRef, useEffect } from 'react';
import { Tile } from './Tile';
import { GameTile, TileType, Direction } from '../types/game';

interface GameBoardProps {
  board: GameTile[][];
  goalPosition: { x: number; y: number };
  startPosition: { x: number; y: number };
  onTilePush: (row: number, col: number, direction: Direction) => void;
  // Real-time path connection system
  connectedPath?: { x: number; y: number }[];
  validConnection?: boolean;
  // Swap-only controls
  onTileTap?: (row: number, col: number) => void;
  selectedTile?: { row: number; col: number } | null;
  // Drag & Drop swap
  onSwapTiles?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  goalPosition,
  startPosition,
  onTilePush,
  connectedPath,
  validConnection,
  onTileTap,
  selectedTile,
  onSwapTiles
}) => {
// Swap/tap interaction
const handleTileClick = (row: number, col: number) => {
  const isLockedCell = (startPosition.x === col && startPosition.y === row) || (goalPosition.x === col && goalPosition.y === row);
  if (isLockedCell) { setShakeCell({ row, col }); setTimeout(() => setShakeCell(null), 400); return; }
  onTileTap?.(row, col);
};

// Drag & Drop (HTML5) state + shake feedback
const [dragFrom, setDragFrom] = useState<{ row: number; col: number } | null>(null);
const [dragOver, setDragOver] = useState<{ row: number; col: number } | null>(null);
const [shakeCell, setShakeCell] = useState<{ row: number; col: number } | null>(null);

// HTML5 Drag & Drop handlers
const handleDragStart = (e: React.DragEvent, row: number, col: number, tile: GameTile) => {
  if (tile.type === TileType.EMPTY) { e.preventDefault(); return; }
  const isLockedCell = (startPosition.x === col && startPosition.y === row) || (goalPosition.x === col && goalPosition.y === row);
  if (isLockedCell) { setShakeCell({ row, col }); setTimeout(() => setShakeCell(null), 400); e.preventDefault(); return; }
  setDragFrom({ row, col });
  try { e.dataTransfer.setData('text/plain', JSON.stringify({ row, col })); } catch {}
  try { e.dataTransfer.effectAllowed = 'move'; } catch {}
};

const handleDragOver = (e: React.DragEvent, row: number, col: number, tile: GameTile) => {
  const isLockedCell = (startPosition.x === col && startPosition.y === row) || (goalPosition.x === col && goalPosition.y === row);
  if (tile.type === TileType.EMPTY || isLockedCell) return;
  e.preventDefault();
  setDragOver(prev => (!prev || prev.row !== row || prev.col !== col) ? { row, col } : prev);
  try { e.dataTransfer.dropEffect = 'move'; } catch {}
};

const handleDrop = (e: React.DragEvent, row: number, col: number, tile: GameTile) => {
  e.preventDefault();
  const isLockedCell = (startPosition.x === col && startPosition.y === row) || (goalPosition.x === col && goalPosition.y === row);
  if (tile.type === TileType.EMPTY || isLockedCell) { setDragOver(null); return; }
  let src = dragFrom as { row: number; col: number } | null;
  if (!src) {
    try { const parsed = JSON.parse(e.dataTransfer.getData('text/plain')); if (parsed && typeof parsed.row === 'number' && typeof parsed.col === 'number') src = parsed; } catch {}
  }
  if (src && (src.row !== row || src.col !== col)) {
    const lockedSrc = (startPosition.x === src.col && startPosition.y === src.row) || (goalPosition.x === src.col && goalPosition.y === src.row);
    if (lockedSrc) {
      setShakeCell(src); setTimeout(() => setShakeCell(null), 400);
    } else {
      onSwapTiles?.(src.row, src.col, row, col);
    }
  } else if (src) {
    setShakeCell(src); setTimeout(() => setShakeCell(null), 400);
  }
  setDragFrom(null);
  setDragOver(null);
};

const handleDragEnd = () => {
  setDragFrom(null);
  setDragOver(null);
};

  return (
<div className="w-full overscroll-none select-none">
      {/* Optimized Game Board */}
<div 
        className="board grid gap-1 sm:gap-2 w-full max-w-sm sm:max-w-lg mx-auto"
        style={{ WebkitOverflowScrolling: 'touch', gridTemplateColumns: `repeat(${board[0]?.length || 0}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const isGoal = goalPosition.x === colIndex && goalPosition.y === rowIndex;
            const isStart = startPosition.x === colIndex && startPosition.y === rowIndex;
            const isConnected = connectedPath?.some(p => p.x === colIndex && p.y === rowIndex) || false;
            const isLockedCell = isStart || isGoal;

            return (
<div
                key={`${rowIndex}-${colIndex}`}
                data-row={rowIndex}
                data-col={colIndex}
                className={`relative aspect-square ${ (tile.type === TileType.EMPTY || isLockedCell) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer touch-manipulation' } ${shakeCell && shakeCell.row === rowIndex && shakeCell.col === colIndex ? 'animate-shake' : ''}`}
                draggable={!(tile.type === TileType.EMPTY || isLockedCell)}
                onDragStart={(e) => handleDragStart(e, rowIndex, colIndex, tile)}
                onDragOver={(e) => handleDragOver(e, rowIndex, colIndex, tile)}
                onDrop={(e) => handleDrop(e, rowIndex, colIndex, tile)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  const isDisabled = tile.type === TileType.EMPTY || isLockedCell;
                  if (isDisabled) return;
                  handleTileClick(rowIndex, colIndex);
                }}
              >
                <div className="absolute inset-0">
                  <Tile
                    tile={tile}
                    isGoal={isGoal}
                    isStart={isStart}
                    isConnected={isConnected}
                    isValidPath={validConnection}
                  />
                  {/* Connected path highlight */}
                  {isConnected && validConnection && (
                    <div className="absolute inset-0 ring-2 rounded-lg pointer-events-none animate-pulse" 
                         style={{ 
                           borderColor: 'hsl(var(--prism-b))', 
                           boxShadow: '0 0 20px hsl(var(--prism-b)/.6), inset 0 0 20px hsl(var(--prism-b)/.3)' 
                         }} />
                  )}
                  {/* Selected tile highlight */}
                  {selectedTile && selectedTile.row === rowIndex && selectedTile.col === colIndex && (
                    <div className="absolute inset-0 ring-2 rounded-lg pointer-events-none" 
                         style={{ borderColor: 'hsl(var(--prism-a))', boxShadow: '0 0 15px hsl(var(--prism-a)/.5)' }} />
                  )}
                  {/* Drag over highlight */}
                  {dragOver && dragOver.row === rowIndex && dragOver.col === colIndex && (
                    <div className="absolute inset-0 ring-2 rounded-lg pointer-events-none" 
                         style={{ borderColor: 'hsl(var(--prism-c))', boxShadow: '0 0 15px hsl(var(--prism-c)/.5)' }} />
                  )}
                </div>
                


                {/* Close tile wrapper */}
              </div>
            );
          })
        )}
      </div>


    </div>
  );
};