import { GameTile, TileType, TileConnections } from '../types/game';
import { getDifficultyForDay, getTemplateForSeed } from './difficultySystems';

// --------------------------------------------------
// PRNG (xmur3 + mulberry32)
// --------------------------------------------------
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

// --------------------------------------------------
// Tile-mönster (endast raka & L-böjar för tydligt spel)
// --------------------------------------------------
const TILE_PATTERNS: TileConnections[] = [
  { north: true, south: true, east: false, west: false },   // Vertikal
  { north: false, south: false, east: true, west: true },   // Horisontell
  { north: true, south: false, east: true, west: false },   // NE
  { north: true, south: false, east: false, west: true },   // NW
  { north: false, south: true, east: true, west: false },   // SE
  { north: false, south: true, east: false, west: true },   // SW
];

export const generateRandomTile = (): GameTile => {
  const pattern = TILE_PATTERNS[Math.floor(Math.random() * TILE_PATTERNS.length)];
  const hasSpecial = Math.random() < 0.15; // 15% chans

  let special: GameTile['special'] = null;
  if (hasSpecial) {
    const specials = ['key', 'time', 'gem'] as const;
    special = specials[Math.floor(Math.random() * specials.length)];
  }

  return {
    type: TileType.PATH,
    connections: pattern,
    special,
    id: Math.random().toString(36).slice(2, 11),
  };
};

export const generateEmptyTile = (): GameTile => ({
  type: TileType.EMPTY,
  connections: { north: false, south: false, east: false, west: false },
  special: null,
  id: Math.random().toString(36).slice(2, 11),
});

