import type { AcwrResult } from "@/lib/running/acwr";
import type { MetricGap } from "@/lib/running/gaps";
import { formatMetricValue } from "@/lib/running/metricDisplay";

const ZONE_LABEL: Record<AcwrResult["zone"], string> = {
  undertrained: "Undertrained",
  "sweet-spot": "Sweet spot",
  elevated: "Elevated risk",
  "sharply-elevated": "Sharply elevated risk",
};

export function WeekSummaryCard({
  volumeGap,
  acwr,
}: {
  volumeGap: MetricGap;
  acwr: AcwrResult;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-100 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-400">This week&apos;s volume</p>
        <p className="text-sm text-neutral-700">
          {volumeGap.current !== null
            ? `${formatMetricValue("volume", volumeGap.current)} of ${formatMetricValue("volume", volumeGap.target)} target`
            : "No activity data yet"}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          Acute:Chronic workload ratio
        </p>
        <p className="text-sm text-neutral-700">
          {acwr.acwr.toFixed(2)} — {ZONE_LABEL[acwr.zone]}
        </p>
        <p className="text-xs text-neutral-400">
          7-day load {acwr.acuteLoad.toFixed(0)} vs. 28-day baseline {acwr.chronicLoad.toFixed(0)}
        </p>
      </div>

      <p className="text-[11px] text-neutral-400">
        ACWR is guidance, not gospel — the &quot;sweet spot&quot; is contested in the research.
        Treat this as one input among several.
      </p>
    </div>
  );
}
