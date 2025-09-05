import { GameTile } from '../types/game';

export interface StarRating {
  stars: number; // 0 or 1
  requirements: {
    completed: boolean;
    goldAchieved: boolean;
    gemsCollected: boolean;
  };
  thresholds: {
    maxMovesForGold: number;
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
    const rows = board.length;
    const cols = board[0]?.length || 0;
    const area = rows * cols;
    const estimate = Math.max(5, Math.min(12, Math.round(area / 6)));
    optimalToGoal = estimate;
    optimalAllGems = totalGems > 0 ? estimate + Math.min(2, totalGems) : estimate;
  }
  
  // Ensure minimum values - enforce STRICT minimum difficulty
  optimalToGoal = Math.max(5, optimalToGoal ?? 5);
  optimalAllGems = Math.max(6, optimalAllGems ?? 6);
  
  // Golden star threshold: optimal all-gems (or goal if no gems) + 1 move
  const maxMovesForGold = (totalGems > 0 ? optimalAllGems : optimalToGoal) + 1;
  
  const requirements = {
    completed: gameCompleted,
    gemsCollected: gameCompleted && (totalGems === 0 || gemsCollected >= totalGems),
    goldAchieved: gameCompleted && moves <= maxMovesForGold
  };
  
  const stars = requirements.goldAchieved ? 1 : 0;
  
  return {
    stars,
    requirements,
    thresholds: {
      maxMovesForGold,
      totalGems
    }
  };
};

// Re-export from gameMessages for backward compatibility
export { getStarDescription, getNextStarRequirement } from './gameMessages';