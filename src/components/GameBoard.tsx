import React, { useState, useRef } from 'react';
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
  onTileTap?.(row, col);
};

// Drag & Drop state (pointer-based)
const [dragFrom, setDragFrom] = useState<{ row: number; col: number } | null>(null);
const [dragOver, setDragOver] = useState<{ row: number; col: number } | null>(null);
const [isDragging, setIsDragging] = useState(false);
const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
const [shakeCell, setShakeCell] = useState<{ row: number; col: number } | null>(null);
const boardRef = useRef<HTMLDivElement>(null);
const dragThreshold = 6;

const handlePointerDown = (e: React.PointerEvent, row: number, col: number, tile: GameTile) => {
  if (tile.type === TileType.EMPTY) return;
  setDragFrom({ row, col });
  setDragOver(null);
  setIsDragging(true);
  setPointer({ x: e.clientX, y: e.clientY });
  try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch {}
};

const handlePointerMove = (e: React.PointerEvent) => {
  if (!isDragging) return;
  setPointer({ x: e.clientX, y: e.clientY });
};

const handlePointerEnter = (row: number, col: number, tile: GameTile) => {
  if (!isDragging) return;
  if (tile.type === TileType.EMPTY) return;
  setDragOver({ row, col });
};

const cancelDrag = () => {
  setIsDragging(false);
  setDragOver(null);
  setDragFrom(null);
  setPointer(null);
};

const handlePointerUp = (e: React.PointerEvent) => {
  if (!isDragging) return;
  const src = dragFrom;
  const dst = dragOver;
  if (src && dst && (src.row !== dst.row || src.col !== dst.col)) {
    onSwapTiles?.(src.row, src.col, dst.row, dst.col);
  } else if (src && (!dst || (src.row === dst.row && src.col === dst.col))) {
    // invalid drop -> shake
    setShakeCell(src);
    setTimeout(() => setShakeCell(null), 400);
  }
  cancelDrag();
};

  return (
    <div ref={boardRef} className="relative px-[50px]" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {/* Game Board */}
      <div 
        className="grid gap-1 p-0 pb-[200px] bg-gradient-board rounded-2xl shadow-game w-[calc(100vw-100px)] mx-auto max-h-[85vh] overflow-y-auto touch-pan-y overscroll-contain select-none"
        style={{ WebkitOverflowScrolling: 'touch', gridTemplateColumns: `repeat(${board[0]?.length || 0}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const isPlayer = playerPosition.x === colIndex && playerPosition.y === rowIndex;
            const isGoal = goalPosition.x === colIndex && goalPosition.y === rowIndex;
            const isPreview = previewMove?.row === rowIndex && previewMove?.col === colIndex;
            const isStart = startPosition.x === colIndex && startPosition.y === rowIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`relative aspect-square ${ (tile.type === TileType.EMPTY) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer' } ${shakeCell && shakeCell.row === rowIndex && shakeCell.col === colIndex ? 'animate-shake' : ''}`}
                draggable={false}
                onPointerDown={(e) => handlePointerDown(e, rowIndex, colIndex, tile)}
                onPointerEnter={() => handlePointerEnter(rowIndex, colIndex, tile)}
                onClick={() => {
                  if (isDragging) return;
                  const isDisabled = tile.type === TileType.EMPTY;
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

      {/* Drag ghost */}
      {isDragging && dragFrom && pointer && (
        <div className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2" style={{ left: pointer.x, top: pointer.y }}>
          <div className="w-16 h-16 opacity-80 scale-95">
            <Tile tile={board[dragFrom.row][dragFrom.col]} />
          </div>
        </div>
      )}

    </div>
  );
};