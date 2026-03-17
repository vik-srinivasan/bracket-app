import { BracketMatchup, Team, UserPicks } from "@/lib/types";
import { getSeedBgColor, getSeedColor } from "@/lib/bracket-utils";
import teamsDataRaw from "@/data/teams.json";

const teamsData = teamsDataRaw as Record<string, Team>;

interface MatchupProps {
  matchup: BracketMatchup;
  picks: UserPicks;
  onPickWinner: (matchupId: string, teamId: string) => void;
  onOpenDetail: (matchupId: string) => void;
  isActive: boolean;
  mirrored?: boolean;
}

export default function Matchup({
  matchup,
  picks,
  onPickWinner,
  onOpenDetail,
  isActive,
  mirrored,
}: MatchupProps) {
  const hasBothTeams = !!(matchup.topTeam && matchup.bottomTeam);
  const hasAnyTeam = !!(matchup.topTeam || matchup.bottomTeam);
  const pickedTeamId = picks[matchup.id];

  // Win probability bar from Barthag
  let topWinPct = 50;
  if (hasBothTeams) {
    const a = teamsData[matchup.topTeam!.teamId];
    const b = teamsData[matchup.bottomTeam!.teamId];
    if (a?.barttorvik.barthag && b?.barttorvik.barthag) {
      const bA = a.barttorvik.barthag;
      const bB = b.barttorvik.barthag;
      topWinPct = Math.round(
        ((bA * (1 - bB)) / (bA * (1 - bB) + bB * (1 - bA))) * 100
      );
    }
  }

  return (
    <div
      className={`group relative w-full rounded-lg border transition-all duration-200
        ${
          isActive
            ? "border-amber-400/60 bg-slate-800 shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/20 animate-pulse-glow"
            : hasAnyTeam
              ? "border-slate-700/40 bg-slate-900/80 hover:border-slate-600/60 hover:bg-slate-800/60"
              : "border-slate-800/30 bg-slate-950/40"
        }
      `}
    >
      <TeamRow
        team={matchup.topTeam}
        isPicked={pickedTeamId === matchup.topTeam?.teamId}
        otherPicked={!!pickedTeamId && pickedTeamId !== matchup.topTeam?.teamId}
        canPick={hasBothTeams}
        isTop
        mirrored={mirrored}
        onPick={() =>
          matchup.topTeam &&
          onPickWinner(matchup.id, matchup.topTeam.teamId)
        }
      />
      <TeamRow
        team={matchup.bottomTeam}
        isPicked={pickedTeamId === matchup.bottomTeam?.teamId}
        otherPicked={!!pickedTeamId && pickedTeamId !== matchup.bottomTeam?.teamId}
        canPick={hasBothTeams}
        isTop={false}
        mirrored={mirrored}
        onPick={() =>
          matchup.bottomTeam &&
          onPickWinner(matchup.id, matchup.bottomTeam.teamId)
        }
      />

      {/* Single info button for the whole matchup */}
      {hasAnyTeam && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(matchup.id);
          }}
          className={`absolute top-0 bottom-0 w-7 flex items-center justify-center text-slate-600 hover:text-amber-400 hover:bg-slate-700/30 transition-all opacity-0 group-hover:opacity-100 ${mirrored ? "left-0 rounded-l-lg" : "right-0 rounded-r-lg"}`}
          title="View matchup analytics"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Win probability bar */}
      {hasBothTeams && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-lg overflow-hidden flex opacity-60">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${topWinPct}%`,
              backgroundColor: teamsData[matchup.topTeam!.teamId]?.primaryColor || "#10b981",
            }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${100 - topWinPct}%`,
              backgroundColor: teamsData[matchup.bottomTeam!.teamId]?.primaryColor || "#3b82f6",
            }}
          />
        </div>
      )}
    </div>
  );
}

function TeamRow({
  team,
  isPicked,
  otherPicked,
  canPick,
  isTop,
  mirrored,
  onPick,
}: {
  team: { seed: number; teamId: string; teamName: string } | null;
  isPicked: boolean;
  otherPicked: boolean;
  canPick: boolean;
  isTop: boolean;
  mirrored?: boolean;
  onPick: () => void;
}) {
  if (!team) {
    return (
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 min-w-0 ${isTop ? "border-b border-slate-800/40" : ""}`}
      >
        <span className="text-[11px] text-slate-600 italic">TBD</span>
      </div>
    );
  }

  const teamInfo = teamsData[team.teamId];

  return (
    <div
      className={`flex items-center gap-1 px-1 py-[3px] min-w-0 ${
        isTop ? "border-b border-slate-800/40" : ""
      } ${mirrored ? "flex-row-reverse" : ""} ${
        isPicked
          ? "bg-emerald-500/10"
          : otherPicked
            ? "opacity-40"
            : ""
      } transition-opacity duration-200`}
    >
      {/* Pick button - click team name to advance */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canPick) onPick();
        }}
        disabled={!canPick}
        className={`flex items-center gap-1 min-w-0 flex-1 px-1 py-0.5 rounded transition-all
          ${mirrored ? "flex-row-reverse" : ""}
          ${
            canPick
              ? "hover:bg-slate-700/40 cursor-pointer active:scale-[0.98]"
              : "cursor-default"
          }
          ${isPicked ? "font-bold" : ""}
        `}
        title={canPick ? `Pick ${team.teamName} to advance` : undefined}
      >
        <span
          className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded border shrink-0 ${getSeedBgColor(team.seed)} ${getSeedColor(team.seed)}`}
        >
          {team.seed}
        </span>
        {teamInfo?.logoUrl && (
          <img
            src={teamInfo.logoUrl}
            alt=""
            className="w-4 h-4 object-contain shrink-0"
          />
        )}
        <span
          className={`text-[12px] truncate flex-1 transition-colors ${
            isPicked
              ? "text-emerald-400 font-semibold"
              : otherPicked
                ? "text-slate-500"
                : "text-white font-medium"
          } ${mirrored ? "text-right" : "text-left"}`}
        >
          {team.teamName}
        </span>
        {teamInfo?.rankings.kenpomRank && (
          <span className={`text-[9px] font-mono shrink-0 ${isPicked ? "text-emerald-400/50" : "text-slate-400"}`}>
            {teamInfo.rankings.kenpomRank}
          </span>
        )}
        {isPicked && (
          <span className="text-emerald-400 text-[11px] shrink-0">&#10003;</span>
        )}
      </button>
    </div>
  );
}
