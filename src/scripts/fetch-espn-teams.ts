/**
 * Fetches all D1 college basketball teams from ESPN's hidden API.
 * Gets: names, logos, colors, ESPN IDs.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "espn-teams.json");

interface ESPNTeam {
  espnId: number;
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string;
  primaryColor: string;
  alternateColor: string;
  conference: string;
}

async function main() {
  console.log("Fetching ESPN team data...");

  const teams: Record<string, ESPNTeam> = {};
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=500&page=${page}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    totalPages = data.pageCount || 1;

    for (const entry of data.sports?.[0]?.leagues?.[0]?.teams || []) {
      const team = entry.team;
      if (!team) continue;

      const slug = slugify(team.shortDisplayName || team.displayName);
      teams[slug] = {
        espnId: parseInt(team.id),
        name: team.displayName || "",
        shortName: team.shortDisplayName || "",
        abbreviation: team.abbreviation || "",
        logoUrl: team.logos?.[0]?.href || "",
        primaryColor: `#${team.color || "333333"}`,
        alternateColor: `#${team.alternateColor || "666666"}`,
        conference:
          team.groups?.parent?.shortName ||
          team.groups?.parent?.name ||
          "",
      };
    }

    console.log(`  Page ${page}/${totalPages}: ${Object.keys(teams).length} teams total`);
    page++;

    // Small delay between pages
    if (page <= totalPages) {
      await new Promise((r) => setTimeout(r, 200));
    }
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
