import Link from "next/link";
import type { MetricGap } from "@/lib/running/gaps";
import { METRIC_LABELS } from "@/lib/running/metricDisplay";
import { GapCard } from "./GapCard";

const SOURCE_NOTE: Record<MetricGap["source"], string> = {
  manual: "You've entered this value directly.",
  derived: "Estimated from your Strava training data.",
  unavailable: "Not enough data yet to estimate this.",
};

export function GapDetailView({ gap }: { gap: MetricGap }) {
  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-8">
      <Link href="/home" className="self-start text-xs text-neutral-400">
        ← Back
      </Link>
      <h1 className="text-lg font-medium text-neutral-900">{METRIC_LABELS[gap.metric]}</h1>
      <GapCard gap={gap} />
      <p className="max-w-sm text-center text-xs text-neutral-400">
        {SOURCE_NOTE[gap.source]}
      </p>
    </main>
  );
}
