import { GameTile, TileType } from '../types/game';

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
  
  // Calculate optimal solution metrics based on board size
  const boardArea = board.length * (board[0]?.length || 0);
  const pathLength = board.flat().filter(tile => tile.type === TileType.PATH).length;
  
  // Dynamic thresholds based on puzzle complexity
  const baseOptimalMoves = Math.max(3, Math.floor(pathLength * 0.15)); // ~15% of path length
  const maxMovesFor3Stars = baseOptimalMoves + Math.floor(boardArea * 0.1);
  const maxMovesFor2Stars = baseOptimalMoves + Math.floor(boardArea * 0.2);
  
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
  
  // 2 stars: Complete efficiently
  if (requirements.efficient) {
    stars = 2;
  }
  
  // 3 stars: Complete efficiently + collect all gems (within 3-star threshold)
  if (requirements.completed && requirements.gemsCollected && moves <= maxMovesFor3Stars) {
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