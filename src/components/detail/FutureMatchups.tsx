import { BracketData, BracketMatchup } from "@/lib/types";
import {
  getPathToChampionship,
  getRoundName,
  getFeederMatchups,
} from "@/lib/bracket-utils";

interface Props {
  matchup: BracketMatchup;
  bracket: BracketData;
}

function PotentialOpponent({ matchup }: { matchup: BracketMatchup }) {
  const feeders = getFeederMatchupsLocal(matchup);

  return (
    <div className="bg-slate-800/40 rounded-lg p-2.5">
      <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">
        {getRoundName(matchup.round)}
      </div>
      <div className="text-xs text-slate-300">
        Winner faces:{" "}
        {matchup.topTeam && matchup.bottomTeam ? (
          <span>
            <span className="text-amber-400 font-medium">
              ({matchup.topTeam.seed}) {matchup.topTeam.teamName}
            </span>
            {" / "}
            <span className="text-amber-400 font-medium">
              ({matchup.bottomTeam.seed}) {matchup.bottomTeam.teamName}
            </span>
          </span>
        ) : matchup.topTeam ? (
          <span className="text-amber-400 font-medium">
            ({matchup.topTeam.seed}) {matchup.topTeam.teamName}
          </span>
        ) : matchup.bottomTeam ? (
          <span className="text-amber-400 font-medium">
            ({matchup.bottomTeam.seed}) {matchup.bottomTeam.teamName}
          </span>
        ) : (
          <span className="text-slate-600">TBD</span>
        )}
      </div>
    </div>
  );
}

// Simple local version to avoid passing bracket everywhere
function getFeederMatchupsLocal(_matchup: BracketMatchup) {
  return [];
}

export default function FutureMatchups({ matchup, bracket }: Props) {
  const path = getPathToChampionship(matchup.id, bracket);

  if (path.length === 0) {
    return null;
  }

  return (
    <div className="border border-slate-700/40 rounded-xl overflow-hidden bg-slate-900/40">
      <div className="bg-slate-800/40 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/30">
        <span className="text-sm font-semibold text-slate-300">
          Path Forward
        </span>
      </div>

      <div className="p-4 space-y-2">
        {path.map((futureMatchup) => (
          <PotentialOpponent
            key={futureMatchup.id}
            matchup={futureMatchup}
          />
        ))}
      </div>
    </div>
  );
}
