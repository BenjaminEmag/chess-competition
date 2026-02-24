import React, { useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { GameState } from '../lib/types';
import type { Square } from 'chess.js';

interface GameBoardProps {
  gameState: GameState;
  onHumanMove?: (from: string, to: string, promotion?: string) => boolean;
  boardOrientation?: 'white' | 'black';
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onHumanMove,
  boardOrientation = 'white',
}) => {
  // Highlight the last move
  const lastMove = gameState.moves.length > 0
    ? gameState.moves[gameState.moves.length - 1]
    : null;

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    const from = lastMove.uci.substring(0, 2);
    const to = lastMove.uci.substring(2, 4);
    customSquareStyles[from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    customSquareStyles[to] = { backgroundColor: 'rgba(255, 255, 0, 0.5)' };
  }

  // Determine if pieces should be draggable (human side and it's their turn)
  const currentPlayer = gameState.currentTurn === 'w'
    ? gameState.whitePlayer
    : gameState.blackPlayer;
  const isHumanTurn = currentPlayer?.type === 'human'
    && gameState.status !== 'finished';
  const humanColor = isHumanTurn ? gameState.currentTurn : null;

  const isDraggablePiece = useCallback(
    (pieceOrArgs: string | { piece: string; sourceSquare: Square }, maybeSquare?: Square) => {
      if (!isHumanTurn || !humanColor) return false;
      const piece = typeof pieceOrArgs === 'string'
        ? pieceOrArgs
        : pieceOrArgs.piece;
      // piece format: "wP", "bK", etc.
      const pieceColor = piece[0];
      return pieceColor === humanColor;
    },
    [isHumanTurn, humanColor],
  );

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
      if (!onHumanMove) return false;
      // Auto-promote to queen
      const isPromotion =
        piece[1] === 'P' &&
        ((piece[0] === 'w' && targetSquare[1] === '8') ||
          (piece[0] === 'b' && targetSquare[1] === '1'));
      const promotion = isPromotion ? 'q' : undefined;
      return onHumanMove(sourceSquare, targetSquare, promotion);
    },
    [onHumanMove],
  );

  const whitePlayer = gameState.whitePlayer;
  const blackPlayer = gameState.blackPlayer;

  return (
    <div className="game-board">
      <div className="board-header">
        <PlayerLabel
          player={boardOrientation === 'white' ? blackPlayer : whitePlayer}
          color={boardOrientation === 'white' ? 'black' : 'white'}
          isActive={
            gameState.currentTurn === (boardOrientation === 'white' ? 'b' : 'w') &&
            (gameState.status === 'running' || gameState.status === 'waiting-human')
          }
          isHuman={
            (boardOrientation === 'white' ? blackPlayer : whitePlayer)?.type === 'human'
          }
        />
      </div>
      <Chessboard
        id="competition-board"
        position={gameState.fen}
        boardWidth={480}
        arePiecesDraggable={isHumanTurn}
        isDraggablePiece={isDraggablePiece}
        onPieceDrop={onPieceDrop}
        boardOrientation={boardOrientation}
        customSquareStyles={customSquareStyles}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
      />
      <div className="board-footer">
        <PlayerLabel
          player={boardOrientation === 'white' ? whitePlayer : blackPlayer}
          color={boardOrientation === 'white' ? 'white' : 'black'}
          isActive={
            gameState.currentTurn === (boardOrientation === 'white' ? 'w' : 'b') &&
            (gameState.status === 'running' || gameState.status === 'waiting-human')
          }
          isHuman={
            (boardOrientation === 'white' ? whitePlayer : blackPlayer)?.type === 'human'
          }
        />
      </div>
    </div>
  );
};

interface PlayerLabelProps {
  player: { type: string; bot: { username: string; avatar: string } | null } | null;
  color: string;
  isActive: boolean;
  isHuman?: boolean;
}

const PlayerLabel: React.FC<PlayerLabelProps> = ({ player, color, isActive, isHuman }) => {
  if (!player) return null;
  const name = isHuman ? 'You' : player.bot?.username ?? 'Unknown';
  return (
    <div className={`bot-label ${isActive ? 'active' : ''}`}>
      {player.bot && (
        <img className="bot-avatar-sm" src={player.bot.avatar} alt={name} />
      )}
      {isHuman && <span className="human-icon-sm">&#129489;</span>}
      <span className="bot-name">{name}</span>
      <span className="bot-color">({color})</span>
      {isActive && !isHuman && <span className="thinking-indicator">thinking...</span>}
      {isActive && isHuman && <span className="your-turn-indicator">your turn</span>}
    </div>
  );
};