// --------------------------------------------------
// Brädesgenerering
// --------------------------------------------------
export const createInitialBoard = (seed?: string): GameTile[][] => {
  const rng = createRng(seed);
  let idCounter = 0;
  const newId = () => `t-${(++idCounter).toString(36)}`;

  // Daglig svårighet + template
  const daysSinceEpoch = seed
    ? Math.floor(parseInt(seed.slice(-8), 16) / 86400000)
    : Math.floor(Date.now() / 86400000);

  const difficulty = getDifficultyForDay(daysSinceEpoch);
  const template = getTemplateForSeed(seed || Date.now().toString(), difficulty);
  const { rows, cols } = template.boardSize;

  // Slumpa start/mål med minsta Manhattan-distans
  const getRandomPosition = (exclude: { x: number; y: number }[] = []) => {
    const boardArea = rows * cols;
    const minDistance = Math.max(3, Math.floor(Math.sqrt(boardArea)));
    let attempts = 0;

    while (attempts < 50) {
      const edgeWeight = 0.3;
      let x: number, y: number;

      if (rng() < edgeWeight) {
        const side = Math.floor(rng() * 4);
        switch (side) {
          case 0: x = 0; y = Math.floor(rng() * rows); break;
          case 1: x = cols - 1; y = Math.floor(rng() * rows); break;
          case 2: x = Math.floor(rng() * cols); y = 0; break;
          case 3: x = Math.floor(rng() * cols); y = rows - 1; break;
          default: x = Math.floor(rng() * cols); y = Math.floor(rng() * rows);
        }
      } else {
        x = Math.floor(rng() * cols);
        y = Math.floor(rng() * rows);
      }

      const valid = exclude.every(pos => Math.abs(pos.x - x) + Math.abs(pos.y - y) >= minDistance);
      if (valid) return { x, y };
      attempts++;
    }

    const fallbacks = [
      { x: 1, y: 1 },
      { x: cols - 2, y: rows - 2 },
      { x: 1, y: rows - 2 },
      { x: cols - 2, y: 1 },
    ].filter(p => p.x >= 0 && p.x < cols && p.y >= 0 && p.y < rows);
    return fallbacks[exclude.length % fallbacks.length] || { x: 0, y: 0 };
  };

  const start = getRandomPosition();
  const goal = getRandomPosition([start]);

  // Tomt bräde
  const emptyTile = (): GameTile => ({
    type: TileType.EMPTY,
    connections: { north: false, south: false, east: false, west: false },
    special: null,
    id: newId(),
  });
  const board: GameTile[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyTile()),
  );

  // Generera huvudväg med sväng-bias
  const boardSize = rows * cols;
  const targetPathLength = Math.floor(boardSize * (0.4 + rng() * 0.3)); // 40–70%
  const minTurns = Math.max(3, Math.floor(targetPathLength / 6));

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  );
  const path: { x: number; y: number }[] = [];

  const dirs = [
    { dx: 0, dy: -1, name: 'north' },
    { dx: 0, dy: 1, name: 'south' },
    { dx: 1, dy: 0, name: 'east' },
    { dx: -1, dy: 0, name: 'west' },
  ];
  const inBounds = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows;

  const generatePathWithTurns = (x: number, y: number, lastDir?: string, turnCount = 0): boolean => {
    path.push({ x, y });
    if (x === goal.x && y === goal.y) {
      return path.length >= Math.floor(targetPathLength * 0.7) && turnCount >= minTurns;
    }
    if (path.length > targetPathLength * 1.5) return false;

    visited[y][x] = true;

    const order = [...dirs];
    for (let i = order.length - 1; i > 0; i--) {
      const r = Math.floor(rng() * (i + 1));
      [order[i], order[r]] = [order[r], order[i]];
    }
    if (turnCount < minTurns && lastDir) {
      order.sort((a, b) => (a.name !== lastDir ? -1 : 1) - (b.name !== lastDir ? -1 : 1));
    }

    for (const { dx, dy, name } of order) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny) || visited[ny][nx]) continue;
      const newTurn = lastDir && name !== lastDir ? turnCount + 1 : turnCount;
      if (generatePathWithTurns(nx, ny, name, newTurn)) return true;
    }

    visited[y][x] = false;
    path.pop();
    return false;
  };

  let attempts = 0;
  while (attempts < 10 && !generatePathWithTurns(start.x, start.y)) {
    path.length = 0;
    visited.forEach(r => r.fill(false));
    attempts++;
  }

  // Fallback L-form
  if (!path.length || path[path.length - 1].x !== goal.x || path[path.length - 1].y !== goal.y) {
    path.length = 0;
    let x = start.x, y = start.y;
    path.push({ x, y });
    const midX = Math.floor((start.x + goal.x) / 2);
    const midY = Math.floor((start.y + goal.y) / 2);
    while (x !== midX) { x += x < midX ? 1 : -1; path.push({ x, y }); }
    while (y !== midY) { y += y < midY ? 1 : -1; path.push({ x, y }); }
    while (x !== goal.x) { x += x < goal.x ? 1 : -1; path.push({ x, y }); }
    while (y !== goal.y) { y += y < goal.y ? 1 : -1; path.push({ x, y }); }
  }

  // Skriv in PATH-tiles längs huvudvägen
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

    board[y][x] = { type: TileType.PATH, connections, special: null, id: newId() };
  }

  // --------------------------------------------------
  // Gem-placering på svängar, därefter jämnt utspritt
  // --------------------------------------------------
  const turnIdxs: number[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i - 1], c = path[i], n = path[i + 1];
    const prevDir = { x: c.x - p.x, y: c.y - p.y };
    const nextDir = { x: n.x - c.x, y: n.y - c.y };
    if (prevDir.x !== nextDir.x || prevDir.y !== nextDir.y) turnIdxs.push(i);
  }

  const targetGems = Math.min(template.gemCount, Math.max(1, Math.floor(path.length / 4)));
  const gemPositions: { x: number; y: number }[] = [];

  for (let i = 0; i < Math.min(turnIdxs.length, targetGems); i++) {
    const pos = path[turnIdxs[i]];
    gemPositions.push(pos);
    board[pos.y][pos.x] = { ...board[pos.y][pos.x], special: 'gem' };
  }

  if (gemPositions.length < targetGems) {
    const need = targetGems - gemPositions.length;
    const interval = Math.max(2, Math.floor(path.length / (need + 1)));
    for (let i = interval; i < path.length - 1 && gemPositions.length < targetGems; i += interval) {
      const pos = path[i];
      if (!gemPositions.some(g => g.x === pos.x && g.y === pos.y)) {
        board[pos.y][pos.x] = { ...board[pos.y][pos.x], special: 'gem' };
        gemPositions.push(pos);
      }
    }
  }

  // Start/Goal-ID
  board[start.y][start.x].id = 'start-tile';
  board[goal.y][goal.x].id = 'goal-tile';

  // LÅS ALLA GEMS
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (board[y][x].special === 'gem') {
        board[y][x] = { ...board[y][x], locked: true };
      }
    }
  }

  // --------------------------------------------------
  // Decoys: nästan-anslutningar + små segment
  // --------------------------------------------------
  const isOnPath = (x: number, y: number) => path.some(p => p.x === x && p.y === y);

  const decoyDensity = 0.4 + rng() * 0.2; // 40–60%
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isOnPath(x, y)) continue; // rör inte huvudvägen/gems

      if (rng() < decoyDensity) {
        const pattern = { ...TILE_PATTERNS[Math.floor(rng() * TILE_PATTERNS.length)] };
        const nIsPath = y - 1 >= 0 && isOnPath(x, y - 1);
        const sIsPath = y + 1 < rows && isOnPath(x, y + 1);
        const eIsPath = x + 1 < cols && isOnPath(x + 1, y);
        const wIsPath = x - 1 >= 0 && isOnPath(x - 1, y);
        const nearPath = nIsPath || sIsPath || eIsPath || wIsPath;

        if (nearPath && rng() < 0.7) {
          if (nIsPath) pattern.north = false;
          if (sIsPath) pattern.south = false;
          if (eIsPath) pattern.east  = false;
          if (wIsPath) pattern.west  = false;
        }
        board[y][x] = { type: TileType.PATH, connections: pattern, special: null, id: newId() };
      }
    }
  }

  const createDecoySegment = (sx: number, sy: number, length: number) => {
    let x = sx, y = sy, seg = 0, last = '';
    while (seg < length && inBounds(x, y) && board[y][x].type === TileType.EMPTY) {
      if (isOnPath(x, y)) break;
      const options = dirs.filter(d => {
        const nx = x + d.dx, ny = y + d.dy;
        return inBounds(nx, ny) && !isOnPath(nx, ny) && d.name !== last;
      });
      if (!options.length) break;
      const dir = options[Math.floor(rng() * options.length)];
      const connections = { north: false, south: false, east: false, west: false };
      (connections as any)[dir.name] = true;
      board[y][x] = { type: TileType.PATH, connections, special: null, id: newId() };
      x += dir.dx; y += dir.dy; last = dir.name; seg++;
    }
  };
  const segments = Math.floor(rng() * 3) + 1;
  for (let i = 0; i < segments; i++) {
    createDecoySegment(Math.floor(rng() * cols), Math.floor(rng() * rows), 2 + Math.floor(rng() * 3));
  }

  // --------------------------------------------------
  // Scramble: rör aldrig start/goal/locked
  // --------------------------------------------------
  const cloneBoard = (b: GameTile[][]) =>
    b.map(row => row.map(tile => ({ ...tile, connections: { ...tile.connections } })));

  const baseSolvedBoard = cloneBoard(board);

  const getMovable = (b: GameTile[][]) => {
    const coords: { x: number; y: number }[] = [];
    for (let yy = 0; yy < rows; yy++) {
      for (let xx = 0; xx < cols; xx++) {
        const t = b[yy][xx];
        if (
          t.type === TileType.PATH &&
          t.id !== 'start-tile' &&
          t.id !== 'goal-tile' &&
          !t.locked
        ) {
          coords.push({ x: xx, y: yy });
        }
      }
    }
    return coords;
  };

  const movableCount = getMovable(baseSolvedBoard).length;
  const baseScrambleIntensity = Math.max(20, Math.floor(movableCount * 1.5));
  const diffMul = template.difficulty === 'hard' ? 3.5 : template.difficulty === 'medium' ? 2.8 : 2.2;
  const targetSwaps = Math.floor(baseScrambleIntensity * diffMul);
  const minRequiredSwaps = template.difficulty === 'hard' ? 5 : template.difficulty === 'medium' ? 5 : 4;

  let acceptedSwaps = -1;
  let scrambled: GameTile[][] | null = null;

  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts && !scrambled; attempt++) {
    const candidate = cloneBoard(baseSolvedBoard);

    const movable = getMovable(candidate);
    const phase1Swaps = Math.max(targetSwaps * 3, Math.floor(movable.length * 2.5));
    for (let i = 0; i < phase1Swaps && movable.length >= 2; i++) {
      const idx1 = Math.floor(rng() * movable.length);
      let idx2 = Math.floor(rng() * movable.length);
      while (idx2 === idx1 && movable.length > 1) idx2 = Math.floor(rng() * movable.length);
      const a = movable[idx1], b = movable[idx2];
      const tmp = candidate[a.y][a.x];
      candidate[a.y][a.x] = candidate[b.y][b.x];
      candidate[b.y][b.x] = tmp;
    }

    const swapsToGoal = findMinimumSwapsToSolve(candidate, start, goal);
    if (swapsToGoal < minRequiredSwaps) continue;

    // NYTT: kräver lösning via alla gems inom sökdjupet
    const swapsAllGems = findMinimumSwapsToCollectAllGems(candidate, start, goal);
    if (Number.isFinite(swapsAllGems)) {
      scrambled = candidate;
      acceptedSwaps = swapsToGoal;
    }
  }

  let finalBoard = scrambled ?? baseSolvedBoard;

  // --------------------------------------------------
  // Optimala värden (tål Infinity)
  // --------------------------------------------------
  const totalGems = finalBoard.flat().filter(t => t.special === 'gem').length;
  const boardArea2 = rows * cols;
  const baseEstimate = Math.max(5, Math.min(12, Math.round(boardArea2 / 6)));

  const minToGoal = acceptedSwaps > 0 ? acceptedSwaps : findMinimumSwapsToSolve(finalBoard, start, goal);
  const minAllGems = findMinimumSwapsToCollectAllGems(finalBoard, start, goal);

  const optimalToGoal = Math.max(baseEstimate, minToGoal);
  const optimalAllGems = Number.isFinite(minAllGems)
    ? Math.max(optimalToGoal, minAllGems as number)
    : optimalToGoal + Math.max(1, totalGems);

  (finalBoard as any).__optimalToGoal = optimalToGoal;
  (finalBoard as any).__optimalAllGems = optimalAllGems;
  (finalBoard as any).__totalGems = totalGems;

  // --------------------------------------------------
  // Säkerhet: start/goal är PATH med anslutning
  // --------------------------------------------------
  const hasConn = (t: GameTile) => t && t.type === TileType.PATH && Object.values(t.connections || {}).some(Boolean);

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
  finalBoard[start.y][start.x].id = 'start-tile';
  finalBoard[goal.y][goal.x].id = 'goal-tile';

  if (!hasConn(finalBoard[start.y][start.x])) {
    const backup = baseSolvedBoard[start.y][start.x];
    finalBoard[start.y][start.x] = { ...backup, id: 'start-tile' };
  }
  if (!hasConn(finalBoard[goal.y][goal.x])) {
    const backup = baseSolvedBoard[goal.y][goal.x];
    finalBoard[goal.y][goal.x] = { ...backup, id: 'goal-tile' };
  }

  // Sista check: se till att minRequiredSwaps upprätthålls (utan att röra locked)
  let minSwapsToSolve = findMinimumSwapsToSolve(finalBoard, start, goal);
  if (minSwapsToSolve < minRequiredSwaps) {
    const movableNow = getMovable(finalBoard);
    for (let tries = 0; tries < 60 && minSwapsToSolve < minRequiredSwaps; tries++) {
      if (movableNow.length < 2) break;
      const i = Math.floor(rng() * movableNow.length);
      let j = Math.floor(rng() * movableNow.length);
      while (j === i && movableNow.length > 1) j = Math.floor(rng() * movableNow.length);
      const a = movableNow[i], b = movableNow[j];
      const tmp = finalBoard[a.y][a.x];
      finalBoard[a.y][a.x] = finalBoard[b.y][b.x];
      finalBoard[b.y][b.x] = tmp;
      finalBoard[start.y][start.x].id = 'start-tile';
      finalBoard[goal.y][goal.x].id = 'goal-tile';
      minSwapsToSolve = findMinimumSwapsToSolve(finalBoard, start, goal);
    }
  }

  return finalBoard;
};

