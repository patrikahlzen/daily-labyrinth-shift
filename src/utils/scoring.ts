import { GameTile, TileType } from '../types/game';
import { findMinimumSwapsToSolve, findMinimumSwapsToCollectAllGems } from './gameUtils';

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
  // Use stored optimal values from board generation for stable thresholds
  const storedOptimalToGoal = (board as any).__optimalToGoal as number | undefined;
  const storedOptimalAllGems = (board as any).__optimalAllGems as number | undefined;
  const storedTotalGems = (board as any).__totalGems as number | undefined;
  
  // Fallback to counting gems if not stored
  const totalGems = storedTotalGems ?? board.flat().filter(tile => tile.special === 'gem').length;
  
  // Use stored values or fallback calculation
  let optimalToGoal = storedOptimalToGoal;
  let optimalAllGems = storedOptimalAllGems;
  
  if (optimalToGoal == null || optimalAllGems == null) {
    // Fallback: locate start and goal and compute
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
      optimalToGoal = findMinimumSwapsToSolve(board, startPos, goalPos);
      // For fallback, compute gems path if any gems exist
      optimalAllGems = totalGems > 0 ? 
        findMinimumSwapsToCollectAllGems(board, startPos, goalPos) : 
        optimalToGoal;
    }
  }
  
  // Ensure minimum values
  optimalToGoal = Math.max(5, optimalToGoal ?? 5);
  optimalAllGems = Math.max(5, optimalAllGems ?? 5);
  
  // Star thresholds: 
  // 3 stars = optimal moves to collect all gems (or to goal if no gems)
  // 2 stars = optimal to goal + 2 moves
  const maxMovesFor3Stars = totalGems > 0 ? optimalAllGems : optimalToGoal;
  const maxMovesFor2Stars = optimalToGoal + 2;
  
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
  
  // 2 stars: Complete efficiently (within 2 extra moves of optimal to goal)
  if (requirements.efficient) {
    stars = 2;
  }
  
  // 3 stars: Complete with optimal moves for all gems scenario
  if (requirements.completed && moves <= maxMovesFor3Stars) {
    // If there are gems, require all gems collected
    if (totalGems === 0 || requirements.gemsCollected) {
      stars = 3;
    }
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