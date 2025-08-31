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

      {/* BOLD START MENU */}
      {!gameState.gameStarted && !showTutorial && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-black flex items-center justify-center p-4">
          <div className="gamebar text-center max-w-md mx-auto w-full space-y-6">
            <div>
              <h1 className="display-xl mb-3">Daily Labyrinth</h1>
              <div className="header-text text-white">
                Puzzle #{String(puzzleNumber).padStart(2,'0')} • Today
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="body-text text-gray-300 text-base sm:text-lg font-semibold">
                Build a continuous path from Start to Goal by swapping tiles.
              </p>
              <div className="pill">
                <span className="text-lg">⏰</span>
                <span className="body-text">New puzzle in {countdown}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={startGame}
                className="w-full pill pill--hot text-lg font-bold py-4"
              >
                Start Game
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={generateNewPuzzle}
                  className="pill font-semibold py-3"
                >
                  Practice
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowTutorial(true)}
                  className="pill font-semibold py-3"
                >
                  Tutorial
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