// --------------------------------------------------
// Rörelselogik / pathfinding
// --------------------------------------------------
export const canMoveTo = (
  board: GameTile[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): boolean => {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  if (toX < 0 || toX >= cols || toY < 0 || toY >= rows) return false;

  const fromTile = board[fromY][fromX];
  const toTile = board[toY][toX];
  if (toTile.type === TileType.EMPTY) return false;

  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

  if (dx === 1)  return fromTile.connections.east  && toTile.connections.west;
  if (dx === -1) return fromTile.connections.west  && toTile.connections.east;
  if (dy === 1)  return fromTile.connections.south && toTile.connections.north;
  if (dy === -1) return fromTile.connections.north && toTile.connections.south;

  return false;
};

export const findPath = (
  board: GameTile[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): { x: number; y: number }[] | null => {
  const queue = [{ x: startX, y: startY, path: [{ x: startX, y: startY }] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (x === endX && y === endY) return path;

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
    ];
    for (const { dx, dy } of dirs) {
      const nx = x + dx, ny = y + dy;
      if (canMoveTo(board, x, y, nx, ny)) {
        queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
      }
    }
  }
  return null;
};

// --------------------------------------------------
// Solver: minsta byten (ej flytta locked/start/goal)
// --------------------------------------------------
export const findMinimumSwapsToSolve = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
): number => {
  if (findPath(board, start.x, start.y, goal.x, goal.y)) return 0;

  const movableTiles: { x: number; y: number }[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < (board[0]?.length || 0); x++) {
      const t = board[y][x];
      if (
        t.type === TileType.PATH &&
        t.id !== 'start-tile' &&
        t.id !== 'goal-tile' &&
        !t.locked
      ) {
        movableTiles.push({ x, y });
      }
    }
  }

  const queue: { board: GameTile[][]; swaps: number }[] = [];
  const visited = new Set<string>();
  const serialize = (b: GameTile[][]) => b.map(r => r.map(t => t.id).join(',')).join('|');

  queue.push({ board: board.map(r => r.map(t => ({ ...t }))), swaps: 0 });
  visited.add(serialize(board));

  while (queue.length > 0 && queue.length < 1000) {
    const { board: cur, swaps } = queue.shift()!;
    for (let i = 0; i < movableTiles.length; i++) {
      for (let j = i + 1; j < movableTiles.length; j++) {
        const nb = cur.map(r => r.map(t => ({ ...t })));
        const a = movableTiles[i], b = movableTiles[j];
        const tmp = nb[a.y][a.x];
        nb[a.y][a.x] = nb[b.y][b.x];
        nb[b.y][b.x] = tmp;

        if (findPath(nb, start.x, start.y, goal.x, goal.y)) return swaps + 1;

        const key = serialize(nb);
        if (!visited.has(key) && swaps < 8) {
          visited.add(key);
          queue.push({ board: nb, swaps: swaps + 1 });
        }
      }
    }
  }
  return 5; // fallback
};

