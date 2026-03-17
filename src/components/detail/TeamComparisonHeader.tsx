import { Team } from "@/lib/types";
import { getSeedBgColor, getSeedColor } from "@/lib/bracket-utils";

interface Props {
  teamA: Team | null;
  teamB: Team | null;
  roundName: string;
  onPickTeam?: (teamId: string) => void;
  pickedTeamId?: string | null;
}

export default function TeamComparisonHeader({
  teamA,
  teamB,
  roundName,
  onPickTeam,
  pickedTeamId,
}: Props) {
  const canPick = !!(teamA && teamB && onPickTeam);

  // Win probability from Barthag
  let winPctA = 50;
  if (teamA?.barttorvik.barthag && teamB?.barttorvik.barthag) {
    const bA = teamA.barttorvik.barthag;
    const bB = teamB.barttorvik.barthag;
    winPctA = Math.round(
      ((bA * (1 - bB)) / (bA * (1 - bB) + bB * (1 - bA))) * 100
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient using team colors */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background: `linear-gradient(135deg, ${teamA?.primaryColor || "#6366f1"} 0%, transparent 40%, transparent 60%, ${teamB?.primaryColor || "#6366f1"} 100%)`,
        }}
      />

      <div className="relative px-6 py-6">
        <div className="text-center mb-5">
          <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-[0.2em] bg-amber-400/[0.06] px-4 py-1.5 rounded-full border border-amber-400/10">
            {roundName}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <TeamCard
            team={teamA}
            align="left"
            isPicked={pickedTeamId === teamA?.id}
            canPick={canPick}
            onPick={() => teamA && onPickTeam?.(teamA.id)}
          />

          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-xl font-black text-slate-700/80">VS</span>
          </div>

          <TeamCard
            team={teamB}
            align="right"
            isPicked={pickedTeamId === teamB?.id}
            canPick={canPick}
            onPick={() => teamB && onPickTeam?.(teamB.id)}
          />
        </div>

        {/* Win probability bar */}
        {teamA && teamB && (
          <div className="mt-5">
            <div className="flex justify-between text-[10px] font-mono mb-1.5">
              <span className={`${winPctA >= 50 ? "text-slate-300" : "text-slate-600"}`}>{winPctA}%</span>
              <span className="text-slate-700 text-[9px] uppercase tracking-wider">Win Probability</span>
              <span className={`${winPctA < 50 ? "text-slate-300" : "text-slate-600"}`}>{100 - winPctA}%</span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800/80 gap-px">
              <div
                className="h-full transition-all duration-700 rounded-l-full"
                style={{
                  width: `${winPctA}%`,
                  backgroundColor: teamA.primaryColor || "#10b981",
                  opacity: winPctA >= 50 ? 0.8 : 0.4,
                }}
              />
              <div
                className="h-full transition-all duration-700 rounded-r-full"
                style={{
                  width: `${100 - winPctA}%`,
                  backgroundColor: teamB.primaryColor || "#3b82f6",
                  opacity: winPctA < 50 ? 0.8 : 0.4,
                }}
              />
            </div>
          </div>
        )}

        {/* Pick buttons */}
        {canPick && (
          <div className="flex gap-2 mt-4">
            <PickButton
              team={teamA!}
              isPicked={pickedTeamId === teamA!.id}
              onPick={() => onPickTeam!(teamA!.id)}
            />
            <PickButton
              team={teamB!}
              isPicked={pickedTeamId === teamB!.id}
              onPick={() => onPickTeam!(teamB!.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PickButton({
  team,
  isPicked,
  onPick,
}: {
  team: Team;
  isPicked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all border active:scale-[0.97]
        ${
          isPicked
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10"
            : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:bg-slate-700/40 hover:border-slate-600 hover:text-slate-200"
        }
      `}
    >
      {isPicked && <span className="mr-1">&#10003;</span>}
      Pick {team.shortName}
    </button>
  );
}

function TeamCard({
  team,
  align,
  isPicked,
  canPick,
  onPick,
}: {
  team: Team | null;
  align: "left" | "right";
  isPicked: boolean;
  canPick: boolean;
  onPick: () => void;
}) {
  if (!team) {
    return (
      <div className="flex-1 text-center">
        <div className="text-slate-600 italic text-sm">TBD</div>
      </div>
    );
  }

  return (
    <div className={`flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.shortName}
            className={`w-12 h-12 object-contain transition-all ${isPicked ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : ""}`}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: team.primaryColor }}
          >
            {team.abbreviation?.substring(0, 3)}
          </div>
        )}
        <div>
          <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getSeedBgColor(team.seed)} ${getSeedColor(team.seed)}`}
            >
              {team.seed}
            </span>
            <span className={`text-base font-bold leading-tight ${isPicked ? "text-emerald-400" : "text-white"}`}>
              {team.shortName}
            </span>
          </div>
          <div className={`text-[10px] text-slate-500 mt-0.5 ${align === "right" ? "text-right" : ""}`}>
            {team.conference} {team.record && `· ${team.record}`}
          </div>
          {/* Compact rankings */}
          <div className={`flex items-center gap-2 mt-1 text-[9px] ${align === "right" ? "flex-row-reverse" : ""}`}>
            {team.rankings.kenpomRank && (
              <span className="text-slate-600">
                KP <span className="text-amber-400/70 font-mono">#{team.rankings.kenpomRank}</span>
              </span>
            )}
            {team.rankings.net && (
              <span className="text-slate-600">
                NET <span className="text-amber-400/70 font-mono">#{team.rankings.net}</span>
              </span>
            )}
            {team.barttorvik.rank > 0 && (
              <span className="text-slate-600">
                T-Rank <span className="text-amber-400/70 font-mono">#{team.barttorvik.rank}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
