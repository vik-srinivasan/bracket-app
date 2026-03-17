// === BRACKET STRUCTURE ===

export type RegionName = "south" | "east" | "west" | "midwest";

export interface BracketSlot {
  seed: number;
  teamId: string;
  teamName: string;
  espnId?: number;
}

export interface BracketMatchup {
  id: string;
  round: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  region: RegionName | "finalfour";
  topTeam: BracketSlot | null;
  bottomTeam: BracketSlot | null;
  winnerSlotId: string | null;
}

export interface BracketRegion {
  name: string;
  location: string;
  matchups: BracketMatchup[];
}

export interface BracketData {
  year: number;
  regions: Record<RegionName, BracketRegion>;
  finalFour: BracketMatchup[];
  firstFour?: BracketMatchup[];
}

// === USER PICKS ===

export interface UserPicks {
  // matchupId -> winning teamId
  [matchupId: string]: string;
}

// === TEAM DATA ===

export interface BarttovikMetrics {
  rank: number;
  adjOE: number;
  adjOERank: number;
  adjDE: number;
  adjDERank: number;
  barthag: number;
  tempo: number;
  tempoRank: number;
  sos: number;
  ncsos: number;
  effMargin: number;
}

export interface EvanMiyaMetrics {
  rank: number;
  oRate: number;
  dRate: number;
  relativeRating: number;
  offRank: number;
  defRank: number;
  trueTempo: number;
  tempoRank: number;
  killShotsPerGame: number;
  killShotsConceded: number;
  killShotsMargin: number;
}

export interface KenpomMetrics {
  rank: number;
  netRtg: number;
  oRtg: number;
  oRtgRank: number;
  dRtg: number;
  dRtgRank: number;
  adjTempo: number;
  adjTempoRank: number;
  luck: number;
  sosNetRtg: number;
  sosORtg: number;
  sosDRtg: number;
  ncsosNetRtg: number;
}

export type EfficiencySource = "kenpom" | "barttorvik" | "evanmiya";

export interface SeasonStats {
  ppg: number;
  oppPpg: number;
  fgPct: number;
  threePtPct: number;
  threePtRate: number; // 3PA/FGA — share of shots from 3
  twoPtPct: number;
  ftPct: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  topg: number;
  astToRatio: number;
}

export interface QuadRecord {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export interface Rankings {
  net: number | null;
  kpiRank: number | null;
  sorRank: number | null;
  kenpomRank: number | null;
  rpiRank: number | null;
  barttovikRank: number | null;
  evanmiyaRank: number | null;
  quadRecord: QuadRecord | null;
}

export interface Team {
  id: string;
  espnId?: number;
  name: string;
  shortName: string;
  abbreviation: string;
  conference: string;
  logoUrl: string;
  primaryColor: string;
  alternateColor: string;
  record: string;
  conferenceRecord: string;
  seed: number;
  region: string;
  kenpom: KenpomMetrics;
  barttorvik: BarttovikMetrics;
  evanmiya: EvanMiyaMetrics;
  seasonStats: SeasonStats;
  rankings: Rankings;
}

// === PLAYER DATA ===

export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  mpg: number;
  fgPct: number;
  threePtPct: number;
  threePtRate: number; // 3PA/FGA — share of shots from 3
  ftPct: number;
  spg: number;
  bpg: number;
  topg: number;
  gamesPlayed: number;
}

export interface Player {
  id: number;
  name: string;
  position: string;
  number: string;
  year: string;
  height: string;
  weight: number;
  headshotUrl?: string;
  stats?: PlayerStats | null;
}

// === SCHEDULE ===

export interface ScheduleGame {
  date: string;
  opponent: string;
  opponentId?: string;
  opponentRank?: number | null;
  isHome: boolean;
  isNeutral: boolean;
  result: "W" | "L" | null;
  score?: string;
  teamScore?: number;
  opponentScore?: number;
}

// === ODDS ===

export interface BookmakerOdds {
  name: string;
  spreads: { team: string; point: number; price: number }[];
  moneyline: { team: string; price: number }[];
  totals: { name: string; point: number; price: number }[];
}

export interface MatchupOdds {
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: BookmakerOdds[];
}

// === ROUND LABELS ===

export const ROUND_NAMES: Record<number, string> = {
  0: "First Four",
  1: "First Round",
  2: "Second Round",
  3: "Sweet 16",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship",
};
