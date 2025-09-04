// English translations for Pathfinder
export const translations = {
  // Start screen
  'game.title': 'Pathfinder',
  'game.puzzle': 'Puzzle',
  'game.today': 'Today',
  'game.description': 'Build a continuous path from Start to Goal by swapping tiles.',
  'game.newPuzzleIn': 'New puzzle in',
  'game.startDaily': 'Start Daily Challenge',
  'game.practiceMode': 'Practice Mode', 
  'game.howToPlay': 'How to Play',

  // Game UI
  'game.time': 'Time',
  'game.moves': 'Moves',
  'game.undo': 'Undo',

  // End screen
  'game.puzzleSolved': 'Puzzle Solved!',
  'game.share': 'Share',
  'game.tryAgain': 'Try Again',
  'game.close': 'Close',
  'game.copied': 'Copied!',
  'game.copiedDescription': 'Your result has been copied to clipboard.',

  // Star ratings
  'stars.perfect': 'Perfect! Minimum moves achieved.',
  'stars.good': 'Well done!',
  'stars.completed': 'Puzzle completed!',
  'stars.nextTarget': 'Next target: {requirement}',
} as const;

export type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey, params?: Record<string, string>): string => {
  let text: string = translations[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
  }
  
  return text;
};