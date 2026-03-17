import { BracketData, BracketMatchup, ROUND_NAMES } from "./types";

export function findMatchup(
  id: string,
  bracket: BracketData
): BracketMatchup | undefined {
  for (const region of Object.values(bracket.regions)) {
    const found = region.matchups.find((m) => m.id === id);
    if (found) return found;
  }
  const ff = bracket.finalFour.find((m) => m.id === id);
  if (ff) return ff;
  return bracket.firstFour?.find((m) => m.id === id);
}

export function getFeederMatchups(
  matchupId: string,
  bracket: BracketData
): BracketMatchup[] {
  const feeders: BracketMatchup[] = [];
  for (const region of Object.values(bracket.regions)) {
    for (const m of region.matchups) {
      if (m.winnerSlotId === matchupId) feeders.push(m);
    }
  }
  for (const m of bracket.finalFour) {
    if (m.winnerSlotId === matchupId) feeders.push(m);
  }
  return feeders;
}

export function getPathToChampionship(
  matchupId: string,
  bracket: BracketData
): BracketMatchup[] {
  const path: BracketMatchup[] = [];
  let current = findMatchup(matchupId, bracket);
  while (current && current.winnerSlotId) {
    const next = findMatchup(current.winnerSlotId, bracket);
    if (next) path.push(next);
    current = next;
  }
  return path;
}

export function getRoundName(round: number): string {
  return ROUND_NAMES[round] || `Round ${round}`;
}

export function getMatchupsByRound(
  matchups: BracketMatchup[],
  round: number
): BracketMatchup[] {
  return matchups.filter((m) => m.round === round);
}

export function getSeedColor(seed: number): string {
  if (seed <= 4) return "text-amber-400";
  if (seed <= 8) return "text-slate-300";
  if (seed <= 12) return "text-orange-300";
  return "text-slate-400";
}

export function getSeedBgColor(seed: number): string {
  if (seed <= 4) return "bg-amber-400/20 border-amber-400/40";
  if (seed <= 8) return "bg-slate-300/15 border-slate-400/30";
  if (seed <= 12) return "bg-orange-300/15 border-orange-400/30";
  return "bg-slate-500/15 border-slate-500/30";
}
