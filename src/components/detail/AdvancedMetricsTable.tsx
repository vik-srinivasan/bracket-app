"use client";

import { useState } from "react";
import { Team, EfficiencySource } from "@/lib/types";

interface Props {
  teamA: Team | null;
  teamB: Team | null;
}

interface MetricRow {
  label: string;
  valueA: number | string;
  valueB: number | string;
  format?: "number" | "rank" | "pct" | "decimal" | "signed";
  lowerIsBetter?: boolean;
}

function formatValue(value: number | string, format: string = "number"): string {
  if (typeof value === "string") return value;
  if (value === 0 || value === null) return "--";
  switch (format) {
    case "rank":
      return `#${value}`;
    case "pct":
      return `${value.toFixed(1)}%`;
    case "decimal":
      return value.toFixed(3);
    case "signed":
      return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    default:
      return value.toFixed(1);
  }
}

function MetricRowComponent({
  label,
  valueA,
  valueB,
  format = "number",
  lowerIsBetter = false,
}: MetricRow) {
  const numA = typeof valueA === "number" ? valueA : 0;
  const numB = typeof valueB === "number" ? valueB : 0;
  const bothValid = numA !== 0 && numB !== 0;

  const aBetter = bothValid && (lowerIsBetter ? numA < numB : numA > numB);
  const bBetter = bothValid && (lowerIsBetter ? numB < numA : numB > numA);

  return (
    <div className="flex items-center py-1.5 px-2 hover:bg-slate-800/20 rounded transition-colors group/row">
      <div
        className={`flex-1 text-right font-mono text-[13px] tabular-nums ${aBetter ? "text-emerald-400 font-bold" : "text-slate-300"}`}
      >
        {formatValue(valueA, format)}
      </div>
      <div className="w-28 text-center text-[10px] text-slate-500 font-medium px-2 shrink-0">
        {label}
      </div>
      <div
        className={`flex-1 text-left font-mono text-[13px] tabular-nums ${bBetter ? "text-emerald-400 font-bold" : "text-slate-300"}`}
      >
        {formatValue(valueB, format)}
      </div>
    </div>
  );
}

function RankingPill({
  label,
  rankA,
  rankB,
}: {
  label: string;
  rankA: number | null;
  rankB: number | null;
}) {
  if (!rankA && !rankB) return null;
  const aBetter = rankA && rankB && rankA < rankB;
  const bBetter = rankA && rankB && rankB < rankA;

  return (
    <div className="flex items-center gap-1 bg-slate-800/40 rounded-md px-2 py-1 min-w-0">
      <span
        className={`font-mono text-[11px] ${aBetter ? "text-emerald-400 font-bold" : "text-slate-300"}`}
      >
        {rankA ? `#${rankA}` : "--"}
      </span>
      <span className="text-[8px] text-slate-500 font-bold uppercase shrink-0 tracking-wider">
        {label}
      </span>
      <span
        className={`font-mono text-[11px] ${bBetter ? "text-emerald-400 font-bold" : "text-slate-300"}`}
      >
        {rankB ? `#${rankB}` : "--"}
      </span>
    </div>
  );
}

function QuadRecordDisplay({ record }: { record: string }) {
  const [wins, losses] = record.split("-").map(Number);
  const isGood = wins > 0 && losses <= 2;
  return (
    <span className={`text-xs font-mono ${isGood ? "text-emerald-400" : "text-slate-400"}`}>
      {record}
    </span>
  );
}

const SOURCE_LABELS: Record<EfficiencySource, string> = {
  kenpom: "KenPom",
  barttorvik: "Barttorvik",
  evanmiya: "EvanMiya",
};

