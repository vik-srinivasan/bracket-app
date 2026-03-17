"use client";

import { Team } from "@/lib/types";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface Props {
  teamA: Team | null;
  teamB: Team | null;
  allTeams: Record<string, Team>;
}

function percentileRank(value: number, allValues: number[], lowerIsBetter = false): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  const index = sorted.findIndex((v) => v >= value);
  const percentile = ((index >= 0 ? index : sorted.length) / sorted.length) * 100;
  return lowerIsBetter ? 100 - percentile : percentile;
}

export default function HeadToHeadChart({ teamA, teamB, allTeams }: Props) {
  if (!teamA || !teamB) return null;

  const teams = Object.values(allTeams).filter((t) => t.barttorvik.rank > 0);

  const allKpNetRtg = teams.map((t) => t.kenpom.netRtg).filter(v => v !== 0);
  const allKpORtg = teams.map((t) => t.kenpom.oRtg).filter(v => v !== 0);
  const allKpDRtg = teams.map((t) => t.kenpom.dRtg).filter(v => v !== 0);
  const allSOS = teams.map((t) => t.barttorvik.sos);
  const allBarthag = teams.map((t) => t.barttorvik.barthag);
  const allEMRelRtg = teams.map((t) => t.evanmiya.relativeRating).filter(v => v !== 0);

  const radarData = [
    {
      metric: "KP Offense",
      A: allKpORtg.length > 0 ? percentileRank(teamA.kenpom.oRtg, allKpORtg) : 50,
      B: allKpORtg.length > 0 ? percentileRank(teamB.kenpom.oRtg, allKpORtg) : 50,
    },
    {
      metric: "KP Defense",
      A: allKpDRtg.length > 0 ? percentileRank(teamA.kenpom.dRtg, allKpDRtg, true) : 50,
      B: allKpDRtg.length > 0 ? percentileRank(teamB.kenpom.dRtg, allKpDRtg, true) : 50,
    },
    {
      metric: "KP NetRtg",
      A: allKpNetRtg.length > 0 ? percentileRank(teamA.kenpom.netRtg, allKpNetRtg) : 50,
      B: allKpNetRtg.length > 0 ? percentileRank(teamB.kenpom.netRtg, allKpNetRtg) : 50,
    },
    {
      metric: "Barthag",
      A: percentileRank(teamA.barttorvik.barthag, allBarthag),
      B: percentileRank(teamB.barttorvik.barthag, allBarthag),
    },
    {
      metric: "SOS",
      A: percentileRank(teamA.barttorvik.sos, allSOS),
      B: percentileRank(teamB.barttorvik.sos, allSOS),
    },
    {
      metric: "EM RelRtg",
      A: allEMRelRtg.length > 0 ? percentileRank(teamA.evanmiya.relativeRating, allEMRelRtg) : 50,
      B: allEMRelRtg.length > 0 ? percentileRank(teamB.evanmiya.relativeRating, allEMRelRtg) : 50,
    },
  ];

  return (
    <div className="border border-slate-700/40 rounded-xl overflow-hidden bg-slate-900/40">
      <div className="bg-slate-800/40 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/30">
        <span className="text-sm font-semibold text-slate-300">
          Head-to-Head Comparison
        </span>
      </div>

      <div className="p-4">
        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mb-1">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: teamA.primaryColor }}
            />
            <span className="text-[11px] text-slate-400 font-medium">{teamA.shortName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: teamB.primaryColor }}
            />
            <span className="text-[11px] text-slate-400 font-medium">{teamB.shortName}</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#1e293b" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <Radar
              name={teamA.shortName}
              dataKey="A"
              stroke={teamA.primaryColor}
              fill={teamA.primaryColor}
              fillOpacity={0.15}
              strokeWidth={2}
              animationDuration={800}
            />
            <Radar
              name={teamB.shortName}
              dataKey="B"
              stroke={teamB.primaryColor}
              fill={teamB.primaryColor}
              fillOpacity={0.15}
              strokeWidth={2}
              animationDuration={800}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="text-center text-[9px] text-slate-700 mt-1">
          Percentile rank among tournament teams
        </div>
      </div>
    </div>
  );
}
