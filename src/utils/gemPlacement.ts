import { GameTile, TileType } from '../types/game';
import { PuzzleTemplate } from './difficultySystem';

interface PlacementContext {
  board: GameTile[][];
  path: { x: number; y: number }[];
  template: PuzzleTemplate;
  rows: number;
  cols: number;
  rng: () => number;
  newId: () => string;
  inBounds: (x: number, y: number) => boolean;
  dirs: Array<{ dx: number; dy: number; name: 'north' | 'south' | 'east' | 'west' }>;
}

/**
 * Places gems on optional side branches to make them avoidable
 * This ensures players can complete the puzzle without collecting gems
 */
export const placeAvoidableGems = (context: PlacementContext): { x: number; y: number }[] => {
  const { board, path, template, rng, newId, inBounds, dirs } = context;
  const gemPositions: { x: number; y: number }[] = [];
  const gemBranches: { x: number; y: number }[] = [];
  const targetGems = Math.min(template.gemCount, Math.max(1, Math.floor(path.length / 4)));

  // Find possible connection points along main path (avoid start/end areas)
  const connectionPoints: number[] = [];
  for (let i = Math.floor(path.length * 0.2); i < Math.floor(path.length * 0.8); i++) {
    const { x, y } = path[i];
    // Check if we can build a side branch from this point
    const possibleBranches = dirs.filter(dir => {
      const branchX = x + dir.dx;
      const branchY = y + dir.dy;
      return inBounds(branchX, branchY) && 
             board[branchY][branchX].type === TileType.EMPTY &&
             !path.some(p => p.x === branchX && p.y === branchY);
    });
    if (possibleBranches.length > 0) {
      connectionPoints.push(i);
    }
  }

  // Create gem branches from selected connection points
  const maxBranches = Math.min(targetGems, connectionPoints.length);
  for (let gemIdx = 0; gemIdx < maxBranches; gemIdx++) {
    if (connectionPoints.length === 0) break;
    
    const connectionIdx = connectionPoints[Math.floor(rng() * connectionPoints.length)];
    connectionPoints.splice(connectionPoints.indexOf(connectionIdx), 1);
    
    const mainPoint = path[connectionIdx];
    
    // Find a direction for the branch
    const availableDirs = dirs.filter(dir => {
      const branchX = mainPoint.x + dir.dx;
      const branchY = mainPoint.y + dir.dy;
      return inBounds(branchX, branchY) && 
             board[branchY][branchX].type === TileType.EMPTY &&
             !path.some(p => p.x === branchX && p.y === branchY) &&
             !gemBranches.some(g => g.x === branchX && g.y === branchY);
    });
    
    if (availableDirs.length > 0) {
      const dir = availableDirs[Math.floor(rng() * availableDirs.length)];
      const gemX = mainPoint.x + dir.dx;
      const gemY = mainPoint.y + dir.dy;
      
      // Create branch tile with connection back to main path
      const branchConnections = { north: false, south: false, east: false, west: false };
      const backConnection = dirs.find(d => d.dx === -dir.dx && d.dy === -dir.dy);
      if (backConnection) {
        branchConnections[backConnection.name] = true;
      }
      
      board[gemY][gemX] = {
        type: TileType.PATH,
        connections: branchConnections,
        special: 'gem',
        locked: true,
        id: `gem-branch-${gemIdx + 1}`,
      };
      
      // Update main path tile to connect to branch
      const mainTile = board[mainPoint.y][mainPoint.x];
      mainTile.connections[dir.name] = true;
      
      gemPositions.push({ x: gemX, y: gemY });
      gemBranches.push({ x: gemX, y: gemY });
    }
  }

  // Fallback: place gems on main path if we couldn't create enough branches
  if (gemPositions.length < targetGems) {
    const turnIdx: number[] = [];
    for (let i = 1; i < path.length - 1; i++) {
      const a = path[i - 1], b = path[i], c = path[i + 1];
      const ab = { x: b.x - a.x, y: b.y - a.y };
      const bc = { x: c.x - b.x, y: c.y - b.y };
      if (ab.x !== bc.x || ab.y !== bc.y) turnIdx.push(i);
    }
    
    const remaining = targetGems - gemPositions.length;
    for (let i = 0; i < Math.min(turnIdx.length, remaining); i++) {
      const p = path[turnIdx[i]];
      if (!gemPositions.some(g => g.x === p.x && g.y === p.y)) {
        board[p.y][p.x] = { 
          ...board[p.y][p.x], 
          special: 'gem',
          locked: true,
          id: `gem-main-${gemPositions.length + 1}`
        };
        gemPositions.push(p);
      }
    }
  }

  return gemPositions;
};