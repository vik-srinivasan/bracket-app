import { BracketData, BracketMatchup, BracketSlot, RegionName, UserPicks } from "@/lib/types";
import Region from "./Region";
import FinalFour from "./FinalFour";
import Matchup from "./Matchup";

interface BracketProps {
  data: BracketData;
  picks: UserPicks;
  onPickWinner: (matchupId: string, teamId: string) => void;
  onOpenDetail: (matchupId: string) => void;
  activeMatchupId: string | null;
  pickCount: number;
  totalMatchups: number;
  championTeam: BracketSlot | null;
  onReset: () => void;
  onAutoFill?: (mode: "chalk" | "analytics") => void;
}

export default function Bracket({
  data,
  picks,
  onPickWinner,
  onOpenDetail,
  activeMatchupId,
  pickCount,
  totalMatchups,
  championTeam,
  onReset,
  onAutoFill,
}: BracketProps) {
  const leftTop: RegionName = "east";
  const leftBottom: RegionName = "south";
  const rightTop: RegionName = "west";
  const rightBottom: RegionName = "midwest";

  const pct = Math.round((pickCount / totalMatchups) * 100);

  return (
    <div>
      {/* Progress & Controls */}
      <div className="flex items-center justify-center gap-3 mb-3 px-4">
        <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/60 rounded-full px-4 py-1.5">
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${pct === 100 ? "animate-shimmer" : "bg-amber-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-300 font-mono tabular-nums">
            {pickCount}<span className="text-slate-500">/{totalMatchups}</span>
          </span>
          {pickCount > 0 ? (
            <button
              onClick={onReset}
              className="text-[10px] text-slate-500 hover:text-red-400 transition-colors ml-1"
            >
              Reset
            </button>
          ) : onAutoFill ? (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={() => onAutoFill("chalk")}
                className="text-[10px] text-slate-500 hover:text-amber-400 transition-all border border-slate-800 hover:border-amber-400/30 rounded-full px-2.5 py-0.5 hover:bg-amber-400/5"
              >
                Chalk
              </button>
              <button
                onClick={() => onAutoFill("analytics")}
                className="text-[10px] text-slate-500 hover:text-emerald-400 transition-all border border-slate-800 hover:border-emerald-400/30 rounded-full px-2.5 py-0.5 hover:bg-emerald-400/5"
              >
                Analytics
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Champion display */}
      {championTeam && (
        <div className="text-center mb-5 mx-auto max-w-sm animate-scale-in">
          <div className="relative py-4 px-6 rounded-xl border border-amber-400/30 bg-gradient-to-b from-amber-400/10 to-amber-400/[0.02] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)]" />
            <div className="relative">
              <div className="text-[10px] text-amber-400/80 uppercase tracking-[0.2em] font-semibold mb-1">
                Your Champion
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                ({championTeam.seed}) {championTeam.teamName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bracket layout */}
      <div className="flex items-start justify-center gap-3 px-4 pb-8 overflow-x-auto min-w-fit">
        <div className="flex flex-col gap-8">
          <Region
            region={data.regions[leftTop]}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenDetail={onOpenDetail}
            activeMatchupId={activeMatchupId}
          />
          <Region
            region={data.regions[leftBottom]}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenDetail={onOpenDetail}
            activeMatchupId={activeMatchupId}
          />
        </div>

        <div className="flex items-center self-center">
          <FinalFour
            matchups={data.finalFour}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenDetail={onOpenDetail}
            activeMatchupId={activeMatchupId}
          />
        </div>

        <div className="flex flex-col gap-8">
          <Region
            region={data.regions[rightTop]}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenDetail={onOpenDetail}
            activeMatchupId={activeMatchupId}
            mirrored
          />
          <Region
            region={data.regions[rightBottom]}
            picks={picks}
            onPickWinner={onPickWinner}
            onOpenDetail={onOpenDetail}
            activeMatchupId={activeMatchupId}
            mirrored
          />
        </div>
      </div>

      {/* First Four play-in games */}
      {data.firstFour && data.firstFour.length > 0 && (
        <div className="mt-2 px-4 pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-slate-800" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">
              First Four &mdash; Dayton, OH
            </span>
            <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-slate-800" />
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {data.firstFour.map((matchup) => {
              const regionSlug = matchup.winnerSlotId?.split("-")[0] || "";
              const regionLabel = regionSlug.charAt(0).toUpperCase() + regionSlug.slice(1);
              return (
                <div key={matchup.id} className="w-48">
                  <div className="text-[9px] text-slate-600 text-center mb-1 font-medium uppercase tracking-wider">
                    {matchup.topTeam?.seed === 16 ? `${regionLabel} 16 Seed` : `${regionLabel} 11 Seed`}
                  </div>
                  <Matchup
                    matchup={matchup}
                    picks={picks}
                    onPickWinner={onPickWinner}
                    onOpenDetail={onOpenDetail}
                    isActive={activeMatchupId === matchup.id}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
