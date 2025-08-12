import React, { useState, useRef, useEffect } from 'react';
import { Tile } from './Tile';
import { GameTile, TileType, Direction } from '../types/game';

interface GameBoardProps {
  board: GameTile[][];
  playerPosition: { x: number; y: number };
  goalPosition: { x: number; y: number };
  startPosition: { x: number; y: number };
  onTilePush: (row: number, col: number, direction: Direction) => void;
  previewMove?: { row: number; col: number; direction: Direction } | null;
  previewPath?: { x: number; y: number }[];
  branchChoice?: { x: number; y: number; options: Direction[] } | null;
  onChooseDirection?: (dir: Direction) => void;
  // Swap-only controls
  onTileTap?: (row: number, col: number) => void;
  selectedTile?: { row: number; col: number } | null;
  // Drag & Drop swap
  onSwapTiles?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  playerPosition,
  goalPosition,
  startPosition,
  onTilePush,
  previewMove,
  previewPath,
  branchChoice,
  onChooseDirection,
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
<div className="relative w-full px-4 md:px-8 overscroll-none select-none">
      {/* Game Board */}
<div 
        className="grid gap-1 p-5 md:p-6 bg-gradient-board rounded-2xl shadow-game w-full max-w-5xl md:max-w-6xl xl:max-w-7xl mx-auto"
        style={{ WebkitOverflowScrolling: 'touch', gridTemplateColumns: `repeat(${board[0]?.length || 0}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const isPlayer = playerPosition.x === colIndex && playerPosition.y === rowIndex;
            const isGoal = goalPosition.x === colIndex && goalPosition.y === rowIndex;
            const isPreview = previewMove?.row === rowIndex && previewMove?.col === colIndex;
            const isStart = startPosition.x === colIndex && startPosition.y === rowIndex;
            const isLockedCell = isStart || isGoal;

            return (
<div
                key={`${rowIndex}-${colIndex}`}
                data-row={rowIndex}
                data-col={colIndex}
                className={`relative aspect-square ${ (tile.type === TileType.EMPTY || isLockedCell) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer' } ${shakeCell && shakeCell.row === rowIndex && shakeCell.col === colIndex ? 'animate-shake' : ''}`}
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
                    isPlayer={isPlayer}
                    isGoal={isGoal}
                    isPreview={isPreview}
                    isStart={isStart}
                  />
                  {/* Preview path highlight */}
                  {previewPath?.some(p => p.x === colIndex && p.y === rowIndex) && (
                    <div className="absolute inset-0 ring-2 ring-primary/60 rounded-lg pointer-events-none tile-glow" />
                  )}
                  {/* Selected tile highlight */}
                  {selectedTile && selectedTile.row === rowIndex && selectedTile.col === colIndex && (
                    <div className="absolute inset-0 ring-2 ring-accent/60 rounded-lg pointer-events-none" />
                  )}
                  {/* Drag over highlight */}
                  {dragOver && dragOver.row === rowIndex && dragOver.col === colIndex && (
                    <div className="absolute inset-0 ring-2 ring-accent/70 rounded-lg pointer-events-none" />
                  )}
                </div>
                

                {/* Direction picker at branch */}
                {branchChoice && branchChoice.x === colIndex && branchChoice.y === rowIndex && onChooseDirection && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Up */}
                      {branchChoice.options.includes('up') && (
                        <button
                          aria-label="Choose up"
                          onClick={() => onChooseDirection('up')}
                          className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-card/80 rounded-full p-1 shadow-tile hover-scale"
                        >
                          ↑
                        </button>
                      )}
                      {/* Down */}
                      {branchChoice.options.includes('down') && (
                        <button
                          aria-label="Choose down"
                          onClick={() => onChooseDirection('down')}
                          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-card/80 rounded-full p-1 shadow-tile hover-scale"
                        >
                          ↓
                        </button>
                      )}
                      {/* Left */}
                      {branchChoice.options.includes('left') && (
                        <button
                          aria-label="Choose left"
                          onClick={() => onChooseDirection('left')}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1 shadow-tile hover-scale"
                        >
                          ←
                        </button>
                      )}
                      {/* Right */}
                      {branchChoice.options.includes('right') && (
                        <button
                          aria-label="Choose right"
                          onClick={() => onChooseDirection('right')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1 shadow-tile hover-scale"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Close tile wrapper */}
              </div>
            );
          })
        )}
      </div>


    </div>
  );
};