export const findMinimumSwapsToCollectAllGems = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
): number => {
  const gems: { x: number; y: number }[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      if (board[y][x].special === 'gem') gems.push({ x, y });
    }
  }
  if (gems.length === 0) return findMinimumSwapsToSolve(board, start, goal);

  const maxDepth = 15;
  const queue: { board: GameTile[][]; swaps: number }[] = [{ board, swaps: 0 }];
  const visited = new Set<string>();
  const serialize = (b: GameTile[][]) =>
    b.map(row =>
      row
        .map(t => `${t.type}-${t.connections.north}-${t.connections.south}-${t.connections.east}-${t.connections.west}-${t.special || ''}`)
        .join('|'),
    ).join('||');

  visited.add(serialize(board));

  while (queue.length > 0) {
    const { board: cur, swaps } = queue.shift()!;

    if (canReachGoalViaAllGems(cur, start, goal, gems)) return swaps;
    if (swaps >= maxDepth) continue;

    const movable: { x: number; y: number }[] = [];
    for (let y = 0; y < cur.length; y++) {
      for (let x = 0; x < cur[0].length; x++) {
        const t = cur[y][x];
        if (t.type === TileType.PATH && t.id !== 'start-tile' && t.id !== 'goal-tile' && !t.locked) {
          movable.push({ x, y });
        }
      }
    }

    for (let i = 0; i < movable.length; i++) {
      for (let j = i + 1; j < movable.length; j++) {
        const nb = cur.map(r => r.map(t => ({ ...t, connections: { ...t.connections } })));
        const a = movable[i], b = movable[j];
        const tmp = nb[a.y][a.x];
        nb[a.y][a.x] = nb[b.y][b.x];
        nb[b.y][b.x] = tmp;

        const key = serialize(nb);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ board: nb, swaps: swaps + 1 });
        }
      }
    }
  }

  // Strikt: hittade ingen lösning via gems inom sökdjupet
  return Number.POSITIVE_INFINITY;
};

const canReachGoalViaAllGems = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
  gems: { x: number; y: number }[],
): boolean => {
  const visited = new Set<string>();
  const gemsToVisit = new Set(gems.map(g => `${g.x},${g.y}`));

  const dfs = (x: number, y: number, visitedGems: Set<string>): boolean => {
    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    visited.add(key);

    const nextVisited = new Set(visitedGems);
    if (gemsToVisit.has(key)) nextVisited.add(key);

    if (x === goal.x && y === goal.y && nextVisited.size === gems.length) return true;

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
    ];
    for (const { dx, dy } of dirs) {
      const nx = x + dx, ny = y + dy;
      if (canMoveTo(board, x, y, nx, ny)) {
        if (dfs(nx, ny, nextVisited)) return true;
      }
    }
    visited.delete(key);
    return false;
  };

  return dfs(start.x, start.y, new Set());
};