export default function AdvancedMetricsTable({ teamA, teamB }: Props) {
  const [source, setSource] = useState<EfficiencySource>("kenpom");

  if (!teamA || !teamB) return null;

  // Compute projected spread from selected source
  let spreadA = 0;
  if (source === "kenpom") {
    spreadA = teamA.kenpom.netRtg - teamB.kenpom.netRtg;
  } else if (source === "barttorvik") {
    spreadA = teamA.barttorvik.effMargin - teamB.barttorvik.effMargin;
  } else {
    spreadA = teamA.evanmiya.relativeRating - teamB.evanmiya.relativeRating;
  }
  // Convert efficiency margin difference to spread (rough: EM diff * ~0.4 for per-game)
  // Actually for Barttorvik effMargin is already per-game-equivalent. EvanMiya relative rating
  // is also a margin. Just use the raw difference as the projected spread.
  const projSpreadVal = -(spreadA / 1.0); // negative means teamA is favored
  // Barttorvik: effMargin is pts/100 poss above average. Diff ~ spread on neutral.
  // Actually the standard conversion: spread ≈ AdjEM_diff * (avgTempo/100) * 0.5
  // But a simpler and commonly used heuristic: spread ≈ effMargin_diff (already in pts/game)
  // For Barttorvik, effMargin IS pts/game-equivalent already.

  const getEfficiencyMetrics = (): MetricRow[] => {
    if (source === "kenpom") {
      return [
        { label: "Adj. Offense", valueA: teamA.kenpom.oRtg, valueB: teamB.kenpom.oRtg },
        { label: "Off. Rank", valueA: teamA.kenpom.oRtgRank, valueB: teamB.kenpom.oRtgRank, format: "rank", lowerIsBetter: true },
        { label: "Adj. Defense", valueA: teamA.kenpom.dRtg, valueB: teamB.kenpom.dRtg, lowerIsBetter: true },
        { label: "Def. Rank", valueA: teamA.kenpom.dRtgRank, valueB: teamB.kenpom.dRtgRank, format: "rank", lowerIsBetter: true },
        { label: "Net Rating", valueA: teamA.kenpom.netRtg, valueB: teamB.kenpom.netRtg, format: "signed" },
        { label: "Adj. Tempo", valueA: teamA.kenpom.adjTempo, valueB: teamB.kenpom.adjTempo },
        { label: "Tempo Rank", valueA: teamA.kenpom.adjTempoRank, valueB: teamB.kenpom.adjTempoRank, format: "rank", lowerIsBetter: true },
        { label: "SOS NetRtg", valueA: teamA.kenpom.sosNetRtg, valueB: teamB.kenpom.sosNetRtg, format: "signed" },
        { label: "SOS ORtg", valueA: teamA.kenpom.sosORtg, valueB: teamB.kenpom.sosORtg },
        { label: "NC SOS", valueA: teamA.kenpom.ncsosNetRtg, valueB: teamB.kenpom.ncsosNetRtg, format: "signed" },
        { label: "Luck", valueA: teamA.kenpom.luck, valueB: teamB.kenpom.luck, format: "decimal" },
      ];
    } else if (source === "barttorvik") {
      return [
        { label: "Adj. Offense", valueA: teamA.barttorvik.adjOE, valueB: teamB.barttorvik.adjOE },
        { label: "Off. Rank", valueA: teamA.barttorvik.adjOERank, valueB: teamB.barttorvik.adjOERank, format: "rank", lowerIsBetter: true },
        { label: "Adj. Defense", valueA: teamA.barttorvik.adjDE, valueB: teamB.barttorvik.adjDE, lowerIsBetter: true },
        { label: "Def. Rank", valueA: teamA.barttorvik.adjDERank, valueB: teamB.barttorvik.adjDERank, format: "rank", lowerIsBetter: true },
        { label: "Eff. Margin", valueA: teamA.barttorvik.effMargin, valueB: teamB.barttorvik.effMargin, format: "signed" },
        { label: "Barthag", valueA: teamA.barttorvik.barthag, valueB: teamB.barttorvik.barthag, format: "decimal" },
        { label: "Tempo", valueA: teamA.barttorvik.tempo, valueB: teamB.barttorvik.tempo },
        { label: "Tempo Rank", valueA: teamA.barttorvik.tempoRank, valueB: teamB.barttorvik.tempoRank, format: "rank", lowerIsBetter: true },
        { label: "SOS", valueA: teamA.barttorvik.sos, valueB: teamB.barttorvik.sos },
        { label: "NC SOS", valueA: teamA.barttorvik.ncsos, valueB: teamB.barttorvik.ncsos },
      ];
    } else {
      return [
        { label: "O-Rate", valueA: teamA.evanmiya.oRate, valueB: teamB.evanmiya.oRate, format: "signed" },
        { label: "Off. Rank", valueA: teamA.evanmiya.offRank, valueB: teamB.evanmiya.offRank, format: "rank", lowerIsBetter: true },
        { label: "D-Rate", valueA: teamA.evanmiya.dRate, valueB: teamB.evanmiya.dRate, format: "signed" },
        { label: "Def. Rank", valueA: teamA.evanmiya.defRank, valueB: teamB.evanmiya.defRank, format: "rank", lowerIsBetter: true },
        { label: "Relative Rtg", valueA: teamA.evanmiya.relativeRating, valueB: teamB.evanmiya.relativeRating, format: "signed" },
        { label: "True Tempo", valueA: teamA.evanmiya.trueTempo, valueB: teamB.evanmiya.trueTempo },
        { label: "Tempo Rank", valueA: teamA.evanmiya.tempoRank, valueB: teamB.evanmiya.tempoRank, format: "rank", lowerIsBetter: true },
        { label: "Kill Shots/G", valueA: teamA.evanmiya.killShotsPerGame, valueB: teamB.evanmiya.killShotsPerGame, format: "decimal" },
        { label: "KS Conceded", valueA: teamA.evanmiya.killShotsConceded, valueB: teamB.evanmiya.killShotsConceded, format: "decimal", lowerIsBetter: true },
        { label: "KS Margin", valueA: teamA.evanmiya.killShotsMargin, valueB: teamB.evanmiya.killShotsMargin, format: "signed" },
      ];
    }
  };

  // Key ratings always shown
  const kpNet_A = teamA.kenpom.netRtg;
  const kpNet_B = teamB.kenpom.netRtg;
  const emRR_A = teamA.evanmiya.relativeRating;
  const emRR_B = teamB.evanmiya.relativeRating;

  return (
    <div className="border border-slate-700/40 rounded-xl overflow-hidden bg-slate-900/40">
      {/* Header with source selector */}
      <div className="bg-slate-800/40 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/30">
        <span className="text-sm font-semibold text-slate-300">
          Advanced Metrics
        </span>
        <div className="ml-auto flex items-center gap-0.5 bg-slate-800/60 rounded-lg p-0.5">
          {(Object.entries(SOURCE_LABELS) as [EfficiencySource, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setSource(key)}
                className={`text-[10px] px-2.5 py-1 rounded-md transition-all font-medium ${
                  source === key
                    ? "bg-amber-400/15 text-amber-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* All Rankings — compact grid */}
      <div className="px-4 py-3 border-b border-slate-700/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
            {teamA.shortName}
          </span>
          <span className="text-[9px] font-semibold text-slate-700 uppercase tracking-wider">
            Rankings
          </span>
          <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
            {teamB.shortName}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 justify-center">
          <RankingPill label="NET" rankA={teamA.rankings.net} rankB={teamB.rankings.net} />
          <RankingPill label="KP" rankA={teamA.rankings.kenpomRank} rankB={teamB.rankings.kenpomRank} />
          <RankingPill label="T-Rank" rankA={teamA.rankings.barttovikRank || teamA.barttorvik.rank || null} rankB={teamB.rankings.barttovikRank || teamB.barttorvik.rank || null} />
          <RankingPill label="EM" rankA={teamA.rankings.evanmiyaRank} rankB={teamB.rankings.evanmiyaRank} />
          <RankingPill label="KPI" rankA={teamA.rankings.kpiRank} rankB={teamB.rankings.kpiRank} />
          <RankingPill label="SOR" rankA={teamA.rankings.sorRank} rankB={teamB.rankings.sorRank} />
        </div>
      </div>

      {/* Key Power Ratings — always visible */}
      <div className="px-4 py-3 border-b border-slate-700/20">
        <div className="grid grid-cols-2 gap-3">
          {/* KenPom Net Rating */}
          <div className="bg-slate-800/30 rounded-lg p-2.5 text-center border border-slate-800/40">
            <div className="text-[8px] text-slate-600 uppercase font-semibold tracking-wider mb-1">
              KenPom NetRtg
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={`font-mono text-sm font-black ${kpNet_A > kpNet_B ? "text-emerald-400" : "text-slate-300"}`}>
                {kpNet_A > 0 ? "+" : ""}{kpNet_A.toFixed(1)}
              </span>
              <span className="text-[8px] text-slate-600">vs</span>
              <span className={`font-mono text-sm font-black ${kpNet_B > kpNet_A ? "text-emerald-400" : "text-slate-300"}`}>
                {kpNet_B > 0 ? "+" : ""}{kpNet_B.toFixed(1)}
              </span>
            </div>
          </div>
          {/* EvanMiya Relative Rating */}
          <div className="bg-slate-800/30 rounded-lg p-2.5 text-center border border-slate-800/40">
            <div className="text-[8px] text-slate-600 uppercase font-semibold tracking-wider mb-1">
              EvanMiya RelRtg
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={`font-mono text-sm font-black ${emRR_A > emRR_B ? "text-emerald-400" : "text-slate-300"}`}>
                {emRR_A > 0 ? "+" : ""}{emRR_A.toFixed(1)}
              </span>
              <span className="text-[8px] text-slate-600">vs</span>
              <span className={`font-mono text-sm font-black ${emRR_B > emRR_A ? "text-emerald-400" : "text-slate-300"}`}>
                {emRR_B > 0 ? "+" : ""}{emRR_B.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Projected Spread */}
        <div className="mt-2.5 bg-amber-400/[0.04] border border-amber-400/15 rounded-lg p-3 text-center">
          <div className="text-[8px] text-amber-400/60 uppercase font-semibold tracking-wider mb-1">
            {SOURCE_LABELS[source]} Projected Spread
          </div>
          <div className="font-mono text-lg font-black text-amber-400">
            {Math.abs(spreadA) < 0.5
              ? "PICK 'EM"
              : `${spreadA > 0 ? teamA.shortName : teamB.shortName} -${Math.abs(spreadA).toFixed(1)}`}
          </div>
        </div>
      </div>

      {/* Quad Records */}
      {(teamA.rankings.quadRecord || teamB.rankings.quadRecord) && (
        <div className="px-4 py-3 border-b border-slate-700/20">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">
            Quad Record
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold text-center">
                {teamA.shortName}
              </div>
              {teamA.rankings.quadRecord ? (
                <div className="flex justify-center gap-2 text-xs">
                  {(["q1", "q2", "q3", "q4"] as const).map((q) => (
                    <div key={q} className="text-center">
                      <div className="text-[9px] text-slate-600 uppercase">{q}</div>
                      <QuadRecordDisplay record={teamA.rankings.quadRecord![q]} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-600">--</div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold text-center">
                {teamB.shortName}
              </div>
              {teamB.rankings.quadRecord ? (
                <div className="flex justify-center gap-2 text-xs">
                  {(["q1", "q2", "q3", "q4"] as const).map((q) => (
                    <div key={q} className="text-center">
                      <div className="text-[9px] text-slate-600 uppercase">{q}</div>
                      <QuadRecordDisplay record={teamB.rankings.quadRecord![q]} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-600">--</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center px-5 py-2 border-b border-slate-700/20">
        <div className="flex-1 text-right text-xs font-semibold text-slate-400">
          {teamA.shortName}
        </div>
        <div className="w-32 text-center text-[10px] text-slate-600">
          {SOURCE_LABELS[source]}
        </div>
        <div className="flex-1 text-left text-xs font-semibold text-slate-400">
          {teamB.shortName}
        </div>
      </div>

      {/* Source-specific efficiency metrics */}
      <div className="px-3 py-2">
        {getEfficiencyMetrics().map((metric) => (
          <MetricRowComponent key={metric.label} {...metric} />
        ))}
      </div>

      {/* Team Shooting Stats */}
      {(teamA.seasonStats.fgPct > 0 || teamB.seasonStats.fgPct > 0) && (
        <>
          <div className="flex items-center px-5 py-2 border-y border-slate-700/20">
            <div className="flex-1 text-right text-xs font-semibold text-slate-400">
              {teamA.shortName}
            </div>
            <div className="w-32 text-center text-[10px] text-slate-600">
              Team Shooting
            </div>
            <div className="flex-1 text-left text-xs font-semibold text-slate-400">
              {teamB.shortName}
            </div>
          </div>
          <div className="px-3 py-2">
            <MetricRowComponent label="3P%" valueA={teamA.seasonStats.threePtPct} valueB={teamB.seasonStats.threePtPct} format="pct" />
            <MetricRowComponent label="3P Rate" valueA={teamA.seasonStats.threePtRate} valueB={teamB.seasonStats.threePtRate} format="pct" />
            <MetricRowComponent label="2P%" valueA={teamA.seasonStats.twoPtPct} valueB={teamB.seasonStats.twoPtPct} format="pct" />
            <MetricRowComponent label="FG%" valueA={teamA.seasonStats.fgPct} valueB={teamB.seasonStats.fgPct} format="pct" />
            <MetricRowComponent label="FT%" valueA={teamA.seasonStats.ftPct} valueB={teamB.seasonStats.ftPct} format="pct" />
            <MetricRowComponent label="PPG" valueA={teamA.seasonStats.ppg} valueB={teamB.seasonStats.ppg} />
            <MetricRowComponent label="RPG" valueA={teamA.seasonStats.rpg} valueB={teamB.seasonStats.rpg} />
            <MetricRowComponent label="APG" valueA={teamA.seasonStats.apg} valueB={teamB.seasonStats.apg} />
            <MetricRowComponent label="SPG" valueA={teamA.seasonStats.spg} valueB={teamB.seasonStats.spg} />
            <MetricRowComponent label="BPG" valueA={teamA.seasonStats.bpg} valueB={teamB.seasonStats.bpg} />
            <MetricRowComponent label="TOPG" valueA={teamA.seasonStats.topg} valueB={teamB.seasonStats.topg} lowerIsBetter />
          </div>
        </>
      )}
    </div>
  );
}
