# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NCAA March Madness 2026 bracket analytics webapp. Interactive bracket picker with slide-out detail panels showing advanced metrics (Barttorvik, NET, KPI, SOR), player stats (from Sports Reference), schedules with opponent rankings, radar charts, and future matchup paths. Picks persist to localStorage.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run fetch-data   # Run full data pipeline (Barttorvik + ESPN + odds + merge)
npm run fetch-barttorvik  # Fetch Barttorvik T-Rank data only
npm run fetch-espn   # Fetch ESPN team metadata only
npm run fetch-details # Fetch schedules + rosters for tournament teams
npm run fetch-odds   # Fetch Vegas odds (requires ODDS_API_KEY in .env.local)
npm run merge-data   # Merge all sources into teams.json

# Individual data scripts (run via tsx):
npx tsx src/scripts/fetch-player-stats.ts   # Scrape Sports Reference for player stats
npx tsx src/scripts/fetch-rankings.ts       # Fetch NET rankings from WarrenNolan
npx tsx src/scripts/enrich-schedules.ts     # Add opponent Barttorvik rank to schedule games
```

## Architecture

**Tech stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Recharts

**Data flow:** Node scripts (`src/scripts/`) fetch from external APIs → write static JSON to `src/data/` → Next.js imports JSON at build time. No runtime API calls from the browser.

**Key data sources:**
- Barttorvik (`barttorvik.com/2026_team_results.json`) — adjusted efficiency, barthag, SOS, rankings
- ESPN hidden API (`site.api.espn.com`) — logos, colors, schedules, rosters
- Sports Reference (HTML scraping) — per-player season stats (PPG, RPG, APG, etc.)
- WarrenNolan — NET rankings
- The Odds API — Vegas spreads/moneylines (needs `ODDS_API_KEY` in `.env.local`)

**Bracket interaction:** Users click team names to pick winners. Winners automatically advance to next round slots. Changing a pick clears all downstream dependent picks. Picks persist to `localStorage`. Detail panel (slide-out) also has pick buttons.

**Bracket structure:** `src/data/bracket-2026.json` defines all 68 teams across 4 regions (east, south, west, midwest) + Final Four. Each matchup has an `id` like `east-r1-1` and a `winnerSlotId` linking to the next round.

**Component hierarchy:**
- `page.tsx` → `useBracket` hook (state management) → `Bracket` → `Region` (×4) + `FinalFour`
- `Region` → `RoundColumn` + `RoundConnectors` → `Matchup` → `TeamRow`
- Click ⓘ on matchup → opens `MatchupDetailPanel` (slide-out, right side)
- Detail panel sections: `TeamComparisonHeader` (with pick buttons + win probability), `VegasOddsCard`, `AdvancedMetricsTable` (rankings + quad records + efficiency), `HeadToHeadChart` (radar), `KeyPlayersSection` (sorted by PPG, real stats), `ScheduleHistory` (last 10 + opponent ranks + common opponents), `FutureMatchups`

**Team data merge:** `merge-team-data.ts` joins Barttorvik + ESPN + rankings by team slug with fuzzy matching + manual overrides in `NAME_OVERRIDES` map. Output: `src/data/teams.json`.

**Win probability:** Matchup cards and detail header show colored bar using Log5 formula on Barthag values.

## Key Files

- `src/lib/types.ts` — all TypeScript interfaces (BracketMatchup, Team, Player, UserPicks, Rankings, etc.)
- `src/hooks/useBracket.ts` — bracket state: picks, winner advancement, downstream clearing, localStorage persistence
- `src/data/bracket-2026.json` — bracket structure (replace with real bracket data when available)
- `src/data/teams.json` — merged team analytics (generated, don't edit manually)
- `src/data/team-rosters/*.json` — per-team player stats from Sports Reference
- `src/data/team-schedules/*.json` — per-team schedules with opponent rankings
- `src/scripts/merge-team-data.ts` — `NAME_OVERRIDES` for cross-source team name matching
- `src/scripts/fetch-player-stats.ts` — `SR_SLUG_MAP` for Sports Reference team slug mapping
- `src/lib/bracket-utils.ts` — bracket traversal helpers (findMatchup, getPathToChampionship)
