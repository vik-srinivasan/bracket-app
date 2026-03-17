/**
 * Orchestrator: runs all data fetch scripts in dependency order.
 * Usage: npx tsx src/scripts/run-all.ts
 */

import { execSync } from "child_process";
import * as path from "path";

const SCRIPTS_DIR = path.join(__dirname);

function run(scriptName: string) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${scriptName}`);
  console.log("=".repeat(60));
  execSync(`npx tsx ${scriptPath}`, {
    stdio: "inherit",
    cwd: path.join(__dirname, "..", ".."),
    env: { ...process.env },
  });
}

async function main() {
  const start = Date.now();

  // Phase 1: Independent fetches
  run("fetch-barttorvik.ts");
  run("fetch-espn-teams.ts");

  // Phase 2: Depends on ESPN teams + bracket
  run("fetch-espn-details.ts");

  // Phase 3: Odds (independent but run after core data)
  run("fetch-odds.ts");

  // Phase 4: Merge everything
  run("merge-team-data.ts");

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`All scripts completed in ${elapsed}s`);
  console.log("=".repeat(60));
}

main().catch(console.error);
