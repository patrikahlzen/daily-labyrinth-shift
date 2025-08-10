import { useState, useEffect, useCallback } from 'react';
import { GameState, GameTile, Direction, TileType } from '../types/game';
import { generateRandomTile, createInitialBoard, canMoveTo } from '../utils/gameUtils';

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
    canRewind: false,
    previewMove: null,
    previewPath: [],
    branchChoice: null,
    walkTimeline: [],
    pushHistory: [],
    selectedTile: null,
    pendingSwap: null
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

  // Simulate auto-walk until goal, dead end, or branch
  const simulateAutoWalk = useCallback((
    board: GameTile[][],
    start: { x: number; y: number },
    goal: { x: number; y: number },
    forcedFirstDirection?: Direction
  ): {
    path: { x: number; y: number }[];
    stopReason: 'goal' | 'deadEnd' | 'branch';
    branch?: { x: number; y: number; options: Direction[] };
  } => {
    const path: { x: number; y: number }[] = [{ x: start.x, y: start.y }];
    let current = { ...start };
    let prev: { x: number; y: number } | null = null;

    const dirFromDelta = (dx: number, dy: number): Direction | null => {
      if (dx === 1 && dy === 0) return 'right';
      if (dx === -1 && dy === 0) return 'left';
      if (dx === 0 && dy === -1) return 'up';
      if (dx === 0 && dy === 1) return 'down';
      return null;
    };

    while (true) {
      if (current.x === goal.x && current.y === goal.y) {
        return { path, stopReason: 'goal' };
      }

      const candidates: { x: number; y: number; dir: Direction }[] = [];
      const deltas = [
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
        { dx: 1, dy: 0 },  // right
        { dx: -1, dy: 0 }, // left
      ];

      for (const { dx, dy } of deltas) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (prev && nx === prev.x && ny === prev.y) continue; // don't go back
        if (canMoveTo(board, current.x, current.y, nx, ny)) {
          const dir = dirFromDelta(dx, dy)!;
          candidates.push({ x: nx, y: ny, dir });
        }
      }

      if (path.length === 1 && forcedFirstDirection) {
        const forced = candidates.find(c => c.dir === forcedFirstDirection);
        if (forced) {
          prev = { ...current };
          current = { x: forced.x, y: forced.y };
          path.push(current);
          continue;
        }
      }

      if (candidates.length === 0) {
        return { path, stopReason: 'deadEnd' };
      }
      if (candidates.length > 1) {
        return {
          path,
          stopReason: 'branch',
          branch: {
            x: current.x,
            y: current.y,
            options: candidates.map(c => c.dir)
          }
        };
      }

      // exactly one way forward
      prev = { ...current };
      current = { x: candidates[0].x, y: candidates[0].y };
      path.push(current);
    }
  }, []);

  const pushTile = useCallback((row: number, col: number, direction: Direction) => {
    if (gameState.gameCompleted) return;

    setGameState(prev => {
      // Start game if not started
      const base = { ...prev };
      if (!base.gameStarted) base.gameStarted = true;

      const snapshot = {
        board: base.board.map(r => r.map(t => ({ ...t }))),
        playerPosition: { ...base.playerPosition },
        heldTile: base.heldTile,
        moves: base.moves
      };

      const newBoard = base.board.map(r => [...r]);
      let newHeldTile = base.heldTile;

      // Implement tile pushing logic based on direction
      if (direction === 'right' && col === 0) {
        const pushedTile = newBoard[row][3];
        for (let i = 3; i > 0; i--) newBoard[row][i] = newBoard[row][i - 1];
        newBoard[row][0] = base.heldTile!;
        newHeldTile = pushedTile;
      } else if (direction === 'left' && col === 3) {
        const pushedTile = newBoard[row][0];
        for (let i = 0; i < 3; i++) newBoard[row][i] = newBoard[row][i + 1];
        newBoard[row][3] = base.heldTile!;
        newHeldTile = pushedTile;
      } else if (direction === 'down' && row === 0) {
        const pushedTile = newBoard[11][col];
        for (let i = 11; i > 0; i--) newBoard[i][col] = newBoard[i - 1][col];
        newBoard[0][col] = base.heldTile!;
        newHeldTile = pushedTile;
      } else if (direction === 'up' && row === 11) {
        const pushedTile = newBoard[0][col];
        for (let i = 0; i < 11; i++) newBoard[i][col] = newBoard[i + 1][col];
        newBoard[11][col] = base.heldTile!;
        newHeldTile = pushedTile;
      }

      // Prepare preview auto-walk from current player position
      const sim = simulateAutoWalk(newBoard, base.playerPosition, base.goalPosition);

      return {
        ...base,
        board: newBoard,
        heldTile: newHeldTile,
        moves: base.moves + 1,
        canUndo: true,
        canRewind: base.walkTimeline.length > 0,
        previewMove: null,
        previewPath: sim.path,
        branchChoice: sim.stopReason === 'branch' ? sim.branch! : null,
        pushHistory: [...base.pushHistory, snapshot],
      };
    });
  }, [gameState.gameCompleted, simulateAutoWalk]);

  const undoMove = useCallback(() => {
    setGameState(prev => {
      const history = [...prev.pushHistory];
      const last = history.pop();
      if (!last) return prev;
      return {
        ...prev,
        board: last.board,
        heldTile: last.heldTile,
        playerPosition: last.playerPosition,
        moves: last.moves,
        pushHistory: history,
        canUndo: history.length > 0,
        previewPath: [],
        branchChoice: null,
        previewMove: null,
        selectedTile: null,
        pendingSwap: null
      };
    });
  }, []);

  const rewindStep = useCallback(() => {
    setGameState(prev => {
      const timeline = [...prev.walkTimeline];
      if (timeline.length === 0) return prev;
      timeline.pop();
      const newPos = timeline.length > 0 ? timeline[timeline.length - 1] : prev.playerPosition;
      return {
        ...prev,
        walkTimeline: timeline,
        playerPosition: newPos,
        canRewind: timeline.length > 0
      };
    });
  }, []);

  const chooseDirection = useCallback((dir: Direction) => {
    setGameState(prev => {
      if (!prev.branchChoice) return prev;
      const sim = simulateAutoWalk(prev.board, prev.playerPosition, prev.goalPosition, dir);
      return {
        ...prev,
        previewPath: sim.path,
        branchChoice: sim.stopReason === 'branch' ? sim.branch! : null
      };
    });
  }, [simulateAutoWalk]);

  // Tap two tiles to preview a swap
  const tapTile = useCallback((row: number, col: number) => {
    setGameState(prev => {
      const base = { ...prev };
      if (!base.gameStarted) base.gameStarted = true;

      if (!base.selectedTile) {
        return { ...base, selectedTile: { row, col }, pendingSwap: null, previewPath: [], branchChoice: null };
      }

      if (base.selectedTile.row === row && base.selectedTile.col === col) {
        return { ...base, selectedTile: null, pendingSwap: null, previewPath: [], branchChoice: null };
      }

      // Build preview board with swap
      const newBoard = base.board.map(r => r.slice());
      const s = base.selectedTile;
      const temp = newBoard[s.row][s.col];
      newBoard[s.row][s.col] = newBoard[row][col];
      newBoard[row][col] = temp;

      const sim = simulateAutoWalk(newBoard, base.playerPosition, base.goalPosition);

      return {
        ...base,
        pendingSwap: { from: s, to: { row, col } },
        previewPath: sim.path,
        branchChoice: sim.stopReason === 'branch' ? sim.branch! : null
      };
    });
  }, [simulateAutoWalk]);

  const confirmMove = useCallback(() => {
    setGameState(prev => {
      if (!prev.pendingSwap) return prev;

      const snapshot = {
        board: prev.board.map(r => r.map(t => ({ ...t }))),
        playerPosition: { ...prev.playerPosition },
        heldTile: prev.heldTile,
        moves: prev.moves
      };

      // Commit the swap
      const newBoard = prev.board.map(r => r.slice());
      const { from, to } = prev.pendingSwap;
      const temp = newBoard[from.row][from.col];
      newBoard[from.row][from.col] = newBoard[to.row][to.col];
      newBoard[to.row][to.col] = temp;

      const steps = prev.previewPath && prev.previewPath.length > 1 ? prev.previewPath.slice(1) : [];
      let index = 0;

      const runStep = () => {
        setGameState(curr => {
          if (index >= steps.length) {
            return {
              ...curr,
              previewPath: [],
              branchChoice: null,
              canRewind: curr.walkTimeline.length > 0,
              gameCompleted: curr.playerPosition.x === curr.goalPosition.x && curr.playerPosition.y === curr.goalPosition.y ? true : curr.gameCompleted
            };
          }
          const nextPos = steps[index++];
          const newTimeline = [...curr.walkTimeline, nextPos];
          const atGoal = nextPos.x === curr.goalPosition.x && nextPos.y === curr.goalPosition.y;
          setTimeout(runStep, 200);
          return {
            ...curr,
            playerPosition: nextPos,
            walkTimeline: newTimeline,
            gameCompleted: atGoal || curr.gameCompleted
          };
        });
      };

      setTimeout(runStep, 0);

      return {
        ...prev,
        board: newBoard,
        moves: prev.moves + 1,
        pushHistory: [...prev.pushHistory, snapshot],
        canUndo: true,
        selectedTile: null,
        pendingSwap: null
      };
    });
  }, []);

  return {
    gameState,
    startGame,
    pushTile,
    undoMove,
    confirmMove,
    rewindStep,
    chooseDirection,
    onTileTap: tapTile
  };
};