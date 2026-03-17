import { ScheduleGame } from "@/lib/types";

interface Props {
  teamAName: string;
  teamBName: string;
  scheduleA: ScheduleGame[];
  scheduleB: ScheduleGame[];
}

function GameRow({ game }: { game: ScheduleGame }) {
  const date = new Date(game.date);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const isRankedWin = game.result === "W" && game.opponentRank && game.opponentRank <= 50;
  const isBadLoss = game.result === "L" && game.opponentRank && game.opponentRank > 100;

  return (
    <div className={`flex items-center gap-1.5 py-1 text-xs ${isRankedWin ? "bg-emerald-500/5" : isBadLoss ? "bg-red-500/5" : ""} rounded px-1`}>
      <span className="text-slate-500 w-11 shrink-0 text-[10px]">{dateStr}</span>
      <span
        className={`font-bold w-3 ${game.result === "W" ? "text-emerald-400" : game.result === "L" ? "text-red-400" : "text-slate-600"}`}
      >
        {game.result || "-"}
      </span>
      <span className="text-slate-400 truncate flex-1">
        {game.isNeutral ? "vs " : game.isHome ? "vs " : "@ "}
        {game.opponent}
      </span>
      {game.opponentRank && game.opponentRank <= 100 && (
        <span className="text-[9px] text-amber-400/70 font-mono shrink-0">
          #{game.opponentRank}
        </span>
      )}
      <span className="text-slate-400 font-mono shrink-0 text-[10px]">
        {game.score || ""}
      </span>
    </div>
  );
}

function TeamScheduleColumn({
  name,
  schedule,
}: {
  name: string;
  schedule: ScheduleGame[];
}) {
  const played = schedule.filter((g) => g.result);
  const last10 = played.slice(-10);
  const wins = played.filter((g) => g.result === "W").length;
  const losses = played.filter((g) => g.result === "L").length;

  // Compute quad-like breakdown
  const topWins = played.filter(
    (g) => g.result === "W" && g.opponentRank && g.opponentRank <= 30
  );
  const topLosses = played.filter(
    (g) => g.result === "L" && g.opponentRank && g.opponentRank <= 30
  );

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {name}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          {wins}-{losses}
        </div>
      </div>

      {/* Top wins summary */}
      {topWins.length > 0 && (
        <div className="text-[10px] text-emerald-400/80 mb-1.5">
          Top 30 wins: {topWins.length} ({topWins.map((g) => `#${g.opponentRank}`).join(", ")})
        </div>
      )}
      {topLosses.length > 0 && (
        <div className="text-[10px] text-red-400/80 mb-1.5">
          Top 30 losses: {topLosses.length} ({topLosses.map((g) => `#${g.opponentRank}`).join(", ")})
        </div>
      )}

      {/* Last 10 games */}
      <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">
        Last 10 Games
      </div>
      {last10.length > 0 ? (
        last10.map((g, i) => <GameRow key={i} game={g} />)
      ) : (
        <div className="text-xs text-slate-600 italic">No schedule data</div>
      )}
    </div>
  );
}

function findCommonOpponents(
  schedA: ScheduleGame[],
  schedB: ScheduleGame[]
): {
  opponent: string;
  rank: number | null;
  resultA: ScheduleGame | undefined;
  resultB: ScheduleGame | undefined;
}[] {
  const opponentsA = new Map<string, ScheduleGame>();
  for (const g of schedA) {
    if (g.result) opponentsA.set(g.opponent.toLowerCase(), g);
  }

  const common: {
    opponent: string;
    rank: number | null;
    resultA: ScheduleGame | undefined;
    resultB: ScheduleGame | undefined;
  }[] = [];

  for (const g of schedB) {
    if (g.result) {
      const match = opponentsA.get(g.opponent.toLowerCase());
      if (match) {
        common.push({
          opponent: g.opponent,
          rank: g.opponentRank || match.opponentRank || null,
          resultA: match,
          resultB: g,
        });
      }
    }
  }

  return common;
}

export default function ScheduleHistory({
  teamAName,
  teamBName,
  scheduleA,
  scheduleB,
}: Props) {
  const commonOpps = findCommonOpponents(scheduleA, scheduleB);

  return (
    <div className="border border-slate-700/40 rounded-xl overflow-hidden bg-slate-900/40">
      <div className="bg-slate-800/40 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/30">
        <span className="text-sm font-semibold text-slate-300">
          Schedule & Resume
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-700/20">
        <TeamScheduleColumn name={teamAName} schedule={scheduleA} />
        <TeamScheduleColumn name={teamBName} schedule={scheduleB} />
      </div>

      {/* Common opponents */}
      {commonOpps.length > 0 && (
        <div className="border-t border-slate-700/20 p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Common Opponents
          </div>
          {commonOpps.map((co, i) => (
            <div key={i} className="flex items-center gap-2 py-1 text-xs">
              <span className="flex-1 text-right">
                <span
                  className={`font-bold ${co.resultA?.result === "W" ? "text-emerald-400" : "text-red-400"}`}
                >
                  {co.resultA?.result}
                </span>
                <span className="text-slate-400 ml-1 text-[10px]">
                  {co.resultA?.score}
                </span>
              </span>
              <span className="text-slate-400 text-center w-28 shrink-0 truncate text-[10px]">
                {co.opponent}
                {co.rank && (
                  <span className="text-amber-400/60 ml-1">#{co.rank}</span>
                )}
              </span>
              <span className="flex-1 text-left">
                <span
                  className={`font-bold ${co.resultB?.result === "W" ? "text-emerald-400" : "text-red-400"}`}
                >
                  {co.resultB?.result}
                </span>
                <span className="text-slate-400 ml-1 text-[10px]">
                  {co.resultB?.score}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
