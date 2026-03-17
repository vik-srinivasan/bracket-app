/**
 * Fetches schedules, rosters, and stats for all 68 tournament teams from ESPN.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const SCHEDULES_DIR = path.join(DATA_DIR, "team-schedules");
const ROSTERS_DIR = path.join(DATA_DIR, "team-rosters");
const BRACKET_FILE = path.join(DATA_DIR, "bracket-2026.json");
const ESPN_TEAMS_FILE = path.join(DATA_DIR, "espn-teams.json");

const BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams";

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function getTeamIds(): Map<string, number> {
  // Read bracket to get team slugs
  const bracket = JSON.parse(fs.readFileSync(BRACKET_FILE, "utf-8"));
  const espnTeams = JSON.parse(fs.readFileSync(ESPN_TEAMS_FILE, "utf-8"));

  const teamMap = new Map<string, number>();

  // Collect all team slugs from bracket
  const allMatchups: { topTeam?: { teamId: string; teamName: string }; bottomTeam?: { teamId: string; teamName: string } }[] = [];
  for (const region of Object.values(bracket.regions) as { matchups: typeof allMatchups }[]) {
    allMatchups.push(...region.matchups);
  }
  if (bracket.firstFour) {
    allMatchups.push(...bracket.firstFour);
  }

  for (const matchup of allMatchups) {
    for (const slot of [matchup.topTeam, matchup.bottomTeam]) {
      if (slot && slot.teamId) {
        // Try to find ESPN ID
        const espnTeam = espnTeams[slot.teamId];
        if (espnTeam) {
          teamMap.set(slot.teamId, espnTeam.espnId);
        } else {
          // Try fuzzy match by name
          for (const [key, value] of Object.entries(espnTeams) as [string, { espnId: number; shortName: string }][]) {
            if (
              key.includes(slot.teamId) ||
              slot.teamId.includes(key) ||
              value.shortName?.toLowerCase() ===
                slot.teamName?.toLowerCase()
            ) {
              teamMap.set(slot.teamId, value.espnId);
              break;
            }
          }
        }
      }
    }
  }

  return teamMap;
}

async function fetchSchedule(espnId: number, teamSlug: string) {
  const outFile = path.join(SCHEDULES_DIR, `${teamSlug}.json`);
  if (fs.existsSync(outFile)) return;

  const data = await fetchJSON(`${BASE_URL}/${espnId}/schedule`);
  if (!data) {
    console.log(`  Schedule not found for ${teamSlug} (${espnId})`);
    return;
  }

  const games: {
    date: string;
    opponent: string;
    isHome: boolean;
    isNeutral: boolean;
    result: string | null;
    score: string | null;
    teamScore: number | null;
    opponentScore: number | null;
  }[] = [];

  for (const event of data.events || []) {
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitors = competition.competitors || [];
    const us = competitors.find(
      (c: { id: string }) => parseInt(c.id) === espnId
    );
    const them = competitors.find(
      (c: { id: string }) => parseInt(c.id) !== espnId
    );

    if (!us || !them) continue;

    games.push({
      date: event.date,
      opponent: them.team?.displayName || them.team?.shortDisplayName || "Unknown",
      isHome: us.homeAway === "home",
      isNeutral: competition.neutralSite || false,
      result: us.winner === true ? "W" : us.winner === false ? "L" : null,
      score:
        us.score && them.score
          ? `${us.score.displayValue}-${them.score.displayValue}`
          : null,
      teamScore: us.score ? parseInt(us.score.displayValue) : null,
      opponentScore: them.score ? parseInt(them.score.displayValue) : null,
    });
  }

  fs.writeFileSync(outFile, JSON.stringify(games, null, 2));
}

async function fetchRoster(espnId: number, teamSlug: string) {
  const outFile = path.join(ROSTERS_DIR, `${teamSlug}.json`);
  if (fs.existsSync(outFile)) return;

  const data = await fetchJSON(`${BASE_URL}/${espnId}/roster`);
  if (!data) {
    console.log(`  Roster not found for ${teamSlug} (${espnId})`);
    return;
  }

  const players: {
    id: number;
    name: string;
    position: string;
    number: string;
    year: string;
    height: string;
    weight: number;
    headshotUrl: string;
  }[] = [];

  for (const group of data.athletes || []) {
    for (const athlete of group.items || []) {
      players.push({
        id: parseInt(athlete.id) || 0,
        name: athlete.displayName || athlete.fullName || "",
        position: athlete.position?.abbreviation || "",
        number: athlete.jersey || "",
        year: athlete.experience?.displayValue || "",
        height: athlete.displayHeight || "",
        weight: athlete.displayWeight ? parseInt(athlete.displayWeight) : 0,
        headshotUrl: athlete.headshot?.href || "",
      });
    }
  }

  fs.writeFileSync(outFile, JSON.stringify(players, null, 2));
}

async function main() {
  fs.mkdirSync(SCHEDULES_DIR, { recursive: true });
  fs.mkdirSync(ROSTERS_DIR, { recursive: true });

  console.log("Loading team mappings...");
  const teamMap = getTeamIds();
  console.log(`Found ${teamMap.size} tournament teams with ESPN IDs`);

  const unmapped: string[] = [];

  // Read bracket for all team slugs
  const bracket = JSON.parse(fs.readFileSync(BRACKET_FILE, "utf-8"));
  const allSlugs = new Set<string>();

  for (const region of Object.values(bracket.regions) as { matchups: { topTeam?: { teamId: string }; bottomTeam?: { teamId: string } }[] }[]) {
    for (const matchup of region.matchups) {
      if (matchup.topTeam?.teamId) allSlugs.add(matchup.topTeam.teamId);
      if (matchup.bottomTeam?.teamId)
        allSlugs.add(matchup.bottomTeam.teamId);
    }
  }
  if (bracket.firstFour) {
    for (const matchup of bracket.firstFour) {
      if (matchup.topTeam?.teamId) allSlugs.add(matchup.topTeam.teamId);
      if (matchup.bottomTeam?.teamId) allSlugs.add(matchup.bottomTeam.teamId);
    }
  }

  for (const slug of allSlugs) {
    if (!teamMap.has(slug)) unmapped.push(slug);
  }

  if (unmapped.length > 0) {
    console.log(`\nUnmapped teams (no ESPN ID): ${unmapped.join(", ")}`);
  }

  console.log("\nFetching schedules and rosters...");
  let i = 0;
  for (const [slug, espnId] of teamMap) {
    i++;
    console.log(`  [${i}/${teamMap.size}] ${slug} (ESPN: ${espnId})`);

    await fetchSchedule(espnId, slug);
    await delay(150);

    await fetchRoster(espnId, slug);
    await delay(150);
  }

  console.log("\nDone fetching ESPN details.");
}

main().catch(console.error);
