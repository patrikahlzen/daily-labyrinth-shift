import { GameTile, TileType, TileConnections } from '../types/game';
import { getDifficultyForDay, getTemplateForSeed, validatePuzzleQuality } from './difficultySystem';

// Simple seeded PRNG (xmur3 + mulberry32)
const xmur3 = (str: string) => {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
};
const mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const createRng = (seed?: string) => {
  if (!seed) return Math.random;
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
};

// Clean tile patterns - only straights and L-bends for logical, clean gameplay
const TILE_PATTERNS: TileConnections[] = [
  // Straight lines
  { north: true, south: true, east: false, west: false }, // Vertical
  { north: false, south: false, east: true, west: true }, // Horizontal
  
  // L-shapes (clean bends only)
  { north: true, south: false, east: true, west: false }, // NE corner
  { north: true, south: false, east: false, west: true }, // NW corner
  { north: false, south: true, east: true, west: false }, // SE corner
  { north: false, south: true, east: false, west: true }, // SW corner
];

export const generateRandomTile = (): GameTile => {
  const pattern = TILE_PATTERNS[Math.floor(Math.random() * TILE_PATTERNS.length)];
  const hasSpecial = Math.random() < 0.15; // 15% chance for special items
  
  let special: GameTile['special'] = null;
  if (hasSpecial) {
    const specials = ['key', 'time', 'gem'] as const;
    special = specials[Math.floor(Math.random() * specials.length)];
  }

  return {
    type: TileType.PATH,
    connections: pattern,
    special,
    id: Math.random().toString(36).substr(2, 9)
  };
};

export const generateEmptyTile = (): GameTile => ({
  type: TileType.EMPTY,
  connections: { north: false, south: false, east: false, west: false },
  special: null,
  id: Math.random().toString(36).substr(2, 9)
});

