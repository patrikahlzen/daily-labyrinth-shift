import { GameTile, TileType, TileConnections } from '../types/game';
import { getDifficultyForDay, getTemplateForSeed } from './difficultySystem';

// ------------------------------------------------------
// RNG
// ------------------------------------------------------
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

// ------------------------------------------------------
// Konstanter – solvern får en budget så den inte kraschar
// ------------------------------------------------------
const SOLVER_LIMITS = {
  maxQueue: 600,      // max antal noder i kön
  maxStates: 2000,    // max antal besökta brädor
  maxDepth: 6,        // söker upp till detta antal byten
  maxTimeMs: 40,      // tidbudget i ms (per anrop)
  branchSamples: 100, // max antal swap-par vi provar per nod
};

// ------------------------------------------------------
// Tile-mönster
// ------------------------------------------------------
const TILE_PATTERNS: TileConnections[] = [
  { north: true, south: true, east: false, west: false },   // | vertikal
  { north: false, south: false, east: true, west: true },   // — horisontell
  { north: true, south: false, east: true, west: false },   // └ NE
  { north: true, south: false, east: false, west: true },   // ┘ NW
  { north: false, south: true, east: true, west: false },   // ┌ SE
  { north: false, south: true, east: false, west: true },   // ┐ SW
];

export const generateRandomTile = (): GameTile => {
  const pattern = TILE_PATTERNS[Math.floor(Math.random() * TILE_PATTERNS.length)];
  const hasSpecial = Math.random() < 0.15;
  let special: GameTile['special'] = null;
  if (hasSpecial) {
    const specials = ['key', 'time', 'gem'] as const;
    special = specials[Math.floor(Math.random() * specials.length)];
  }
  return {
    type: TileType.PATH,
    connections: pattern,
    special,
    id: Math.random().toString(36).slice(2),
  };
};

export const generateEmptyTile = (): GameTile => ({
  type: TileType.EMPTY,
  connections: { north: false, south: false, east: false, west: false },
  special: null,
  id: Math.random().toString(36).slice(2),
});

