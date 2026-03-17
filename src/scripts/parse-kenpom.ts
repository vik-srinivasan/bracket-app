/**
 * Parses KenPom markdown data into kenpom.json with full efficiency metrics.
 * Source: kenpom.com ratings page (markdown export).
 *
 * Columns: Rk | Team | Conf | W-L | NetRtg | ORtg | ORtgRank | DRtg | DRtgRank |
 *          AdjT | AdjTRank | Luck | LuckRank | SOS_NetRtg | SOS_NetRtgRank |
 *          SOS_ORtg | SOS_ORtgRank | SOS_DRtg | SOS_DRtgRank | NCSOS_NetRtg | NCSOS_NetRtgRank
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const RAW_FILE = path.join(__dirname, "..", "..", "kenpom_raw.md");

// Map KenPom team names to bracket slugs
const NAME_TO_SLUG: Record<string, string> = {
  "Duke": "duke",
  "Arizona": "arizona",
  "Michigan": "michigan",
  "Florida": "florida",
  "Houston": "houston",
  "Iowa St.": "iowa-state",
  "Illinois": "illinois",
  "Purdue": "purdue",
  "Michigan St.": "michigan-state",
  "Gonzaga": "gonzaga",
  "Connecticut": "uconn",
  "Vanderbilt": "vanderbilt",
  "Virginia": "virginia",
  "Nebraska": "nebraska",
  "Arkansas": "arkansas",
  "Tennessee": "tennessee",
  "St. John's": "st-johns",
  "Alabama": "alabama",
  "Louisville": "louisville",
  "Texas Tech": "texas-tech",
  "Kansas": "kansas",
  "Wisconsin": "wisconsin",
  "BYU": "byu",
  "Saint Mary's": "st-marys",
  "Iowa": "iowa",
  "Ohio St.": "ohio-state",
  "UCLA": "ucla",
  "Kentucky": "kentucky",
  "North Carolina": "north-carolina",
  "Utah St.": "utah-state",
  "Miami FL": "miami",
  "Georgia": "georgia",
  "Villanova": "villanova",
  "N.C. State": "nc-state",
  "Santa Clara": "santa-clara",
  "Clemson": "clemson",
  "Texas": "texas",
  "Texas A&M": "texas-am",
  "Saint Louis": "st-louis",
  "SMU": "smu",
  "TCU": "tcu",
  "VCU": "vcu",
  "South Florida": "south-florida",
  "Missouri": "missouri",
  "UCF": "ucf",
  "Akron": "akron",
  "McNeese St.": "mcneese",
  "McNeese": "mcneese",
  "Northern Iowa": "northern-iowa",
  "Hofstra": "hofstra",
  "High Point": "high-point",
  "Miami OH": "miami-oh",
  "California Baptist": "cal-baptist",
  "Cal Baptist": "cal-baptist",
  "Hawaii": "hawaii",
  "North Dakota St.": "north-dakota-state",
  "Wright St.": "wright-state",
  "Troy": "troy",
  "Idaho": "idaho",
  "Pennsylvania": "penn",
  "Penn": "penn",
  "Kennesaw St.": "kennesaw-state",
  "Queens": "queens",
  "UMBC": "umbc",
  "Tennessee St.": "tennessee-state",
  "Furman": "furman",
  "Siena": "siena",
  "Howard": "howard",
  "Long Island": "liu",
  "LIU": "liu",
  "Lehigh": "lehigh",
  "Prairie View A&M": "prairie-view",
  // Extra variations
  "Sam Houston St.": "sam-houston-state",
};

// Build a set of target slugs (our 68+ bracket teams)
const TARGET_SLUGS = new Set(Object.values(NAME_TO_SLUG));

interface KenpomEntry {
  kenpomRank: number;
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

function cleanTeamName(raw: string): string {
  // Remove markdown links: [Duke](url) → Duke
  const linkMatch = raw.match(/\[([^\]]+)\]\([^)]+\)/);
  return (linkMatch ? linkMatch[1] : raw).trim();
}

function parseNumber(s: string): number {
  const cleaned = s.replace(/[+,]/g, "").trim();
  return parseFloat(cleaned) || 0;
}

function main() {
  if (!fs.existsSync(RAW_FILE)) {
    console.error(`kenpom_raw.md not found at ${RAW_FILE}`);
    console.log("Falling back to rank-only mode...");
    return;
  }

  const markdown = fs.readFileSync(RAW_FILE, "utf-8");
  const lines = markdown.split("\n");

  const output: Record<string, KenpomEntry> = {};
  let matched = 0;

  for (const line of lines) {
    // Data rows start with "| <number> |"
    if (!line.match(/^\|\s*\d+\s*\|/)) continue;

    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 20) continue;

    const rank = parseInt(cells[0]);
    const teamName = cleanTeamName(cells[1]);
    // cells[2] = Conf, cells[3] = W-L
    const netRtg = parseNumber(cells[4]);
    const oRtg = parseNumber(cells[5]);
    const oRtgRank = parseInt(cells[6]) || 0;
    const dRtg = parseNumber(cells[7]);
    const dRtgRank = parseInt(cells[8]) || 0;
    const adjTempo = parseNumber(cells[9]);
    const adjTempoRank = parseInt(cells[10]) || 0;
    const luck = parseNumber(cells[11]);
    // cells[12] = luck rank
    const sosNetRtg = parseNumber(cells[13]);
    // cells[14] = sos netrtg rank
    const sosORtg = parseNumber(cells[15]);
    // cells[16] = sos ortg rank
    const sosDRtg = parseNumber(cells[17]);
    // cells[18] = sos drtg rank
    const ncsosNetRtg = parseNumber(cells[19]);

    // Try to find slug
    const slug = NAME_TO_SLUG[teamName];
    if (slug) {
      output[slug] = {
        kenpomRank: rank,
        netRtg,
        oRtg,
        oRtgRank,
        dRtg,
        dRtgRank,
        adjTempo,
        adjTempoRank,
        luck,
        sosNetRtg,
        sosORtg,
        sosDRtg,
        ncsosNetRtg,
      };
      matched++;
    }
  }

  // Check which bracket teams are missing
  const missing = [...TARGET_SLUGS].filter((s) => !output[s]);
  if (missing.length > 0) {
    console.log(`\nMissing bracket teams (${missing.length}):`);
    console.log(`  ${missing.join(", ")}`);
  }

  const outputPath = path.join(DATA_DIR, "kenpom.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${Object.keys(output).length} teams to kenpom.json (${matched} bracket teams matched)`);
}

main();
