import React from 'react';
import type { BotInfo, PlayerInfo } from '../lib/types';
import { HUMAN_PLAYER } from '../lib/types';

interface BotSelectorProps {
  bots: BotInfo[];
  whitePlayer: PlayerInfo | null;
  blackPlayer: PlayerInfo | null;
  onWhiteChange: (player: PlayerInfo | null) => void;
  onBlackChange: (player: PlayerInfo | null) => void;
  onStart: () => void;
  disabled: boolean;
  loading: boolean;
  timeLimitMs: number;
  onTimeLimitChange: (ms: number) => void;
}

const TIME_PRESETS = [
  { label: '1s', value: 1000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
];

export const BotSelector: React.FC<BotSelectorProps> = ({
  bots,
  whitePlayer,
  blackPlayer,
  onWhiteChange,
  onBlackChange,
  onStart,
  disabled,
  loading,
  timeLimitMs,
  onTimeLimitChange,
}) => {
  const resolvePlayer = (value: string): PlayerInfo | null => {
    if (value === '') return null;
    if (value === '__human__') return HUMAN_PLAYER;
    const bot = bots.find((b) => b.username === value) ?? null;
    return bot ? { type: 'bot', bot } : null;
  };

  const playerValue = (p: PlayerInfo | null): string => {
    if (!p) return '';
    if (p.type === 'human') return '__human__';
    return p.bot?.username ?? '';
  };

  const canStart =
    whitePlayer !== null &&
    blackPlayer !== null &&
    !(whitePlayer.type === 'human' && blackPlayer.type === 'human');

  return (
    <div className="bot-selector">
      <h2>Select Players</h2>
      <div className="bot-selector-row">
        <PlayerPick
          label="White"
          bots={bots}
          value={playerValue(whitePlayer)}
          onChange={(v) => onWhiteChange(resolvePlayer(v))}
          player={whitePlayer}
          disabled={disabled}
        />

        <span className="vs-label">VS</span>

        <PlayerPick
          label="Black"
          bots={bots}
          value={playerValue(blackPlayer)}
          onChange={(v) => onBlackChange(resolvePlayer(v))}
          player={blackPlayer}
          disabled={disabled}
        />
      </div>

      <div className="time-limit-row">
        <label className="time-limit-label">Bot time limit:</label>
        <div className="time-preset-buttons">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.value}
              className={`time-preset-btn ${timeLimitMs === p.value ? 'active' : ''}`}
              onClick={() => onTimeLimitChange(p.value)}
              disabled={disabled}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="time-custom">
          <input
            type="number"
            min={100}
            max={120000}
            step={100}
            value={timeLimitMs}
            onChange={(e) => onTimeLimitChange(Number(e.target.value))}
            disabled={disabled}
            className="time-input"
          />
          <span className="time-unit">ms</span>
        </div>
      </div>

      <button
        className="btn-start"
        onClick={onStart}
        disabled={disabled || !canStart || loading}
      >
        {loading ? 'Loading...' : 'Start Game'}
      </button>
    </div>
  );
};

interface PlayerPickProps {
  label: string;
  bots: BotInfo[];
  value: string;
  onChange: (value: string) => void;
  player: PlayerInfo | null;
  disabled: boolean;
}

const PlayerPick: React.FC<PlayerPickProps> = ({
  label,
  bots,
  value,
  onChange,
  player,
  disabled,
}) => {
  return (
    <div className="bot-pick">
      <label>{label}</label>
      <div className="bot-pick-inner">
        {player?.type === 'bot' && player.bot && (
          <img
            className="bot-avatar"
            src={player.bot.avatar}
            alt={player.bot.username}
          />
        )}
        {player?.type === 'human' && (
          <span className="human-icon">&#129489;</span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">-- Select --</option>
          <option value="__human__">Human</option>
          <optgroup label="Bots">
            {bots.map((b) => (
              <option key={b.username} value={b.username}>
                {b.username}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
};
