import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

interface TeamPayload {
  name: string;
  seed: number;
  record: string;
  conference: string;
  kenpom: { rank: number; netRtg: number; oRtg: number; dRtg: number };
  barttorvik: { rank: number; adjOE: number; adjDE: number; barthag: number; effMargin: number };
  evanmiya: { rank: number; oRate: number; dRate: number };
  rankings: { net: number | null; kpiRank: number | null; sorRank: number | null; quadRecord: { q1: string; q2: string; q3: string; q4: string } | null };
  seasonStats: { ppg: number; oppPpg: number; fgPct: number; threePtPct: number; ftPct: number; rpg: number; apg: number; spg: number; bpg: number; topg: number };
}

function formatTeam(t: TeamPayload): string {
  const lines = [
    `${t.name} (${t.seed} seed, ${t.record}, ${t.conference})`,
    `KenPom #${t.kenpom.rank} (Net ${t.kenpom.netRtg > 0 ? "+" : ""}${t.kenpom.netRtg}, Off ${t.kenpom.oRtg}, Def ${t.kenpom.dRtg})`,
    `Barttorvik #${t.barttorvik.rank} (AdjOE ${t.barttorvik.adjOE}, AdjDE ${t.barttorvik.adjDE}, Barthag ${t.barttorvik.barthag})`,
    `EvanMiya #${t.evanmiya.rank} (Off ${t.evanmiya.oRate}, Def ${t.evanmiya.dRate})`,
  ];
  if (t.rankings.net) lines.push(`NET #${t.rankings.net}, KPI #${t.rankings.kpiRank}, SOR #${t.rankings.sorRank}`);
  if (t.rankings.quadRecord) {
    const q = t.rankings.quadRecord;
    lines.push(`Quad Record: Q1 ${q.q1}, Q2 ${q.q2}, Q3 ${q.q3}, Q4 ${q.q4}`);
  }
  const s = t.seasonStats;
  lines.push(`Stats: ${s.ppg} PPG, ${s.oppPpg} opp PPG, ${s.fgPct}% FG, ${s.threePtPct}% 3PT, ${s.ftPct}% FT, ${s.rpg} RPG, ${s.apg} APG, ${s.spg} SPG, ${s.bpg} BPG, ${s.topg} TOPG`);
  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const { teamA, teamB } = (await request.json()) as { teamA: TeamPayload; teamB: TeamPayload };

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: "You are a sharp, conversational college basketball analyst. Given two teams' data, write a 3-sentence max prediction. Sentence 1: the key matchup edge one team has (reference one or two stats naturally, don't list them). Sentence 2: why the other team could keep it close or pull the upset. Sentence 3: your pick and predicted final score. Keep it casual and confident — like a podcast host, not a stats textbook.",
      messages: [
        {
          role: "user",
          content: `Predict this NCAA Tournament matchup:\n\nTEAM A:\n${formatTeam(teamA)}\n\nTEAM B:\n${formatTeam(teamB)}`,
        },
      ],
    });

    const prediction = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ prediction });
  } catch (err) {
    console.error("Prediction API error:", err);
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 });
  }
}
