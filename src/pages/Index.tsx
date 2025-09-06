import React, { useEffect, useState } from 'react';
import { GameBoard } from '../components/GameBoard';
import { GameHUD } from '../components/GameHUD';
import { EndScreen } from '../components/EndScreen';
import { Tutorial } from '../components/Tutorial';
import { Button } from '../components/ui/button';
import { useGameLogic } from '../hooks/useGameLogic';
import { useDailyInfo } from '../hooks/useDaily';
import { t } from '../utils/i18n';

const Index = () => {
  const { gameState, startGame, pushTile, undoMove, onTileTap, onSwapTiles, resetGame, generateNewPuzzle, undoUsage } = useGameLogic();
  const { puzzleNumber, countdown } = useDailyInfo();
  const [showEnd, setShowEnd] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    // Show tutorial for first-time users
    return !localStorage.getItem('dailyLabyrinth_tutorialCompleted');
  });

  useEffect(() => {
    if (gameState.gameCompleted) setShowEnd(true);
  }, [gameState.gameCompleted]);

  const handleTutorialComplete = () => {
    localStorage.setItem('dailyLabyrinth_tutorialCompleted', 'true');
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    localStorage.setItem('dailyLabyrinth_tutorialCompleted', 'true');
    setShowTutorial(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <script dangerouslySetInnerHTML={{__html: `document.body.classList.add('theme-prism')`}} />
      
      {/* Streamlined layout without extra header */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {/* Game HUD */}
        <GameHUD 
          timer={gameState.timer} 
          moves={gameState.moves} 
          canUndo={gameState.canUndo} 
          onUndo={undoMove}
          undoUsage={undoUsage}
        />

        {/* Main Game Area - optimized spacing */}
        <div className="flex-1 flex items-center justify-center py-4">
          <GameBoard
            board={gameState.board}
            goalPosition={gameState.goalPosition}
            startPosition={gameState.startPosition}
            onTilePush={pushTile}
            connectedPath={gameState.connectedPath}
            validConnection={gameState.validConnection}
            onTileTap={onTileTap}
            selectedTile={gameState.selectedTile}
            onSwapTiles={onSwapTiles}
          />
        </div>
      </div>
      {/* Tutorial overlay */}
      {showTutorial && (
        <Tutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* End screen overlay */}
      {showEnd && (
        <EndScreen 
          timer={gameState.timer} 
          moves={gameState.moves} 
          puzzleNumber={puzzleNumber}
          stars={gameState.stars}
          board={gameState.board}
          gemsCollected={gameState.gemsCollected}
          attempts={gameState.attempts}
          onClose={() => setShowEnd(false)}
          onTryAgain={() => {
            setShowEnd(false);
            resetGame();
          }}
        />
      )}

      {/* START SCREEN - Modern Material Design */}
      {!gameState.gameStarted && !showTutorial && (
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg">
            {/* Modern card with material design */}
            <div className="backdrop-blur-xl bg-card border border-card-border rounded-2xl shadow-glass p-6 sm:p-8 space-y-6">
              
              {/* Hero title with gradient text */}
              <div className="space-y-4 text-center">
                <h1 className="title-hero">
                  {t('game.title')}
                </h1>
                
                {/* Puzzle number in large secondary text */}
                <div className="title-secondary">
                  {t('game.puzzle')} #{String(puzzleNumber).padStart(2,'0')}
                </div>
                
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full"></div>
              </div>
              
              {/* Game description */}
              <div className="space-y-4 text-center">
                <p className="body-text text-base sm:text-lg leading-relaxed">
                  {t('game.description')}
                </p>
                
                {/* Countdown pill */}
                <div className="pill inline-flex items-center gap-3">
                  <span className="text-lg">⏰</span>
                  <span className="counter">{t('game.newPuzzleIn')} {countdown}</span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="space-y-3">
                {/* Primary CTA with prism border */}
                <Button
                  onClick={startGame}
                  className="btn-cta w-full h-12 sm:h-14 text-base sm:text-lg"
                >
                  {t('game.startDaily')}
                </Button>
                
                {/* Secondary buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={generateNewPuzzle}
                    className="btn-ghost h-10 sm:h-12 text-sm sm:text-base"
                  >
                    {t('game.practiceMode')}
                  </Button>
                  <Button
                    onClick={() => setShowTutorial(true)}
                    className="btn-ghost h-10 sm:h-12 text-sm sm:text-base"
                  >
                    {t('game.howToPlay')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
