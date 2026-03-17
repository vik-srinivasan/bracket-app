/**
 * Fetches NCAA basketball odds from The Odds API (free tier: 500 req/month).
 * Requires ODDS_API_KEY in .env.local or environment.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "odds.json");

async function main() {
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    console.log(
      "ODDS_API_KEY not set. Creating empty odds file. Set it in .env.local to fetch real odds."
    );
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  console.log("Fetching odds from The Odds API...");

  const url = `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error(`Odds API error: ${response.status}`, text);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  const data = await response.json();
  console.log(`Fetched odds for ${data.length} games`);

  // Log remaining requests
  const remaining = response.headers.get("x-requests-remaining");
  const used = response.headers.get("x-requests-used");
  console.log(`API usage: ${used} used, ${remaining} remaining this month`);

  // Transform to our format
  const odds = data.map(
    (game: {
      id: string;
      home_team: string;
      away_team: string;
      commence_time: string;
      bookmakers: {
        title: string;
        markets: {
          key: string;
          outcomes: { name: string; point?: number; price: number }[];
        }[];
      }[];
    }) => ({
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: game.commence_time,
      bookmakers: game.bookmakers.map((bk) => ({
        name: bk.title,
        spreads:
          bk.markets
            .find((m) => m.key === "spreads")
            ?.outcomes.map((o) => ({
              team: o.name,
              point: o.point || 0,
              price: o.price,
            })) || [],
        moneyline:
          bk.markets
            .find((m) => m.key === "h2h")
            ?.outcomes.map((o) => ({
              team: o.name,
              price: o.price,
            })) || [],
        totals:
          bk.markets
            .find((m) => m.key === "totals")
            ?.outcomes.map((o) => ({
              name: o.name,
              point: o.point || 0,
              price: o.price,
            })) || [],
      })),
    })
  );

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(odds, null, 2));
  console.log(`Wrote odds for ${odds.length} games to ${OUTPUT_FILE}`);
}

main().catch(console.error);
