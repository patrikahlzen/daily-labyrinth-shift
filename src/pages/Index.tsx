import React from 'react';
import { GameBoard } from '../components/GameBoard';
import { GameHUD } from '../components/GameHUD';

import { useGameLogic } from '../hooks/useGameLogic';
import { useDailyInfo } from '../hooks/useDaily';

const Index = () => {
  const { gameState, startGame, pushTile, undoMove, confirmMove, rewindStep, chooseDirection, onTileTap, onSwapTiles } = useGameLogic();
  const { puzzleNumber, countdown } = useDailyInfo();

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
        onConfirmMove={confirmMove}
        hasUnconfirmedMove={Boolean(gameState.pendingSwap)}
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


      {/* Welcome overlay for new players */}
      {!gameState.gameStarted && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 bg-card rounded-2xl shadow-game max-w-sm mx-4">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Daily Labyrinth</h1>
            <p className="text-muted-foreground mb-2">
              Dra & släpp eller tryck två tiles för att byta platser och skapa flödet. Alla får dagens samma pussel!
            </p>
            <p className="text-sm text-muted-foreground mb-6">Pussel #{String(puzzleNumber).padStart(2,'0')} · nytt om {countdown}</p>
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
