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
  let pathAttempts = 0;
  while (pathAttempts < 10 && !generatePathWithTurns(start.x, start.y)) {
    path.length = 0;
    visited.forEach(row => row.fill(false));
    pathAttempts++;
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

  // SIMPLIFIED SCRAMBLING: Generate controlled difficulty with guaranteed solvability
  // Create a pristine copy BEFORE scrambling so we can retry safely
  const cloneBoard = (b: GameTile[][]) => b.map(row => row.map(tile => ({
    ...tile,
    connections: { ...tile.connections },
  })));
  const baseSolvedBoard = cloneBoard(board);

  // Helper to collect movable tile coordinates for a given board state
  const getMovable = (b: GameTile[][]) => {
    const coords: { x: number; y: number }[] = [];
    for (let yy = 0; yy < rows; yy++) {
      for (let xx = 0; xx < cols; xx++) {
        const t = b[yy][xx];
        if (t.type === TileType.PATH && t.id !== 'start-tile' && t.id !== 'goal-tile') {
          coords.push({ x: xx, y: yy });
        }
      }
    }
    return coords;
  };

  // Improved scrambling algorithm - create significantly more challenging puzzles
  const movableCount = getMovable(baseSolvedBoard).length;
  
  // Aggressive scrambling based on board size and movable tiles
  const boardComplexity = rows * cols;
  const baseScrambleIntensity = Math.max(8, Math.floor(movableCount * 0.7)); // At least 70% of movable tiles
  const difficultyMultiplier = template.difficulty === 'hard' ? 1.4 : template.difficulty === 'medium' ? 1.2 : 1.0;
  const targetSwaps = Math.floor(baseScrambleIntensity * difficultyMultiplier);

  // Multi-phase scrambling for better randomization
  let scrambled: GameTile[][] | null = null;
  const maxAttempts = 50;
  
  for (let attempt = 0; attempt < maxAttempts && !scrambled; attempt++) {
    const candidate = cloneBoard(baseSolvedBoard);
    
    // Phase 1: Heavy initial scrambling
    const movable = getMovable(candidate);
    const phase1Swaps = Math.max(targetSwaps, Math.floor(movable.length * 0.8));
    
    for (let i = 0; i < phase1Swaps && movable.length >= 2; i++) {
      const idx1 = Math.floor(rng() * movable.length);
      let idx2 = Math.floor(rng() * movable.length);
      while (idx2 === idx1 && movable.length > 1) idx2 = Math.floor(rng() * movable.length);

      const a = movable[idx1];
      const b = movable[idx2];
      const temp = candidate[a.y][a.x];
      candidate[a.y][a.x] = candidate[b.y][b.x];
      candidate[b.y][b.x] = temp;
    }
    
    // Phase 2: Verify still solvable, if not apply corrective swaps
    if (!findPath(candidate, start.x, start.y, goal.x, goal.y)) {
      // Try a few corrective swaps
      for (let correction = 0; correction < 5; correction++) {
        const movableNow = getMovable(candidate);
        if (movableNow.length >= 2) {
          const idx1 = Math.floor(rng() * movableNow.length);
          let idx2 = Math.floor(rng() * movableNow.length);
          while (idx2 === idx1 && movableNow.length > 1) idx2 = Math.floor(rng() * movableNow.length);
          
          const a = movableNow[idx1];
          const b = movableNow[idx2];
          const temp = candidate[a.y][a.x];
          candidate[a.y][a.x] = candidate[b.y][b.x];
          candidate[b.y][b.x] = temp;
          
          if (findPath(candidate, start.x, start.y, goal.x, goal.y)) {
            scrambled = candidate;
            break;
          }
        }
      }
    } else {
      scrambled = candidate;
    }
  }

  // If we failed to find a solvable scramble, fall back to the solved base
  let finalBoard = scrambled ?? baseSolvedBoard;

  // Calculate estimated optimal swaps quickly (avoid heavy CPU for Vercel/mobile)
  const totalGems = finalBoard.flat().filter(tile => tile.special === 'gem').length;
  const boardArea = rows * cols;
  const baseEstimate = Math.max(5, Math.min(12, Math.round(boardArea / 6)));
  const optimalToGoal = Math.max(baseEstimate, targetSwaps);
  const optimalAllGems = totalGems > 0 ? optimalToGoal + Math.min(2, totalGems) : optimalToGoal;

  // Store values on the board for stable star rating
  (finalBoard as any).__optimalToGoal = optimalToGoal;
  (finalBoard as any).__optimalAllGems = optimalAllGems;
  (finalBoard as any).__totalGems = totalGems;

  // Safety: ensure start/goal tiles are path tiles with at least one connection and IDs are correct
  const hasConn = (t: GameTile) => t && t.type === TileType.PATH && Object.values(t.connections || {}).some(Boolean);

  // Remove stray start/goal IDs off their coordinates
  for (let yy = 0; yy < rows; yy++) {
    for (let xx = 0; xx < cols; xx++) {
      if ((xx !== start.x || yy !== start.y) && finalBoard[yy][xx].id === 'start-tile') {
        finalBoard[yy][xx].id = `t-fix-s-${yy}-${xx}`;
      }
      if ((xx !== goal.x || yy !== goal.y) && finalBoard[yy][xx].id === 'goal-tile') {
        finalBoard[yy][xx].id = `t-fix-g-${yy}-${xx}`;
      }
    }
  }

  // Re-stamp IDs on correct cells
  finalBoard[start.y][start.x].id = 'start-tile';
  finalBoard[goal.y][goal.x].id = 'goal-tile';

  // Ensure both are PATH with visible shape; fallback to the pristine solved board's tiles if needed
  if (!hasConn(finalBoard[start.y][start.x])) {
    const backup = baseSolvedBoard[start.y][start.x];
    finalBoard[start.y][start.x] = { ...backup, id: 'start-tile' };
  }
  if (!hasConn(finalBoard[goal.y][goal.x])) {
    const backup = baseSolvedBoard[goal.y][goal.x];
    finalBoard[goal.y][goal.x] = { ...backup, id: 'goal-tile' };
  }

  // Final solvability guard
  if (!findPath(finalBoard, start.x, start.y, goal.x, goal.y)) {
    finalBoard = baseSolvedBoard.map(row => row.map(tile => ({ ...tile, connections: { ...tile.connections } })));
    finalBoard[start.y][start.x].id = 'start-tile';
    finalBoard[goal.y][goal.x].id = 'goal-tile';
  }

  return finalBoard;
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

// Simple solver that finds minimum swaps needed to solve the puzzle
export const findMinimumSwapsToSolve = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal: { x: number; y: number }
): number => {
  // If already solved, return 0
  if (findPath(board, start.x, start.y, goal.x, goal.y)) {
    return 0;
  }
  
  // Get all movable tiles (exclude start/goal)
  const movableTiles: { x: number; y: number }[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < (board[0]?.length || 0); x++) {
      if (board[y][x].type === TileType.PATH && 
          board[y][x].id !== 'start-tile' && 
          board[y][x].id !== 'goal-tile') {
        movableTiles.push({ x, y });
      }
    }
  }
  
  // Try BFS approach: try all possible single swaps, then double swaps, etc.
  const queue: { board: GameTile[][]; swaps: number }[] = [];
  const visited = new Set<string>();
  
  // Helper to serialize board state for duplicate detection
  const serializeBoard = (b: GameTile[][]) => {
    return b.map(row => row.map(tile => tile.id).join(',')).join('|');
  };
  
  queue.push({ board: board.map(row => row.map(tile => ({ ...tile }))), swaps: 0 });
  visited.add(serializeBoard(board));
  
  while (queue.length > 0 && queue.length < 1000) { // Limit search to prevent infinite loops
    const { board: currentBoard, swaps } = queue.shift()!;
    
    // Try all possible swaps
    for (let i = 0; i < movableTiles.length; i++) {
      for (let j = i + 1; j < movableTiles.length; j++) {
        const newBoard = currentBoard.map(row => row.map(tile => ({ ...tile })));
        const pos1 = movableTiles[i];
        const pos2 = movableTiles[j];
        
        // Perform swap
        const temp = newBoard[pos1.y][pos1.x];
        newBoard[pos1.y][pos1.x] = newBoard[pos2.y][pos2.x];
        newBoard[pos2.y][pos2.x] = temp;
        
        // Check if solved
        if (findPath(newBoard, start.x, start.y, goal.x, goal.y)) {
          return swaps + 1;
        }
        
        // Add to queue if not visited and we haven't searched too deep
        const serialized = serializeBoard(newBoard);
        if (!visited.has(serialized) && swaps < 8) { // Limit depth to 8 swaps
          visited.add(serialized);
          queue.push({ board: newBoard, swaps: swaps + 1 });
        }
      }
    }
  }
  
  // If we can't find a solution within reasonable bounds, return template optimal
  return 5; // Default fallback raised to 5
};

