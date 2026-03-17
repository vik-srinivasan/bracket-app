import { BracketSlot, Team } from "@/lib/types";
import { getSeedBgColor, getSeedColor } from "@/lib/bracket-utils";
import teamsDataRaw from "@/data/teams.json";

const teamsData = teamsDataRaw as Record<string, Team>;

interface TeamSlotProps {
  team: BracketSlot | null;
  isTop?: boolean;
  mirrored?: boolean;
}

export default function TeamSlot({ team, isTop, mirrored }: TeamSlotProps) {
  if (!team) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 min-w-0 ${isTop ? "border-b border-slate-700/50" : ""}`}
      >
        <span className="text-xs text-slate-600 italic">TBD</span>
      </div>
    );
  }

  const teamInfo = teamsData[team.teamId];

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 min-w-0 group-hover:bg-slate-700/30 transition-colors ${
        isTop ? "border-b border-slate-700/50" : ""
      } ${mirrored ? "flex-row-reverse" : ""}`}
    >
      <span
        className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded border shrink-0 ${getSeedBgColor(team.seed)} ${getSeedColor(team.seed)}`}
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
      <span className="text-xs font-medium text-slate-200 truncate flex-1">
        {team.teamName}
      </span>
      {teamInfo?.record && (
        <span className="text-[9px] text-slate-500 font-mono shrink-0 hidden group-hover:inline">
          {teamInfo.record}
        </span>
      )}
    </div>
  );
}
