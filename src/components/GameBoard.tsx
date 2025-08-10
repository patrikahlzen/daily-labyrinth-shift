import React, { useState } from 'react';
import { Tile } from './Tile';
import { GameTile, TileType, Direction } from '../types/game';

interface GameBoardProps {
  board: GameTile[][];
  playerPosition: { x: number; y: number };
  goalPosition: { x: number; y: number };
  onTilePush: (row: number, col: number, direction: Direction) => void;
  previewMove?: { row: number; col: number; direction: Direction } | null;
  previewPath?: { x: number; y: number }[];
  branchChoice?: { x: number; y: number; options: Direction[] } | null;
  onChooseDirection?: (dir: Direction) => void;
  // Swap-only controls
  onTileTap?: (row: number, col: number) => void;
  selectedTile?: { row: number; col: number } | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  playerPosition,
  goalPosition,
  onTilePush,
  previewMove,
  previewPath,
  branchChoice,
  onChooseDirection,
  onTileTap,
  selectedTile
}) => {
  // Swap/tap interaction
  const handleTileClick = (row: number, col: number) => {
    onTileTap?.(row, col);
  };

  return (
    <div className="relative px-[50px]">
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

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`relative aspect-square ${ (tile.type === TileType.EMPTY || isGoal) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer' }`}
                onClick={() => {
                  const isDisabled = tile.type === TileType.EMPTY || isGoal;
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
                  />
                  {/* Preview path highlight */}
                  {previewPath?.some(p => p.x === colIndex && p.y === rowIndex) && (
                    <div className="absolute inset-0 ring-2 ring-primary/50 rounded-lg pointer-events-none" />
                  )}
                  {/* Selected tile highlight */}
                  {selectedTile && selectedTile.row === rowIndex && selectedTile.col === colIndex && (
                    <div className="absolute inset-0 ring-2 ring-accent/60 rounded-lg pointer-events-none" />
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