export const findMinimumSwapsToCollectAllGems = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal: { x: number; y: number }
): number => {
  // Find all gem positions
  const gems: { x: number; y: number }[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      if (board[y][x].special === 'gem') {
        gems.push({ x, y });
      }
    }
  }

  if (gems.length === 0) {
    return findMinimumSwapsToSolve(board, start, goal);
  }

  // Find minimum swaps to create a path that visits all gems and reaches goal
  const maxDepth = 15;
  const queue: { board: GameTile[][]; swaps: number }[] = [{ board, swaps: 0 }];
  const visited = new Set<string>();

  const serializeBoard = (b: GameTile[][]) => {
    return b.map(row => 
      row.map(tile => `${tile.type}-${tile.connections.north}-${tile.connections.south}-${tile.connections.east}-${tile.connections.west}-${tile.special || ''}`).join('|')
    ).join('||');
  };

  visited.add(serializeBoard(board));

  while (queue.length > 0) {
    const { board: currentBoard, swaps } = queue.shift()!;

    // Check if we can reach goal via all gems
    if (canReachGoalViaAllGems(currentBoard, start, goal, gems)) {
      return swaps;
    }

    if (swaps >= maxDepth) {
      continue;
    }

    // Get movable tiles for this board
    const movable: { x: number; y: number }[] = [];
    for (let y = 0; y < currentBoard.length; y++) {
      for (let x = 0; x < currentBoard[0].length; x++) {
        const t = currentBoard[y][x];
        if (t.type === TileType.PATH && t.id !== 'start-tile' && t.id !== 'goal-tile') {
          movable.push({ x, y });
        }
      }
    }
    
    for (let i = 0; i < movable.length; i++) {
      for (let j = i + 1; j < movable.length; j++) {
        const newBoard = currentBoard.map(row => row.map(tile => ({
          ...tile,
          connections: { ...tile.connections },
        })));
        const pos1 = movable[i];
        const pos2 = movable[j];
        
        const temp = newBoard[pos1.y][pos1.x];
        newBoard[pos1.y][pos1.x] = newBoard[pos2.y][pos2.x];
        newBoard[pos2.y][pos2.x] = temp;

        const boardStr = serializeBoard(newBoard);
        if (!visited.has(boardStr)) {
          visited.add(boardStr);
          queue.push({ board: newBoard, swaps: swaps + 1 });
        }
      }
    }
  }

  return 5; // Default fallback
};

