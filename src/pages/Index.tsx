import React, { useEffect, useState } from 'react';
import { GameBoard } from '../components/GameBoard';
import { GameHUD } from '../components/GameHUD';
import { EndScreen } from '../components/EndScreen';

import { useGameLogic } from '../hooks/useGameLogic';
import { useDailyInfo } from '../hooks/useDaily';

const Index = () => {
  const { gameState, startGame, pushTile, undoMove, rewindStep, chooseDirection, onTileTap, onSwapTiles } = useGameLogic();
  const { puzzleNumber, countdown } = useDailyInfo();
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    if (gameState.gameCompleted) setShowEnd(true);
  }, [gameState.gameCompleted]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with daily info */}
      <header className="w-full py-6">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Pussel #{String(puzzleNumber).padStart(2,'0')}</h1>
          <div className="text-sm text-muted-foreground" aria-live="polite" title="Tid kvar till nytt pussel">
            Byts om {countdown}
          </div>
        </div>
      </header>

      {/* Top HUD */}
      <GameHUD
        timer={gameState.timer}
        moves={gameState.moves}
        canUndo={gameState.canUndo}
        canRewind={gameState.canRewind}
        onUndo={undoMove}
        onRewind={rewindStep}
      />

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
      <GameBoard
        board={gameState.board}
        playerPosition={gameState.playerPosition}
        goalPosition={gameState.goalPosition}
        startPosition={gameState.startPosition}
        onTilePush={pushTile}
        previewMove={gameState.previewMove}
        previewPath={gameState.previewPath}
        branchChoice={gameState.branchChoice}
        onChooseDirection={chooseDirection}
        onTileTap={onTileTap}
        selectedTile={gameState.selectedTile}
        onSwapTiles={onSwapTiles}
      />
      </div>
      {/* End screen overlay */}
      {showEnd && (
        <EndScreen timer={gameState.timer} moves={gameState.moves} puzzleNumber={puzzleNumber} onClose={() => setShowEnd(false)} />
      )}

      {/* Welcome overlay for new players */}
      {!gameState.gameStarted && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 bg-card rounded-2xl shadow-game max-w-sm mx-4">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Daily Labyrinth</h2>
            <p className="text-muted-foreground mb-2">
              Skapa en obruten väg från Start till Mål genom att byta plats på brickor. Dra & släpp eller tryck två rutor. Alla får samma dagliga pussel.
            </p>
            <p className="text-sm text-muted-foreground mb-6">Nollställs vid midnatt (svensk tid). Tid och drag räknas. Pussel #{String(puzzleNumber).padStart(2,'0')} · nytt om {countdown}</p>
            <button
              onClick={startGame}
              className="w-full bg-gradient-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg shadow-glow hover:opacity-90 transition-opacity"
            >
              Starta dagens pussel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
