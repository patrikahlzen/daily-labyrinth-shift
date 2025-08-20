export enum TileType {
  EMPTY = 'empty',
  PATH = 'path'
}

export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down' | 'left' | 'right';

export interface TileConnections {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface GameTile {
  type: TileType;
  connections: TileConnections;
  special?: 'key' | 'time' | 'block' | 'gem' | null;
  id: string;
}

export interface GameState {
  board: GameTile[][];
  startPosition: { x: number; y: number };
  goalPosition: { x: number; y: number };
  heldTile: GameTile | null;
  moves: number;
  timer: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  canUndo: boolean;
  // Path highlighting
  connectedPath: { x: number; y: number }[];
  validConnection: boolean;
  // History for undo
  pushHistory: {
    board: GameTile[][];
    startPosition: { x: number; y: number };
    goalPosition: { x: number; y: number };
    heldTile: GameTile | null;
    moves: number;
  }[];
  // Swap-only mode state
  selectedTile?: { row: number; col: number } | null;
  // Star rating and gem collection
  gemsCollected: number;
  stars: number;
}

export interface GameResult {
  moves: number;
  time: number;
  score: number;
  stars: number;
  perfect: boolean;
  gemsCollected: number;
  totalGems: number;
}

export interface GameStats {
  gemsCollected: number;
  totalGems: number;
}