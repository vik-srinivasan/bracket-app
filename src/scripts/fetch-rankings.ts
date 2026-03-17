/**
 * Fetches NET rankings, quad records, KPI, SOR from WarrenNolan and Barttorvik.
 * Outputs to src/data/rankings.json
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "rankings.json");
const BRACKET_FILE = path.join(DATA_DIR, "bracket-2026.json");

interface TeamRanking {
  netRank: number;
  kpiRank: number | null;
  sorRank: number | null;
  kenpomRank: number | null;
  rpiRank: number | null;
  sosRank: number | null;
  quadRecord: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  } | null;
}

// Map our slugs to WarrenNolan team names
const WN_NAME_MAP: Record<string, string> = {
  "st-johns": "St. John's",
  "st-marys": "St. Mary's",
  "st-louis": "Saint Louis",
  "north-carolina": "North Carolina",
  "nc-state": "NC State",
  "michigan-state": "Michigan St.",
  "ohio-state": "Ohio St.",
  "iowa-state": "Iowa St.",
  "utah-state": "Utah St.",
  "tennessee-state": "Tennessee St.",
  "north-dakota-state": "N. Dakota St.",
  "jackson-state": "Jackson St.",
  "kennesaw-state": "Kennesaw St.",
  "south-florida": "South Florida",
  "texas-am": "Texas A&M",
  "texas-tech": "Texas Tech",
  "cal-baptist": "Cal Baptist",
  "high-point": "High Point",
  "northern-iowa": "Northern Iowa",
  "santa-clara": "Santa Clara",
  uconn: "Connecticut",
  liu: "LIU",
  byu: "BYU",
  smu: "SMU",
  ucf: "UCF",
  vcu: "VCU",
  umbc: "UMBC",
  mcneese: "McNeese",
  penn: "Penn",
};

async function fetchNETRankings(): Promise<Record<string, { netRank: number; record: string }>> {
  console.log("Fetching NET rankings from WarrenNolan...");
  const res = await fetch("https://www.warrennolan.com/basketball/2026/net", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) {
    console.error(`WarrenNolan NET returned ${res.status}`);
    return {};
  }

  const html = await res.text();
  const rowRegex = new RegExp("<tr[^>]*>(.*?)</tr>", "gs");
  const teams: Record<string, { netRank: number; record: string }> = {};
  let rank = 0;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    const cellRegex = new RegExp("<td[^>]*>(.*?)</td>", "gs");
    let cellMatch;
    while ((cellMatch = cellRegex.exec(match[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
    }

    if (cells.length >= 3 && cells[0] && cells[2]) {
      rank++;
      const name = cells[0].toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");
      teams[name] = {
        netRank: parseInt(cells[2]) || rank,
        record: cells[1],
      };
    }
  }

  console.log(`  Parsed ${Object.keys(teams).length} teams`);
  return teams;
}

async function fetchQuadRecord(teamName: string): Promise<{ q1: string; q2: string; q3: string; q4: string } | null> {
  const encodedName = encodeURIComponent(teamName);
  const url = `https://www.warrennolan.com/basketball/2026/team-sheet?team=${encodedName}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) return null;

  const html = await res.text();

  // Parse quad records from the team sheet
  // Looking for patterns like "Q1: 16-2" or quad table rows
  const quadRegex = /Q([1-4])\s*[:\-]?\s*(\d+-\d+)/g;
  const quads: Record<string, string> = {};
  let qMatch;

  while ((qMatch = quadRegex.exec(html)) !== null) {
    quads[`q${qMatch[1]}`] = qMatch[2];
  }

  if (Object.keys(quads).length === 4) {
    return {
      q1: quads.q1 || "0-0",
      q2: quads.q2 || "0-0",
      q3: quads.q3 || "0-0",
      q4: quads.q4 || "0-0",
    };
  }

  // Try alternate parsing - look for quad data in table cells
  const cellRegex = new RegExp('<td[^>]*class="[^"]*quad[^"]*"[^>]*>(.*?)</td>', "gs");
  const quadCells: string[] = [];
  let cellMatch;
  while ((cellMatch = cellRegex.exec(html)) !== null) {
    const clean = cellMatch[1].replace(/<[^>]+>/g, "").trim();
    if (clean.match(/\d+-\d+/)) quadCells.push(clean);
  }

  if (quadCells.length >= 4) {
    return {
      q1: quadCells[0],
      q2: quadCells[1],
      q3: quadCells[2],
      q4: quadCells[3],
    };
  }

  return null;
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const bracket = JSON.parse(fs.readFileSync(BRACKET_FILE, "utf-8"));
  const teamSlugs = new Set<string>();
  const teamNames: Record<string, string> = {};

  for (const region of Object.values(bracket.regions) as { matchups: { topTeam?: { teamId: string; teamName: string }; bottomTeam?: { teamId: string; teamName: string } }[] }[]) {
    for (const matchup of region.matchups) {
      if (matchup.topTeam) {
        teamSlugs.add(matchup.topTeam.teamId);
        teamNames[matchup.topTeam.teamId] = matchup.topTeam.teamName;
      }
      if (matchup.bottomTeam) {
        teamSlugs.add(matchup.bottomTeam.teamId);
        teamNames[matchup.bottomTeam.teamId] = matchup.bottomTeam.teamName;
      }
    }
  }

  // Fetch NET rankings (all at once)
  const netData = await fetchNETRankings();

  // Fetch quad records for each tournament team
  const rankings: Record<string, TeamRanking> = {};

  let i = 0;
  for (const slug of teamSlugs) {
    i++;
    const displayName = WN_NAME_MAP[slug] || teamNames[slug] || slug;

    // Find NET rank
    let netRank = 0;
    const netMatch =
      netData[slug] ||
      netData[displayName.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-")];

    if (netMatch) {
      netRank = netMatch.netRank;
    } else {
      // Fuzzy match
      for (const [key, val] of Object.entries(netData)) {
        if (key.includes(slug) || slug.includes(key)) {
          netRank = val.netRank;
          break;
        }
      }
    }

    console.log(`  [${i}/${teamSlugs.size}] ${slug} -> NET #${netRank || "?"}`);

    // Fetch quad record
    let quadRecord = null;
    try {
      quadRecord = await fetchQuadRecord(displayName);
      if (quadRecord) {
        console.log(`    Quads: Q1:${quadRecord.q1} Q2:${quadRecord.q2} Q3:${quadRecord.q3} Q4:${quadRecord.q4}`);
      }
    } catch (e) {
      // Ignore quad fetch errors
    }

    rankings[slug] = {
      netRank,
      kpiRank: null,
      sorRank: null,
      kenpomRank: null,
      rpiRank: null,
      sosRank: null,
      quadRecord,
    };

    // Rate limit for team sheets
    if (quadRecord !== null || i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rankings, null, 2));
  console.log(`\nWrote rankings for ${Object.keys(rankings).length} teams to ${OUTPUT_FILE}`);
}

main().catch(console.error);
