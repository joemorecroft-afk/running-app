import { redirect } from "next/navigation";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { buildSnapshot } from "@/lib/running/snapshot";
import { InteractiveFitnessTriangle } from "@/components/triangle/InteractiveFitnessTriangle";
import { GapChip } from "@/components/gaps/GapChip";

export default async function HomePage() {
  const athleteId = await resolveActiveAthleteId();
  if (!athleteId) {
    redirect("/settings");
  }

  const snapshot = await buildSnapshot(athleteId);
  const biggestGap = [...snapshot.gaps].sort(
    (a, b) => Math.abs(b.percentDelta ?? 0) - Math.abs(a.percentDelta ?? 0)
  )[0];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <InteractiveFitnessTriangle
        volumeScore={snapshot.volumeScore}
        intensityScore={snapshot.intensityScore}
        injuryRiskScore={snapshot.acwr.riskScore}
      />
      <p className="max-w-xs text-center text-[11px] text-neutral-400">
        Width = base (volume + LT1) · Height = ceiling (VO2max + LT2) · dashed outline = your
        target for this race
      </p>

      <div className="flex w-full max-w-sm gap-2">
        {snapshot.gaps.map((gap) => (
          <GapChip key={gap.metric} gap={gap} />
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-neutral-700">
          Injury risk: {Math.round(snapshot.acwr.riskScore)} / 100 ({snapshot.acwr.zone})
        </p>
        <p className="text-xs text-neutral-400">{biggestGap?.read}</p>
      </div>
    </main>
  );
}
