/**
 * Fetches team data from Barttorvik (free, no auth needed).
 * Downloads the bulk JSON file with all D1 teams' advanced metrics.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "barttorvik-raw.json");

// Barttorvik provides bulk JSON: each team is an array of values
// We need to map array indices to named fields
const FIELD_MAP: Record<number, string> = {
  0: "rank",
  1: "team",
  2: "conference",
  3: "record",
  4: "adjOE",
  5: "adjOERank",
  6: "adjDE",
  7: "adjDERank",
  8: "barthag",
  9: "projectedSeed",
  10: "projW",
  11: "projL",
  12: "proConfW",
  13: "proConfL",
  14: "confAdjEM",
  15: "sos",
  16: "ncsos",
  17: "confSOS",
  18: "adjTempo",
  19: "adjTempoRank",
  20: "fun",
  21: "funRk",
  22: "year",
};

interface BarttovikTeam {
  rank: number;
  team: string;
  conference: string;
  record: string;
  adjOE: number;
  adjOERank: number;
  adjDE: number;
  adjDERank: number;
  barthag: number;
  projectedSeed: number | null;
  sos: number;
  ncsos: number;
  adjTempo: number;
  adjTempoRank: number;
  effMargin: number;
}

async function main() {
  console.log("Fetching Barttorvik data...");

  const url = "https://barttorvik.com/2026_team_results.json";
  const response = await fetch(url);

  if (!response.ok) {
    // Try CSV as fallback
    console.log("JSON not available, trying CSV...");
    const csvUrl = "https://barttorvik.com/2026_team_results.csv";
    const csvResponse = await fetch(csvUrl);

    if (!csvResponse.ok) {
      throw new Error(
        `Failed to fetch Barttorvik data: ${csvResponse.status}`
      );
    }

    const csvText = await csvResponse.text();
    const lines = csvText.split("\n").filter((l) => l.trim());
    const teams: Record<string, BarttovikTeam> = {};

    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 10 || isNaN(Number(parts[0]))) continue;

      const adjOE = parseFloat(parts[4]) || 0;
      const adjDE = parseFloat(parts[6]) || 0;

      const slug = slugify(parts[1]);
      teams[slug] = {
        rank: parseInt(parts[0]) || 0,
        team: parts[1]?.trim() || "",
        conference: parts[2]?.trim() || "",
        record: parts[3]?.trim() || "",
        adjOE,
        adjOERank: parseInt(parts[5]) || 0,
        adjDE,
        adjDERank: parseInt(parts[7]) || 0,
        barthag: parseFloat(parts[8]) || 0,
        projectedSeed: parts[9] ? parseInt(parts[9]) : null,
        sos: parseFloat(parts[15]) || 0,
        ncsos: parseFloat(parts[16]) || 0,
        adjTempo: parseFloat(parts[18]) || 0,
        adjTempoRank: parseInt(parts[19]) || 0,
        effMargin: adjOE - adjDE,
      };
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(teams, null, 2));
    console.log(`Wrote ${Object.keys(teams).length} teams to ${OUTPUT_FILE}`);
    return;
  }

  const data = await response.json();

  // data is expected to be an array of arrays
  const teams: Record<string, BarttovikTeam> = {};

  for (const row of data) {
    if (!Array.isArray(row) || row.length < 10) continue;

    const teamName = String(row[1] || "").trim();
    if (!teamName) continue;

    const adjOE = parseFloat(row[4]) || 0;
    const adjDE = parseFloat(row[6]) || 0;

    const slug = slugify(teamName);
    teams[slug] = {
      rank: parseInt(row[0]) || 0,
      team: teamName,
      conference: String(row[2] || "").trim(),
      record: String(row[3] || "").trim(),
      adjOE,
      adjOERank: parseInt(row[5]) || 0,
      adjDE,
      adjDERank: parseInt(row[7]) || 0,
      barthag: parseFloat(row[8]) || 0,
      projectedSeed: row[9] ? parseInt(row[9]) : null,
      sos: parseFloat(row[15]) || 0,
      ncsos: parseFloat(row[16]) || 0,
      adjTempo: parseFloat(row[18]) || 0,
      adjTempoRank: parseInt(row[19]) || 0,
      effMargin: adjOE - adjDE,
    };
  }

  // Log first team for field verification
  const firstKey = Object.keys(teams)[0];
  if (firstKey) {
    console.log("Sample team:", JSON.stringify(teams[firstKey], null, 2));
    console.log("Raw first row:", JSON.stringify(data[0]?.slice(0, 25)));
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(teams, null, 2));
  console.log(`Wrote ${Object.keys(teams).length} teams to ${OUTPUT_FILE}`);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

main().catch(console.error);
