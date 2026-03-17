import { BracketMatchup, BracketRegion as BracketRegionType, UserPicks } from "@/lib/types";
import { getMatchupsByRound, getRoundName } from "@/lib/bracket-utils";
import Matchup from "./Matchup";

interface RegionProps {
  region: BracketRegionType;
  picks: UserPicks;
  onPickWinner: (matchupId: string, teamId: string) => void;
  onOpenDetail: (matchupId: string) => void;
  activeMatchupId: string | null;
  mirrored?: boolean;
}

function RoundColumn({
  matchups,
  round,
  picks,
  onPickWinner,
  onOpenDetail,
  activeMatchupId,
  mirrored,
  isFirst,
}: {
  matchups: BracketMatchup[];
  round: number;
  picks: UserPicks;
  onPickWinner: (matchupId: string, teamId: string) => void;
  onOpenDetail: (matchupId: string) => void;
  activeMatchupId: string | null;
  mirrored?: boolean;
  isFirst: boolean;
}) {
  return (
    <div className="flex flex-col w-[170px]">
      {isFirst && (
        <div
          className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em] mb-2 text-left px-1"
        >
          {getRoundName(round)}
        </div>
      )}
      <div className={`flex flex-col flex-1 ${round === 1 ? "gap-1" : ""}`}>
        {matchups.map((matchup) =>
          round === 1 ? (
            <Matchup
              key={matchup.id}
              matchup={matchup}
              picks={picks}
              onPickWinner={onPickWinner}
              onOpenDetail={onOpenDetail}
              isActive={activeMatchupId === matchup.id}
              mirrored={mirrored}
            />
          ) : (
            <div key={matchup.id} className="flex-1 flex items-center">
              <div className="w-full">
                <Matchup
                  matchup={matchup}
                  picks={picks}
                  onPickWinner={onPickWinner}
                  onOpenDetail={onOpenDetail}
                  isActive={activeMatchupId === matchup.id}
                  mirrored={mirrored}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Connector lines between rounds — use flex-1 to auto-center with matchups
function RoundConnectors({ count }: { count: number; round: number }) {
  return (
    <div className="flex flex-col flex-1 w-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col">
          <div className="flex-1 border-t border-r border-slate-700/30 rounded-tr-sm" />
          <div className="flex-1 border-b border-r border-slate-700/30 rounded-br-sm" />
        </div>
      ))}
    </div>
  );
}

function MirroredRoundConnectors({ count }: { count: number; round: number }) {
  return (
    <div className="flex flex-col flex-1 w-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col">
          <div className="flex-1 border-t border-l border-slate-700/30 rounded-tl-sm" />
          <div className="flex-1 border-b border-l border-slate-700/30 rounded-bl-sm" />
        </div>
      ))}
    </div>
  );
}

export default function Region({
  region,
  picks,
  onPickWinner,
  onOpenDetail,
  activeMatchupId,
  mirrored,
}: RegionProps) {
  const rounds = [1, 2, 3, 4];
  const matchupCounts = [8, 4, 2, 1];

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-sm font-bold text-amber-400/90 tracking-wide">
          {region.name}
        </span>
        <span className="text-slate-500 text-[10px] font-normal">
          {region.location}
        </span>
      </div>
      <div
        className={`flex ${mirrored ? "flex-row-reverse" : "flex-row"} items-stretch`}
      >
        {rounds.map((round, idx) => {
          const matchups = getMatchupsByRound(region.matchups, round);
          const isFirst = idx === 0;

          return (
            <div key={round} className={`flex ${mirrored ? "flex-row-reverse" : "flex-row"} items-stretch`}>
              <RoundColumn
                matchups={matchups}
                round={round}
                picks={picks}
                onPickWinner={onPickWinner}
                onOpenDetail={onOpenDetail}
                activeMatchupId={activeMatchupId}
                mirrored={mirrored}
                isFirst={isFirst}
              />
              {/* Add connectors between columns (not after last) */}
              {idx < rounds.length - 1 && (
                mirrored ? (
                  <MirroredRoundConnectors count={matchupCounts[idx] / 2} round={round} />
                ) : (
                  <RoundConnectors count={matchupCounts[idx] / 2} round={round} />
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
