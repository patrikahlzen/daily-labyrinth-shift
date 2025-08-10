import React from 'react';
import { GameBoard } from '../components/GameBoard';
import { GameHUD } from '../components/GameHUD';
import { HeldTile } from '../components/HeldTile';
import { useGameLogic } from '../hooks/useGameLogic';

const Index = () => {
  const { gameState, startGame, pushTile, undoMove, confirmMove } = useGameLogic();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top HUD */}
      <GameHUD
        timer={gameState.timer}
        moves={gameState.moves}
        canUndo={gameState.canUndo}
        onUndo={undoMove}
        onConfirmMove={confirmMove}
        hasUnconfirmedMove={gameState.previewMove !== null}
      />

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <GameBoard
          board={gameState.board}
          playerPosition={gameState.playerPosition}
          goalPosition={gameState.goalPosition}
          onTilePush={pushTile}
          previewMove={gameState.previewMove}
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
              Drag tiles to create a path from start to goal. Everyone gets the same puzzle today!
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
