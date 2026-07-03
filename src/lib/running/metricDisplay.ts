import type { MetricName } from "./gaps";
import { formatPaceSecPerKm } from "./format";

export const METRIC_LABELS: Record<MetricName, string> = {
  vo2max: "VO2max",
  lt1: "LT1 (marathon-effort pace)",
  lt2: "LT2 (half-marathon-effort pace)",
  volume: "Weekly volume",
};

export function formatMetricValue(metric: MetricName, value: number): string {
  switch (metric) {
    case "vo2max":
      return value.toFixed(1);
    case "lt1":
    case "lt2":
      return formatPaceSecPerKm(value);
    case "volume":
      return `${value.toFixed(0)} km`;
  }
}
