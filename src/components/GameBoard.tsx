import React, { useState } from 'react';
import { Tile } from './Tile';
import { GameTile, TileType, Direction } from '../types/game';

interface GameBoardProps {
  board: GameTile[][];
  playerPosition: { x: number; y: number };
  goalPosition: { x: number; y: number };
  onTilePush: (row: number, col: number, direction: Direction) => void;
  previewMove?: { row: number; col: number; direction: Direction } | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  playerPosition,
  goalPosition,
  onTilePush,
  previewMove
}) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart) return;
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent, row: number, col: number) => {
    if (!dragStart || !isDragging) {
      setDragStart(null);
      setIsDragging(false);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    const threshold = 30;

    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      let direction: Direction;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      onTilePush(row, col, direction);
    }

    setDragStart(null);
    setIsDragging(false);
  };

  return (
    <div className="relative">
      {/* Game Board */}
      <div 
        className="grid grid-cols-4 gap-1 p-4 bg-gradient-board rounded-2xl shadow-game"
        style={{ gridTemplateRows: 'repeat(12, 1fr)' }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const isPlayer = playerPosition.x === colIndex && playerPosition.y === rowIndex;
            const isGoal = goalPosition.x === colIndex && goalPosition.y === rowIndex;
            const isPreview = previewMove?.row === rowIndex && previewMove?.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="relative aspect-square"
                onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(e, rowIndex, colIndex)}
              >
                <Tile
                  tile={tile}
                  isPlayer={isPlayer}
                  isGoal={isGoal}
                  isPreview={isPreview}
                />
                
                {/* Row/Column indicators for pushing */}
                {(rowIndex === 0 || rowIndex === 11) && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
                {(rowIndex === 0 || rowIndex === 11) && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
                {(colIndex === 0 || colIndex === 3) && (
                  <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
                {(colIndex === 0 || colIndex === 3) && (
                  <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Drag hint */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 rounded-2xl border-2 border-dashed border-primary/50 flex items-center justify-center">
          <div className="text-primary font-semibold">↔ Drag to push tiles ↕</div>
        </div>
      )}
    </div>
  );
};