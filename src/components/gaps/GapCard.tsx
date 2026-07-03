import type { MetricGap } from "@/lib/running/gaps";
import { METRIC_LABELS, formatMetricValue } from "@/lib/running/metricDisplay";

const CONFIDENCE_LABEL: Record<MetricGap["confidence"], string> = {
  low: "Low confidence",
  med: "Medium confidence",
  high: "High confidence",
};

export function GapCard({ gap }: { gap: MetricGap }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-lg border border-neutral-100 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-900">
          {METRIC_LABELS[gap.metric]}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-neutral-400">
          {CONFIDENCE_LABEL[gap.confidence]}
        </span>
      </div>

      {gap.current === null ? (
        <p className="text-xs text-neutral-400">{gap.read}</p>
      ) : (
        <>
          <div className="flex items-baseline gap-4 text-sm text-neutral-700">
            <span>Current: {formatMetricValue(gap.metric, gap.current)}</span>
            <span>Target: {formatMetricValue(gap.metric, gap.target)}</span>
          </div>
          <p className="text-xs text-neutral-500">{gap.read}</p>
        </>
      )}
    </div>
  );
}
