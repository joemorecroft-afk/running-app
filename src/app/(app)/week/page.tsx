import { redirect } from "next/navigation";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { buildSnapshot } from "@/lib/running/snapshot";
import { WeekSummaryCard } from "@/components/week/WeekSummaryCard";
import { GapCard } from "@/components/gaps/GapCard";

export default async function WeekPage() {
  const athleteId = await resolveActiveAthleteId();
  if (!athleteId) {
    redirect("/settings");
  }

  const snapshot = await buildSnapshot(athleteId);
  const volumeGap = snapshot.gaps.find((g) => g.metric === "volume")!;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <WeekSummaryCard volumeGap={volumeGap} acwr={snapshot.acwr} />
      <div className="flex w-full max-w-sm flex-col gap-3">
        {snapshot.gaps.map((gap) => (
          <GapCard key={gap.metric} gap={gap} />
        ))}
      </div>
    </main>
  );
}
