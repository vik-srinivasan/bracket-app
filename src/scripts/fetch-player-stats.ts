/**
 * Fetches per-player season stats from Sports Reference for all tournament teams.
 * Outputs to src/data/team-rosters/{teamSlug}.json with full stats.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const ROSTERS_DIR = path.join(DATA_DIR, "team-rosters");
const BRACKET_FILE = path.join(DATA_DIR, "bracket-2026.json");

// Sports-reference uses different team slugs
const SR_SLUG_MAP: Record<string, string> = {
  duke: "duke",
  siena: "siena",
  villanova: "villanova",
  georgia: "georgia",
  kansas: "kansas",
  "northern-iowa": "northern-iowa",
  alabama: "alabama",
  "north-dakota-state": "north-dakota-state",
  louisville: "louisville",
  "south-florida": "south-florida",
  "michigan-state": "michigan-state",
  "tennessee-state": "tennessee-state",
  ucla: "ucla",
  "santa-clara": "santa-clara",
  "iowa-state": "iowa-state",
  queens: "queens-nc",
  florida: "florida",
  lehigh: "lehigh",
  "ohio-state": "ohio-state",
  "st-louis": "saint-louis",
  wisconsin: "wisconsin",
  akron: "akron",
  gonzaga: "gonzaga",
  hawaii: "hawaii",
  byu: "brigham-young",
  smu: "southern-methodist",
  illinois: "illinois",
  troy: "troy",
  miami: "miami-fl",
  "texas-am": "texas-am",
  houston: "houston",
  furman: "furman",
  michigan: "michigan",
  liu: "long-island-university",
  "utah-state": "utah-state",
  tcu: "texas-christian",
  "texas-tech": "texas-tech",
  "high-point": "high-point",
  arkansas: "arkansas",
  "cal-baptist": "california-baptist",
  "north-carolina": "north-carolina",
  missouri: "missouri",
  nebraska: "nebraska",
  "jackson-state": "jackson-state",
  kentucky: "kentucky",
  "nc-state": "north-carolina-state",
  uconn: "connecticut",
  umbc: "umbc",
  arizona: "arizona",
  howard: "howard",
  clemson: "clemson",
  iowa: "iowa",
  "st-johns": "st-johns-ny",
  mcneese: "mcneese-state",
  vanderbilt: "vanderbilt",
  hofstra: "hofstra",
  tennessee: "tennessee",
  vcu: "virginia-commonwealth",
  virginia: "virginia",
  "kennesaw-state": "kennesaw-state",
  "st-marys": "saint-marys-ca",
  ucf: "central-florida",
  purdue: "purdue",
  penn: "pennsylvania",
  texas: "texas",
  "miami-oh": "miami-oh",
  "prairie-view": "prairie-view",
  "wright-state": "wright-state",
  idaho: "idaho",
};

interface PlayerStats {
  id: number;
  name: string;
  position: string;
  number: string;
  year: string;
  height: string;
  weight: number;
  headshotUrl: string;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    mpg: number;
    fgPct: number;
    threePtPct: number;
    threePtRate: number;
    ftPct: number;
    spg: number;
    bpg: number;
    topg: number;
    gamesPlayed: number;
  } | null;
}

function parseFloat2(s: string): number {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
}

function parseRosterHeights(html: string): Map<string, { height: string; weight: number; year: string; number: string }> {
  const map = new Map<string, { height: string; weight: number; year: string; number: string }>();

  // Roster table might be in a comment block on SR
  // First try direct table, then look inside comments
  let rosterHtml = "";
  const directStart = html.indexOf('id="roster"');
  if (directStart !== -1) {
    const directEnd = html.indexOf("</table>", directStart);
    rosterHtml = html.substring(directStart, directEnd);
  } else {
    // SR often wraps tables in HTML comments for lazy loading
    const commentRegex = /<!--([\s\S]*?id="roster"[\s\S]*?)-->/;
    const commentMatch = html.match(commentRegex);
    if (commentMatch) {
      rosterHtml = commentMatch[1];
    }
  }

  if (!rosterHtml) return map;

  const rowRegex = new RegExp("<tr[^>]*>(.*?)</tr>", "gs");
  let match;
  while ((match = rowRegex.exec(rosterHtml)) !== null) {
    const row = match[1];
    const stats: Record<string, string> = {};
    const cellRegex = new RegExp('data-stat="(\\w+)"[^>]*>(.*?)</', "gs");
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      const clean = cellMatch[2].replace(/<[^>]+>/g, "").trim();
      stats[cellMatch[1]] = clean;
    }
    const name = stats.player;
    if (name) {
      map.set(name.toLowerCase(), {
        height: stats.height || "",
        weight: parseInt(stats.weight) || 0,
        year: stats.class || "",
        number: stats.number || "",
      });
    }
  }

  return map;
}

async function fetchPlayerStats(teamSlug: string, srSlug: string): Promise<PlayerStats[]> {
  const url = `https://www.sports-reference.com/cbb/schools/${srSlug}/men/2026.html`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    console.log(`    SR returned ${res.status} for ${srSlug}`);
    return [];
  }

  const html = await res.text();

  // Parse roster table for height/weight/year
  const rosterInfo = parseRosterHeights(html);

  // Find per_game table
  const tableStart = html.indexOf('id="players_per_game"');
  if (tableStart === -1) {
    console.log(`    No per_game table for ${srSlug}`);
    return [];
  }

  const tableEnd = html.indexOf("</table>", tableStart);
  const tableHtml = html.substring(tableStart, tableEnd);

  // Extract rows
  const rowRegex = new RegExp("<tr[^>]*>(.*?)</tr>", "gs");
  const players: PlayerStats[] = [];
  let match;
  let id = 1;

  while ((match = rowRegex.exec(tableHtml)) !== null) {
    const row = match[1];
    if (!row.includes('data-stat="name_display"')) continue;

    const stats: Record<string, string> = {};
    const cellRegex = new RegExp('data-stat="(\\w+)"[^>]*>(.*?)</', "gs");
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      const clean = cellMatch[2].replace(/<[^>]+>/g, "").trim();
      stats[cellMatch[1]] = clean;
    }

    if (!stats.name_display) continue;

    // Compute 3P rate: 3PA / FGA
    const fga = parseFloat2(stats.fga_per_g);
    const fg3a = parseFloat2(stats.fg3a_per_g);
    const threePtRate = fga > 0 ? (fg3a / fga) * 100 : 0;

    // Get roster info for this player
    const bio = rosterInfo.get(stats.name_display.toLowerCase());

    players.push({
      id: id++,
      name: stats.name_display,
      position: stats.pos || "",
      number: bio?.number || "",
      year: bio?.year || "",
      height: bio?.height || "",
      weight: bio?.weight || 0,
      headshotUrl: "",
      stats: {
        ppg: parseFloat2(stats.pts_per_g),
        rpg: parseFloat2(stats.trb_per_g),
        apg: parseFloat2(stats.ast_per_g),
        mpg: parseFloat2(stats.mp_per_g),
        fgPct: parseFloat2(stats.fg_pct) * 100,
        threePtPct: parseFloat2(stats.fg3_pct) * 100,
        threePtRate: Math.round(threePtRate * 10) / 10,
        ftPct: parseFloat2(stats.ft_pct) * 100,
        spg: parseFloat2(stats.stl_per_g),
        bpg: parseFloat2(stats.blk_per_g),
        topg: parseFloat2(stats.tov_per_g),
        gamesPlayed: parseInt(stats.games) || 0,
      },
    });
  }

  return players;
}

async function main() {
  fs.mkdirSync(ROSTERS_DIR, { recursive: true });

  const bracket = JSON.parse(fs.readFileSync(BRACKET_FILE, "utf-8"));
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

  console.log(`Fetching player stats for ${teamSlugs.size} teams from Sports Reference...`);

  // Also load existing ESPN roster data to merge headshots
  const espnRosters: Record<string, PlayerStats[]> = {};
  for (const slug of teamSlugs) {
    const espnFile = path.join(ROSTERS_DIR, `${slug}.json`);
    if (fs.existsSync(espnFile)) {
      try {
        espnRosters[slug] = JSON.parse(fs.readFileSync(espnFile, "utf-8"));
      } catch {}
    }
  }

  let i = 0;
  for (const slug of teamSlugs) {
    i++;
    const srSlug = SR_SLUG_MAP[slug];
    if (!srSlug) {
      console.log(`  [${i}/${teamSlugs.size}] ${slug} - no SR mapping, skipping`);
      continue;
    }

    console.log(`  [${i}/${teamSlugs.size}] ${slug} -> ${srSlug}`);

    const players = await fetchPlayerStats(slug, srSlug);

    if (players.length > 0) {
      // Merge ESPN headshots if available
      const espnPlayers = espnRosters[slug] || [];
      for (const p of players) {
        const espnMatch = espnPlayers.find(
          (ep) => ep.name.toLowerCase() === p.name.toLowerCase() ||
            ep.name.split(" ").pop()?.toLowerCase() === p.name.split(" ").pop()?.toLowerCase()
        );
        if (espnMatch) {
          p.headshotUrl = espnMatch.headshotUrl || "";
          // Only use ESPN bio data as fallback — SR roster data is preferred
          p.number = p.number || espnMatch.number || "";
          p.year = p.year || espnMatch.year || "";
          p.height = p.height || espnMatch.height || "";
          p.weight = p.weight || espnMatch.weight || 0;
        }
      }

      fs.writeFileSync(
        path.join(ROSTERS_DIR, `${slug}.json`),
        JSON.stringify(players, null, 2)
      );
      console.log(`    ${players.length} players with stats`);
    } else {
      console.log(`    No stats found`);
    }

    // Respect rate limits - SR is strict
    await new Promise((r) => setTimeout(r, 3500));
  }

  console.log("\nDone fetching player stats.");
}

main().catch(console.error);
