import { GameTile, TileType, TileConnections } from '../types/game';

// Predefined tile patterns for the labyrinth
const TILE_PATTERNS: TileConnections[] = [
  // Straight lines
  { north: true, south: true, east: false, west: false }, // Vertical
  { north: false, south: false, east: true, west: true }, // Horizontal
  
  // L-shapes (bends only)
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

export const createInitialBoard = (): GameTile[][] => {
  const rows = 4;
  const cols = 5;
  const start = { x: 1, y: 3 };
  const goal = { x: 3, y: 0 };

  // Initialize empty board
  const emptyTile = (): GameTile => ({
    type: TileType.EMPTY,
    connections: { north: false, south: false, east: false, west: false },
    special: null,
    id: Math.random().toString(36).substr(2, 9)
  });
  const board: GameTile[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyTile())
  );

  // DFS to generate a single simple path from start to goal
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );
  const path: { x: number; y: number }[] = [];

  const dirs = [
    { dx: 0, dy: -1 }, // North
    { dx: 0, dy: 1 },  // South
    { dx: 1, dy: 0 },  // East
    { dx: -1, dy: 0 }  // West
  ];

  const inBounds = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows;

  const dfs = (x: number, y: number): boolean => {
    path.push({ x, y });
    if (x === goal.x && y === goal.y) return true;
    visited[y][x] = true;

    const order = [...dirs].sort(() => Math.random() - 0.5);
    for (const { dx, dy } of order) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny) || visited[ny][nx]) continue;
      if (dfs(nx, ny)) return true;
    }

    visited[y][x] = false;
    path.pop();
    return false;
  };

  if (!dfs(start.x, start.y)) {
    // Fallback: simple deterministic path (vertical then horizontal)
    path.length = 0;
    let x = start.x;
    let y = start.y;
    path.push({ x, y });
    while (y > goal.y) { y -= 1; path.push({ x, y }); }
    while (x < goal.x) { x += 1; path.push({ x, y }); }
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
      id: Math.random().toString(36).substr(2, 9)
    };
  }

  // Optionally add specials along the path (not on start/goal)
  for (let i = 1; i < path.length - 1; i++) {
    if (Math.random() < 0.15) {
      const { x, y } = path[i];
      const specials = ['key', 'time', 'gem'] as const;
      board[y][x] = {
        ...board[y][x],
        special: specials[Math.floor(Math.random() * specials.length)]
      };
    }
  }

  // Keep explicit IDs to mark start/goal for the UI
  board[start.y][start.x].id = 'start-tile';
  board[goal.y][goal.x].id = 'goal-tile';

  // Add decoy tiles (straights/bends only) that never connect into the main path
  const isOnPath = (x: number, y: number) => path.some(p => p.x === x && p.y === y);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isOnPath(x, y)) continue;
      if (Math.random() < 0.45) {
        const pattern = { ...TILE_PATTERNS[Math.floor(Math.random() * TILE_PATTERNS.length)] };
        // Block any connection that faces a path cell
        const nIsPath = y - 1 >= 0 && isOnPath(x, y - 1);
        const sIsPath = y + 1 < rows && isOnPath(x, y + 1);
        const eIsPath = x + 1 < cols && isOnPath(x + 1, y);
        const wIsPath = x - 1 >= 0 && isOnPath(x - 1, y);
        if (nIsPath) pattern.north = false;
        if (sIsPath) pattern.south = false;
        if (eIsPath) pattern.east = false;
        if (wIsPath) pattern.west = false;
        board[y][x] = {
          type: TileType.PATH,
          connections: pattern,
          special: null,
          id: Math.random().toString(36).substr(2, 9)
        };
      }
    }
  }

  // Scramble the path tiles to ensure the puzzle starts unsolved with a minimum swap distance
  const MIN_SWAP_DISTANCE = 7; // target difficulty
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

  // Try multiple shuffles until criteria met
  let best: { ids: string[]; swaps: number } | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    // Build a random long cycle covering k elements
    const k = Math.min(movable.length, MIN_SWAP_DISTANCE + 1);
    const idxs = Array.from({ length: movable.length }, (_, i) => i);
    // pick k distinct indices
    for (let i = idxs.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[r]] = [idxs[r], idxs[i]];
    }
    const cycle = idxs.slice(0, k);
    // create permutation from a rotation of the cycle
    const order = Array.from({ length: movable.length }, (_, i) => i);
    for (let i = 0; i < cycle.length; i++) {
      const from = cycle[i];
      const to = cycle[(i + 1) % cycle.length];
      order[to] = from;
    }

    applyPermutation(order);

    // Verify not solved and measure distance
    const hasPath = !!findPath(board, start.x, start.y, goal.x, goal.y);
    const curIds = movable.map(({ x, y }) => board[y][x].id);
    const dist = minimalSwaps(curIds);
    if (best === null || dist > best.swaps) best = { ids: curIds.slice(), swaps: dist };
    if (!hasPath && dist >= MIN_SWAP_DISTANCE) break;

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