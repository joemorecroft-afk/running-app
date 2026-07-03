import { notFound, redirect } from "next/navigation";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { buildSnapshot } from "@/lib/running/snapshot";
import { GapDetailView } from "@/components/gaps/GapDetailView";
import type { MetricName } from "@/lib/running/gaps";

const VALID_METRICS: MetricName[] = ["vo2max", "lt1", "lt2", "volume"];

export default async function GapDetailPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric } = await params;
  if (!VALID_METRICS.includes(metric as MetricName)) {
    notFound();
  }

  const athleteId = await resolveActiveAthleteId();
  if (!athleteId) {
    redirect("/settings");
  }

  const snapshot = await buildSnapshot(athleteId);
  const gap = snapshot.gaps.find((g) => g.metric === metric);
  if (!gap) notFound();

  return <GapDetailView gap={gap} />;
}
