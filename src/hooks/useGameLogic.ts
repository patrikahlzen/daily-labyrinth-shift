import { useState, useEffect, useCallback } from 'react';
import { GameState, GameTile, Direction, TileType } from '../types/game';
import { generateRandomTile, createInitialBoard } from '../utils/gameUtils';

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createInitialBoard(),
    playerPosition: { x: 1, y: 11 }, // Bottom center
    goalPosition: { x: 2, y: 0 }, // Top center
    heldTile: generateRandomTile(),
    moves: 0,
    timer: 0,
    gameStarted: false,
    gameCompleted: false,
    canUndo: false,
    previewMove: null
  }));

  // Timer effect
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameCompleted) return;

    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.gameCompleted]);

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStarted: true }));
  }, []);

  const pushTile = useCallback((row: number, col: number, direction: Direction) => {
    if (gameState.gameCompleted) return;

    setGameState(prev => {
      // Start game if not started
      if (!prev.gameStarted) {
        return { ...prev, gameStarted: true };
      }

      const newBoard = prev.board.map(r => [...r]);
      let newHeldTile = prev.heldTile;

      // Implement tile pushing logic based on direction
      if (direction === 'right' && col === 0) {
        // Push row to the right
        const pushedTile = newBoard[row][3];
        for (let i = 3; i > 0; i--) {
          newBoard[row][i] = newBoard[row][i - 1];
        }
        newBoard[row][0] = prev.heldTile!;
        newHeldTile = pushedTile;
      } else if (direction === 'left' && col === 3) {
        // Push row to the left
        const pushedTile = newBoard[row][0];
        for (let i = 0; i < 3; i++) {
          newBoard[row][i] = newBoard[row][i + 1];
        }
        newBoard[row][3] = prev.heldTile!;
        newHeldTile = pushedTile;
      } else if (direction === 'down' && row === 0) {
        // Push column down
        const pushedTile = newBoard[11][col];
        for (let i = 11; i > 0; i--) {
          newBoard[i][col] = newBoard[i - 1][col];
        }
        newBoard[0][col] = prev.heldTile!;
        newHeldTile = pushedTile;
      } else if (direction === 'up' && row === 11) {
        // Push column up
        const pushedTile = newBoard[0][col];
        for (let i = 0; i < 11; i++) {
          newBoard[i][col] = newBoard[i + 1][col];
        }
        newBoard[11][col] = prev.heldTile!;
        newHeldTile = pushedTile;
      }

      // Update player position if they were on the moved tile
      let newPlayerPosition = prev.playerPosition;
      // TODO: Implement player movement logic based on tile connections

      return {
        ...prev,
        board: newBoard,
        heldTile: newHeldTile,
        moves: prev.moves + 1,
        canUndo: true,
        previewMove: null
      };
    });
  }, [gameState.gameCompleted]);

  const undoMove = useCallback(() => {
    // TODO: Implement undo logic
    setGameState(prev => ({ ...prev, canUndo: false }));
  }, []);

  const confirmMove = useCallback(() => {
    setGameState(prev => ({ ...prev, previewMove: null }));
  }, []);

  return {
    gameState,
    startGame,
    pushTile,
    undoMove,
    confirmMove
  };
};