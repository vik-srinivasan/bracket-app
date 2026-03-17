/**
 * Fetches team season stats (shooting, scoring, etc.) from the ESPN API
 * for all tournament teams. Outputs to src/data/team-stats.json.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const BRACKET_FILE = path.join(DATA_DIR, "bracket-2026.json");
const TEAMS_FILE = path.join(DATA_DIR, "teams.json");
const OUTPUT_FILE = path.join(DATA_DIR, "team-stats.json");

interface TeamSeasonStats {
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
}

function findStat(stats: { name: string; value: number }[], name: string): number {
  return stats.find((s) => s.name === name)?.value || 0;
}

async function fetchTeamStats(espnId: number): Promise<TeamSeasonStats | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${espnId}/statistics`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const categories = data?.results?.stats?.categories;
  if (!categories) return null;

  const allStats: { name: string; value: number }[] = [];
  for (const cat of categories) {
    for (const s of cat.stats) {
      allStats.push({ name: s.name, value: s.value });
    }
  }

  const fga = findStat(allStats, "fieldGoalsAttempted");
  const fg3a = findStat(allStats, "threePointFieldGoalsAttempted");
  const gp = findStat(allStats, "gamesPlayed") || 1;

  return {
    ppg: findStat(allStats, "avgPoints"),
    oppPpg: 0, // ESPN doesn't provide opponent stats in this endpoint
    fgPct: findStat(allStats, "fieldGoalPct"),
    threePtPct: findStat(allStats, "threePointFieldGoalPct"),
    threePtRate: fga > 0 ? Math.round((fg3a / fga) * 1000) / 10 : 0,
    twoPtPct: findStat(allStats, "twoPointFieldGoalPct"),
    ftPct: findStat(allStats, "freeThrowPct"),
    rpg: findStat(allStats, "avgRebounds"),
    apg: findStat(allStats, "avgAssists"),
    spg: findStat(allStats, "avgSteals"),
    bpg: findStat(allStats, "avgBlocks"),
    topg: findStat(allStats, "avgTurnovers"),
    astToRatio: findStat(allStats, "assistTurnoverRatio"),
  };
}

async function main() {
  const bracket = JSON.parse(fs.readFileSync(BRACKET_FILE, "utf-8"));
  const teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));

  // Collect all tournament team slugs
  const teamSlugs = new Set<string>();
  for (const region of Object.values(bracket.regions) as { matchups: { topTeam?: { teamId: string }; bottomTeam?: { teamId: string } }[] }[]) {
    for (const matchup of region.matchups) {
      if (matchup.topTeam?.teamId) teamSlugs.add(matchup.topTeam.teamId);
      if (matchup.bottomTeam?.teamId) teamSlugs.add(matchup.bottomTeam.teamId);
    }
  }
  if (bracket.firstFour) {
    for (const matchup of bracket.firstFour) {
      if (matchup.topTeam?.teamId) teamSlugs.add(matchup.topTeam.teamId);
      if (matchup.bottomTeam?.teamId) teamSlugs.add(matchup.bottomTeam.teamId);
    }
  }

  console.log(`Fetching team stats for ${teamSlugs.size} teams from ESPN...`);

  const results: Record<string, TeamSeasonStats> = {};
  let i = 0;

  for (const slug of teamSlugs) {
    i++;
    const team = teams[slug];
    if (!team?.espnId) {
      console.log(`  [${i}/${teamSlugs.size}] ${slug} - no ESPN ID, skipping`);
      continue;
    }

    const stats = await fetchTeamStats(team.espnId);
    if (stats) {
      results[slug] = stats;
      console.log(`  [${i}/${teamSlugs.size}] ${slug}: ${stats.ppg} PPG, ${stats.threePtPct}% 3P, ${stats.threePtRate}% 3PAr`);
    } else {
      console.log(`  [${i}/${teamSlugs.size}] ${slug}: no stats`);
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nWrote stats for ${Object.keys(results).length} teams to ${OUTPUT_FILE}`);
}

main().catch(console.error);
