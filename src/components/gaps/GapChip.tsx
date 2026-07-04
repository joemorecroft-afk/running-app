"use client";

import { useRouter } from "next/navigation";
import type { MetricGap } from "@/lib/running/gaps";

const SHORT_LABELS: Record<MetricGap["metric"], string> = {
  vo2max: "VO2max",
  lt1: "LT1",
  lt2: "LT2",
  volume: "Volume",
};

// For pace metrics (lt1/lt2) a slower current pace is a positive percentDelta (worse), so
// "ahead of target" flips sign relative to vo2max/volume where higher is better.
function isAheadOfTarget(gap: MetricGap): boolean {
  if (gap.percentDelta === null) return false;
  return gap.metric === "lt1" || gap.metric === "lt2" ? gap.percentDelta < 0 : gap.percentDelta > 0;
}

export function GapChip({ gap }: { gap: MetricGap }) {
  const router = useRouter();
  const hasData = gap.current !== null && gap.percentDelta !== null;
  const ahead = isAheadOfTarget(gap);

  return (
    <button
      onClick={() => router.push(`/gaps/${gap.metric}`)}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-neutral-100 px-2 py-2"
    >
      <span className="text-[10px] uppercase tracking-wide text-neutral-400">
        {SHORT_LABELS[gap.metric]}
      </span>
      {hasData ? (
        <span
          className={`text-sm font-medium ${ahead ? "text-green-600" : "text-neutral-700"}`}
        >
          {gap.percentDelta! > 0 ? "+" : ""}
          {gap.percentDelta!.toFixed(0)}%
        </span>
      ) : (
        <span className="text-sm text-neutral-300">—</span>
      )}
    </button>
  );
}
