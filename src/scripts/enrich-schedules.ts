/**
 * Enriches schedule data with opponent Barttorvik rankings.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const SCHEDULES_DIR = path.join(DATA_DIR, "team-schedules");
const BART_FILE = path.join(DATA_DIR, "barttorvik-raw.json");

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function main() {
  const bartData = JSON.parse(fs.readFileSync(BART_FILE, "utf-8")) as Record<
    string,
    { team: string; rank: number }
  >;

  // Build multiple lookup maps
  const rankBySlug: Record<string, number> = {};
  const rankByFullName: Record<string, number> = {};

  for (const [slug, data] of Object.entries(bartData)) {
    rankBySlug[slug] = data.rank;
    rankByFullName[data.team.toLowerCase()] = data.rank;
  }

  function findOpponentRank(opponentName: string): number {
    const lower = opponentName.toLowerCase();
    const slug = slugify(opponentName);

    // Direct match on full name
    if (rankByFullName[lower]) return rankByFullName[lower];

    // Slug match
    if (rankBySlug[slug]) return rankBySlug[slug];

    // Partial match: try stripping common suffixes like "Blue Devils", "Wildcats", etc
    for (const [key, rank] of Object.entries(rankByFullName)) {
      // Check if one contains the other (for "Duke Blue Devils" -> "duke")
      if (lower.includes(key) || key.includes(lower)) return rank;
    }

    for (const [key, rank] of Object.entries(rankBySlug)) {
      if (slug.includes(key) || key.includes(slug)) return rank;
    }

    return 0;
  }

  const files = fs.readdirSync(SCHEDULES_DIR).filter((f) => f.endsWith(".json"));
  let enrichedCount = 0;
  let totalGames = 0;

  for (const file of files) {
    const filePath = path.join(SCHEDULES_DIR, file);
    const games = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const game of games) {
      totalGames++;
      if (!game.opponent) continue;

      const rank = findOpponentRank(game.opponent);
      if (rank > 0) {
        game.opponentRank = rank;
        enrichedCount++;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
  }

  console.log(
    `Enriched ${enrichedCount}/${totalGames} games with opponent rankings across ${files.length} teams`
  );
}

main();
