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

      {/* PREMIUM GAME START MENU */}
      {!gameState.gameStarted && !showTutorial && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-black flex items-center justify-center p-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl text-center max-w-lg mx-auto w-full p-8 space-y-8">
            
            {/* HERO TITLE */}
            <div className="space-y-4">
              <h1 className="font-black text-5xl tracking-tighter text-white mb-4 leading-none">
                Daily Labyrinth
              </h1>
              <div className="font-bold text-2xl text-white">
                Puzzle #{String(puzzleNumber).padStart(2,'0')} • Today
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
            </div>
            
            {/* GAME DESCRIPTION */}
            <div className="space-y-6">
              <p className="font-semibold text-xl text-gray-300 leading-relaxed">
                Build a continuous path from Start to Goal by swapping tiles.
              </p>
              
              {/* COUNTDOWN PILL */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <span className="text-2xl">⏰</span>
                <span className="font-semibold text-lg text-white">New puzzle in {countdown}</span>
              </div>
            </div>
            
            {/* LARGE ACTION BUTTONS */}
            <div className="space-y-4">
              {/* PRIMARY START BUTTON */}
              <Button
                onClick={startGame}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 hover:from-cyan-300 hover:via-blue-400 hover:to-cyan-300 text-white border-0 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                🎮 Start Daily Challenge
              </Button>
              
              {/* SECONDARY BUTTONS */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={generateNewPuzzle}
                  className="h-14 text-lg font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  🏃 Practice Mode
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowTutorial(true)}
                  className="h-14 text-lg font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  📚 How to Play
                </Button>
              </div>
            </div>
            
            {/* SUBTLE DECORATION */}
            <div className="flex justify-center space-x-2 opacity-50">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
