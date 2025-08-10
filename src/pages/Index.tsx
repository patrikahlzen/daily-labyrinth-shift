import React from 'react';
import { GameBoard } from '../components/GameBoard';
import { GameHUD } from '../components/GameHUD';
import { HeldTile } from '../components/HeldTile';
import { useGameLogic } from '../hooks/useGameLogic';

const Index = () => {
  const { gameState, startGame, pushTile, undoMove, confirmMove, rewindStep, chooseDirection, onTileTap } = useGameLogic();

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      />
      </div>

      {/* Bottom Area */}
      <div className="flex justify-center">
        <HeldTile tile={gameState.heldTile} />
      </div>

      {/* Welcome overlay for new players */}
      {!gameState.gameStarted && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 bg-card rounded-2xl shadow-game max-w-sm mx-4">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Daily Labyrinth</h1>
            <p className="text-muted-foreground mb-6">
              Tap two tiles to swap and create a path. Everyone gets the same puzzle today!
            </p>
            <button
              onClick={startGame}
              className="w-full bg-gradient-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg shadow-glow hover:opacity-90 transition-opacity"
            >
              Start Today's Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
