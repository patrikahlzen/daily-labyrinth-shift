// Swedish translations for Daily Labyrinth
export const translations = {
  // Start screen
  'game.title': 'Daily Labyrinth',
  'game.puzzle': 'Pussel',
  'game.today': 'Idag',
  'game.description': 'Bygg en sammanhängande stig från Start till Mål genom att byta tiles.',
  'game.newPuzzleIn': 'Nytt pussel om',
  'game.startDaily': 'Starta daglig utmaning',
  'game.practiceMode': 'Träningsläge', 
  'game.howToPlay': 'Hur man spelar',

  // Game UI
  'game.time': 'Tid',
  'game.moves': 'Drag',
  'game.undo': 'Ångra',

  // End screen
  'game.puzzleSolved': 'Pussel löst!',
  'game.share': 'Dela',
  'game.tryAgain': 'Försök igen',
  'game.close': 'Stäng',
  'game.copied': 'Kopierat!',
  'game.copiedDescription': 'Ditt resultat har kopierats till urklipp.',

  // Star ratings
  'stars.perfect': 'Perfekt! Minsta antal drag.',
  'stars.good': 'Bra jobbat!',
  'stars.completed': 'Pussel slutfört!',
  'stars.nextTarget': 'Nästa mål: {requirement}',
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