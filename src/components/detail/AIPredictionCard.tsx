"use client";

import { useState, useRef } from "react";
import { Team } from "@/lib/types";

interface AIPredictionCardProps {
  teamA: Team | null;
  teamB: Team | null;
  matchupId: string;
}

// Cache predictions across re-renders/re-opens
const predictionCache = new Map<string, string>();

export default function AIPredictionCard({ teamA, teamB, matchupId }: AIPredictionCardProps) {
  const [prediction, setPrediction] = useState<string | null>(predictionCache.get(matchupId) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (!teamA || !teamB) return null;

  async function fetchPrediction() {
    if (loading) return;
    setLoading(true);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const payload = {
        teamA: pick(teamA!),
        teamB: pick(teamB!),
      };

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to get prediction");

      const data = await res.json();
      setPrediction(data.prediction);
      predictionCache.set(matchupId, data.prediction);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Could not generate prediction. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl overflow-hidden">
      {!prediction && !loading && (
        <button
          onClick={fetchPrediction}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <span className="font-semibold text-sm">Ask AI for Prediction</span>
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2.5 px-4 py-3 text-amber-400/70">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Analyzing matchup...</span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3">
          <p className="text-red-400 text-sm text-center">{error}</p>
          <button
            onClick={fetchPrediction}
            className="mt-2 w-full text-center text-amber-400 hover:text-amber-300 text-sm font-medium cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {prediction && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">AI Prediction</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{prediction}</p>
        </div>
      )}
    </div>
  );
}

function pick(t: Team) {
  return {
    name: t.name,
    seed: t.seed,
    record: t.record,
    conference: t.conference,
    kenpom: { rank: t.kenpom.rank, netRtg: t.kenpom.netRtg, oRtg: t.kenpom.oRtg, dRtg: t.kenpom.dRtg },
    barttorvik: { rank: t.barttorvik.rank, adjOE: t.barttorvik.adjOE, adjDE: t.barttorvik.adjDE, barthag: t.barttorvik.barthag, effMargin: t.barttorvik.effMargin },
    evanmiya: { rank: t.evanmiya.rank, oRate: t.evanmiya.oRate, dRate: t.evanmiya.dRate },
    rankings: { net: t.rankings.net, kpiRank: t.rankings.kpiRank, sorRank: t.rankings.sorRank, quadRecord: t.rankings.quadRecord },
    seasonStats: { ppg: t.seasonStats.ppg, oppPpg: t.seasonStats.oppPpg, fgPct: t.seasonStats.fgPct, threePtPct: t.seasonStats.threePtPct, ftPct: t.seasonStats.ftPct, rpg: t.seasonStats.rpg, apg: t.seasonStats.apg, spg: t.seasonStats.spg, bpg: t.seasonStats.bpg, topg: t.seasonStats.topg },
  };
}