// ------------------------------------------------------
// Brädgenerering
// ------------------------------------------------------
export const createInitialBoard = (seed?: string): GameTile[][] => {
  const rng = createRng(seed);
  let idCounter = 0;
  const newId = () => `t-${(++idCounter).toString(36)}`;

  const daysSinceEpoch = seed
    ? Math.floor(parseInt(seed.slice(-8), 16) / 86400000)
    : Math.floor(Date.now() / 86400000);

  const difficulty = getDifficultyForDay(daysSinceEpoch);
  const template = getTemplateForSeed(seed || Date.now().toString(), difficulty);
  const { rows, cols } = template.boardSize;

  // -- start/mål placering
  const getRandomPosition = (exclude: { x: number; y: number }[] = []) => {
    const boardArea = rows * cols;
    const minDistance = Math.max(3, Math.floor(Math.sqrt(boardArea)));
    let attempts = 0;
    while (attempts < 50) {
      const edgeWeight = 0.3;
      let x: number, y: number;
      if (rng() < edgeWeight) {
        const side = Math.floor(rng() * 4);
        if (side === 0) { x = 0; y = Math.floor(rng() * rows); }
        else if (side === 1) { x = cols - 1; y = Math.floor(rng() * rows); }
        else if (side === 2) { x = Math.floor(rng() * cols); y = 0; }
        else { x = Math.floor(rng() * cols); y = rows - 1; }
      } else {
        x = Math.floor(rng() * cols);
        y = Math.floor(rng() * rows);
      }
      const ok = exclude.every(p => Math.abs(p.x - x) + Math.abs(p.y - y) >= minDistance);
      if (ok) return { x, y };
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
  const goal  = getRandomPosition([start]);

  // Tomt bräde
  const emptyTile = (): GameTile => ({
    type: TileType.EMPTY,
    connections: { north: false, south: false, east: false, west: false },
    special: null,
    id: newId(),
  });
  const board: GameTile[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyTile())
  );

  // ---- bygg en enda snygg väg (med svängar)
  const boardArea = rows * cols;
  const targetPathLength = Math.floor(boardArea * (0.4 + rng() * 0.3));
  const minTurns = Math.max(3, Math.floor(targetPathLength / 6));

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );
  const path: { x: number; y: number }[] = [];

  const dirs = [
    { dx: 0, dy: -1, name: 'north' as const },
    { dx: 0, dy: 1,  name: 'south' as const },
    { dx: 1, dy: 0,  name: 'east'  as const },
    { dx: -1, dy: 0, name: 'west'  as const },
  ];
  const inBounds = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows;

  const generatePathWithTurns = (x: number, y: number, lastDir?: string, turns = 0): boolean => {
    path.push({ x, y });
    if (x === goal.x && y === goal.y) {
      return path.length >= Math.floor(targetPathLength * 0.7) && turns >= minTurns;
    }
    if (path.length > targetPathLength * 1.5) return false;
    visited[y][x] = true;

    const order = [...dirs];
    for (let i = order.length - 1; i > 0; i--) {
      const r = Math.floor(rng() * (i + 1));
      [order[i], order[r]] = [order[r], order[i]];
    }
    if (turns < minTurns && lastDir) {
      order.sort((a, b) => (a.name !== lastDir ? -1 : 1) - (b.name !== lastDir ? -1 : 1));
    }

    for (const { dx, dy, name } of order) {
      const nx = x + dx, ny = y + dy;
      if (!inBounds(nx, ny) || visited[ny][nx]) continue;
      const t2 = lastDir && name !== lastDir ? turns + 1 : turns;
      if (generatePathWithTurns(nx, ny, name, t2)) return true;
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
  // Fallback L-böjd väg
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

  // Lägg ut själva rören längs path
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

  // --- strategisk gem-placering
  const gemPositions: { x: number; y: number }[] = [];
  const turnIdx: number[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1], b = path[i], c = path[i + 1];
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };
    if (ab.x !== bc.x || ab.y !== bc.y) turnIdx.push(i);
  }
  const targetGems = Math.min(template.gemCount, Math.max(1, Math.floor(path.length / 4)));
  for (let i = 0; i < Math.min(turnIdx.length, targetGems); i++) {
    const p = path[turnIdx[i]];
    gemPositions.push(p);
    board[p.y][p.x] = { ...board[p.y][p.x], special: 'gem' };
  }
  if (gemPositions.length < targetGems) {
    const interval = Math.max(2, Math.floor(path.length / (targetGems - gemPositions.length + 1)));
    for (let i = interval; i < path.length - 1 && gemPositions.length < targetGems; i += interval) {
      const p = path[i];
      if (!gemPositions.some(g => g.x === p.x && g.y === p.y)) {
        board[p.y][p.x] = { ...board[p.y][p.x], special: 'gem' };
        gemPositions.push(p);
      }
    }
  }

  // 🔒 Lås ALLA gems (som start/mål)
  gemPositions.forEach((p, idx) => {
    board[p.y][p.x] = {
      ...board[p.y][p.x],
      special: 'gem',
      locked: true,
      id: `gem-fixed-${idx + 1}`,
    };
  });

  // Markera start/mål
  board[start.y][start.x].id = 'start-tile';
  board[goal.y][goal.x].id = 'goal-tile';

  // --- decoy tiles (visuell distraktion) - create coherent segments
  const isOnPath = (x: number, y: number) => path.some(p => p.x === x && p.y === y);
  
  // Helper for opposite direction
  const opposite = { north: 'south', south: 'north', east: 'west', west: 'east' } as const;

  // Second pass: create mini decoy paths that form coherent but disconnected segments
  const createDecoySegment = (startX: number, startY: number, length: number) => {
    let x = startX, y = startY;
    let segmentLength = 0;
    // which direction we CAME into current tile from (for back-connection)
    let inbound: 'north' | 'south' | 'east' | 'west' | null = null;

    while (
      segmentLength < length &&
      inBounds(x, y) &&
      board[y][x].type === TileType.EMPTY &&
      !isOnPath(x, y)
    ) {
      // choose a direction that's not the same as inbound (makes nicer zig-zag)
      const available = dirs.filter(d => {
        const nx = x + d.dx, ny = y + d.dy;
        return inBounds(nx, ny) && !isOnPath(nx, ny) && board[ny][nx].type === TileType.EMPTY && d.name !== inbound;
      });
      if (available.length === 0) break;

      const dir = available[Math.floor(rng() * available.length)];
      const nx = x + dir.dx, ny = y + dir.dy;

      // Set connections for current tile
      const con = { north: false, south: false, east: false, west: false };
      con[dir.name] = true;                    // outgoing
      if (inbound) con[inbound] = true;        // incoming (back-connection)

      board[y][x] = {
        type: TileType.PATH,
        connections: con,
        special: null,
        id: newId(),
      };

      // Move forward. Next tile should back-connect to opposite direction.
      inbound = opposite[dir.name];
      x = nx; y = ny;
      segmentLength++;
    }

    // Finish last "hanging" end if loop broke after 1+ steps
    if (segmentLength > 0 && inBounds(x, y) && board[y][x].type === TileType.EMPTY && !isOnPath(x, y)) {
      const con = { north: false, south: false, east: false, west: false };
      if (inbound) con[inbound] = true;
      board[y][x] = {
        type: TileType.PATH,
        connections: con,
        special: null,
        id: newId(),
      };
    }
  };

  // Create several decoy segments
  const decoyCount = Math.floor((rows * cols) * 0.15);
  for (let i = 0; i < decoyCount; i++) {
    const startX = Math.floor(rng() * cols);
    const startY = Math.floor(rng() * rows);
    if (!isOnPath(startX, startY) && board[startY][startX].type === TileType.EMPTY) {
      const segmentLength = 2 + Math.floor(rng() * 3); // 2-4 tiles per segment
      createDecoySegment(startX, startY, segmentLength);
    }
  }

  // ------------------------------------------------------
  // Scrambling – med begränsningar
  // ------------------------------------------------------
  const cloneBoard = (b: GameTile[][]) => b.map(r => r.map(t => ({ ...t, connections: { ...t.connections } })));
  const baseSolvedBoard = cloneBoard(board);

  const getMovable = (b: GameTile[][]) => {
    const coords: { x: number; y: number }[] = [];
    for (let yy = 0; yy < rows; yy++) {
      for (let xx = 0; xx < cols; xx++) {
        const t = b[yy][xx];
        if (t.type === TileType.PATH && t.id !== 'start-tile' && t.id !== 'goal-tile' && !t.locked) {
          coords.push({ x: xx, y: yy });
        }
      }
    }
    return coords;
  };

  const movableCount = getMovable(baseSolvedBoard).length;
  const baseScrambleIntensity = Math.max(12, Math.floor(movableCount * 1.2));
  const multiplier =
    template.difficulty === 'hard' ? 2.6 : template.difficulty === 'medium' ? 2.2 : 1.8;
  const targetSwaps = Math.floor(baseScrambleIntensity * multiplier);
  const minRequiredSwaps = template.difficulty === 'hard' ? 5 : template.difficulty === 'medium' ? 5 : 4;

  let scrambled: GameTile[][] | null = null;
  let acceptedSwaps = -1;
  const maxAttempts = 8; // ↓ mycket lägre än tidigare

  for (let attempt = 0; attempt < maxAttempts && !scrambled; attempt++) {
    const candidate = cloneBoard(baseSolvedBoard);
    const movable = getMovable(candidate);
    const phase1 = Math.max(targetSwaps * 2, Math.floor(movable.length * 2));
    for (let i = 0; i < phase1 && movable.length >= 2; i++) {
      const a = movable[Math.floor(rng() * movable.length)];
      let b = movable[Math.floor(rng() * movable.length)];
      while (b.x === a.x && b.y === a.y && movable.length > 1) {
        b = movable[Math.floor(rng() * movable.length)];
      }
      const tmp = candidate[a.y][a.x];
      candidate[a.y][a.x] = candidate[b.y][b.x];
      candidate[b.y][b.x] = tmp;
    }
    const swapsNeeded = findMinimumSwapsToSolve(candidate, start, goal, SOLVER_LIMITS);
    if (swapsNeeded >= minRequiredSwaps) {
      scrambled = candidate;
      acceptedSwaps = swapsNeeded;
    }
  }

  let finalBoard = scrambled ?? baseSolvedBoard;

  // Siffror till scoring
  const totalGems = finalBoard.flat().filter(t => t.special === 'gem').length;
  const baseEstimate = Math.max(5, Math.min(12, Math.round((rows * cols) / 6)));
  const computedMin = acceptedSwaps > 0
    ? acceptedSwaps
    : findMinimumSwapsToSolve(finalBoard, start, goal, SOLVER_LIMITS);
  const optimalToGoal = Math.max(baseEstimate, computedMin);
  const optimalAllGems = totalGems > 0 ? optimalToGoal + Math.min(2, totalGems) : optimalToGoal;
  (finalBoard as any).__optimalToGoal = optimalToGoal;
  (finalBoard as any).__optimalAllGems = optimalAllGems;
  (finalBoard as any).__totalGems = totalGems;

  // säkerställ start/mål
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
  if (!hasConn(finalBoard[start.y][start.x])) finalBoard[start.y][start.x] = { ...baseSolvedBoard[start.y][start.x], id: 'start-tile' };
  if (!hasConn(finalBoard[goal.y][goal.x]))  finalBoard[goal.y][goal.x]  = { ...baseSolvedBoard[goal.y][goal.x],  id: 'goal-tile'  };

  // Se till att minDepth uppfylls utan att loopa ihjäl oss
  let minSwaps = findMinimumSwapsToSolve(finalBoard, start, goal, SOLVER_LIMITS);
  if (minSwaps < minRequiredSwaps) {
    const movableNow = getMovable(finalBoard);
    for (let tries = 0; tries < 40 && minSwaps < minRequiredSwaps; tries++) {
      if (movableNow.length < 2) break;
      const a = movableNow[Math.floor(rng() * movableNow.length)];
      let b = movableNow[Math.floor(rng() * movableNow.length)];
      while (b.x === a.x && b.y === a.y && movableNow.length > 1) {
        b = movableNow[Math.floor(rng() * movableNow.length)];
      }
      const tmp = finalBoard[a.y][a.x];
      finalBoard[a.y][a.x] = finalBoard[b.y][b.x];
      finalBoard[b.y][b.x] = tmp;
      finalBoard[start.y][start.x].id = 'start-tile';
      finalBoard[goal.y][goal.x].id = 'goal-tile';
      minSwaps = findMinimumSwapsToSolve(finalBoard, start, goal, SOLVER_LIMITS);
    }
  }

  return finalBoard;
};

