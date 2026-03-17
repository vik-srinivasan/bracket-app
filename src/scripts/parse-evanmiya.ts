/**
 * Parses evanmiya_team_ratings_2025-26.csv into evanmiya.json
 * Maps EvanMiya team names to our bracket slugs.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const CSV_PATH = path.join(__dirname, "..", "..", "evanmiya_team_ratings_2025-26.csv");

const NAME_TO_SLUG: Record<string, string> = {
  "Michigan": "michigan",
  "Duke": "duke",
  "Arizona": "arizona",
  "Florida": "florida",
  "Houston": "houston",
  "Illinois": "illinois",
  "Iowa State": "iowa-state",
  "Purdue": "purdue",
  "Connecticut": "uconn",
  "Gonzaga": "gonzaga",
  "Michigan State": "michigan-state",
  "St. John's": "st-johns",
  "Vanderbilt": "vanderbilt",
  "Virginia": "virginia",
  "Tennessee": "tennessee",
  "Arkansas": "arkansas",
  "Alabama": "alabama",
  "Louisville": "louisville",
  "Nebraska": "nebraska",
  "Wisconsin": "wisconsin",
  "Kansas": "kansas",
  "Ohio State": "ohio-state",
  "Saint Mary's": "st-marys",
  "UCLA": "ucla",
  "Kentucky": "kentucky",
  "Iowa": "iowa",
  "Miami (Fla.)": "miami",
  "Texas Tech": "texas-tech",
  "Georgia": "georgia",
  "Clemson": "clemson",
  "Saint Louis": "st-louis",
  "Utah State": "utah-state",
  "Texas": "texas",
  "Santa Clara": "santa-clara",
  "SMU": "smu",
  "NC State": "nc-state",
  "BYU": "byu",
  "Texas A&M": "texas-am",
  "TCU": "tcu",
  "VCU": "vcu",
  "South Florida": "south-florida",
  "Villanova": "villanova",
  "North Carolina": "north-carolina",
  "Missouri": "missouri",
  "UCF": "ucf",
  "Akron": "akron",
  "McNeese State": "mcneese",
  "Northern Iowa": "northern-iowa",
  "Hofstra": "hofstra",
  "High Point": "high-point",
  "Miami (Ohio)": "miami-oh",
  "Miami (OH)": "miami-oh",
  "Cal Baptist": "cal-baptist",
  "California Baptist": "cal-baptist",
  "Hawaii": "hawaii",
  "Hawai'i": "hawaii",
  "North Dakota State": "north-dakota-state",
  "Wright State": "wright-state",
  "Troy": "troy",
  "Idaho": "idaho",
  "Penn": "penn",
  "Pennsylvania": "penn",
  "Kennesaw State": "kennesaw-state",
  "Queens": "queens",
  "Queens (NC)": "queens",
  "UMBC": "umbc",
  "Tennessee State": "tennessee-state",
  "Furman": "furman",
  "Siena": "siena",
  "Howard": "howard",
  "LIU": "liu",
  "Long Island University": "liu",
  "Long Island": "liu",
  "Lehigh": "lehigh",
  "Prairie View": "prairie-view",
  "Prairie View A&M": "prairie-view",
  "Jackson State": "jackson-state",
};

interface EvanMiyaTeam {
  rank: number;
  oRate: number;
  dRate: number;
  relativeRating: number;
  offRank: number;
  defRank: number;
  trueTempo: number;
  tempoRank: number;
  d1Wins: number;
  d1Losses: number;
  killShotsPerGame: number;
  killShotsConceded: number;
  killShotsMargin: number;
}

function main() {
  const csv = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = csv.trim().split("\n");
  const header = lines[0];

  const output: Record<string, EvanMiyaTeam> = {};
  const bracketTeams = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(DATA_DIR, "teams.json"), "utf-8"))));
  const unmatched: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 21) continue;

    const rank = parseInt(cols[0]);
    const name = cols[1];
    const oRate = parseFloat(cols[2]);
    const dRate = parseFloat(cols[3]);
    const relativeRating = parseFloat(cols[4]);
    const offRank = parseInt(cols[7]);
    const defRank = parseInt(cols[8]);
    const trueTempo = parseFloat(cols[9]);
    const tempoRank = parseInt(cols[10]);
    const killShotsPerGame = parseFloat(cols[14]);
    const killShotsConceded = parseFloat(cols[15]);
    const killShotsMargin = parseFloat(cols[16]);
    const d1Wins = parseInt(cols[19]);
    const d1Losses = parseInt(cols[20]);

    const slug = NAME_TO_SLUG[name];
    if (!slug) {
      // Try fuzzy
      const nameLower = name.toLowerCase().replace(/[^a-z]/g, "");
      for (const [mapName, mapSlug] of Object.entries(NAME_TO_SLUG)) {
        if (mapName.toLowerCase().replace(/[^a-z]/g, "") === nameLower) {
          output[mapSlug] = { rank, oRate, dRate, relativeRating, offRank, defRank, trueTempo, tempoRank, d1Wins, d1Losses, killShotsPerGame, killShotsConceded, killShotsMargin };
          break;
        }
      }
      continue;
    }

    output[slug] = { rank, oRate, dRate, relativeRating, offRank, defRank, trueTempo, tempoRank, d1Wins, d1Losses, killShotsPerGame, killShotsConceded, killShotsMargin };
  }

  // Check which bracket teams we matched
  for (const teamSlug of bracketTeams) {
    if (!output[teamSlug]) {
      unmatched.push(teamSlug);
    }
  }

  if (unmatched.length > 0) {
    console.log(`Unmatched bracket teams: ${unmatched.join(", ")}`);
  }

  const outputPath = path.join(DATA_DIR, "evanmiya.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${Object.keys(output).length} teams to ${outputPath}`);
  console.log(`Matched ${bracketTeams.size - unmatched.length}/${bracketTeams.size} bracket teams`);
}

main();
