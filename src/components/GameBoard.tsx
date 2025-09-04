import React, { useState } from 'react';
import { Tile } from './Tile';
import { GameTile, TileType, Direction } from '../types/game';

interface GameBoardProps {
  board: GameTile[][];
  goalPosition: { x: number; y: number };
  startPosition: { x: number; y: number };
  onTilePush: (row: number, col: number, direction: Direction) => void; // (kept for API parity)
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
  // Drag & Drop (HTML5) state + shake feedback
  const [dragFrom, setDragFrom] = useState<{ row: number; col: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ row: number; col: number } | null>(null);
  const [shakeCell, setShakeCell] = useState<{ row: number; col: number } | null>(null);

  // Helpers
  const cellIsStart = (row: number, col: number) =>
    startPosition.x === col && startPosition.y === row;
  const cellIsGoal = (row: number, col: number) =>
    goalPosition.x === col && goalPosition.y === row;
  const cellIsLocked = (row: number, col: number, tile: GameTile) =>
    cellIsStart(row, col) || cellIsGoal(row, col) || !!tile.locked;

  // Swap/tap interaction
  const handleTileClick = (row: number, col: number, tile: GameTile) => {
    if (cellIsLocked(row, col, tile) || tile.type === TileType.EMPTY) {
      setShakeCell({ row, col });
      setTimeout(() => setShakeCell(null), 400);
      return;
    }
    onTileTap?.(row, col);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, row: number, col: number, tile: GameTile) => {
    if (tile.type === TileType.EMPTY || cellIsLocked(row, col, tile)) {
      e.preventDefault();
      setShakeCell({ row, col });
      setTimeout(() => setShakeCell(null), 400);
      return;
    }
    setDragFrom({ row, col });
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent, row: number, col: number, tile: GameTile) => {
    // Only allow drag-over if the target can be swapped with (not empty, not locked/start/goal)
    if (tile.type === TileType.EMPTY || cellIsLocked(row, col, tile)) return;
    e.preventDefault();
    setDragOver(prev =>
      !prev || prev.row !== row || prev.col !== col ? { row, col } : prev
    );
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number, tile: GameTile) => {
    e.preventDefault();
    if (tile.type === TileType.EMPTY || cellIsLocked(row, col, tile)) {
      setDragOver(null);
      return;
    }

    // Source
    let src = dragFrom as { row: number; col: number } | null;
    if (!src) {
      try {
        const parsed = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (parsed && typeof parsed.row === 'number' && typeof parsed.col === 'number') {
          src = parsed;
        }
      } catch {}
    }

    if (src && (src.row !== row || src.col !== col)) {
      const srcTile = board[src.row]?.[src.col];
      const sourceLocked =
        !srcTile ||
        srcTile.type === TileType.EMPTY ||
       