// ------------------------------------------------------
// Rörelse & path
// ------------------------------------------------------
export const canMoveTo = (
  board: GameTile[][],
  fromX: number, fromY: number,
  toX: number, toY: number
): boolean => {
  const rows = board.length, cols = board[0]?.length || 0;
  if (toX < 0 || toX >= cols || toY < 0 || toY >= rows) return false;
  const fromTile = board[fromY][fromX];
  const toTile   = board[toY][toX];
  if (toTile.type === TileType.EMPTY) return false;

  const dx = toX - fromX, dy = toY - fromY;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

  if (dx === 1)  return fromTile.connections.east  && toTile.connections.west;
  if (dx === -1) return fromTile.connections.west  && toTile.connections.east;
  if (dy === 1)  return fromTile.connections.south && toTile.connections.north;
  if (dy === -1) return fromTile.connections.north && toTile.connections.south;
  return false;
};

export const findPath = (
  board: GameTile[][],
  startX: number, startY: number,
  endX: number, endY: number
): { x: number; y: number }[] | null => {
  const q = [{ x: startX, y: startY, path: [{ x: startX, y: startY }] }];
  const seen = new Set<string>();
  while (q.length) {
    const { x, y, path } = q.shift()!;
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (x === endX && y === endY) return path;
    const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:1,dy:0},{dx:-1,dy:0}];
    for (const {dx,dy} of dirs) {
      const nx = x + dx, ny = y + dy;
      if (canMoveTo(board, x, y, nx, ny)) {
        q.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
      }
    }
  }
  return null;
};

