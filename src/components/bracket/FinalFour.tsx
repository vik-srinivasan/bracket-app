import { BracketMatchup, UserPicks } from "@/lib/types";
import Matchup from "./Matchup";

interface FinalFourProps {
  matchups: BracketMatchup[];
  picks: UserPicks;
  onPickWinner: (matchupId: string, teamId: string) => void;
  onOpenDetail: (matchupId: string) => void;
  activeMatchupId: string | null;
}

export default function FinalFour({
  matchups,
  picks,
  onPickWinner,
  onOpenDetail,
  activeMatchupId,
}: FinalFourProps) {
  const semi1 = matchups[0];
  const semi2 = matchups[1];
  const championship = matchups[2];

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 min-w-[185px]">
      <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em]">
        Final Four
      </div>

      <div className="w-[168px]">
        <Matchup
          matchup={semi1}
          picks={picks}
          onPickWinner={onPickWinner}
          onOpenDetail={onOpenDetail}
          isActive={activeMatchupId === semi1.id}
        />
      </div>

      {/* Championship with connector lines */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-px h-3 bg-slate-800" />
        <div className="text-[9px] font-bold text-amber-400/80 uppercase tracking-[0.2em]">
          Championship
        </div>
        <div className="w-[168px] relative">
          <div className="absolute -inset-1 rounded-xl bg-amber-400/[0.04] border border-amber-400/10" />
          <div className="relative">
            <Matchup
              matchup={championship}
              picks={picks}
              onPickWinner={onPickWinner}
              onOpenDetail={onOpenDetail}
              isActive={activeMatchupId === championship.id}
            />
          </div>
        </div>
        <div className="w-px h-3 bg-slate-800" />
      </div>

      <div className="w-[168px]">
        <Matchup
          matchup={semi2}
          picks={picks}
          onPickWinner={onPickWinner}
          onOpenDetail={onOpenDetail}
          isActive={activeMatchupId === semi2.id}
        />
      </div>
    </div>
  );
}
