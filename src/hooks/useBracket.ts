"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { BracketData, BracketMatchup, BracketSlot, Team, UserPicks } from "@/lib/types";
import { findMatchup } from "@/lib/bracket-utils";
import teamsDataRaw from "@/data/teams.json";

const teamsData = teamsDataRaw as Record<string, Team>;

const PICKS_STORAGE_KEY = "bracket-2026-picks";

function loadSavedPicks(): UserPicks {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(PICKS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function useBracket(initialData: BracketData) {
  const [picks, setPicks] = useState<UserPicks>(loadSavedPicks);
  const [activeMatchupId, setActiveMatchupId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Build bracket with user picks applied — winners advance to next rounds
  const bracket = useMemo(() => {
    const data = JSON.parse(JSON.stringify(initialData)) as BracketData;

    // Apply picks: when a team is picked in a matchup, place them in the next round
    for (const [matchupId, winnerTeamId] of Object.entries(picks)) {
      const matchup = findMatchup(matchupId, data);
      if (!matchup || !matchup.winnerSlotId) continue;

      // Find the winning team's slot
      const winner =
        matchup.topTeam?.teamId === winnerTeamId
          ? matchup.topTeam
          : matchup.bottomTeam?.teamId === winnerTeamId
            ? matchup.bottomTeam
            : null;

      if (!winner) continue;

      // Place winner in next matchup
      const nextMatchup = findMatchup(matchup.winnerSlotId, data);
      if (!nextMatchup) continue;

      // Determine if this winner goes to top or bottom slot
      // Convention: the first feeder goes to top, second to bottom
      // Exception: First Four winners fill the empty slot in a pre-seeded round-1 matchup
      const feeders = getAllFeeders(matchup.winnerSlotId, data);
      const feederIndex = feeders.indexOf(matchupId);

      if (feeders.length === 1 && nextMatchup.topTeam && !nextMatchup.bottomTeam) {
        // Single feeder into a matchup that already has topTeam (First Four → Round 1)
        nextMatchup.bottomTeam = { ...winner };
      } else if (feeders.length === 1 && !nextMatchup.topTeam && nextMatchup.bottomTeam) {
        nextMatchup.topTeam = { ...winner };
      } else if (feederIndex === 0 || feederIndex === -1) {
        nextMatchup.topTeam = { ...winner };
      } else {
        nextMatchup.bottomTeam = { ...winner };
      }
    }

    return data;
  }, [initialData, picks]);

  const pickWinner = useCallback(
    (matchupId: string, teamId: string) => {
      setPicks((prev) => {
        const next = { ...prev };

        // If picking a different winner, clear all downstream picks
        if (prev[matchupId] && prev[matchupId] !== teamId) {
          clearDownstream(matchupId, teamId, next, initialData);
        }

        next[matchupId] = teamId;
        return next;
      });
    },
    [initialData]
  );

  const openDetail = useCallback((matchupId: string) => {
    setActiveMatchupId(matchupId);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const activeMatchup = activeMatchupId
    ? findMatchup(activeMatchupId, bracket)
    : undefined;

  // Persist picks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(picks));
    } catch {}
  }, [picks]);

  const resetPicks = useCallback(() => {
    setPicks({});
    try { localStorage.removeItem(PICKS_STORAGE_KEY); } catch {}
  }, []);

  const pickCount = Object.keys(picks).length;
  const firstFourCount = bracket.firstFour?.length || 0;
  const totalMatchups = 63 + firstFourCount;
  const champion = picks["ff-championship"]
    ? findMatchup("ff-championship", bracket)
    : null;
  const championTeam = champion
    ? champion.topTeam?.teamId === picks["ff-championship"]
      ? champion.topTeam
      : champion.bottomTeam
    : null;

  // Auto-fill bracket by higher seed (chalk) or by Barthag (analytics)
  const autoFill = useCallback(
    (mode: "chalk" | "analytics") => {
      // We need to process rounds in order: first four, then round 1, 2, 3, etc.
      const newPicks: UserPicks = {};
      const workingData = JSON.parse(JSON.stringify(initialData)) as BracketData;

      // Helper to pick and propagate
      function pickAndPropagate(matchup: BracketMatchup) {
        if (!matchup.topTeam || !matchup.bottomTeam) return;

        let winnerId: string;
        if (mode === "chalk") {
          // Lower seed wins (chalk)
          winnerId =
            matchup.topTeam.seed <= matchup.bottomTeam.seed
              ? matchup.topTeam.teamId
              : matchup.bottomTeam.teamId;
        } else {
          // Better Barthag wins
          const a = teamsData[matchup.topTeam.teamId];
          const b = teamsData[matchup.bottomTeam.teamId];
          const barthagA = a?.barttorvik.barthag || 0;
          const barthagB = b?.barttorvik.barthag || 0;
          winnerId =
            barthagA >= barthagB
              ? matchup.topTeam.teamId
              : matchup.bottomTeam.teamId;
        }

        newPicks[matchup.id] = winnerId;

        // Propagate winner to next matchup
        if (matchup.winnerSlotId) {
          const winner =
            matchup.topTeam.teamId === winnerId
              ? { ...matchup.topTeam }
              : { ...matchup.bottomTeam };

          const nextMatchup = findMatchup(matchup.winnerSlotId, workingData);
          if (nextMatchup) {
            const feeders = getAllFeeders(matchup.winnerSlotId, workingData);
            const feederIndex = feeders.indexOf(matchup.id);
            if (feeders.length === 1 && nextMatchup.topTeam && !nextMatchup.bottomTeam) {
              nextMatchup.bottomTeam = winner;
            } else if (feeders.length === 1 && !nextMatchup.topTeam && nextMatchup.bottomTeam) {
              nextMatchup.topTeam = winner;
            } else if (feederIndex === 0 || feederIndex === -1) {
              nextMatchup.topTeam = winner;
            } else {
              nextMatchup.bottomTeam = winner;
            }
          }
        }
      }

      // Process First Four first
      if (workingData.firstFour) {
        for (const m of workingData.firstFour) {
          pickAndPropagate(m);
        }
      }

      // Process rounds 1-4 for each region
      for (let round = 1; round <= 4; round++) {
        for (const region of Object.values(workingData.regions)) {
          for (const m of region.matchups) {
            if (m.round === round && m.topTeam && m.bottomTeam) {
              pickAndPropagate(m);
            }
          }
        }
      }

      // Process Final Four
      for (const m of workingData.finalFour) {
        if (m.topTeam && m.bottomTeam) {
          pickAndPropagate(m);
        }
      }

      setPicks(newPicks);
    },
    [initialData]
  );

  const shareBracket = useCallback(() => {
    const encoded = btoa(JSON.stringify(picks));
    const url = new URL(window.location.href);
    url.searchParams.set("picks", encoded);
    url.searchParams.delete("matchup");
    return url.toString();
  }, [picks]);

  const importPicks = useCallback((encoded: string) => {
    try {
      const decoded = JSON.parse(atob(encoded));
      if (typeof decoded === "object" && decoded !== null) {
        setPicks(decoded);
      }
    } catch {}
  }, []);

  // Import picks from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get("picks");
    if (encoded) {
      importPicks(encoded);
      // Clean up URL
      url.searchParams.delete("picks");
      window.history.replaceState({}, "", url.toString());
    }
  }, [importPicks]);

  return {
    bracket,
    picks,
    pickWinner,
    activeMatchup: activeMatchup ?? null,
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
  };
}

