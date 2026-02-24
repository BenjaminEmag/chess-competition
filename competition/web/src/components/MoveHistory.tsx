import React from 'react';
import type { MoveRecord } from '../lib/types';

interface MoveHistoryProps {
  moves: MoveRecord[];
  currentFen: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, currentFen }) => {
  const totalTimes = moves.reduce(
    (acc, move) => {
      if (move.color === 'w') {
        acc.white += move.timeMs;
      } else {
        acc.black += move.timeMs;
      }
      return acc;
    },
    { white: 0, black: 0 },
  );

  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    return seconds.toFixed(3) + 's';
  };

  const getHalfmoveClock = (fen: string): number => {
    const parts = fen.split(' ');
    const halfmove = parts[4];
    const parsed = halfmove ? parseInt(halfmove, 10) : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const latestFen = currentFen || (moves.length > 0 ? moves[moves.length - 1].fen : '');
  const halfmoveClock = latestFen ? getHalfmoveClock(latestFen) : 0;

  // Group moves into pairs (white + black)
  const pairs: { num: number; white?: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    if (move.color === 'w') {
      pairs.push({ num: move.moveNumber, white: move });
    } else {
      if (pairs.length > 0 && !pairs[pairs.length - 1].black) {
        pairs[pairs.length - 1].black = move;
      } else {
        pairs.push({ num: move.moveNumber, black: move });
      }
    }
  }

  const orderedPairs = [...pairs].reverse();

  return (
    <div className="move-history">
      <div className="move-history-header">
        <h3>Move History</h3>
        <div className="move-history-summary">
          <span>White: {formatTime(totalTimes.white)} </span>
          <span>Black: {formatTime(totalTimes.black)} </span>
          <span>50-move: {halfmoveClock}</span>
        </div>
      </div>
      <table className="move-history-table">
        <thead>
          <tr>
            <th>Move</th>
            <th>White (UCI)</th>
            <th>Time</th>
            <th>Black (UCI)</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {orderedPairs.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-moves">
                No moves yet
              </td>
            </tr>
          ) : (
            orderedPairs.map((pair, i) => (
              <tr key={`${pair.num}-${i}`}>
                <td>{pair.num}</td>
                <td>{pair.white ? pair.white.uci : '—'}</td>
                <td>{pair.white ? formatTime(pair.white.timeMs) : '—'}</td>
                <td>{pair.black ? pair.black.uci : '—'}</td>
                <td>{pair.black ? formatTime(pair.black.timeMs) : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
