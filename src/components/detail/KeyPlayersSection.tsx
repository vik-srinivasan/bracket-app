import { Player } from "@/lib/types";

interface Props {
  teamAName: string;
  teamBName: string;
  playersA: Player[];
  playersB: Player[];
  teamAColor: string;
  teamBColor: string;
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-slate-600 uppercase">{label}</div>
      <div className="text-[11px] text-slate-300 font-mono font-medium">{value}</div>
    </div>
  );
}

function PlayerRow({ player, rank }: { player: Player; color: string; rank: number }) {
  const s = player.stats;

  return (
    <div className={`py-1.5 border-b border-slate-800/30 last:border-0 ${rank === 1 ? "bg-amber-400/[0.02]" : ""}`}>
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="text-[9px] text-slate-700 font-mono w-3 shrink-0">{rank}</span>
        <span className={`text-[11px] font-semibold truncate ${rank === 1 ? "text-slate-100" : "text-slate-300"}`}>
          {player.name}
        </span>
        <span className="text-[9px] text-slate-600 shrink-0">
          {player.position}
        </span>
        {player.height && (
          <span className="text-[9px] text-slate-600 shrink-0">
            {player.height}
          </span>
        )}
      </div>
      {s && s.ppg > 0 ? (
        <div className="flex flex-wrap gap-x-2.5 gap-y-0 ml-[18px]">
          <StatPill label="PPG" value={s.ppg.toFixed(1)} />
          <StatPill label="RPG" value={s.rpg.toFixed(1)} />
          <StatPill label="APG" value={s.apg.toFixed(1)} />
          {s.fgPct > 0 && (
            <StatPill label="FG%" value={`${(s.fgPct).toFixed(1)}`} />
          )}
          {s.threePtPct > 0 && (
            <StatPill label="3P%" value={`${(s.threePtPct).toFixed(1)}`} />
          )}
          {s.threePtRate > 0 && (
            <StatPill label="3PAr" value={`${(s.threePtRate).toFixed(1)}`} />
          )}
        </div>
      ) : (
        <div className="text-[10px] text-slate-700 italic ml-[18px]">No stats</div>
      )}
    </div>
  );
}

function TeamColumn({
  name,
  players,
  color,
}: {
  name: string;
  players: Player[];
  color: string;
}) {
  // Filter out header rows and sort by PPG descending, take top 7
  const sorted = [...players]
    .filter((p) => p.name !== "Player" && p.name !== "Team" && !p.name.includes("Totals") && !p.name.includes("Opponent") && p.stats?.ppg)
    .sort((a, b) => (b.stats?.ppg || 0) - (a.stats?.ppg || 0))
    .slice(0, 8);

  // Team aggregate
  const withStats = players.filter((p) => p.stats && p.stats.ppg > 0);
  const topScorer = sorted[0];

  return (
    <div className="p-3">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        {name}
      </div>

      {/* Team summary line */}
      {topScorer?.stats && (
        <div className="text-[10px] text-slate-500 mb-2">
          {withStats.length} players with stats · Top scorer:{" "}
          <span className="text-amber-400">{topScorer.stats.ppg.toFixed(1)} PPG</span>
        </div>
      )}

      {sorted.length > 0 ? (
        sorted.map((p, i) => (
          <PlayerRow key={p.id} player={p} color={color} rank={i + 1} />
        ))
      ) : (
        <div className="text-xs text-slate-600 italic py-2">
          Roster data unavailable
        </div>
      )}
    </div>
  );
}

export default function KeyPlayersSection({
  teamAName,
  teamBName,
  playersA,
  playersB,
  teamAColor,
  teamBColor,
}: Props) {
  return (
    <div className="border border-slate-700/40 rounded-xl overflow-hidden bg-slate-900/40">
      <div className="bg-slate-800/40 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/30">
        <span className="text-sm font-semibold text-slate-300">
          Key Players
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-700/20">
        <TeamColumn name={teamAName} players={playersA} color={teamAColor} />
        <TeamColumn name={teamBName} players={playersB} color={teamBColor} />
      </div>
    </div>
  );
}
