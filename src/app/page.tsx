"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import bracketData from "@/data/bracket-2026.json";
import { BracketData } from "@/lib/types";
import { useBracket } from "@/hooks/useBracket";
import Bracket from "@/components/bracket/Bracket";
import MatchupDetailPanel from "@/components/detail/MatchupDetailPanel";

function BracketPageInner() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const {
    bracket,
    picks,
    pickWinner,
    activeMatchup,
    activeMatchupId,
    detailOpen,
    openDetail,
    closeDetail,
    resetPicks,
    pickCount,
    totalMatchups,
    championTeam,
    shareBracket,
    autoFill,
  } = useBracket(bracketData as BracketData);

  // Open matchup from URL param
  useEffect(() => {
    const matchupParam = searchParams.get("matchup");
    if (matchupParam) {
      openDetail(matchupParam);
    }
  }, [searchParams, openDetail]);

  // Update URL when detail opens/closes
  useEffect(() => {
    if (detailOpen && activeMatchupId) {
      const url = new URL(window.location.href);
      url.searchParams.set("matchup", activeMatchupId);
      window.history.replaceState({}, "", url.toString());
    } else if (!detailOpen) {
      const url = new URL(window.location.href);
      url.searchParams.delete("matchup");
      window.history.replaceState({}, "", url.toString());
    }
  }, [detailOpen, activeMatchupId]);

  return (
    <main className="min-h-screen relative">
      {/* Header */}
      <header className="relative py-6 px-4 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.02] to-transparent" />
        <div className="relative flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <span className="text-amber-400 text-sm font-black">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                    March Madness <span className="text-amber-400">2026</span>
                  </h1>
                  <p className="text-slate-600 text-[10px] leading-tight">
                    NCAA Tournament Bracket
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-slate-600 text-[10px] hidden sm:block">
              Click team to pick · Click <span className="text-amber-400/70">ⓘ</span> for analytics
            </p>
            {pickCount > 0 && (
              <button
                onClick={() => {
                  const url = shareBracket();
                  navigator.clipboard.writeText(url).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="text-[11px] text-slate-400 hover:text-amber-400 transition-all border border-slate-700/60 hover:border-amber-400/40 rounded-lg px-3 py-1.5 hover:bg-amber-400/5"
              >
                {copied ? "Copied!" : "Share"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bracket */}
      <div className="py-4 overflow-x-auto">
        <Bracket
          data={bracket}
          picks={picks}
          onPickWinner={pickWinner}
          onOpenDetail={openDetail}
          activeMatchupId={activeMatchupId}
          pickCount={pickCount}
          totalMatchups={totalMatchups}
          championTeam={championTeam}
          onReset={resetPicks}
          onAutoFill={autoFill}
        />
      </div>

      {/* Detail Panel */}
      {detailOpen && activeMatchup && (
        <MatchupDetailPanel
          matchup={activeMatchup}
          bracket={bracket}
          picks={picks}
          onPickWinner={pickWinner}
          onClose={closeDetail}
        />
      )}
    </main>
  );
}

export default function BracketPage() {
  return (
    <Suspense>
      <BracketPageInner />
    </Suspense>
  );
}
