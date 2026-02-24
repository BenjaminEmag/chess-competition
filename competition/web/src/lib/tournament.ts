import type { BotInfo, TournamentMatch, TournamentRound } from './types';

export function shuffleBots(bots: BotInfo[]): BotInfo[] {
  const array = [...bots];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function getRoundTitle(roundIndex: number, totalRounds: number, matchCount: number): string {
  if (matchCount === 1) {
    return 'Final';
  }
  if (totalRounds >= 3 && roundIndex === totalRounds - 2 && matchCount === 2) {
    return 'Semifinals';
  }
  return `Round ${roundIndex + 1}`;
}

export function buildRound(
  bots: BotInfo[],
  roundIndex: number,
  totalRounds: number,
): TournamentRound {
  const matches: TournamentMatch[] = [];
  for (let i = 0; i < bots.length; i += 2) {
    const whiteBot = bots[i] ?? null;
    const blackBot = bots[i + 1] ?? null;
    const hasBye = !!whiteBot && !blackBot;

    matches.push({
      id: `r${roundIndex}-m${i / 2}`,
      roundIndex,
      matchIndex: i / 2,
      whiteBot,
      blackBot,
      gameResults: [],
      status: hasBye ? 'bye' : 'pending',
      winner: hasBye ? whiteBot : null,
      loser: null,
    });
  }

  return {
    title: getRoundTitle(roundIndex, totalRounds, matches.length),
    matches,
  };
}
