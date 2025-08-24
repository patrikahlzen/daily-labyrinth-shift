import { useState, useEffect, useCallback } from 'react';
import { GameState, GameTile, Direction, TileType, TileConnections } from '../types/game';
import { generateRandomTile, createInitialBoard, canMoveTo } from '../utils/gameUtils';
import { getDailyKeySE } from './useDaily';
import { calculateStarRating } from '../utils/scoring';

export const useGameLogic = () => {
  // Check for valid path connection from start to goal
  const checkPathConnection = useCallback((board: GameTile[][], start: { x: number; y: number }, goal: { x: number; y: number }) => {
    const visited = new Set<string>();
    const path: { x: number; y: number }[] = [];
    
    const dfs = (current: { x: number; y: number }): boolean => {
      const { x, y } = current;
      const key = `${x},${y}`;

      if (visited.has(key)) return false;
      visited.add(key);
      path.push(current);

      if (x === goal.x && y === goal.y) return true;

      if (y < 0 || y >= board.length || x < 0 || x >= board[0].length) return false;

      const tile = board[y][x];
      if (tile.type !== TileType.PATH) return false;

      const directions: Array<{ dir: Direction; dx: number; dy: number; connection: keyof TileConnections }> = [
        { dir: 'up', dx: 0, dy: -1, connection: 'north' },
        { dir: 'down', dx: 0, dy: 1, connection: 'south' },
        { dir: 'left', dx: -1, dy: 0, connection: 'west' },
        { dir: 'right', dx: 1, dy: 0, connection: 'east' }
      ];

      for (const { dx, dy, connection } of directions) {
        if (!tile.connections[connection]) continue;
        
        const nx = x + dx, ny = y + dy;
        if (ny < 0 || ny >= board.length || nx < 0 || nx >= board[0].length) continue;
        
        const neighbor = board[ny][nx];
        if (neighbor.type !== TileType.PATH) continue;
        
        const oppositeConnections = {
          north: 'south', south: 'north', west: 'east', east: 'west'
        } as const;
        
        if (neighbor.connections[oppositeConnections[connection]]) {
          if (dfs({ x: nx, y: ny })) return true;
        }
      }

      path.pop();
      return false;
    };

    const connected = dfs(start);
    return { connected, path: connected ? path : [] };
  }, []);

  const [gameState, setGameState] = useState<GameState>(() => {
    const dailySeed = `SEED_${getDailyKeySE()}`;
    const board = createInitialBoard(dailySeed);

    const findPos = (id: string): { x: number; y: number } => {
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < (board[0]?.length ?? 0); x++) {
          if (board[y][x]?.id === id) return { x, y };
        }
      }
      return { x: 0, y: 0 };
    };

    const start = findPos('start-tile');
    const goal = findPos('goal-tile');

    return {
      board,
      startPosition: start,
      goalPosition: goal,
      moves: 0,
      timer: 0,
      gameStarted: false,
      gameCompleted: false,
      canUndo: false,
      connectedPath: [],
      validConnection: false,
      pushHistory: [],
      selectedTile: null,
      gemsCollected: 0,
      stars: 0,
      attempts: 0
    };
  });

  // Persistence and timer effects
  const STORAGE_KEY = `dlab_state_${getDailyKeySE()}`;

  useEffect(() => {
    if (!STORAGE_KEY) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Validate saved board's goal tile so we don't resurrect broken states
        const board: GameTile[][] | undefined = saved?.board;
        if (Array.isArray(board) && board.length > 0 && Array.isArray(board[0])) {
          // Recompute start/goal from IDs to be safe
          const findPos = (id: string): { x: number; y: number } => {
            for (let y = 0; y < board.length; y++) {
              for (let x = 0; x < (board[0]?.length ?? 0); x++) {
                if (board[y][x]?.id === id) return { x, y };
              }
            }
            return { x: 0, y: 0 };
          };
          const start = findPos('start-tile');
          const goal = findPos('goal-tile');
          const goalTile = board?.[goal.y]?.[goal.x];
          const hasConnection = !!goalTile && goalTile.type === TileType.PATH && Object.values(goalTile.connections || {}).some(Boolean);
          if (!hasConnection) {
            // Discard broken save and regenerate a fresh, validated board for today
            const dailySeed = `SEED_${getDailyKeySE()}`;
            const fresh = createInitialBoard(dailySeed);
            const newStart = findPos('start-tile');
            const newGoal = findPos('goal-tile');
            setGameState(prev => ({
              ...prev,
              board: fresh,
              startPosition: newStart,
              goalPosition: newGoal,
              connectedPath: [],
              validConnection: false,
              moves: 0,
              timer: 0,
              gameStarted: false,
              gameCompleted: false,
              canUndo: false,
              pushHistory: [],
              selectedTile: null,
              gemsCollected: 0,
              stars: 0
            }));
            // Clear the broken state to avoid loading it again
            localStorage.removeItem(STORAGE_KEY);
            return;
          }
        }
        setGameState(prev => ({ ...prev, ...saved, connectedPath: [], validConnection: false }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameCompleted) return;
    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.gameCompleted]);

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStarted: true, attempts: prev.attempts + 1 }));
  }, []);

  const pushTile = useCallback((row: number, col: number, direction: Direction) => {
    if (gameState.gameCompleted) return;
    setGameState(prev => {
      const base = { ...prev };
      if (!base.gameStarted) base.gameStarted = true;

      const snapshot = {
        board: base.board.map(r => r.map(t => ({ ...t }))),
        startPosition: { ...base.startPosition },
        goalPosition: { ...base.goalPosition },
        moves: base.moves
      };

      const newBoard = base.board.map(r => [...r]);

      // Since we removed tile pushing, this function now only handles swapping
      // Remove the push tile functionality entirely

      const pathCheck = checkPathConnection(newBoard, base.startPosition, base.goalPosition);
      const rating = calculateStarRating(pathCheck.connected, base.moves + 1, newBoard, base.gemsCollected);

      return {
        ...base,
        board: newBoard,
        moves: base.moves + 1,
        canUndo: true,
        connectedPath: pathCheck.path,
        validConnection: pathCheck.connected,
        gameCompleted: pathCheck.connected,
        stars: rating.stars,
        pushHistory: [...base.pushHistory, snapshot],
      };
    });
  }, [gameState.gameCompleted, checkPathConnection]);

  const undoMove = useCallback(() => {
    setGameState(prev => {
      const history = [...prev.pushHistory];
      const last = history.pop();
      if (!last) return prev;
      
      const pathCheck = checkPathConnection(last.board, last.startPosition, last.goalPosition);
      
      return {
        ...prev,
        board: last.board,
        startPosition: last.startPosition,
        goalPosition: last.goalPosition,
        moves: last.moves,
        pushHistory: history,
        canUndo: history.length > 0,
        connectedPath: pathCheck.path,
        validConnection: pathCheck.connected,
        gameCompleted: pathCheck.connected,
        selectedTile: null
      };
    });
  }, [checkPathConnection]);

  const tapTile = useCallback((row: number, col: number) => {
    setGameState(prev => {
      if (!prev.selectedTile) {
        return { ...prev, selectedTile: { row, col } };
      }
      if (prev.selectedTile.row === row && prev.selectedTile.col === col) {
        return { ...prev, selectedTile: null };
      }
      
      // Perform the swap between selected tile and current tile
      if (!prev.gameStarted) prev.gameStarted = true;

      const snapshot = {
        board: prev.board.map(r => r.map(t => ({ ...t }))),
        startPosition: { ...prev.startPosition },
        goalPosition: { ...prev.goalPosition },
        moves: prev.moves
      };

      const newBoard = prev.board.map(r => r.slice());
      const temp = newBoard[prev.selectedTile.row][prev.selectedTile.col];
      newBoard[prev.selectedTile.row][prev.selectedTile.col] = newBoard[row][col];
      newBoard[row][col] = temp;

      const pathCheck = checkPathConnection(newBoard, prev.startPosition, prev.goalPosition);
      const rating = calculateStarRating(pathCheck.connected, prev.moves + 1, newBoard, prev.gemsCollected);

      return {
        ...prev,
        board: newBoard,
        moves: prev.moves + 1,
        canUndo: true,
        connectedPath: pathCheck.path,
        validConnection: pathCheck.connected,
        gameCompleted: pathCheck.connected,
        stars: rating.stars,
        pushHistory: [...prev.pushHistory, snapshot],
        selectedTile: null
      };
    });
  }, [checkPathConnection]);

  const swapTiles = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    setGameState(prev => {
      if (!prev.gameStarted) prev.gameStarted = true;

      const snapshot = {
        board: prev.board.map(r => r.map(t => ({ ...t }))),
        startPosition: { ...prev.startPosition },
        goalPosition: { ...prev.goalPosition },
        moves: prev.moves
      };

      const newBoard = prev.board.map(r => r.slice());
      const temp = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = newBoard[toRow][toCol];
      newBoard[toRow][toCol] = temp;

      const pathCheck = checkPathConnection(newBoard, prev.startPosition, prev.goalPosition);
      const rating = calculateStarRating(pathCheck.connected, prev.moves + 1, newBoard, prev.gemsCollected);

      return {
        ...prev,
        board: newBoard,
        moves: prev.moves + 1,
        canUndo: true,
        connectedPath: pathCheck.path,
        validConnection: pathCheck.connected,
        gameCompleted: pathCheck.connected,
        stars: rating.stars,
        pushHistory: [...prev.pushHistory, snapshot],
        selectedTile: null
      };
    });
  }, [checkPathConnection]);

  const generateNewPuzzle = useCallback(() => {
    // Generate a new puzzle with a random seed based on current timestamp
    const randomSeed = `PUZZLE_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const board = createInitialBoard(randomSeed);

    const findPos = (id: string): { x: number; y: number } => {
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < (board[0]?.length ?? 0); x++) {
          if (board[y][x]?.id === id) return { x, y };
        }
      }
      return { x: 0, y: 0 };
    };

    const start = findPos('start-tile');
    const goal = findPos('goal-tile');

    setGameState(prev => ({
      board,
      startPosition: start,
      goalPosition: goal,
      moves: 0,
      timer: 0,
      gameStarted: false,
      gameCompleted: false,
      canUndo: false,
      connectedPath: [],
      validConnection: false,
      pushHistory: [],
      selectedTile: null,
      gemsCollected: 0,
      stars: 0,
      attempts: 0 // Reset attempt count for new puzzle
    }));
    
    // Clear any saved state since this is a new puzzle
    localStorage.removeItem(STORAGE_KEY);
  }, [STORAGE_KEY]);

  const resetGame = useCallback(() => {
    const dailySeed = `SEED_${getDailyKeySE()}`;
    const board = createInitialBoard(dailySeed);

    const findPos = (id: string): { x: number; y: number } => {
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < (board[0]?.length ?? 0); x++) {
          if (board[y][x]?.id === id) return { x, y };
        }
      }
      return { x: 0, y: 0 };
    };

    const start = findPos('start-tile');
    const goal = findPos('goal-tile');

    setGameState(prev => ({
      board,
      startPosition: start,
      goalPosition: goal,
      moves: 0,
      timer: 0,
      gameStarted: false,
      gameCompleted: false,
      canUndo: false,
      connectedPath: [],
      validConnection: false,
      pushHistory: [],
      selectedTile: null,
      gemsCollected: 0,
      stars: 0,
      attempts: prev.attempts // Keep attempt count
    }));
  }, []);

  return {
    gameState,
    startGame,
    pushTile,
    undoMove,
    onTileTap: tapTile,
    onSwapTiles: swapTiles,
    resetGame,
    generateNewPuzzle
  };
};