export const createInitialBoard = (seed?: string): GameTile[][] => {
  const rng = createRng(seed);
  let idCounter = 0;
  const newId = () => `t-${(++idCounter).toString(36)}`;

  // Use difficulty system for curated puzzle generation
  const daysSinceEpoch = seed ? 
    Math.floor(parseInt(seed.slice(-8), 16) / 86400000) : 
    Math.floor(Date.now() / 86400000);
  
  const difficulty = getDifficultyForDay(daysSinceEpoch);
  const template = getTemplateForSeed(seed || Date.now().toString(), difficulty);
  const { rows, cols } = template.boardSize;
  
  // Smart start/goal placement for optimal challenge
  const getRandomPosition = (excludePositions: {x: number, y: number}[] = []) => {
    const boardArea = rows * cols;
    const minDistance = Math.max(3, Math.floor(Math.sqrt(boardArea))); // Scale with board size
    
    let attempts = 0;
    while (attempts < 50) {
      // Prefer positions away from edges but not exclusively
      const edgeWeight = 0.3; // 30% chance to be near edge
      let x, y;
      
      if (rng() < edgeWeight) {
        // Edge placement for variety
        const side = Math.floor(rng() * 4);
        switch (side) {
          case 0: x = 0; y = Math.floor(rng() * rows); break;
          case 1: x = cols - 1; y = Math.floor(rng() * rows); break;
          case 2: x = Math.floor(rng() * cols); y = 0; break;
          case 3: x = Math.floor(rng() * cols); y = rows - 1; break;
          default: x = Math.floor(rng() * cols); y = Math.floor(rng() * rows);
        }
      } else {
        // Interior placement
        x = Math.floor(rng() * cols);
        y = Math.floor(rng() * rows);
      }
      
      // Check distance from excluded positions
      const isValid = excludePositions.every(pos => {
        const distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
        return distance >= minDistance;
      });
      
      if (isValid) return { x, y };
      attempts++;
    }
    
    // Guaranteed fallback positions
    const fallbacks = [
      { x: 1, y: 1 },
      { x: cols - 2, y: rows - 2 },
      { x: 1, y: rows - 2 },
      { x: cols - 2, y: 1 },
    ].filter(pos => pos.x >= 0 && pos.x < cols && pos.y >= 0 && pos.y < rows);
    
    return fallbacks[excludePositions.length % fallbacks.length] || { x: 0, y: 0 };
  };
  
  const start = getRandomPosition();
  const goal = getRandomPosition([start]);

  // Initialize empty board
  const emptyTile = (): GameTile => ({
    type: TileType.EMPTY,
    connections: { north: false, south: false, east: false, west: false },
    special: null,
    id: newId()
  });
  const board: GameTile[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyTile())
  );

  // Generate an interesting path with strategic turns and optimal length
  const boardSize = rows * cols;
  const targetPathLength = Math.floor(boardSize * (0.4 + rng() * 0.3)); // 40-70% of board
  const minTurns = Math.max(3, Math.floor(targetPathLength / 6)); // At least 3 turns
  
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );
  const path: { x: number; y: number }[] = [];
  
  const dirs = [
    { dx: 0, dy: -1, name: 'north' }, 
    { dx: 0, dy: 1, name: 'south' },  
    { dx: 1, dy: 0, name: 'east' },  
    { dx: -1, dy: 0, name: 'west' }  
  ];

  const inBounds = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows;
  
  // Smart pathfinding that encourages turns
  const generatePathWithTurns = (x: number, y: number, lastDir?: string, turnCount = 0): boolean => {
    path.push({ x, y });
    if (x === goal.x && y === goal.y) {
      return path.length >= Math.floor(targetPathLength * 0.7) && turnCount >= minTurns;
    }
    
    if (path.length > targetPathLength * 1.5) return false; // Prevent overly long paths
    visited[y][x] = true;

    // Bias towards creating turns for interesting gameplay
    const order = [...dirs];
    for (let i = order.length - 1; i > 0; i--) {
      const r = Math.floor(rng() * (i + 1));
      [order[i], order[r]] = [order[r], order[i]];
    }
    
    // Prefer directions that create turns if we need more
    if (turnCount < minTurns && lastDir) {
      order.sort((a, b) => {
        const aTurn = a.name !== lastDir ? -1 : 1;
        const bTurn = b.name !== lastDir ? -1 : 1;
        return aTurn - bTurn;
      });
    }

    for (const { dx, dy, name } of order) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny) || visited[ny][nx]) continue;
      
      const newTurnCount = (lastDir && name !== lastDir) ? turnCount + 1 : turnCount;
      if (generatePathWithTurns(nx, ny, name, newTurnCount)) return true;
    }

    visited[y][x] = false;
    path.pop();
    return false;
  };

  // Try multiple times to get a good path
  let attempts = 0;
  while (attempts < 10 && !generatePathWithTurns(start.x, start.y)) {
    path.length = 0;
    visited.forEach(row => row.fill(false));
    attempts++;
  }
  
  // Fallback: create a simpler but valid path
  if (path.length === 0 || path[path.length - 1].x !== goal.x || path[path.length - 1].y !== goal.y) {
    path.length = 0;
    let x = start.x;
    let y = start.y;
    path.push({ x, y });
    
    // Create L-shaped path with guaranteed turns
    const midX = Math.floor((start.x + goal.x) / 2);
    const midY = Math.floor((start.y + goal.y) / 2);
    
    // Move to intermediate point first
    while (x !== midX) {
      x += x < midX ? 1 : -1;
      path.push({ x, y });
    }
    while (y !== midY) {
      y += y < midY ? 1 : -1;
      path.push({ x, y });
    }
    // Then to goal
    while (x !== goal.x) {
      x += x < goal.x ? 1 : -1;
      path.push({ x, y });
    }
    while (y !== goal.y) {
      y += y < goal.y ? 1 : -1;
      path.push({ x, y });
    }
  }

  // Convert the path into tiles with only straight/L connections
  for (let i = 0; i < path.length; i++) {
    const { x, y } = path[i];
    const prev = i > 0 ? path[i - 1] : null;
    const next = i < path.length - 1 ? path[i + 1] : null;

    const connections = { north: false, south: false, east: false, west: false };
    if (prev) {
      if (prev.x === x && prev.y === y - 1) connections.north = true;
      if (prev.x === x && prev.y === y + 1) connections.south = true;
      if (prev.y === y && prev.x === x - 1) connections.west = true;
      if (prev.y === y && prev.x === x + 1) connections.east = true;
    }
    if (next) {
      if (next.x === x && next.y === y - 1) connections.north = true;
      if (next.x === x && next.y === y + 1) connections.south = true;
      if (next.y === y && next.x === x - 1) connections.west = true;
      if (next.y === y && next.x === x + 1) connections.east = true;
    }

    board[y][x] = {
      type: TileType.PATH,
      connections,
      special: null,
      id: newId()
    };
  }

  // Strategic gem placement using template guidance
  const gemPositions: { x: number; y: number }[] = [];
  const turnPoints: number[] = [];
  
  // Find turn points in the path
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];
    
    const prevDir = { x: curr.x - prev.x, y: curr.y - prev.y };
    const nextDir = { x: next.x - curr.x, y: next.y - curr.y };
    
    // This is a turn if direction changes
    if (prevDir.x !== nextDir.x || prevDir.y !== nextDir.y) {
      turnPoints.push(i);
    }
  }
  
  // Place gems using template requirements instead of hardcoded logic
  const targetGems = Math.min(template.gemCount, Math.max(1, Math.floor(path.length / 4)));
  
  // Always place gems at turns first (most strategic spots)
  for (let i = 0; i < Math.min(turnPoints.length, targetGems); i++) {
    const pos = path[turnPoints[i]];
    gemPositions.push(pos);
    board[pos.y][pos.x] = {
      ...board[pos.y][pos.x],
      special: 'gem'
    };
  }
  
  // Add evenly spaced gems if we need more
  if (gemPositions.length < targetGems) {
    const interval = Math.max(2, Math.floor(path.length / (targetGems - gemPositions.length + 1)));
    for (let i = interval; i < path.length - 1 && gemPositions.length < targetGems; i += interval) {
      const pos = path[i];
      if (!gemPositions.some(g => g.x === pos.x && g.y === pos.y)) {
        board[pos.y][pos.x] = {
          ...board[pos.y][pos.x],
          special: 'gem'
        };
        gemPositions.push(pos);
      }
    }
  }

  // Keep explicit IDs to mark start/goal for the UI
  board[start.y][start.x].id = 'start-tile';
  board[goal.y][goal.x].id = 'goal-tile';

  // Create sophisticated decoy paths for visual trickery
  const isOnPath = (x: number, y: number) => path.some(p => p.x === x && p.y === y);
  
  // First pass: create decoy tiles that almost connect to main path
  const decoyDensity = 0.4 + rng() * 0.2; // 40-60% coverage
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isOnPath(x, y)) continue;
      
      if (rng() < decoyDensity) {
        const pattern = { ...TILE_PATTERNS[Math.floor(rng() * TILE_PATTERNS.length)] };
        
        // Smart decoy placement: create almost-connections for visual traps
        const nIsPath = y - 1 >= 0 && isOnPath(x, y - 1);
        const sIsPath = y + 1 < rows && isOnPath(x, y + 1);
        const eIsPath = x + 1 < cols && isOnPath(x + 1, y);
        const wIsPath = x - 1 >= 0 && isOnPath(x - 1, y);
        
        const pathAdjacent = nIsPath || sIsPath || eIsPath || wIsPath;
        
        if (pathAdjacent) {
          // Create "almost connection" - looks like it should connect but doesn't
          if (rng() < 0.7) { // 70% chance to be a red herring
            // Block the connection that would lead to main path
            if (nIsPath) pattern.north = false;
            if (sIsPath) pattern.south = false;
            if (eIsPath) pattern.east = false;
            if (wIsPath) pattern.west = false;
          } else {
            // 30% chance to create a real connection (makes puzzle more complex)
            // Keep the pattern as is for potential shortcuts
          }
        }
        
        board[y][x] = {
          type: TileType.PATH,
          connections: pattern,
          special: null,
          id: newId()
        };
      }
    }
  }
  
  // Second pass: create mini decoy paths that form coherent but disconnected segments
  const createDecoySegment = (startX: number, startY: number, length: number) => {
    let x = startX, y = startY;
    let segmentLength = 0;
    let lastDir = '';
    
    while (segmentLength < length && inBounds(x, y) && board[y][x].type === TileType.EMPTY) {
      if (isOnPath(x, y)) break; // Don't interfere with main path
      
      const availableDirs = dirs.filter(d => {
        const nx = x + d.dx, ny = y + d.dy;
        return inBounds(nx, ny) && !isOnPath(nx, ny) && d.name !== lastDir;
      });
      
      if (availableDirs.length === 0) break;
      
      const dir = availableDirs[Math.floor(rng() * availableDirs.length)];
      const nextX = x + dir.dx;
      const nextY = y + dir.dy;
      
      // Create connection
      const connections = { north: false, south: false, east: false, west: false };
      connections[dir.name as keyof typeof connections] = true;
      
      board[y][x] = {
        type: TileType.PATH,
        connections,
        special: null,
        id: newId()
      };
      
      x = nextX;
      y = nextY;
      lastDir = dir.name;
      segmentLength++;
    }
  };
  
  // Add a few coherent decoy segments
  const numDecoySegments = Math.floor(rng() * 3) + 1;
  for (let i = 0; i < numDecoySegments; i++) {
    const startX = Math.floor(rng() * cols);
    const startY = Math.floor(rng() * rows);
    createDecoySegment(startX, startY, 2 + Math.floor(rng() * 3));
  }

  // Intelligent scrambling for optimal difficulty
  // Scale difficulty with board size - larger boards need more moves
  const boardArea = rows * cols;
  const MIN_SWAP_DISTANCE = Math.max(5, Math.floor(boardArea * 0.4)); // Dynamic difficulty
  const MAX_SWAP_DISTANCE = Math.floor(boardArea * 0.7); // Upper bound to avoid impossibility
  
  const movable = path.slice(1, -1); // exclude start and goal positions

  // Snapshot solved state for movable positions
  const solvedTiles = movable.map(({ x, y }) => board[y][x]);
  const solvedIds = solvedTiles.map(t => t.id);

  const applyPermutation = (order: number[]) => {
    // order is a permutation of indices [0..movable.length-1]
    const tiles = order.map(i => solvedTiles[i]);
    for (let i = 0; i < movable.length; i++) {
      const { x, y } = movable[i];
      board[y][x] = { ...tiles[i] };
    }
  };

  const minimalSwaps = (currentIds: string[]) => {
    const indexOfId: Record<string, number> = {};
    solvedIds.forEach((id, idx) => (indexOfId[id] = idx));
    const n = currentIds.length;
    const visited = new Array(n).fill(false);
    let swaps = 0;
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      let cycleLen = 0;
      let j = i;
      while (!visited[j]) {
        visited[j] = true;
        const id = currentIds[j];
        j = indexOfId[id];
        cycleLen++;
      }
      if (cycleLen > 1) swaps += cycleLen - 1;
    }
    return swaps;
  };

  // Enhanced shuffling algorithm for unique solutions
  let best: { ids: string[]; swaps: number; solutionCount: number } | null = null;
  const MAX_ATTEMPTS = 30;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Progressive difficulty: start with minimum swaps, increase if needed
    const targetSwaps = MIN_SWAP_DISTANCE + Math.floor(attempt / 10);
    const k = Math.min(movable.length, Math.max(3, targetSwaps));
    
    // Create more sophisticated permutations
    const order = Array.from({ length: movable.length }, (_, i) => i);
    
    // Multiple smaller cycles for more complex arrangements
    const cycleCount = Math.min(3, Math.floor(k / 2) + 1);
    const usedIndices = new Set<number>();
    
    for (let c = 0; c < cycleCount && usedIndices.size < movable.length; c++) {
      const availableIndices = Array.from({ length: movable.length }, (_, i) => i)
        .filter(i => !usedIndices.has(i));
      
      if (availableIndices.length < 2) break;
      
      // Fisher-Yates shuffle for this cycle
      for (let i = availableIndices.length - 1; i > 0; i--) {
        const r = Math.floor(rng() * (i + 1));
        [availableIndices[i], availableIndices[r]] = [availableIndices[r], availableIndices[i]];
      }
      
      const cycleSize = Math.min(Math.max(2, Math.floor(k / cycleCount)), availableIndices.length);
      const cycle = availableIndices.slice(0, cycleSize);
      
      // Apply cycle
      for (let i = 0; i < cycle.length; i++) {
        const from = cycle[i];
        const to = cycle[(i + 1) % cycle.length];
        order[to] = from;
        usedIndices.add(from);
      }
    }

    applyPermutation(order);

    // Check if puzzle is valid and has unique solution
    const hasPath = !!findPath(board, start.x, start.y, goal.x, goal.y);
    const curIds = movable.map(({ x, y }) => board[y][x].id);
    const dist = minimalSwaps(curIds);
    
    // Count solution paths (for uniqueness)
    const solutionCount = hasPath ? 1 : countSolutions(board, start, goal, movable, solvedTiles);
    
    // Prefer puzzles with exactly one solution and good difficulty
    const isGoodPuzzle = !hasPath && 
                        dist >= MIN_SWAP_DISTANCE && 
                        dist <= MAX_SWAP_DISTANCE &&
                        solutionCount === 1;
    
    if (isGoodPuzzle) {
      best = { ids: curIds.slice(), swaps: dist, solutionCount };
      break;
    }
    
    // Track best candidate even if not perfect
    if (best === null || 
        (solutionCount <= best.solutionCount && dist > best.swaps) ||
        (solutionCount < best.solutionCount)) {
      best = { ids: curIds.slice(), swaps: dist, solutionCount };
    }

    // Revert to solved and try again
    for (let i = 0; i < movable.length; i++) {
      const { x, y } = movable[i];
      board[y][x] = { ...solvedTiles[i] };
    }
  }

  // If still not meeting criteria, apply the best found unsolved shuffle or force-break
  if (!!findPath(board, start.x, start.y, goal.x, goal.y)) {
    if (best) {
      // Map best ids back to tiles in that order and apply
      const idToTile: Record<string, GameTile> = Object.fromEntries(solvedTiles.map(t => [t.id, t]));
      for (let i = 0; i < movable.length; i++) {
        const { x, y } = movable[i];
        board[y][x] = { ...idToTile[best.ids[i]] };
      }
    } else {
      // Fallback: swap two middle tiles
      if (movable.length >= 2) {
        const a = Math.floor(movable.length / 2) - 1;
        const b = a + 1;
        const A = movable[a];
        const B = movable[b];
        const tmp = board[A.y][A.x];
        board[A.y][A.x] = board[B.y][B.x];
        board[B.y][B.x] = tmp;
      }
    }
  }

  return board;
};

