import React, { useEffect, useState } from 'react';
import { GameBoard } from '../components/GameBoard';
import { GameHUD } from '../components/GameHUD';
import { EndScreen } from '../components/EndScreen';
import { Tutorial } from '../components/Tutorial';
import { Button } from '../components/ui/button';
import { useGameLogic } from '../hooks/useGameLogic';
import { useDailyInfo } from '../hooks/useDaily';

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
      <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-4xl mx-auto w-full">
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

      {/* Compact welcome overlay */}
      {!gameState.gameStarted && !showTutorial && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="text-center p-6 sm:p-8 bg-card rounded-2xl shadow-game max-w-xs sm:max-w-sm mx-auto w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">Daily Labyrinth</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-2">
              Bygg en kontinuerlig väg från Start till Mål genom att byta platser på brickorna.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              Puzzle #{String(puzzleNumber).padStart(2,'0')} • Nytt om {countdown}
            </p>
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={startGame}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-sm sm:text-base py-2 sm:py-3"
              >
                Starta spel
              </Button>
              <Button
                variant="outline"
                onClick={generateNewPuzzle}
                className="w-full text-sm sm:text-base py-2 sm:py-3"
              >
                Generera testpussel
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowTutorial(true)}
                className="w-full text-muted-foreground hover:text-foreground text-xs sm:text-sm py-1 sm:py-2"
              >
                Visa tutorial
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
