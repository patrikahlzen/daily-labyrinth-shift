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
  playerPosition: { x: number; y: number };
  goalPosition: { x: number; y: number };
  heldTile: GameTile | null;
  moves: number;
  timer: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  canUndo: boolean;
  previewMove: { row: number; col: number; direction: Direction } | null;
}

export interface GameResult {
  moves: number;
  time: number;
  score: number;
  stars: number;
  perfect: boolean;
}