export const canMoveTo = (
  board: GameTile[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): boolean => {
  // Check bounds dynamically based on board size
  const rows = board.length;
  const cols = board[0]?.length || 0;
  if (toX < 0 || toX >= cols || toY < 0 || toY >= rows) return false;
  
  const fromTile = board[fromY][fromX];
  const toTile = board[toY][toX];
  
  // Can't move to empty tiles
  if (toTile.type === TileType.EMPTY) return false;
  
  // Check if tiles are connected
  const dx = toX - fromX;
  const dy = toY - fromY;
  
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false; // Must be adjacent
  
  if (dx === 1) { // Moving east
    return fromTile.connections.east && toTile.connections.west;
  } else if (dx === -1) { // Moving west
    return fromTile.connections.west && toTile.connections.east;
  } else if (dy === 1) { // Moving south
    return fromTile.connections.south && toTile.connections.north;
  } else if (dy === -1) { // Moving north
    return fromTile.connections.north && toTile.connections.south;
  }
  
  return false;
};

export const findPath = (
  board: GameTile[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] | null => {
  // Simple BFS pathfinding
  const queue = [{ x: startX, y: startY, path: [{ x: startX, y: startY }] }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (x === endX && y === endY) {
      return path;
    }
    
    // Check all adjacent cells
    const directions = [
      { dx: 0, dy: -1 }, // North
      { dx: 0, dy: 1 },  // South
      { dx: 1, dy: 0 },  // East
      { dx: -1, dy: 0 }  // West
    ];
    
    for (const { dx, dy } of directions) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (canMoveTo(board, x, y, newX, newY)) {
        queue.push({
          x: newX,
          y: newY,
          path: [...path, { x: newX, y: newY }]
        });
      }
    }
  }
  
  return null; // No path found
};

// Helper function to count possible solutions for uniqueness validation
const countSolutions = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
  movable: { x: number; y: number }[],
  solvedTiles: GameTile[],
  maxSolutions = 3
): number => {
  let solutions = 0;
  const boardCopy = board.map(row => row.map(tile => ({ ...tile })));
  
  // Try limited permutations to check for multiple solutions
  const trySwap = (swapCount: number, maxSwaps: number) => {
    if (solutions >= maxSolutions || swapCount >= maxSwaps) return;
    
    // Check current state
    if (findPath(boardCopy, start.x, start.y, goal.x, goal.y)) {
      solutions++;
      return;
    }
    
    // Try swapping pairs of movable tiles
    for (let i = 0; i < movable.length && solutions < maxSolutions; i++) {
      for (let j = i + 1; j < movable.length && solutions < maxSolutions; j++) {
        const pos1 = movable[i];
        const pos2 = movable[j];
        
        // Swap
        const temp = boardCopy[pos1.y][pos1.x];
        boardCopy[pos1.y][pos1.x] = boardCopy[pos2.y][pos2.x];
        boardCopy[pos2.y][pos2.x] = temp;
        
        // Recurse
        trySwap(swapCount + 1, maxSwaps);
        
        // Swap back
        boardCopy[pos2.y][pos2.x] = boardCopy[pos1.y][pos1.x];
        boardCopy[pos1.y][pos1.x] = temp;
      }
    }
  };
  
  // Check solutions within 2-3 swaps for uniqueness
  trySwap(0, Math.min(3, movable.length));
  return solutions;
};