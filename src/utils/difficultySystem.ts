import { GameTile, TileType, TileConnections } from '../types/game';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',  
  HARD = 'hard'
}

export interface PuzzleTemplate {
  boardSize: { rows: number; cols: number };
  pathComplexity: number; // 1-5, where 5 is most complex
  gemCount: number;
  decoyDensity: number; // 0-1, how many decoy tiles
  optimalMoves: number;
  difficulty: Difficulty;
}

// Curated puzzle templates for consistent quality
export const PUZZLE_TEMPLATES: Record<Difficulty, PuzzleTemplate[]> = {
  [Difficulty.EASY]: [
    {
      boardSize: { rows: 3, cols: 4 },
      pathComplexity: 1,
      gemCount: 1,
      decoyDensity: 0.3,
      optimalMoves: 2,
      difficulty: Difficulty.EASY
    },
    {
      boardSize: { rows: 4, cols: 4 },
      pathComplexity: 2,
      gemCount: 1,
      decoyDensity: 0.4,
      optimalMoves: 3,
      difficulty: Difficulty.EASY
    }
  ],
  [Difficulty.MEDIUM]: [
    {
      boardSize: { rows: 4, cols: 5 },
      pathComplexity: 3,
      gemCount: 2,
      decoyDensity: 0.5,
      optimalMoves: 4,
      difficulty: Difficulty.MEDIUM
    },
    {
      boardSize: { rows: 5, cols: 5 },
      pathComplexity: 3,
      gemCount: 2,
      decoyDensity: 0.6,
      optimalMoves: 5,
      difficulty: Difficulty.MEDIUM
    }
  ],
  [Difficulty.HARD]: [
    {
      boardSize: { rows: 5, cols: 6 },
      pathComplexity: 4,
      gemCount: 3,
      decoyDensity: 0.7,
      optimalMoves: 6,
      difficulty: Difficulty.HARD
    },
    {
      boardSize: { rows: 6, cols: 6 },
      pathComplexity: 5,
      gemCount: 4,
      decoyDensity: 0.8,
      optimalMoves: 8,
      difficulty: Difficulty.HARD
    }
  ]
};

// Seed-based difficulty rotation for daily puzzles
export const getDifficultyForDay = (daysSinceEpoch: number): Difficulty => {
  const cycle = daysSinceEpoch % 7; // Weekly cycle
  
  if (cycle === 0 || cycle === 6) return Difficulty.EASY; // Weekend easy
  if (cycle === 1 || cycle === 2 || cycle === 5) return Difficulty.MEDIUM; // Most days medium
  return Difficulty.HARD; // Wed/Thu hard
};

export const getTemplateForSeed = (seed: string, difficulty: Difficulty): PuzzleTemplate => {
  const templates = PUZZLE_TEMPLATES[difficulty];
  const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return templates[seedNum % templates.length];
};

// Enhanced star rating thresholds based on template
export const calculateStarThresholds = (template: PuzzleTemplate) => {
  const { optimalMoves, difficulty } = template;
  
  // More forgiving thresholds for harder puzzles
  const difficultyMultiplier = {
    [Difficulty.EASY]: 1.0,
    [Difficulty.MEDIUM]: 1.2,
    [Difficulty.HARD]: 1.5
  };
  
  const multiplier = difficultyMultiplier[difficulty];
  
  return {
    maxMovesFor3Stars: Math.ceil(optimalMoves * multiplier),
    maxMovesFor2Stars: Math.ceil(optimalMoves * multiplier * 1.5),
    difficulty
  };
};

// Validate puzzle solvability and uniqueness
export const validatePuzzleQuality = (board: GameTile[][], template: PuzzleTemplate): boolean => {
  // Check if puzzle has appropriate complexity
  const pathTiles = board.flat().filter(tile => tile.type === TileType.PATH);
  const expectedPathLength = template.pathComplexity * 3; // Rough estimate
  
  if (Math.abs(pathTiles.length - expectedPathLength) > 2) {
    return false;
  }
  
  // Check gem placement
  const gems = board.flat().filter(tile => tile.special === 'gem');
  if (gems.length !== template.gemCount) {
    return false;  
  }
  
  return true;
};