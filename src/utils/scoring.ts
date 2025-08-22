import { GameTile, TileType } from '../types/game';
import { findMinimumSwapsToSolve } from './gameUtils';

export interface StarRating {
  stars: number;
  requirements: {
    completed: boolean;
    efficient: boolean;
    gemsCollected: boolean;
  };
  thresholds: {
    maxMovesFor2Stars: number;
    maxMovesFor3Stars: number;
    totalGems: number;
  };
}

export const calculateStarRating = (
  gameCompleted: boolean,
  moves: number,
  board: GameTile[][],
  gemsCollected = 0
): StarRating => {
  // Count total gems available
  const totalGems = board.flat().filter(tile => tile.special === 'gem').length;
  
  // Use stored optimal swaps or compute deterministically from current board
  let computedOptimal = (board as any).__optimalSwaps as number | undefined;
  if (computedOptimal == null) {
    // Locate start and goal on the current board
    let startPos: { x: number; y: number } | null = null;
    let goalPos: { x: number; y: number } | null = null;
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < (board[0]?.length || 0); x++) {
        const id = board[y][x].id;
        if (id === 'start-tile') startPos = { x, y };
        if (id === 'goal-tile') goalPos = { x, y };
      }
    }
    if (startPos && goalPos) {
      computedOptimal = findMinimumSwapsToSolve(board, startPos, goalPos);
    }
  }
  const optimalSwaps = Math.max(3, computedOptimal ?? 3);
  
  // Star thresholds based on the actual optimal solution (clamped)
  const maxMovesFor3Stars = optimalSwaps; // Perfect = exact optimal moves (min 3)
  const maxMovesFor2Stars = optimalSwaps + 2; // Good = within 2 extra moves
  
  const requirements = {
    completed: gameCompleted,
    efficient: gameCompleted && moves <= maxMovesFor2Stars,
    gemsCollected: gameCompleted && gemsCollected >= totalGems && totalGems > 0
  };
  
  let stars = 0;
  
  // 1 star: Complete the game
  if (requirements.completed) {
    stars = 1;
  }
  
  // 2 stars: Complete efficiently (within 2 extra moves)
  if (requirements.efficient) {
    stars = 2;
  }
  
  // 3 stars: Complete optimally with all gems
  if (requirements.completed && moves <= maxMovesFor3Stars && 
      (totalGems === 0 || requirements.gemsCollected)) {
    stars = 3;
  }
  
  return {
    stars,
    requirements,
    thresholds: {
      maxMovesFor2Stars,
      maxMovesFor3Stars,
      totalGems
    }
  };
};

export const getStarDescription = (stars: number): string => {
  switch (stars) {
    case 3:
      return "Perfect! Efficient solution with all gems collected!";
    case 2:
      return "Great! Efficient solution!";
    case 1:
      return "Well done! Puzzle completed!";
    default:
      return "Keep trying!";
  }
};

export const getNextStarRequirement = (
  currentStars: number,
  moves: number,
  thresholds: StarRating['thresholds']
): string => {
  switch (currentStars) {
    case 0:
      return "Complete the puzzle to earn your first star!";
    case 1:
      return `Complete in ${thresholds.maxMovesFor2Stars} moves or fewer for 2 stars!`;
    case 2:
      if (thresholds.totalGems > 0) {
        return `Complete in ${thresholds.maxMovesFor3Stars} moves with all ${thresholds.totalGems} gems for 3 stars!`;
      }
      return "Perfect! Maximum stars achieved!";
    default:
      return "Perfect! Maximum stars achieved!";
  }
};