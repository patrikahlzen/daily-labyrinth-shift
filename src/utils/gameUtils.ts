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
  const rows = 3;
  const cols = 4;
  const start = { x: 1, y: 2 };
  const goal = { x: 2, y: 0 };

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

  // Ensure the initial board is NOT already solved: try to break the path with one safe swap
  const isLocked = (x: number, y: number) => (x === start.x && y === start.y) || (x === goal.x && y === goal.y);
  const pathCells = path.filter(({ x, y }) => !isLocked(x, y));

  const tryBreak = () => {
    // Shuffle candidates
    const shuffled = [...pathCells].sort(() => Math.random() - 0.5);
    for (const { x, y } of shuffled) {
      const neighbors = [
        { nx: x, ny: y - 1 },
        { nx: x, ny: y + 1 },
        { nx: x + 1, ny: y },
        { nx: x - 1, ny: y },
      ].filter(({ nx, ny }) => inBounds(nx, ny) && !isLocked(nx, ny) && board[ny][nx].type === TileType.PATH);

      // Prefer swapping different-shaped tiles to increase chance of breaking
      neighbors.sort((a, b) => {
        const deg = (t: GameTile) => Number(t.connections.north) + Number(t.connections.south) + Number(t.connections.east) + Number(t.connections.west);
        const dA = Math.abs(
          (deg(board[y][x]) - deg(board[a.ny][a.nx]))
        );
        const dB = Math.abs(
          (deg(board[y][x]) - deg(board[b.ny][b.nx]))
        );
        return dB - dA;
      });

      for (const { nx, ny } of neighbors) {
        const a = { x, y };
        const b = { x: nx, y: ny };
        const tmp = board[y][x];
        board[y][x] = board[ny][nx];
        board[ny][nx] = tmp;

        const stillSolved = !!findPath(board, start.x, start.y, goal.x, goal.y);
        if (!stillSolved) return true; // successfully broke the path

        // revert and try another pair
        board[ny][nx] = board[y][x];
        board[y][x] = tmp;
      }
    }
    return false;
  };

  // Only attempt to break if currently solved
  if (findPath(board, start.x, start.y, goal.x, goal.y)) {
    let attempts = 0;
    while (attempts < 20 && !tryBreak()) attempts++;
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