const canReachGoalViaAllGems = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
  gems: { x: number; y: number }[]
): boolean => {
  // Use DFS to check if there's a path from start to goal that visits all gems
  const visited = new Set<string>();
  const gemsToVisit = new Set(gems.map(g => `${g.x},${g.y}`));
  
  const dfs = (x: number, y: number, visitedGems: Set<string>): boolean => {
    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    visited.add(key);

    // Check if we collected a gem at this position
    const newVisitedGems = new Set(visitedGems);
    if (gemsToVisit.has(key)) {
      newVisitedGems.add(key);
    }

    // If we reached goal and have all gems, success
    if (x === goal.x && y === goal.y && newVisitedGems.size === gems.length) {
      return true;
    }

    // Try all adjacent connected tiles
    const directions = [
      { dx: 0, dy: -1, from: 'south', to: 'north' }, // North
      { dx: 0, dy: 1, from: 'north', to: 'south' },  // South
      { dx: 1, dy: 0, from: 'west', to: 'east' },    // East
      { dx: -1, dy: 0, from: 'east', to: 'west' }    // West
    ];

    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;
      
      if (canMoveTo(board, x, y, newX, newY)) {
        if (dfs(newX, newY, newVisitedGems)) {
          return true;
        }
      }
    }

    visited.delete(key);
    return false;
  };

  return dfs(start.x, start.y, new Set());
};