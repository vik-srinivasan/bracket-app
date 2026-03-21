"use client";

import { useEffect, useState } from "react";
import { BracketData, BracketMatchup, Team, Player, ScheduleGame, MatchupOdds, ROUND_NAMES, UserPicks } from "@/lib/types";
import teamsData from "@/data/teams.json";
import oddsData from "@/data/odds.json";
import TeamComparisonHeader from "./TeamComparisonHeader";
import AdvancedMetricsTable from "./AdvancedMetricsTable";
import HeadToHeadChart from "./HeadToHeadChart";
import KeyPlayersSection from "./KeyPlayersSection";
import ScheduleHistory from "./ScheduleHistory";
import VegasOddsCard from "./VegasOddsCard";
import FutureMatchups from "./FutureMatchups";
import AIPredictionCard from "./AIPredictionCard";

interface MatchupDetailPanelProps {
  matchup: BracketMatchup;
  bracket: BracketData;
  picks: UserPicks;
  onPickWinner: (matchupId: string, teamId: string) => void;
  onClose: () => void;
}

const allTeams = teamsData as Record<string, Team>;
const allOdds = oddsData as MatchupOdds[];

export default function MatchupDetailPanel({
  matchup,
  bracket,
  picks,
  onPickWinner,
  onClose,
}: MatchupDetailPanelProps) {
  const roundName = ROUND_NAMES[matchup.round] || "Round";
  const teamA = matchup.topTeam ? allTeams[matchup.topTeam.teamId] : null;
  const teamB = matchup.bottomTeam ? allTeams[matchup.bottomTeam.teamId] : null;

  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [scheduleA, setScheduleA] = useState<ScheduleGame[]>([]);
  const [scheduleB, setScheduleB] = useState<ScheduleGame[]>([]);

  const pickedTeamId = picks[matchup.id] || null;

  // Load per-team data dynamically
  useEffect(() => {
    async function loadTeamData() {
      if (matchup.topTeam) {
        try {
          const roster = await import(
            `@/data/team-rosters/${matchup.topTeam.teamId}.json`
          );
          setPlayersA(roster.default || []);
        } catch {
          setPlayersA([]);
        }
        try {
          const sched = await import(
            `@/data/team-schedules/${matchup.topTeam.teamId}.json`
          );
          setScheduleA(sched.default || []);
        } catch {
          setScheduleA([]);
        }
      }
      if (matchup.bottomTeam) {
        try {
          const roster = await import(
            `@/data/team-rosters/${matchup.bottomTeam.teamId}.json`
          );
          setPlayersB(roster.default || []);
        } catch {
          setPlayersB([]);
        }
        try {
          const sched = await import(
            `@/data/team-schedules/${matchup.bottomTeam.teamId}.json`
          );
          setScheduleB(sched.default || []);
        } catch {
          setScheduleB([]);
        }
      }
    }
    loadTeamData();
  }, [matchup]);

  // Find odds for this matchup
  const matchOdds = findOdds(teamA, teamB, allOdds);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel — full screen on mobile, side panel on desktop */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg bg-[#080c18] sm:border-l border-slate-800/60 z-50 overflow-y-auto shadow-2xl shadow-black/50 animate-slide-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="sticky top-3 right-3 float-right z-10 text-slate-500 hover:text-white transition-all p-2 hover:bg-slate-800/80 rounded-lg mr-2 mt-1 backdrop-blur-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Team comparison header with pick buttons */}
        <TeamComparisonHeader
          teamA={teamA}
          teamB={teamB}
          roundName={roundName}
          onPickTeam={(teamId) => onPickWinner(matchup.id, teamId)}
          pickedTeamId={pickedTeamId}
        />

        {/* Content sections */}
        <div className="px-4 pb-8 space-y-3">
          <AIPredictionCard
            teamA={teamA}
            teamB={teamB}
            matchupId={matchup.id}
          />

          <VegasOddsCard
            odds={matchOdds}
            teamA={teamA}
            teamB={teamB}
          />

          <AdvancedMetricsTable teamA={teamA} teamB={teamB} />

          <HeadToHeadChart
            teamA={teamA}
            teamB={teamB}
            allTeams={allTeams}
          />

          <KeyPlayersSection
            teamAName={teamA?.shortName || "TBD"}
            teamBName={teamB?.shortName || "TBD"}
            playersA={playersA}
            playersB={playersB}
            teamAColor={teamA?.primaryColor || "#6366f1"}
            teamBColor={teamB?.primaryColor || "#6366f1"}
          />

          <ScheduleHistory
            teamAName={teamA?.shortName || "TBD"}
            teamBName={teamB?.shortName || "TBD"}
            scheduleA={scheduleA}
            scheduleB={scheduleB}
          />

          <FutureMatchups matchup={matchup} bracket={bracket} />
        </div>
      </div>
    </>
  );
}

function findOdds(
  teamA: Team | null,
  teamB: Team | null,
  odds: MatchupOdds[]
): MatchupOdds | null {
  if (!teamA || !teamB || odds.length === 0) return null;

  const nameA = teamA.name.toLowerCase();
  const nameB = teamB.name.toLowerCase();

  return (
    odds.find((o) => {
      const home = o.homeTeam.toLowerCase();
      const away = o.awayTeam.toLowerCase();
      return (
        (home.includes(nameA) || nameA.includes(home)) &&
        (away.includes(nameB) || nameB.includes(away))
      ) || (
        (home.includes(nameB) || nameB.includes(home)) &&
        (away.includes(nameA) || nameA.includes(away))
      );
    }) || null
  );
}