// ------------------------------------------------------
// Solver – med hårda tak och sampling
// ------------------------------------------------------
const serializeByIds = (b: GameTile[][]) => b.map(r => r.map(t => t.id).join(',')).join('|');
const shallowCopyBoard = (b: GameTile[][]) => b.map(r => r.slice());

export const findMinimumSwapsToSolve = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal:  { x: number; y: number },
  limits: Partial<typeof SOLVER_LIMITS> = {}
): number => {
  const L = { ...SOLVER_LIMITS, ...limits };

  // redan löst?
  if (findPath(board, start.x, start.y, goal.x, goal.y)) return 0;

  // vilka rutor får flyttas?
  const movable: { x: number; y: number }[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < (board[0]?.length || 0); x++) {
      const t = board[y][x];
      if (t.type === TileType.PATH && t.id !== 'start-tile' && t.id !== 'goal-tile' && !t.locked) {
        movable.push({ x, y });
      }
    }
  }
  if (movable.length < 2) return 5;

  const startTime = Date.now();
  let statesVisited = 0;

  const seen = new Set<string>();
  const queue: { b: GameTile[][]; d: number }[] = [];
  queue.push({ b: shallowCopyBoard(board), d: 0 });
  seen.add(serializeByIds(board));

  const pickPair = () => {
    const i = Math.floor(Math.random() * movable.length);
    let j = Math.floor(Math.random() * movable.length);
    while (j === i) j = Math.floor(Math.random() * movable.length);
    return [movable[i], movable[j]] as const;
  };

  while (queue.length) {
    if (queue.length > L.maxQueue) break;
    if (statesVisited > L.maxStates) break;
    if (Date.now() - startTime > L.maxTimeMs) break;

    const { b: cur, d } = queue.shift()!;
    statesVisited++;

    if (d >= L.maxDepth) continue;

    // prova ett begränsat antal swappar
    const tries = Math.min(L.branchSamples, movable.length * 3);
    for (let t = 0; t < tries; t++) {
      const [a, b] = pickPair();
      const nb = shallowCopyBoard(cur); // kopiera 2D-arrayerna
      const tmp = nb[a.y][a.x];
      nb[a.y][a.x] = nb[b.y][b.x];
      nb[b.y][b.x] = tmp;

      if (findPath(nb, start.x, start.y, goal.x, goal.y)) {
        return d + 1;
      }

      const sig = serializeByIds(nb);
      if (!seen.has(sig)) {
        seen.add(sig);
        queue.push({ b: nb, d: d + 1 });
      }

      if (queue.length > L.maxQueue || Date.now() - startTime > L.maxTimeMs) break;
    }
  }

  // hittade inget inom budget → rimligt fallbackvärde
  return Math.min(L.maxDepth + 1, 5);
};

export const findMinimumSwapsToCollectAllGems = (
  board: GameTile[][],
  start: { x: number; y: number },
  goal:  { x: number; y: number }
): number => {
  // billig approximation: använd samma solver med lite högre budget
  return findMinimumSwapsToSolve(board, start, goal, {
    maxDepth: SOLVER_LIMITS.maxDepth + 1,
    maxStates: SOLVER_LIMITS.maxStates + 500,
    maxQueue: SOLVER_LIMITS.maxQueue + 200,
    maxTimeMs: SOLVER_LIMITS.maxTimeMs + 20,
  });
};