// Get all matchup IDs that feed into a given matchup
function getAllFeeders(matchupId: string, data: BracketData): string[] {
  const feeders: string[] = [];
  for (const region of Object.values(data.regions)) {
    for (const m of region.matchups) {
      if (m.winnerSlotId === matchupId) feeders.push(m.id);
    }
  }
  for (const m of data.finalFour) {
    if (m.winnerSlotId === matchupId) feeders.push(m.id);
  }
  if (data.firstFour) {
    for (const m of data.firstFour) {
      if (m.winnerSlotId === matchupId) feeders.push(m.id);
    }
  }
  return feeders;
}

// When changing a pick, clear all downstream picks that depended on the old winner
function clearDownstream(
  matchupId: string,
  newWinnerId: string,
  picks: UserPicks,
  data: BracketData
) {
  const matchup = findMatchup(matchupId, data);
  if (!matchup || !matchup.winnerSlotId) return;

  const oldWinner = picks[matchupId];
  if (!oldWinner || oldWinner === newWinnerId) return;

  // Check if old winner was picked in the next matchup
  const nextId = matchup.winnerSlotId;
  if (picks[nextId] === oldWinner) {
    // Clear this pick and recurse
    delete picks[nextId];
    clearDownstream(nextId, "", picks, data);
  }
}
