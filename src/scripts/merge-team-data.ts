/**
 * Merges data from all sources into a single teams.json file.
 * Combines: Barttorvik metrics + ESPN metadata + bracket data.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");

// Manual name mapping for teams that don't match between sources
const NAME_OVERRIDES: Record<string, string[]> = {
  uconn: ["connecticut"],
  "st-johns": ["st-johns-ny", "saint-johns"],
  "st-marys": ["saint-marys", "st-marys-ca"],
  "north-carolina": ["unc"],
  "nc-state": ["north-carolina-state"],
  "miami": ["miami-fl"],
  liu: ["long-island", "long-island-university"],
  "cal-baptist": ["california-baptist"],
  "texas-am": ["texas-am"],
  "north-dakota-state": ["n-dakota-st", "north-dakota-st"],
  "northern-iowa": ["n-iowa"],
  "michigan-state": ["michigan-st"],
  "tennessee-state": ["tennessee-st"],
  "ohio-state": ["ohio-st"],
  "st-louis": ["saint-louis"],
  "iowa-state": ["iowa-st"],
  "utah-state": ["utah-st"],
  "texas-tech": ["texas-tech"],
  "kennesaw-state": ["kennesaw-st"],
  "jackson-state": ["jackson-st"],
  "high-point": ["high-point"],
  "south-florida": ["usf", "s-florida"],
  "santa-clara": ["santa-clara"],
  "penn": ["pennsylvania"],
  queens: ["queens-nc"],
  mcneese: ["mcneese-state", "mcneese-st"],
  "prairie-view": ["prairie-view-am", "prairie-view-a-m"],
  "miami-oh": ["miami-ohio"],
  "wright-state": ["wright-st"],
};

interface Team {
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
  barttorvik: {
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
  };
  kenpom: {
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
  };
  evanmiya: {
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
  };
  seasonStats: {
    ppg: number;
    oppPpg: number;
    fgPct: number;
    threePtPct: number;
    threePtRate: number;
    twoPtPct: number;
    ftPct: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    topg: number;
    astToRatio: number;
  };
  rankings: {
    net: number | null;
    kpiRank: number | null;
    sorRank: number | null;
    kenpomRank: number | null;
    rpiRank: number | null;
    barttovikRank: number | null;
    evanmiyaRank: number | null;
    quadRecord: { q1: string; q2: string; q3: string; q4: string } | null;
  };
}

function loadJSON(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function findBarttovikMatch(
  teamSlug: string,
  barttovikData: Record<string, { team: string; rank: number; conference: string; record: string; adjOE: number; adjOERank: number; adjDE: number; adjDERank: number; barthag: number; sos: number; ncsos: number; adjTempo: number; adjTempoRank: number; effMargin: number }>
): (typeof barttovikData)[string] | null {
  // Direct match
  if (barttovikData[teamSlug]) return barttovikData[teamSlug];

  // Try overrides
  const alternatives = NAME_OVERRIDES[teamSlug] || [];
  for (const alt of alternatives) {
    if (barttovikData[alt]) return barttovikData[alt];
  }

  // Fuzzy: check if any barttorvik key contains our slug or vice versa
  for (const [key, value] of Object.entries(barttovikData)) {
    if (key.includes(teamSlug) || teamSlug.includes(key)) {
      return value;
    }
  }

  return null;
}

function findESPNMatch(
  teamSlug: string,
  espnData: Record<string, { espnId: number; name: string; shortName: string; abbreviation: string; logoUrl: string; primaryColor: string; alternateColor: string; conference: string }>
): (typeof espnData)[string] | null {
  if (espnData[teamSlug]) return espnData[teamSlug];

  const alternatives = NAME_OVERRIDES[teamSlug] || [];
  for (const alt of alternatives) {
    if (espnData[alt]) return espnData[alt];
  }

  for (const [key, value] of Object.entries(espnData)) {
    if (key.includes(teamSlug) || teamSlug.includes(key)) {
      return value;
    }
  }

  return null;
}

function main() {
  console.log("Merging team data...");

  const bracket = loadJSON(path.join(DATA_DIR, "bracket-2026.json"));
  const barttovikData = loadJSON(path.join(DATA_DIR, "barttorvik-raw.json"));
  const espnTeams = loadJSON(path.join(DATA_DIR, "espn-teams.json"));
  const rankingsData = loadJSON(path.join(DATA_DIR, "rankings.json"));
  const kenpomData = loadJSON(path.join(DATA_DIR, "kenpom.json"));
  const evanmiyaData = loadJSON(path.join(DATA_DIR, "evanmiya.json"));
  const teamStatsData = loadJSON(path.join(DATA_DIR, "team-stats.json"));

  if (!bracket) {
    console.error("bracket-2026.json not found!");
    return;
  }

  const emptyKenpom = { rank: 0, netRtg: 0, oRtg: 0, oRtgRank: 0, dRtg: 0, dRtgRank: 0, adjTempo: 0, adjTempoRank: 0, luck: 0, sosNetRtg: 0, sosORtg: 0, sosDRtg: 0, ncsosNetRtg: 0 };
  const emptyEvanmiya = { rank: 0, oRate: 0, dRate: 0, relativeRating: 0, offRank: 0, defRank: 0, trueTempo: 0, tempoRank: 0, killShotsPerGame: 0, killShotsConceded: 0, killShotsMargin: 0 };
  const emptyBarttorvik = { rank: 0, adjOE: 0, adjOERank: 0, adjDE: 0, adjDERank: 0, barthag: 0, tempo: 0, tempoRank: 0, sos: 0, ncsos: 0, effMargin: 0 };

  function buildTeam(slot: { teamId: string; teamName: string; seed: number }, regionKey: string): Team {
    const bart = barttovikData ? findBarttovikMatch(slot.teamId, barttovikData) : null;
    const espn = espnTeams ? findESPNMatch(slot.teamId, espnTeams) : null;
    const kp = kenpomData?.[slot.teamId] || null;
    const em = evanmiyaData?.[slot.teamId] || null;
    const ts = teamStatsData?.[slot.teamId] || null;

    if (!bart && !espn) unmatched.push(slot.teamId);

    return {
      id: slot.teamId,
      espnId: espn?.espnId,
      name: espn?.name || slot.teamName,
      shortName: espn?.shortName || slot.teamName,
      abbreviation: espn?.abbreviation || slot.teamName.substring(0, 4).toUpperCase(),
      conference: bart?.conference || espn?.conference || "",
      logoUrl: espn?.logoUrl || "",
      primaryColor: espn?.primaryColor || "#6366f1",
      alternateColor: espn?.alternateColor || "#818cf8",
      record: bart?.record || "",
      conferenceRecord: "",
      seed: slot.seed,
      region: regionKey,
      kenpom: kp
        ? {
            rank: kp.kenpomRank,
            netRtg: kp.netRtg,
            oRtg: kp.oRtg,
            oRtgRank: kp.oRtgRank,
            dRtg: kp.dRtg,
            dRtgRank: kp.dRtgRank,
            adjTempo: kp.adjTempo,
            adjTempoRank: kp.adjTempoRank,
            luck: kp.luck,
            sosNetRtg: kp.sosNetRtg,
            sosORtg: kp.sosORtg,
            sosDRtg: kp.sosDRtg,
            ncsosNetRtg: kp.ncsosNetRtg,
          }
        : emptyKenpom,
      barttorvik: bart
        ? {
            rank: bart.rank,
            adjOE: bart.adjOE,
            adjOERank: bart.adjOERank,
            adjDE: bart.adjDE,
            adjDERank: bart.adjDERank,
            barthag: bart.barthag,
            tempo: bart.adjTempo || 0,
            tempoRank: bart.adjTempoRank || 0,
            sos: bart.sos,
            ncsos: bart.ncsos,
            effMargin: bart.effMargin,
          }
        : emptyBarttorvik,
      evanmiya: em
        ? {
            rank: em.rank,
            oRate: em.oRate,
            dRate: em.dRate,
            relativeRating: em.relativeRating,
            offRank: em.offRank,
            defRank: em.defRank,
            trueTempo: em.trueTempo,
            tempoRank: em.tempoRank,
            killShotsPerGame: em.killShotsPerGame,
            killShotsConceded: em.killShotsConceded,
            killShotsMargin: em.killShotsMargin,
          }
        : emptyEvanmiya,
      seasonStats: ts
        ? {
            ppg: ts.ppg, oppPpg: ts.oppPpg, fgPct: ts.fgPct,
            threePtPct: ts.threePtPct, threePtRate: ts.threePtRate,
            twoPtPct: ts.twoPtPct, ftPct: ts.ftPct,
            rpg: ts.rpg, apg: ts.apg, spg: ts.spg, bpg: ts.bpg,
            topg: ts.topg, astToRatio: ts.astToRatio,
          }
        : {
            ppg: 0, oppPpg: 0, fgPct: 0, threePtPct: 0, threePtRate: 0,
            twoPtPct: 0, ftPct: 0, rpg: 0, apg: 0, spg: 0, bpg: 0,
            topg: 0, astToRatio: 0,
          },
      rankings: {
        net: rankingsData?.[slot.teamId]?.netRank || null,
        kpiRank: rankingsData?.[slot.teamId]?.kpiRank || null,
        sorRank: rankingsData?.[slot.teamId]?.sorRank || null,
        kenpomRank: kp?.kenpomRank || null,
        rpiRank: rankingsData?.[slot.teamId]?.rpiRank || null,
        barttovikRank: bart?.rank || null,
        evanmiyaRank: em?.rank || null,
        quadRecord: rankingsData?.[slot.teamId]?.quadRecord || null,
      },
    };
  }

  const teams: Record<string, Team> = {};
  const unmatched: string[] = [];

  // Iterate all teams in the bracket
  for (const [regionKey, region] of Object.entries(bracket.regions) as [string, { name: string; matchups: { topTeam?: { teamId: string; teamName: string; seed: number }; bottomTeam?: { teamId: string; teamName: string; seed: number } }[] }][]) {
    for (const matchup of region.matchups) {
      for (const slot of [matchup.topTeam, matchup.bottomTeam]) {
        if (!slot || !slot.teamId || teams[slot.teamId]) continue;
        teams[slot.teamId] = buildTeam(slot, regionKey);
      }
    }
  }

  // Also process First Four teams
  if (bracket.firstFour) {
    for (const matchup of bracket.firstFour) {
      for (const slot of [matchup.topTeam, matchup.bottomTeam]) {
        if (!slot || !slot.teamId || teams[slot.teamId]) continue;
        teams[slot.teamId] = buildTeam(slot, "firstfour");
      }
    }
  }

  if (unmatched.length > 0) {
    console.log(`\nUnmatched teams (no Barttorvik or ESPN data):`);
    console.log(`  ${unmatched.join(", ")}`);
  }

  const outputFile = path.join(DATA_DIR, "teams.json");
  fs.writeFileSync(outputFile, JSON.stringify(teams, null, 2));
  console.log(`\nWrote ${Object.keys(teams).length} teams to ${outputFile}`);

  // Write metadata
  const metadataFile = path.join(DATA_DIR, "metadata.json");
  fs.writeFileSync(
    metadataFile,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString(),
        teamCount: Object.keys(teams).length,
        hasBarttorvik: !!barttovikData,
        hasESPN: !!espnTeams,
      },
      null,
      2
    )
  );
}

main();
