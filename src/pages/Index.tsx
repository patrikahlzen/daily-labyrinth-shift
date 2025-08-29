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
    <div className="min-h-screen bg-background flex flex-col">
      <script dangerouslySetInnerHTML={{__html: `document.body.classList.add('theme-prism')`}} />
      {/* Header with daily info */}
      <header className="w-full py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Puzzle #{String(puzzleNumber).padStart(2,'0')}</h1>
          <div className="text-sm md:text-base text-muted-foreground" aria-live="polite" title="Time until new puzzle">
            New puzzle in {countdown}
          </div>
        </div>
      </header>

      {/* Top HUD */}
        <GameHUD 
          timer={gameState.timer} 
          moves={gameState.moves} 
          canUndo={gameState.canUndo} 
          onUndo={undoMove}
          undoUsage={undoUsage}
        />

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
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

      {/* Welcome overlay for new players */}
      {!gameState.gameStarted && !showTutorial && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 bg-card rounded-2xl shadow-game max-w-sm mx-4">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Daily Labyrinth</h2>
            <p className="text-muted-foreground mb-2">
              Build a continuous path from Start to Goal by swapping tiles. Everyone plays the same daily puzzle.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Puzzle #{String(puzzleNumber).padStart(2,'0')} · New in {countdown}
            </p>
            <div className="space-y-3">
              <Button
                onClick={startGame}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                Start Playing
              </Button>
              <Button
                variant="outline"
                onClick={generateNewPuzzle}
                className="w-full"
              >
                Generate Test Puzzle
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowTutorial(true)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Show Tutorial
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
