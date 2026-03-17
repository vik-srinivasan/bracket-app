import { MatchupOdds, Team } from "@/lib/types";

interface Props {
  odds: MatchupOdds | null;
  teamA: Team | null;
  teamB: Team | null;
}

export default function VegasOddsCard({ odds, teamA, teamB }: Props) {
  const bk = odds?.bookmakers?.[0];
  const teamAName = teamA?.shortName || "TBD";
  const teamBName = teamB?.shortName || "TBD";

  // KenPom projected spread using real KenPom NetRtg
  const kpSpread =
    teamA && teamB && teamA.kenpom.netRtg && teamB.kenpom.netRtg
      ? teamA.kenpom.netRtg - teamB.kenpom.netRtg
      : null;

  // T-Rank projected spread using Barttorvik AdjEM
  const bartSpread =
    teamA && teamB && teamA.barttorvik.effMargin && teamB.barttorvik.effMargin
      ? teamA.barttorvik.effMargin - teamB.barttorvik.effMargin
      : null;

  // EvanMiya projected spread from relative rating
  const emSpread =
    teamA && teamB && teamA.evanmiya.relativeRating && teamB.evanmiya.relativeRating
      ? teamA.evanmiya.relativeRating - teamB.evanmiya.relativeRating
      : null;

  const hasAnyData = bk || kpSpread !== null || bartSpread !== null;

  return (
    <div className="border border-slate-700/40 rounded-xl overflow-hidden bg-slate-900/40">
      <div className="bg-slate-800/40 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/30">
        <span className="text-sm font-semibold text-slate-300">
          Odds & Projected Spreads
        </span>
        {bk && (
          <span className="text-[10px] text-slate-600 ml-auto">
            via {bk.name}
          </span>
        )}
      </div>

      <div className="p-4">
        {!hasAnyData ? (
          <div className="text-sm text-slate-500 text-center py-2">
            Odds not yet available. Configure ODDS_API_KEY in .env.local and run{" "}
            <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">
              npm run fetch-odds
            </code>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Projected spreads — always show if we have team data */}
            {(kpSpread !== null || bartSpread !== null || emSpread !== null) && (
              <div className="grid grid-cols-3 gap-2">
                {kpSpread !== null && (
                  <SpreadCard
                    label="KenPom Spread"
                    spread={kpSpread}
                    teamAName={teamAName}
                    teamBName={teamBName}
                  />
                )}
                {bartSpread !== null && (
                  <SpreadCard
                    label="T-Rank Spread"
                    spread={bartSpread}
                    teamAName={teamAName}
                    teamBName={teamBName}
                  />
                )}
                {emSpread !== null && (
                  <SpreadCard
                    label="EvanMiya Spread"
                    spread={emSpread}
                    teamAName={teamAName}
                    teamBName={teamBName}
                  />
                )}
              </div>
            )}

            {/* Vegas odds */}
            {bk && (
              <div className="grid grid-cols-3 gap-2">
                {/* Spread */}
                <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                    Vegas Spread
                  </div>
                  {bk.spreads.map((s, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-slate-300 text-xs">{s.team}</span>
                      <span className="text-amber-400 font-mono ml-1 text-xs">
                        {s.point > 0 ? "+" : ""}
                        {s.point}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Moneyline */}
                <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                    Moneyline
                  </div>
                  {bk.moneyline.map((m, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-slate-300 text-xs">{m.team}</span>
                      <span
                        className={`font-mono ml-1 text-xs ${m.price > 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {m.price > 0 ? "+" : ""}
                        {m.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                    Over/Under
                  </div>
                  {bk.totals.map((t, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-slate-300 text-xs">{t.name}</span>
                      <span className="text-amber-400 font-mono ml-1 text-xs">
                        {t.point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpreadCard({
  label,
  spread,
  teamAName,
  teamBName,
}: {
  label: string;
  spread: number;
  teamAName: string;
  teamBName: string;
}) {
  const favored = spread > 0.5 ? teamAName : spread < -0.5 ? teamBName : null;
  const spreadVal = Math.abs(spread);

  return (
    <div className="bg-amber-400/[0.04] border border-amber-400/15 rounded-lg p-2.5 text-center">
      <div className="text-[8px] text-amber-400/60 uppercase font-semibold tracking-wider mb-0.5">
        {label}
      </div>
      {favored ? (
        <div className="font-mono text-sm font-bold text-amber-400">
          {favored} <span className="text-amber-400/70">-{spreadVal.toFixed(1)}</span>
        </div>
      ) : (
        <div className="font-mono text-sm font-bold text-amber-400/80">PICK</div>
      )}
    </div>
  );
}
