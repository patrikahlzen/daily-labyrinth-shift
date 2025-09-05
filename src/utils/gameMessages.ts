import { StarRating } from './scoring';

export interface GamePerformance {
  completed: boolean;
  gemsCollected: number;
  totalGems: number;
  moves: number;
  optimal: number;
  hasGoldStar: boolean;
}

export const getGameFeedback = (performance: GamePerformance): {
  title: string;
  description: string;
  encouragement?: string;
} => {
  const {
    completed,
    gemsCollected,
    totalGems,
    moves,
    optimal,
    hasGoldStar
  } = performance;

  if (!completed) {
    return {
      title: "Keep trying!",
      description: "Don't give up - every puzzle has a solution!"
    };
  }

  const collectedAllGems = totalGems === 0 || gemsCollected >= totalGems;
  const isOptimal = moves <= optimal;
  const isNearOptimal = moves <= optimal + 1;

  // Perfect performance
  if (hasGoldStar && collectedAllGems && isOptimal) {
    return {
      title: "Flawless!",
      description: "You've mastered this puzzle with perfect efficiency!",
      encouragement: "Legendary performance! 🏆"
    };
  }

  // Great performance with gems
  if (collectedAllGems && isNearOptimal) {
    return {
      title: "Excellent!",
      description: "Great work collecting all gems efficiently!",
      encouragement: moves === optimal ? "Perfect moves!" : "Almost perfect!"
    };
  }

  // Optimal moves without gems
  if (isOptimal && !collectedAllGems && totalGems > 0) {
    return {
      title: "Great efficiency!",
      description: "Perfect move count! Try collecting gems for the ultimate challenge.",
      encouragement: `Can you get all ${totalGems} gems next time?`
    };
  }

  // Good performance with gems
  if (collectedAllGems) {
    return {
      title: "Well done!",
      description: "You collected all the gems!",
      encouragement: `Try completing in ${optimal} moves for the perfect score.`
    };
  }

  // Completed without gems
  if (totalGems > 0) {
    return {
      title: "Good work!",
      description: "Puzzle solved! Gems are optional but add extra challenge.",
      encouragement: `Try collecting all ${totalGems} gems for bonus points!`
    };
  }

  // Basic completion
  return {
    title: "Success!",
    description: "Great job solving the puzzle!",
    encouragement: `Can you do it in ${optimal} moves?`
  };
};

export const getStarDescription = (stars: number): string => {
  return stars >= 1
    ? "Perfect! Golden star achieved!"
    : "Keep improving!";
};

export const getNextStarRequirement = (
  currentStars: number,
  moves: number,
  thresholds: StarRating['thresholds'],
  gemsCollected: number = 0
): string => {
  if (currentStars >= 1) {
    return "Perfect! Maximum reward achieved!";
  }

  const { maxMovesForGold, totalGems } = thresholds;
  const needsBetterMoves = moves > maxMovesForGold;
  const hasAllGems = totalGems === 0 || gemsCollected >= totalGems;

  if (totalGems > 0) {
    if (needsBetterMoves && !hasAllGems) {
      return `Complete in ${maxMovesForGold} moves and collect all ${totalGems} gems for the gold star!`;
    } else if (needsBetterMoves) {
      return `Complete in ${maxMovesForGold} moves for the gold star!`;
    } else if (!hasAllGems) {
      return `Collect all ${totalGems} gems for the gold star!`;
    }
  }
  
  return `Complete in ${maxMovesForGold} moves for the gold star!`;
};